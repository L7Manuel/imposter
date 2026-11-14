import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import {
  computeTokenVerifyHash,
  createPurchaseApprovedToken,
  createRotatedCeoToken,
  createSignedExpiry,
  generateDynamicCeoKey,
  generateFounderCode,
  generateGuestPass,
  getDecryptedVipCodes,
  isPurchaseApprovedToken,
  isRotatedCeoToken,
  isValidDynamicCeoKey,
  isValidFounderCode,
  isValidGuestPass,
  isValidStoredToken,
  parseSignedExpiry,
  sanitizeImportedCategories,
  sha256,
  STORAGE_KEYS,
  TESTER_COUPON_DURATION_MS,
  verifyAccessCode,
} from "@/lib/security";
import { detectUserDevice, isCeoDevice } from "@/lib/telemetry";
import { getUndercoverWord, PARTY_PENALTIES } from "@/data/categories";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches pages for / and /ceo instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const homeMatches = router.matchRoutes("/");
    const ceoMatches = router.matchRoutes("/ceo");

    expect(homeMatches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(ceoMatches.at(-1)?.routeId).toBe("/ceo");
  });
});

describe("Security shields", () => {
  it("computes standard RFC 6234 SHA-256 hashes accurately", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("rejects invalid access codes and forged localStorage tokens", () => {
    expect(verifyAccessCode("HACKER-123")).toEqual({
      role: null,
      token: null,
      couponIdHash: null,
    });
    expect(verifyAccessCode("")).toEqual({
      role: null,
      token: null,
      couponIdHash: null,
    });
    expect(isValidStoredToken("true", "pro")).toBe(false);
    expect(isValidStoredToken("true", "ceo")).toBe(false);
    // Even copying the second-level verifyHash from source code into localStorage must fail:
    expect(
      isValidStoredToken("ee150df582f0b2130dfb7f240a8301a509b51a39b96f622321e48ef152a71bf3", "ceo"),
    ).toBe(false);

    // Signed 48h expiry must reject tampered timestamps:
    const fakeToken = "a".repeat(64);
    const validSigned = createSignedExpiry(fakeToken, 1000000);
    expect(parseSignedExpiry(fakeToken, validSigned)).toBe(1000000);
    expect(parseSignedExpiry(fakeToken, `9999999.${validSigned.split(".")[1]}`)).toBeNull();
  });

  it("sanitizes imported JSON packs against XSS, prototype pollution, and reserved names", () => {
    const maliciousPayload = {
      __proto__: ["a", "b", "c"],
      Comida: ["Hack1", "Hack2", "Hack3"],
      "<script>Anime</script>": ["<img onerror=1>Naruto", "Goku", "Luffy", "Luffy"],
      Corto: ["SoloDos", "Palabras"],
    };

    const result = sanitizeImportedCategories(maliciousPayload, ["Aleatoria", "Comida"]);
    expect(result).toEqual({
      "scriptAnime/script": ["img onerror=1Naruto", "Goku", "Luffy"],
    });
  });

  it("detects user execution environments correctly for telemetry", () => {
    expect(typeof detectUserDevice()).toBe("string");
    expect(isCeoDevice()).toBe(false);
  });

  it("generates distinct decoy words for Undercover Mode and provides party penalties", () => {
    expect(getUndercoverWord("Pizza", ["Pizza", "Sushi", "Tacos"])).toBe("Lasaña");
    expect(getUndercoverWord("Playa", ["Playa", "Cine"])).toBe("Piscina");
    expect(getUndercoverWord("PalabraCustom", ["PalabraCustom", "OtraPalabra"])).toBe(
      "OtraPalabra",
    );
    expect(PARTY_PENALTIES.length).toBeGreaterThanOrEqual(10);
  });

  it("validates CEO master key, decrypts all 10 Tester VIP Coupons, and enforces 1-use + 48h expiry", () => {
    const ceoRes = verifyAccessCode("ceo imposter 2026");
    expect(ceoRes.role).toBe("ceo");
    expect(ceoRes.token).toBeTruthy();
    expect(isValidStoredToken(ceoRes.token, "ceo")).toBe(true);

    const testerCodes = getDecryptedVipCodes(ceoRes.token);
    expect(testerCodes).toHaveLength(10);

    for (const code of testerCodes) {
      const check1 = verifyAccessCode(code, []);
      expect(check1.role).toBe("vip_single");
      expect(check1.token).toBeTruthy();
      expect(check1.couponIdHash).toBeTruthy();

      // Must reject second use when hash is recorded
      const check2 = verifyAccessCode(code, [check1.couponIdHash!]);
      expect(check2.role).toBe("already_used");

      // Must validate 48h signed expiry
      const now = Date.now();
      const expiresAt = now + TESTER_COUPON_DURATION_MS;
      const signed = createSignedExpiry(check1.token!, expiresAt);
      expect(isValidStoredToken(check1.token, "pro", signed, now)).toBe(true);
      expect(isValidStoredToken(check1.token, "pro", signed, expiresAt + 1000)).toBe(false);
    }
  });

  it("generates and validates Founder Passes and their 5 Ambassador Guest Passes", () => {
    const fndrCode = generateFounderCode(1);
    expect(isValidFounderCode(fndrCode)).toEqual({ valid: true, number: 1 });

    const fndrVerify = verifyAccessCode(fndrCode, []);
    expect(fndrVerify.role).toBe("founder");
    expect(fndrVerify.meta?.founderNumber).toBe(1);
    expect(isValidStoredToken(fndrVerify.token, "pro")).toBe(true);

    // Verify all 5 guest passes for Founder #1
    for (let idx = 1; idx <= 5; idx++) {
      const guestCode = generateGuestPass(1, idx);
      expect(isValidGuestPass(guestCode)).toEqual({
        valid: true,
        founderNumber: 1,
        passIndex: idx,
      });
      const guestVerify = verifyAccessCode(guestCode, []);
      expect(guestVerify.role).toBe("guest_pass");
      expect(guestVerify.meta).toEqual({ founderNumber: 1, passIndex: idx });
    }

    const purchaseToken = createPurchaseApprovedToken();
    expect(isPurchaseApprovedToken(purchaseToken)).toBe(true);
    expect(isValidStoredToken(purchaseToken, "pro")).toBe(true);
  });

  it("rotates CEO Master Keys dynamically, revokes old tokens, and keeps the 10 Tester Coupons decrypted", () => {
    const dynamicKey = generateDynamicCeoKey();
    expect(isValidDynamicCeoKey(dynamicKey)).toEqual({
      valid: true,
      normalized: dynamicKey,
    });

    const rotatedToken = createRotatedCeoToken(dynamicKey);
    expect(isRotatedCeoToken(rotatedToken)).toBe(true);

    const activeHash = computeTokenVerifyHash(rotatedToken);
    localStorage.setItem(STORAGE_KEYS.CEO_ACTIVE_HASH, activeHash);

    // Rotated key must be accepted
    const checkRotated = verifyAccessCode(dynamicKey, []);
    expect(checkRotated.role).toBe("ceo");
    expect(checkRotated.token).toBe(rotatedToken);
    expect(isValidStoredToken(rotatedToken, "ceo")).toBe(true);

    // Old factory key must now be rejected while rotated key is active
    const checkOldFactory = verifyAccessCode("CEO-IMPOSTER-2026", []);
    expect(checkOldFactory.role).toBeNull();

    // All 10 Tester VIP Coupons must still decrypt cleanly with the rotated token
    const decryptedWithRotated = getDecryptedVipCodes(rotatedToken);
    expect(decryptedWithRotated).toHaveLength(10);

    // Clean up localStorage for subsequent tests
    localStorage.removeItem(STORAGE_KEYS.CEO_ACTIVE_HASH);
  });
});
