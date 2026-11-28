import { describe, expect, it } from "vitest";

import {
  createPurchaseApprovedToken,
  createSignedExpiry,
  isPurchaseApprovedToken,
  isValidStoredToken,
  parsePurchaseToken,
  sha256,
} from "@/lib/security";

const HOUR = 3600 * 1000;

describe("Bloque 3: expiración anclada de los pases PRO", () => {
  it("crea tokens con vencimiento embebido y los reconoce como tales", () => {
    const expiresAt = Date.now() + 24 * HOUR;
    const token = createPurchaseApprovedToken(expiresAt);

    expect(token).toHaveLength(64);
    expect(isPurchaseApprovedToken(token)).toBe(true);

    const info = parsePurchaseToken(token);
    expect(info?.permanent).toBe(false);
    // El vencimiento se guarda en segundos: tolerancia de 1s.
    expect(Math.abs((info?.expiresAt ?? 0) - expiresAt)).toBeLessThan(1000);
  });

  it("distingue los tokens vitalicios (kind P)", () => {
    const token = createPurchaseApprovedToken(null);
    expect(parsePurchaseToken(token)).toEqual({ permanent: true, expiresAt: null });
    expect(isValidStoredToken(token, "pro", null)).toBe(true);
  });

  it("acepta un pase vigente aunque no haya expiración firmada en localStorage", () => {
    const token = createPurchaseApprovedToken(Date.now() + 2 * HOUR);
    expect(isValidStoredToken(token, "pro", null)).toBe(true);
  });

  it("rechaza un pase vencido aunque localStorage tenga una fecha futura", () => {
    const expired = createPurchaseApprovedToken(Date.now() - 5 * 60 * 1000);
    const forgedExpiry = createSignedExpiry(expired, Date.now() + 30 * 24 * HOUR);

    expect(isValidStoredToken(expired, "pro", null)).toBe(false);
    expect(isValidStoredToken(expired, "pro", forgedExpiry)).toBe(false);
  });

  it("rechaza un pase vigente si la expiración firmada dice que ya terminó", () => {
    const token = createPurchaseApprovedToken(Date.now() + 2 * HOUR);
    const staleExpiry = createSignedExpiry(token, Date.now() - HOUR);
    expect(isValidStoredToken(token, "pro", staleExpiry)).toBe(false);
  });

  it("no acepta tokens con formato inválido o sin sello", () => {
    const bogus = sha256("cualquier-cosa").slice(0, 64);
    expect(isPurchaseApprovedToken(bogus)).toBe(false);
    expect(isValidStoredToken(bogus, "pro", null)).toBe(false);
    expect(isValidStoredToken("", "pro", null)).toBe(false);
    expect(isValidStoredToken(null, "pro", null)).toBe(false);
  });
});
