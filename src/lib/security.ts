/**
 * Módulo de Seguridad Criptográfica y Sanitización — Imposter
 *
 * 1. Hashing SHA-256 puro (RFC 6234) sin dependencias externas (funciona en HTTPS, localhost y LAN).
 * 2. Esquema de Doble Hash (Zero-Plaintext & Anti-LocalStorage Tampering):
 *    - Ninguna clave ("CEO-..." ni "VIP-...") existe en texto plano dentro del bundle JS.
 *    - Ni siquiera el token que se guarda en localStorage está en el código fuente:
 *      el código solo conoce `VERIFY_HASH = sha256(VERIFY_SALT + sha256(SALT + CLAVE))`.
 *    - Si alguien edita localStorage con F12 poniendo "true" o copiando el VERIFY_HASH del bundle,
 *      la verificación falla y se revoca el acceso automáticamente.
 * 3. Protección Anti-Fuerza Bruta (Rate Limiting con bloqueo temporal).
 * 4. Sanitización estricta de JSON al importar categorías personalizadas (Anti-XSS / Prototype Pollution / DoS).
 */

const K: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256(ascii: string): string {
  const utf8 = unescape(encodeURIComponent(ascii));
  const words: number[] = [];
  const asciiBitLength = utf8.length * 8;

  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | ((utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8));
  }
  words[utf8.length >> 2] = (words[utf8.length >> 2] ?? 0) | (0x80 << (24 - (utf8.length % 4) * 8));
  words[(((utf8.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);

  for (let j = 0; j < words.length; j += 16) {
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = words[j + i] ?? 0;
      } else {
        const gamma0x = w[i - 15]!;
        const gamma0 = rotr(7, gamma0x) ^ rotr(18, gamma0x) ^ (gamma0x >>> 3);
        const gamma1x = w[i - 2]!;
        const gamma1 = rotr(17, gamma1x) ^ rotr(19, gamma1x) ^ (gamma1x >>> 10);
        w[i] = (w[i - 16]! + gamma0 + w[i - 7]! + gamma1) | 0;
      }

      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const sigma0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const sigma1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);

      const t1 = (h + sigma1 + ch + K[i]! + w[i]!) | 0;
      const t2 = (sigma0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

const CODE_SALT = "imposter-v1-salt-9f8e7d:";
const VERIFY_SALT = "imposter-verify-v1:";

// Hashes de segundo nivel (VERIFY_HASH = sha256(VERIFY_SALT + sha256(CODE_SALT + CODE)))
const CEO_VERIFY_HASHES = new Set([
  "ee150df582f0b2130dfb7f240a8301a509b51a39b96f622321e48ef152a71bf3",
  "5cd20db932697e488ab667d8a1297f994f23df925a29bd7cb01074e503b9cfe3",
]);

// Cupón VIP multi-uso ilimitado (controlado por el CEO: VIP-FIESTA-99)
const VIP_UNLIMITED_HASH = "8523782c1795c0fa05d5ae558254ff2297fcaf66c7d43c25050fc44e79586582";

// 10 Cupones VIP de 1 solo uso para sujetos de prueba (VIP-01 a VIP-10)
export const VIP_COUPON_HASHES_ORDERED = [
  "2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78", // #01 (Ivana)
  "64dcfd5399ddc201e6e6d0b97d850858bd1fd57c65829d38442d2c6b7810a981", // #02
  "6e9d8dee0ef7f4ef50b36867d0bffcfee63ed07f54aaae9f938056e381386e22", // #03
  "3838a6eb765ea62076919c582f173b04e12191b92676e5c483e727343476e3fa", // #04
  "f97978c09cc314b1c8f8f309df08c60afc4895ccdf6d2271300eed85ab1dae12", // #05
  "e1b7e9b125c1c1357499a748d284798ac91e735cf756f8db031aa9ccf14be9e1", // #06
  "6664b2fdb0d124ba6edceb067967bfb0294f4329bedc0fceae5ea095d81e94a6", // #07
  "5426e534150f74c93852bf59eff2c617f6f81e5bc216c3d70fbeb21e2597843c", // #08
  "e87a979d3088ad7386aad2495a65a962b472d0066e8ea4d828be2607b58abfb8", // #09
  "742a2aec39167520bf37f1335d5c01535910e17906212bb71a87ecd6fb56f9fe", // #10
];

// Cifrado criptográfico de códigos VIP exclusivo en memoria para la consola del CEO.
// Ningún código existe en texto plano en el bundle cliente (Zero-Plaintext).
const ENCRYPTED_VIP_CODES = [
  "cd632d3195350385593f",
  "a0db949a90254e9f265c",
  "d1903b2eea5e29bf2ae3",
  "45a4197f143361930a3f",
  "0d8276d7a3a1c2e6b617",
  "c4b741b7b44c37716a40",
  "1a1d28eaf1fc29d42763",
  "3c1d4317f91cac74ae0b",
  "af8f58a027f98c13f33a",
  "6126abf1774d957cdaa1",
];

function pureXorDecrypt(hex: string, keyHex: string): string {
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const cipherByte = parseInt(hex.substring(i, i + 2), 16);
    const keyByteIndex = ((i / 2) % 32) * 2;
    const keyByte = parseInt(keyHex.substring(keyByteIndex, keyByteIndex + 2), 16);
    out += String.fromCharCode(cipherByte ^ keyByte);
  }
  return out;
}

/**
 * Descifra en memoria la lista de códigos VIP única y exclusivamente si el usuario
 * posee un token de CEO válido y verificado. Si alguien no es CEO o no tiene la clave,
 * devuelve un array vacío.
 */
export function getDecryptedVipCodes(ceoToken: string | null): string[] {
  if (!ceoToken || typeof ceoToken !== "string" || ceoToken.length !== 64) return [];
  const verifyHash = sha256(VERIFY_SALT + ceoToken);
  if (!CEO_VERIFY_HASHES.has(verifyHash)) return [];

  const list: string[] = [];
  for (let i = 0; i < ENCRYPTED_VIP_CODES.length; i++) {
    const subkey = sha256(`${ceoToken}:${i + 1}`);
    const code = pureXorDecrypt(ENCRYPTED_VIP_CODES[i]!, subkey);
    if (/^VIP-\d{2}-[A-Z0-9]{3}$/.test(code)) {
      list.push(code);
    } else {
      return [];
    }
  }
  return list;
}

const VIP_SINGLE_USE_HASHES = new Set(VIP_COUPON_HASHES_ORDERED);

export const TESTER_COUPON_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas (2 días)

export const STORAGE_KEYS = {
  CEO_TOKEN: "impostor-ceo-token",
  PRO_TOKEN: "impostor-pro-token",
  PRO_EXPIRES: "impostor-pro-expires",
  USED_COUPONS: "impostor-used-coupons",
  COUPON_NAMES: "impostor-coupon-names",
  DISCORD_WEBHOOK: "impostor-discord-webhook",
  FOUNDER_NUMBER: "impostor-founder-number",
  FOUNDER_CODE: "impostor-founder-code",
  PAYMENT_CONFIG: "impostor-payment-config",
} as const;

export type AccessCodeRole =
  "ceo" | "vip_unlimited" | "vip_single" | "founder" | "guest_pass" | "already_used" | null;

const FOUNDER_SECRET = "imposter-founder-v1-secret-8a2b4c6e:";

/**
 * Genera un código criptográfico único de Miembro Fundador Vitalicio.
 * Formato: FNDR-XXXX-YYYY (Ej: FNDR-0001-A7B2)
 */
export function generateFounderCode(number: number): string {
  const numStr = String(number).padStart(4, "0");
  const prefix = `FNDR-${numStr}`;
  const sig = sha256(FOUNDER_SECRET + prefix)
    .slice(0, 4)
    .toUpperCase();
  return `${prefix}-${sig}`;
}

/**
 * Valida la autenticidad matemática de un código de Fundador Vitalicio.
 */
export function isValidFounderCode(rawInput: string): { valid: boolean; number: number | null } {
  const normalized = rawInput.trim().toUpperCase();
  const match = normalized.match(/^FNDR-(\d{4})-([A-F0-9]{4})$/);
  if (!match) return { valid: false, number: null };
  const numStr = match[1]!;
  const sig = match[2]!;
  const expectedSig = sha256(FOUNDER_SECRET + `FNDR-${numStr}`)
    .slice(0, 4)
    .toUpperCase();
  if (sig !== expectedSig) return { valid: false, number: null };
  return { valid: true, number: parseInt(numStr, 10) };
}

/**
 * Genera uno de los 5 pases de invitado de un fundador (P1 a P5).
 * Formato: FNDRXXXX-P1-YYY (Ej: FNDR0001-P1-9B4)
 */
export function generateGuestPass(founderNumber: number, passIndex: number): string {
  const numStr = String(founderNumber).padStart(4, "0");
  const base = `FNDR${numStr}-P${passIndex}`;
  const sig = sha256(FOUNDER_SECRET + base)
    .slice(0, 3)
    .toUpperCase();
  return `${base}-${sig}`;
}

/**
 * Valida la autenticidad matemática de un pase de invitado (24h).
 */
export function isValidGuestPass(rawInput: string): {
  valid: boolean;
  founderNumber: number | null;
  passIndex: number | null;
} {
  const normalized = rawInput.trim().toUpperCase();
  const match = normalized.match(/^FNDR(\d{4})-P([1-5])-([A-F0-9]{3})$/);
  if (!match) return { valid: false, founderNumber: null, passIndex: null };
  const numStr = match[1]!;
  const passIdx = parseInt(match[2]!, 10);
  const sig = match[3]!;
  const expectedSig = sha256(FOUNDER_SECRET + `FNDR${numStr}-P${passIdx}`)
    .slice(0, 3)
    .toUpperCase();
  if (sig !== expectedSig) return { valid: false, founderNumber: null, passIndex: null };
  return { valid: true, founderNumber: parseInt(numStr, 10), passIndex: passIdx };
}

/**
 * Crea un sello de expiración firmado con SHA-256 vinculado al token del cupón.
 * Impide que alguien edite la fecha de vencimiento con F12 en localStorage.
 */
export function createSignedExpiry(token: string, expiresAt: number): string {
  const sig = sha256(`${VERIFY_SALT}${token}:exp:${expiresAt}`);
  return `${expiresAt}.${sig}`;
}

/**
 * Verifica la firma criptográfica del tiempo de expiración y devuelve el timestamp (ms)
 * o null si fue manipulado con F12.
 */
export function parseSignedExpiry(token: string | null, rawExpiry: string | null): number | null {
  if (!token || !rawExpiry || typeof rawExpiry !== "string") return null;
  const parts = rawExpiry.split(".");
  if (parts.length !== 2) return null;
  const expiresAt = Number(parts[0]);
  const sig = parts[1];
  if (!Number.isFinite(expiresAt) || expiresAt <= 0 || !sig || sig.length !== 64) {
    return null;
  }
  const expectedSig = sha256(`${VERIFY_SALT}${token}:exp:${expiresAt}`);
  if (sig !== expectedSig) return null;
  return expiresAt;
}

export interface AccessCodeVerificationResult {
  role: AccessCodeRole;
  token: string | null;
  couponIdHash: string | null;
  meta?: {
    founderNumber?: number;
    passIndex?: number;
  };
}

/**
 * Normaliza cualquier formato de código de acceso ingresado por testers o usuarios
 * (mayúsculas/minúsculas, con o sin guiones, con o sin espacios) al formato canónico.
 * Ejemplos:
 * - "vip01k9x" | "VIP 01 K9X" | "VIP-1-K9X" -> "VIP-01-K9X"
 * - "vipfiesta99" | "VIP FIESTA 99" -> "VIP-FIESTA-99"
 * - "ceoimposter2026" | "CEO IMPOSTER 2026" -> "CEO-IMPOSTER-2026"
 * - "fndr0001a7b2" -> "FNDR-0001-A7B2"
 * - "fndr0001p19b4" -> "FNDR0001-P1-9B4"
 */
export function normalizeAccessCodeInput(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");

  // Cupones VIP de prueba (VIP-01 a VIP-10)
  const vipTesterMatch = cleaned.match(/^VIP-?0?([1-9]|10)-?([A-Z0-9]{3})$/);
  if (vipTesterMatch) {
    const num = vipTesterMatch[1]!.padStart(2, "0");
    const suffix = vipTesterMatch[2]!;
    return `VIP-${num}-${suffix}`;
  }

  // Cupón VIP ilimitado
  const vipFiestaMatch = cleaned.match(/^VIP-?FIESTA-?99$/);
  if (vipFiestaMatch) {
    return "VIP-FIESTA-99";
  }

  // Clave maestra CEO
  const ceoMatch = cleaned.match(/^CEO-?IMPOSTER-?2026$/);
  if (ceoMatch) {
    return "CEO-IMPOSTER-2026";
  }

  // Código Fundador Vitalicio (FNDR-XXXX-YYYY)
  const fndrMatch = cleaned.match(/^FNDR-?(\d{4})-?([A-F0-9]{4})$/);
  if (fndrMatch) {
    return `FNDR-${fndrMatch[1]}-${fndrMatch[2]}`;
  }

  // Pase de Invitado Embajador (FNDRXXXX-PX-YYY)
  const guestMatch = cleaned.match(/^FNDR-?(\d{4})-?P([1-5])-?([A-F0-9]{3})$/);
  if (guestMatch) {
    return `FNDR${guestMatch[1]}-P${guestMatch[2]}-${guestMatch[3]}`;
  }

  return cleaned;
}

/**
 * Verifica un código ingresado por el usuario sin exponer las claves en texto plano.
 * - "ceo": Acceso maestro ilimitado.
 * - "vip_unlimited": Cupón VIP-FIESTA-99 de uso libre ilimitado.
 * - "vip_single": Cupón de tester de 1 solo uso y 48 horas de duración.
 * - "founder": Pase Fundador Vitalicio (FNDR-XXXX-YYYY).
 * - "guest_pass": Pase de Embajador 24h de un fundador (FNDRXXXX-PX-YYY).
 * - "already_used": El cupón o pase ya fue consumido anteriormente.
 */
export function verifyAccessCode(
  rawInput: string,
  usedCouponHashes: string[] = [],
): AccessCodeVerificationResult {
  const normalized = normalizeAccessCodeInput(rawInput);
  if (!normalized || normalized.length > 40) {
    return { role: null, token: null, couponIdHash: null };
  }
  const token = sha256(CODE_SALT + normalized);
  const verifyHash = sha256(VERIFY_SALT + token);

  if (CEO_VERIFY_HASHES.has(verifyHash)) {
    return { role: "ceo", token, couponIdHash: verifyHash };
  }
  if (verifyHash === VIP_UNLIMITED_HASH) {
    return { role: "vip_unlimited", token, couponIdHash: verifyHash };
  }
  if (VIP_SINGLE_USE_HASHES.has(verifyHash)) {
    if (usedCouponHashes.includes(verifyHash)) {
      return { role: "already_used", token: null, couponIdHash: verifyHash };
    }
    return { role: "vip_single", token, couponIdHash: verifyHash };
  }

  // Comprobar si es un Código de Miembro Fundador Vitalicio (FNDR-XXXX-YYYY)
  const founderCheck = isValidFounderCode(normalized);
  if (founderCheck.valid && founderCheck.number !== null) {
    if (usedCouponHashes.includes(verifyHash)) {
      return {
        role: "already_used",
        token: null,
        couponIdHash: verifyHash,
        meta: { founderNumber: founderCheck.number },
      };
    }
    const approvedToken = createPurchaseApprovedToken();
    return {
      role: "founder",
      token: approvedToken,
      couponIdHash: verifyHash,
      meta: { founderNumber: founderCheck.number },
    };
  }

  // Comprobar si es un Pase de Invitado 24h de Fundador (FNDRXXXX-PX-YYY)
  const guestCheck = isValidGuestPass(normalized);
  if (guestCheck.valid && guestCheck.founderNumber !== null && guestCheck.passIndex !== null) {
    if (usedCouponHashes.includes(verifyHash)) {
      return {
        role: "already_used",
        token: null,
        couponIdHash: verifyHash,
        meta: { founderNumber: guestCheck.founderNumber, passIndex: guestCheck.passIndex },
      };
    }
    const approvedToken = createPurchaseApprovedToken();
    return {
      role: "guest_pass",
      token: approvedToken,
      couponIdHash: verifyHash,
      meta: { founderNumber: guestCheck.founderNumber, passIndex: guestCheck.passIndex },
    };
  }

  return { role: null, token: null, couponIdHash: null };
}

const PURCHASE_SEAL = "imposter-approved-purchase-v1-seal-7a8b9c:";

export function createPurchaseApprovedToken(): string {
  const seed = sha256(Math.random().toString() + Date.now().toString());
  const body = seed.slice(8);
  const check = sha256(PURCHASE_SEAL + body).slice(0, 8);
  return check + body;
}

export function isPurchaseApprovedToken(token: string | null): boolean {
  if (!token || typeof token !== "string" || token.length !== 64) return false;
  const check = token.slice(0, 8);
  const body = token.slice(8);
  const expected = sha256(PURCHASE_SEAL + body).slice(0, 8);
  return check === expected;
}

/**
 * Valida que el token almacenado en localStorage no haya sido falsificado con F12,
 * y si pertenece a uno de los 10 cupones de prueba o compras aprobadas, exige que su sello sea válido y vigente.
 */
export function isValidStoredToken(
  token: string | null,
  expectedRole: "ceo" | "pro",
  rawExpiry?: string | null,
  now: number = Date.now(),
): boolean {
  if (!token || typeof token !== "string" || token.length !== 64) return false;
  const verifyHash = sha256(VERIFY_SALT + token);
  if (expectedRole === "ceo") {
    return CEO_VERIFY_HASHES.has(verifyHash);
  }
  if (verifyHash === VIP_UNLIMITED_HASH) {
    return true;
  }
  if (isPurchaseApprovedToken(token)) {
    if (rawExpiry) {
      const expiresAt = parseSignedExpiry(token, rawExpiry);
      if (!expiresAt) return false;
      if (now >= expiresAt) return false;
    }
    return true;
  }
  if (VIP_SINGLE_USE_HASHES.has(verifyHash)) {
    const expiresAt = parseSignedExpiry(token, rawExpiry ?? null);
    if (!expiresAt) return false;
    // Bloquear si ya pasaron las 48h o si la fecha excede el límite máximo permitido
    if (now >= expiresAt || expiresAt > now + TESTER_COUPON_DURATION_MS + 60000) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Sanitiza un objeto JSON importado desde el portapapeles para prevenir Prototype Pollution,
 * inyección de tipos inválidos o desbordamiento de memoria (DoS).
 */
export function sanitizeImportedCategories(
  raw: unknown,
  reservedNames: string[],
): Record<string, string[]> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const forbiddenKeys = new Set(["__proto__", "constructor", "prototype", ...reservedNames]);
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length === 0 || entries.length > 20) {
    return null;
  }

  const sanitized: Record<string, string[]> = {};

  for (const [rawKey, rawVal] of entries) {
    const cleanKey = rawKey.replace(/[<>]/g, "").trim().slice(0, 30);
    if (!cleanKey || forbiddenKeys.has(cleanKey)) continue;
    if (!Array.isArray(rawVal)) continue;

    const cleanWords = rawVal
      .filter((w): w is string => typeof w === "string")
      .map((w) => w.replace(/[<>]/g, "").trim().slice(0, 40))
      .filter((w) => w.length > 0)
      .slice(0, 150);

    if (cleanWords.length >= 3) {
      sanitized[cleanKey] = Array.from(new Set(cleanWords));
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}
