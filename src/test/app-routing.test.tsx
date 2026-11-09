import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import {
  createSignedExpiry,
  isValidStoredToken,
  parseSignedExpiry,
  sanitizeImportedCategories,
  sha256,
  verifyAccessCode,
} from "@/lib/security";
import { detectUserDevice } from "@/lib/telemetry";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
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
  });
});
