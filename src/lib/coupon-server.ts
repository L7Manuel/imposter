import { createServerFn } from "@tanstack/react-start";
import {
  VIP_COUPON_HASHES_ORDERED,
  isValidStoredToken,
  createPurchaseApprovedToken,
  createSignedExpiry,
  generateFounderCode,
  isValidFounderCode,
  generateGuestPass,
  isValidGuestPass,
  createRotatedCeoToken,
  isRotatedCeoToken,
  computeTokenVerifyHash,
  isValidDynamicCeoKey,
  normalizeAccessCodeInput,
  verifyAccessCode,
  STORAGE_KEYS,
} from "@/lib/security";
import {
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  sanitizePaymentConfig,
  PendingPayment,
  PartyPassPlan,
  PARTY_PASS_PLANS,
} from "@/lib/payment-config";

export interface FounderRecord {
  number: number;
  code: string;
  name: string;
  issuedAt: number;
  redeemedAt: number | null;
  guestPasses: Array<{
    passIndex: number;
    code: string;
    redeemedAt: number | null;
    redeemedBy?: string;
  }>;
}

interface CloudflareKVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface ImposterVaultSnapshot {
  founders?: FounderRecord[];
  payments?: PendingPayment[];
  paymentConfig?: PaymentConfig;
  usedCoupons?: Array<[string, { activatedAt: number; couponNumber: number }]>;
  activeCeoVerifyHash?: string | null;
  ceoKeyMeta?: { keyVersion: number; rotatedAt: number | null; maskedPreview: string };
}

declare global {
  var __imposterUsedCouponsMap:
    Map<string, { activatedAt: number; couponNumber: number }> | undefined;
  var __imposterDiscordWebhookUrl: string | undefined;
  var __imposterPaymentConfig: PaymentConfig | undefined;
  var __imposterPendingPayments: Map<string, PendingPayment> | undefined;
  var __imposterPaymentRateLimitMap: Map<string, number[]> | undefined;
  var __imposterFoundersMap: Map<number, FounderRecord> | undefined;
  var __imposterActiveCeoVerifyHash: string | null | undefined;
  var __imposterCeoKeyMeta:
    { keyVersion: number; rotatedAt: number | null; maskedPreview: string } | undefined;
  var __imposterVaultHydrated: boolean | undefined;
  var __imposterVaultLastSyncAt: number | undefined;
  var __env__: { IMPOSTER_KV?: CloudflareKVNamespace } | undefined;
}

const VAULT_STORAGE_KEY = "imposter:vault:v2";

function getCloudflareKv(): CloudflareKVNamespace | null {
  return globalThis.__env__?.IMPOSTER_KV ?? null;
}

async function ensureVaultHydrated(): Promise<void> {
  if (typeof process !== "undefined" && process.env?.["VITEST"]) return;
  const now = Date.now();
  if (
    globalThis.__imposterVaultHydrated &&
    now - (globalThis.__imposterVaultLastSyncAt ?? 0) < 2000
  ) {
    return;
  }
  globalThis.__imposterVaultHydrated = true;
  globalThis.__imposterVaultLastSyncAt = now;

  try {
    let rawJson: string | null = null;
    const kv = getCloudflareKv();
    if (kv) {
      rawJson = await kv.get(VAULT_STORAGE_KEY);
    } else if (typeof process !== "undefined" && process.versions?.node) {
      try {
        const fs = await import("node:fs/promises");
        rawJson = await fs.readFile(".wrangler/imposter-vault-dev.json", "utf8");
      } catch {
        rawJson = null;
      }
    }

    if (!rawJson) return;
    const parsed = JSON.parse(rawJson) as ImposterVaultSnapshot;

    if (Array.isArray(parsed.founders)) {
      const fMap = getServerFoundersMap();
      fMap.clear();
      for (const f of parsed.founders) {
        if (f && typeof f.number === "number") {
          fMap.set(f.number, f);
        }
      }
    }
    if (Array.isArray(parsed.payments)) {
      const pMap = getServerPaymentsMap();
      pMap.clear();
      for (const p of parsed.payments) {
        if (p && typeof p.id === "string") {
          pMap.set(p.id, p);
        }
      }
    }
    if (parsed.paymentConfig) {
      globalThis.__imposterPaymentConfig = sanitizePaymentConfig(parsed.paymentConfig);
    }
    if (Array.isArray(parsed.usedCoupons)) {
      const cMap = getServerCouponMap();
      cMap.clear();
      for (const [hash, meta] of parsed.usedCoupons) {
        if (typeof hash === "string" && meta && typeof meta.activatedAt === "number") {
          cMap.set(hash, meta);
        }
      }
    }
    if (parsed.activeCeoVerifyHash !== undefined) {
      globalThis.__imposterActiveCeoVerifyHash = parsed.activeCeoVerifyHash;
    }
    if (parsed.ceoKeyMeta) {
      globalThis.__imposterCeoKeyMeta = parsed.ceoKeyMeta;
    }
  } catch {
    /* ignore hydration errors */
  }
}

async function persistVaultSnapshot(): Promise<void> {
  if (typeof process !== "undefined" && process.env?.["VITEST"]) return;
  try {
    globalThis.__imposterVaultLastSyncAt = Date.now();
    const snapshot: ImposterVaultSnapshot = {
      founders: Array.from(getServerFoundersMap().values()),
      payments: Array.from(getServerPaymentsMap().values()),
      paymentConfig: globalThis.__imposterPaymentConfig || DEFAULT_PAYMENT_CONFIG,
      usedCoupons: Array.from(getServerCouponMap().entries()),
      activeCeoVerifyHash: globalThis.__imposterActiveCeoVerifyHash ?? null,
      ceoKeyMeta: getCeoKeyMeta(),
    };
    const serialized = JSON.stringify(snapshot);
    const kv = getCloudflareKv();
    if (kv) {
      await kv.put(VAULT_STORAGE_KEY, serialized);
    } else if (typeof process !== "undefined" && process.versions?.node) {
      try {
        const fs = await import("node:fs/promises");
        await fs.mkdir(".wrangler", { recursive: true });
        await fs.writeFile(".wrangler/imposter-vault-dev.json", serialized, "utf8");
      } catch {
        /* ignore local dev write error */
      }
    }
  } catch {
    /* ignore persistence error */
  }
}

function getCeoKeyMeta() {
  if (!globalThis.__imposterCeoKeyMeta) {
    globalThis.__imposterCeoKeyMeta = {
      keyVersion: 1,
      rotatedAt: null,
      maskedPreview: "CEO-••••-2026 (Fábrica)",
    };
  }
  return globalThis.__imposterCeoKeyMeta;
}

function isServerCeoTokenValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string" || token.length !== 64) return false;
  const activeHash = globalThis.__imposterActiveCeoVerifyHash;
  if (activeHash) {
    return computeTokenVerifyHash(token) === activeHash && isRotatedCeoToken(token);
  }
  return isValidStoredToken(token, "ceo");
}

function getServerFoundersMap(): Map<number, FounderRecord> {
  if (!globalThis.__imposterFoundersMap) {
    globalThis.__imposterFoundersMap = new Map();
  }
  return globalThis.__imposterFoundersMap;
}

function getServerCouponMap(): Map<string, { activatedAt: number; couponNumber: number }> {
  if (!globalThis.__imposterUsedCouponsMap) {
    globalThis.__imposterUsedCouponsMap = new Map();
  }
  return globalThis.__imposterUsedCouponsMap;
}

function getServerPaymentsMap(): Map<string, PendingPayment> {
  if (!globalThis.__imposterPendingPayments) {
    globalThis.__imposterPendingPayments = new Map();
  }
  return globalThis.__imposterPendingPayments;
}

export async function sendDiscordWebhookEmbed({
  webhookUrl,
  title,
  description,
  color = 0xf59e0b,
  fields = [],
}: {
  webhookUrl: string;
  title: string;
  description: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): Promise<boolean> {
  const url =
    webhookUrl ||
    globalThis.__imposterDiscordWebhookUrl ||
    (typeof process !== "undefined" && process.env?.["DISCORD_METRICS_WEBHOOK_URL"]) ||
    (typeof process !== "undefined" && process.env?.["DISCORD_WEBHOOK_URL"]) ||
    "";

  let deliveredViaWebhook = false;
  if (url && url.startsWith("https://discord.com/api/webhooks/")) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Imposter CEO Bot",
          avatar_url: "https://imposter.manu-07games.workers.dev/icon-512.png",
          embeds: [
            {
              title,
              description,
              color,
              fields,
              footer: { text: "Imposter Monetization Engine — Cloudflare Edge" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });
      deliveredViaWebhook = res.ok;
    } catch {
      deliveredViaWebhook = false;
    }
  }

  // Fallback automático hacia el bot Atlas en Render Cloud si no hubo webhook directo
  if (!deliveredViaWebhook) {
    try {
      const atlasRes = await fetch("https://atlas-bot-2xh4.onrender.com/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "commerce_embed",
          title,
          description,
          color,
          fields,
        }),
        signal: AbortSignal.timeout(4500),
      });
      if (atlasRes.ok) return true;
    } catch {
      /* ignore fallback error */
    }
  }

  return deliveredViaWebhook;
}

/**
 * Valida la sesión del CEO en el servidor leyendo la cookie segura o el token cliente (Zero-Flicker SSR & SPA).
 * Permite precargar fundadores, pagos y configuración desde el primer frame sin parpadeos.
 */
export const checkCeoAuthServerFn = createServerFn({ method: "GET" })
  .validator((input?: { clientToken?: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const meta = getCeoKeyMeta();
    const activeVerifyHash = globalThis.__imposterActiveCeoVerifyHash ?? null;
    try {
      let token = data?.clientToken || null;
      if (!token) {
        const srv = await import("@tanstack/react-start/server");
        if (typeof srv.getCookie === "function") {
          token = srv.getCookie(STORAGE_KEYS.CEO_TOKEN) || null;
        }
        if (!token && typeof srv.getRequestHeader === "function") {
          const cookieHeader = srv.getRequestHeader("cookie") || "";
          const match = cookieHeader.match(
            new RegExp(`(?:^|;\\s*)${STORAGE_KEYS.CEO_TOKEN}=([^;]+)`),
          );
          if (match?.[1]) {
            token = decodeURIComponent(match[1]);
          }
        }
      }
      if (token && isServerCeoTokenValid(token)) {
        const initialFounders = Array.from(getServerFoundersMap().values()).sort(
          (a, b) => a.number - b.number,
        );
        const initialPayments = Array.from(getServerPaymentsMap().values())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 40);
        const initialPaymentConfig = globalThis.__imposterPaymentConfig || DEFAULT_PAYMENT_CONFIG;
        const initialUsedCoupons = Array.from(getServerCouponMap().keys());

        return {
          isAuthorized: true,
          token,
          activeVerifyHash,
          keyVersion: meta.keyVersion,
          rotatedAt: meta.rotatedAt,
          maskedPreview: meta.maskedPreview,
          initialFounders,
          initialPayments,
          initialPaymentConfig,
          initialUsedCoupons,
        };
      }
    } catch {
      /* fallback to unauthenticated */
    }
    return {
      isAuthorized: false,
      token: null,
      activeVerifyHash,
      keyVersion: meta.keyVersion,
      rotatedAt: meta.rotatedAt,
      maskedPreview: meta.maskedPreview,
      initialFounders: [] as FounderRecord[],
      initialPayments: [] as PendingPayment[],
      initialPaymentConfig: DEFAULT_PAYMENT_CONFIG,
      initialUsedCoupons: [] as string[],
    };
  });

/**
 * Verifica el inicio de sesión del CEO contra la llave maestra activa en el servidor
 * (ya sea la de fábrica o una llave maestra rotada dinámicamente).
 */
export const verifyCeoLoginServerFn = createServerFn({ method: "POST" })
  .validator((input: { rawKey: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const normalized = normalizeAccessCodeInput(data.rawKey);
    const activeHash = globalThis.__imposterActiveCeoVerifyHash ?? null;
    const meta = getCeoKeyMeta();

    if (activeHash) {
      const candidateToken = createRotatedCeoToken(normalized);
      const candidateHash = computeTokenVerifyHash(candidateToken);
      if (candidateHash === activeHash) {
        return {
          authorized: true,
          token: candidateToken,
          activeVerifyHash: activeHash,
          keyVersion: meta.keyVersion,
          rotatedAt: meta.rotatedAt,
          maskedPreview: meta.maskedPreview,
        };
      }
      return { authorized: false, token: null, activeVerifyHash: activeHash };
    }

    // Si el worker no tiene hash activo en memoria pero el CEO ingresa una llave dinámica firmada válida
    const dynCheck = isValidDynamicCeoKey(normalized);
    if (dynCheck.valid) {
      const rotatedToken = createRotatedCeoToken(dynCheck.normalized);
      const rotatedHash = computeTokenVerifyHash(rotatedToken);
      globalThis.__imposterActiveCeoVerifyHash = rotatedHash;
      meta.maskedPreview = `${dynCheck.normalized.slice(0, 6)}••••${dynCheck.normalized.slice(-2)}`;
      await persistVaultSnapshot();
      return {
        authorized: true,
        token: rotatedToken,
        activeVerifyHash: rotatedHash,
        keyVersion: meta.keyVersion,
        rotatedAt: meta.rotatedAt,
        maskedPreview: meta.maskedPreview,
      };
    }

    const stdCheck = verifyAccessCode(normalized, []);
    if (stdCheck.role === "ceo" && stdCheck.token) {
      return {
        authorized: true,
        token: stdCheck.token,
        activeVerifyHash: null,
        keyVersion: meta.keyVersion,
        rotatedAt: meta.rotatedAt,
        maskedPreview: meta.maskedPreview,
      };
    }

    return { authorized: false, token: null, activeVerifyHash: activeHash };
  });

/**
 * Rota la Llave Maestra del CEO, revoca instantáneamente sesiones anteriores en otros dispositivos
 * y envía respaldo cifrado al canal de Discord del CEO vía Atlas.
 */
export const rotateCeoMasterKeyServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: { currentCeoToken: string; action: "rotate" | "reset_factory"; newKey?: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.currentCeoToken)) {
      return { success: false, error: "Sesión CEO actual no válida o expirada." };
    }

    const meta = getCeoKeyMeta();

    if (data.action === "reset_factory") {
      globalThis.__imposterActiveCeoVerifyHash = null;
      meta.keyVersion += 1;
      meta.rotatedAt = Date.now();
      meta.maskedPreview = "CEO-••••-2026 (Fábrica)";
      await persistVaultSnapshot();

      await sendDiscordWebhookEmbed({
        webhookUrl: "",
        title: "🔐 Llave Maestra CEO Restaurada a Fábrica",
        description:
          "El CEO restauró la Llave Maestra original de fábrica desde el Panel Ejecutivo.",
        color: 0xf59e0b,
        fields: [
          { name: "Versión de Bóveda", value: `v${meta.keyVersion}.0`, inline: true },
          { name: "Llave Activa", value: "`CEO-••••-2026 (Fábrica)`", inline: true },
        ],
      });

      return {
        success: true,
        token: data.currentCeoToken,
        activeVerifyHash: null,
        normalizedKey: "CEO-••••-2026",
        keyVersion: meta.keyVersion,
        rotatedAt: meta.rotatedAt,
        maskedPreview: meta.maskedPreview,
      };
    }

    const rawNewKey = (data.newKey || "").trim().toUpperCase().replace(/\s+/g, "");
    if (rawNewKey.length < 6 || rawNewKey.length > 36) {
      return {
        success: false,
        error: "La nueva llave maestra debe tener entre 6 y 36 caracteres.",
      };
    }

    const newToken = createRotatedCeoToken(rawNewKey);
    const newVerifyHash = computeTokenVerifyHash(newToken);

    globalThis.__imposterActiveCeoVerifyHash = newVerifyHash;
    meta.keyVersion += 1;
    meta.rotatedAt = Date.now();
    meta.maskedPreview =
      rawNewKey.length >= 8
        ? `${rawNewKey.slice(0, 6)}••••${rawNewKey.slice(-2)}`
        : `${rawNewKey.slice(0, 3)}•••`;
    await persistVaultSnapshot();

    await sendDiscordWebhookEmbed({
      webhookUrl: "",
      title: "🛡️ ¡NUEVA LLAVE MAESTRA CEO ACTIVADA!",
      description:
        "Se acaba de rotar la Llave Maestra del Panel Ejecutivo CEO. Todas las sesiones anteriores en otros teléfonos han sido revocadas automáticamente.",
      color: 0x10b981,
      fields: [
        { name: "🔑 Nueva Llave Maestra", value: `\`${rawNewKey}\``, inline: true },
        { name: "🛡️ Versión de Seguridad", value: `v${meta.keyVersion}.0`, inline: true },
        {
          name: "📱 Estado de Otros Dispositivos",
          value: "Sesiones anteriores revocadas",
          inline: true,
        },
      ],
    });

    return {
      success: true,
      token: newToken,
      activeVerifyHash: newVerifyHash,
      normalizedKey: rawNewKey,
      keyVersion: meta.keyVersion,
      rotatedAt: meta.rotatedAt,
      maskedPreview: meta.maskedPreview,
    };
  });

export const consumeSingleUseCouponServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      couponIdHash: string;
      action?: "consume" | "reset" | undefined;
      testerName?: string | undefined;
      discordWebhookUrl?: string | undefined;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const store = getServerCouponMap();

    if (data.discordWebhookUrl) {
      globalThis.__imposterDiscordWebhookUrl = data.discordWebhookUrl;
    }

    if (data.action === "reset") {
      if (data.couponIdHash) {
        store.delete(data.couponIdHash);
      } else {
        store.clear();
      }
      await persistVaultSnapshot();
      return { allowed: true, totalUsed: store.size };
    }

    const hash = data.couponIdHash;
    if (!hash || typeof hash !== "string" || hash.length !== 64) {
      return { allowed: false, totalUsed: store.size, activatedAt: 0 };
    }

    if (store.has(hash)) {
      const existing = store.get(hash)!;
      return { allowed: false, totalUsed: store.size, activatedAt: existing.activatedAt };
    }

    const idx = VIP_COUPON_HASHES_ORDERED.indexOf(hash);
    const couponNumber = idx >= 0 ? idx + 1 : 0;
    const now = Date.now();

    store.set(hash, { activatedAt: now, couponNumber });
    await persistVaultSnapshot();

    // Notificar a Discord si hay webhook configurado
    await sendDiscordWebhookEmbed({
      webhookUrl: data.discordWebhookUrl || "",
      title: `🎟️ ¡Cupón VIP #${couponNumber} Activado!`,
      description: "Un sujeto de prueba acaba de canjear su acceso de 48 horas a Party Pass PRO.",
      fields: [
        { name: "Cupón", value: `Cupón #${couponNumber}`, inline: true },
        {
          name: "Tester Asignado",
          value: data.testerName || (couponNumber === 1 ? "Ivana" : `Tester #${couponNumber}`),
          inline: true,
        },
        { name: "Duración", value: "48 Horas (2 días)", inline: true },
      ],
    });

    return { allowed: true, totalUsed: store.size, activatedAt: now };
  });

export const getCouponServerStatusServerFn = createServerFn({ method: "POST" })
  .validator((input?: { defaultWebhook?: string | undefined } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const store = getServerCouponMap();
    if (data?.defaultWebhook && !globalThis.__imposterDiscordWebhookUrl) {
      globalThis.__imposterDiscordWebhookUrl = data.defaultWebhook;
    }
    const list: Array<{ hash: string; activatedAt: number; couponNumber: number }> = [];
    store.forEach((val, hash) => {
      list.push({ hash, activatedAt: val.activatedAt, couponNumber: val.couponNumber });
    });
    return {
      usedCoupons: list,
      hasDiscordWebhook: Boolean(globalThis.__imposterDiscordWebhookUrl),
    };
  });

export const testDiscordWebhookServerFn = createServerFn({ method: "POST" })
  .validator((input: { webhookUrl?: string | undefined }) => input)
  .handler(async ({ data }) => {
    const url = (data.webhookUrl || "").trim();
    if (url && !url.startsWith("https://discord.com/api/webhooks/")) {
      return {
        success: false,
        error: "Si ingresas un Webhook manual, debe comenzar con https://discord.com/api/webhooks/",
      };
    }
    if (url) {
      globalThis.__imposterDiscordWebhookUrl = url;
    }
    const ok = await sendDiscordWebhookEmbed({
      webhookUrl: url,
      title: "👑 ¡Conexión de Imposter Verificada Exitosamente!",
      description:
        "Las notificaciones en tiempo real para tu juego **Imposter** están activas. Recibirás aquí un aviso instantáneo cada vez que un cliente pague, un fundador active su pase o un tester canjee un cupón.",
      fields: [
        { name: "Plataforma", value: "Cloudflare Workers / Atlas Bridge", inline: true },
        { name: "Estado", value: "🟢 En Línea y Monitoreando", inline: true },
      ],
    });
    return {
      success: ok,
      error: ok
        ? null
        : "No se pudo entregar la alerta. Verifica tu enlace de Webhook o que el bot Atlas esté activo.",
    };
  });

export const getPaymentConfigServerFn = createServerFn({ method: "POST" })
  .validator((input?: { defaultFallback?: PaymentConfig | undefined } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!globalThis.__imposterPaymentConfig) {
      if (data?.defaultFallback) {
        globalThis.__imposterPaymentConfig = sanitizePaymentConfig(data.defaultFallback);
      } else {
        globalThis.__imposterPaymentConfig = DEFAULT_PAYMENT_CONFIG;
      }
    }
    return {
      config: globalThis.__imposterPaymentConfig,
    };
  });

export const savePaymentConfigServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: { ceoToken: string; config: PaymentConfig; discordWebhookUrl?: string | undefined }) =>
      input,
  )
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.ceoToken)) {
      return { success: false, error: "No autorizado. Clave CEO no válida." };
    }

    const sanitized = sanitizePaymentConfig(data.config);
    globalThis.__imposterPaymentConfig = sanitized;

    const webhookToUse =
      data.discordWebhookUrl ||
      sanitized.discordWebhookUrl ||
      globalThis.__imposterDiscordWebhookUrl;

    if (webhookToUse) {
      globalThis.__imposterDiscordWebhookUrl = webhookToUse;
    }

    await persistVaultSnapshot();

    // Notificar a Discord si hay webhook
    await sendDiscordWebhookEmbed({
      webhookUrl: webhookToUse || "",
      title: "💳 Configuración de Pagos Actualizada",
      description: "El CEO acaba de actualizar los datos de cobro de Imposter.",
      fields: [
        {
          name: "Pago Móvil",
          value: `${sanitized.pagoMovil.banco} | ${sanitized.pagoMovil.telefono || "Sin teléfono"}`,
          inline: true,
        },
        {
          name: "Binance Pay ID",
          value: sanitized.binancePay.payId || "Sin configurar",
          inline: true,
        },
        {
          name: "Tasa Referencia",
          value: `Bs. ${sanitized.pagoMovil.tasaBs} / USD`,
          inline: true,
        },
      ],
    });

    return { success: true, config: sanitized };
  });

export const notifyPaymentIntentServerFn = createServerFn({ method: "POST" })
  .validator((input: { plan: string; method: string }) => input)
  .handler(async ({ data }) => {
    await sendDiscordWebhookEmbed({
      webhookUrl: "",
      title: "🛒 ¡Intención de Compra Detectada!",
      description: `Un jugador acaba de abrir la pantalla de checkout para pagar con **${data.method}**.`,
      fields: [
        { name: "Plan Elegido", value: data.plan, inline: true },
        { name: "Método Seleccionado", value: data.method, inline: true },
        { name: "Estado", value: "Revisando datos de pago", inline: true },
      ],
    });
    return { received: true };
  });

export const submitPaymentProofServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      customerName: string;
      reference: string;
      method: "Pago Móvil" | "Binance Pay";
      plan: PartyPassPlan | "lifetime";
      amountFormatted: string;
      discordContact?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    // 🛡️ Blindaje Anti-Spam: Rate limiting estricto de envíos de comprobantes (máximo 3 por cada 2 minutos)
    if (!globalThis.__imposterPaymentRateLimitMap) {
      globalThis.__imposterPaymentRateLimitMap = new Map();
    }
    const clientKey = `${data.method}-${data.plan}`;
    const now = Date.now();
    const history = globalThis.__imposterPaymentRateLimitMap.get(clientKey) || [];
    const recent = history.filter((t) => now - t < 120000); // 2 minutos
    if (recent.length >= 3) {
      return {
        success: false,
        paymentId: "",
        error: "Has enviado varios intentos recientemente. Espera 2 minutos antes de reenviar.",
      };
    }
    recent.push(now);
    globalThis.__imposterPaymentRateLimitMap.set(clientKey, recent);

    const store = getServerPaymentsMap();
    // 🛡️ Sanitización estricta de entradas (Anti-XSS / Inyecciones)
    const cleanName = data.customerName.replace(/[<>]/g, "").trim().slice(0, 40) || "Jugador";
    const cleanRef =
      data.reference
        .replace(/[<>]/g, "")
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim()
        .slice(0, 40) || "S/R";
    const cleanDiscord = data.discordContact
      ? data.discordContact.replace(/[<>]/g, "").trim().slice(0, 40)
      : undefined;
    const id = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const payment: PendingPayment = {
      id,
      customerName: cleanName,
      reference: cleanRef,
      method: data.method,
      plan: data.plan,
      amountFormatted: data.amountFormatted,
      createdAt: Date.now(),
      status: "pending",
      discordContact: cleanDiscord,
    };

    store.set(id, payment);
    await persistVaultSnapshot();

    const isFounder = payment.plan === "founder";
    const planMeta = PARTY_PASS_PLANS[payment.plan as PartyPassPlan];
    const planTitle = planMeta
      ? planMeta.title
      : payment.plan === "day"
        ? "⚡ Pase Fiesta (24h)"
        : "👑 Party Pass";

    if (isFounder) {
      // Alerta VIP destacada para el Pase Fundador
      await sendDiscordWebhookEmbed({
        webhookUrl: "",
        title: "👑 ¡SOLICITUD DE PASE FUNDADOR VITALICIO ($9.80)! 🎉",
        description: `¡Un cliente VIP ha transferido para adquirir la **Edición Fundador Vitalicio** y recibir acceso permanente y rol en Discord!`,
        color: 0xf59e0b,
        fields: [
          { name: "👤 Cliente", value: payment.customerName, inline: true },
          { name: "💳 Método", value: payment.method, inline: true },
          { name: "💵 Monto", value: payment.amountFormatted, inline: true },
          { name: "🔢 Referencia", value: `#${payment.reference}`, inline: true },
          { name: "👑 Plan", value: "Edición Fundador ($9.80 USD) — Permanente", inline: true },
          {
            name: "💬 Discord del Cliente",
            value: payment.discordContact
              ? `@${payment.discordContact.replace(/^@/, "")}`
              : "No indicado (verificar por chat o referencia)",
            inline: true,
          },
          { name: "🆔 ID de Pago", value: payment.id, inline: true },
          {
            name: "⚡ Acción Requerida",
            value:
              "1. Abre tu Panel CEO > pestaña Cobros para [Aprobar Acceso].\n2. Asigna el rol `@⭐ Miembro Fundador VIP` en Discord.",
            inline: false,
          },
        ],
      });
    } else {
      // Notificar a Discord pago estándar
      await sendDiscordWebhookEmbed({
        webhookUrl: "",
        title: "🔔 ¡NUEVO PAGO REGISTRADO PARA APROBACIÓN!",
        description: `Un jugador acaba de registrar su transferencia y está esperando confirmación en vivo.`,
        color: 0x3b82f6,
        fields: [
          { name: "👤 Cliente", value: payment.customerName, inline: true },
          { name: "💳 Método", value: payment.method, inline: true },
          { name: "💵 Monto", value: payment.amountFormatted, inline: true },
          { name: "🔢 Referencia", value: `#${payment.reference}`, inline: true },
          {
            name: "📦 Plan",
            value: planTitle,
            inline: true,
          },
          { name: "🆔 ID de Pago", value: payment.id, inline: true },
          {
            name: "⚡ Acción Requerida",
            value: "Abre tu Panel CEO > pestaña Cobros para Aprobar en 1 toque.",
            inline: false,
          },
        ],
      });
    }

    return { success: true, paymentId: id };
  });

export const checkPaymentStatusServerFn = createServerFn({ method: "POST" })
  .validator((input: { paymentId: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const store = getServerPaymentsMap();
    const payment = store.get(data.paymentId);
    if (!payment) {
      return {
        exists: false,
        status: "pending" as const,
        plan: "weekend" as PartyPassPlan,
        token: null,
        signedExpiry: null,
        expiresAt: null as number | null,
        founderNumber: null as number | null,
        founderCode: null as string | null,
      };
    }

    let token: string | null = null;
    let signedExpiry: string | null = null;
    let expiresAt: number | null = null;

    if (payment.status === "approved") {
      token = createPurchaseApprovedToken();
      let durationHours: number | null = null;

      if (payment.plan === "day") {
        durationHours = 24;
      } else if (payment.plan === "weekend") {
        durationHours = 72;
      } else if (payment.plan === "month") {
        durationHours = 24 * 30; // 720h (30 días)
      } else if (payment.plan === "founder" || payment.plan === "lifetime") {
        durationHours = null; // Permanente de por vida
      }

      if (durationHours !== null) {
        expiresAt = Date.now() + durationHours * 3600 * 1000;
        signedExpiry = createSignedExpiry(token, expiresAt);
      }
    }

    return {
      exists: true,
      status: payment.status,
      plan: payment.plan,
      token,
      signedExpiry,
      expiresAt,
      founderNumber: payment.founderNumber ?? null,
      founderCode: payment.founderCode ?? null,
    };
  });

export const getPendingPaymentsServerFn = createServerFn({ method: "POST" })
  .validator((input: { ceoToken: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.ceoToken)) {
      return { success: false, payments: [] };
    }
    const store = getServerPaymentsMap();
    const list = Array.from(store.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 40);
    return { success: true, payments: list };
  });

export const reviewPaymentServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: { ceoToken: string; paymentId: string; action: "approve" | "reject" }) => input,
  )
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.ceoToken)) {
      return { success: false, error: "No autorizado" };
    }
    const store = getServerPaymentsMap();
    const payment = store.get(data.paymentId);
    if (!payment) {
      return { success: false, error: "Pago no encontrado" };
    }

    const isFounder = payment.plan === "founder";
    const planMeta = PARTY_PASS_PLANS[payment.plan as PartyPassPlan];
    const planTitle = planMeta ? planMeta.title : payment.plan;

    if (data.action === "approve") {
      payment.status = "approved";
      payment.approvedAt = Date.now();

      if (isFounder) {
        // Auto-generar y asignar su certificado de Miembro Fundador + 5 Pases de Invitación
        if (!payment.founderNumber) {
          const foundersStore = getServerFoundersMap();
          const existingNumbers = Array.from(foundersStore.keys());
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          const founderCode = generateFounderCode(nextNumber);
          const guestPasses = [1, 2, 3, 4, 5].map((idx) => ({
            passIndex: idx,
            code: generateGuestPass(nextNumber, idx),
            redeemedAt: null as number | null,
          }));
          const founderRecord: FounderRecord = {
            number: nextNumber,
            code: founderCode,
            name: payment.customerName || `Fundador #${nextNumber}`,
            issuedAt: Date.now(),
            redeemedAt: Date.now(),
            guestPasses,
          };
          foundersStore.set(nextNumber, founderRecord);
          payment.founderNumber = nextNumber;
          payment.founderCode = founderCode;
        }
        await persistVaultSnapshot();

        await sendDiscordWebhookEmbed({
          webhookUrl: "",
          title: "👑 ¡PASE FUNDADOR VITALICIO APROBADO! 🌟",
          description: `El pago de **${payment.customerName}** (Ref: #${payment.reference}) ha sido **APROBADO** por el CEO. Su acceso vitalicio permanente y sus **5 Pases de Invitación** (Fundador #${payment.founderNumber}) ya se entregaron automáticamente en su dispositivo.`,
          color: 0x10b981,
          fields: [
            { name: "👤 Cliente", value: payment.customerName, inline: true },
            { name: "💵 Monto", value: payment.amountFormatted, inline: true },
            {
              name: "👑 Certificado Fundador",
              value: `#${payment.founderNumber} (\`${payment.founderCode}\`)`,
              inline: true,
            },
            {
              name: "💬 Discord Contact",
              value: payment.discordContact
                ? `@${payment.discordContact.replace(/^@/, "")}`
                : "Verificar por canal",
              inline: true,
            },
            {
              name: "⭐ Asignar Rol en Discord",
              value:
                "Recuerda asignarle el rol `@⭐ Miembro Fundador VIP` para darle acceso al canal secreto `#⭐-fundador-vip`.",
              inline: false,
            },
          ],
        });
      } else {
        await persistVaultSnapshot();
        await sendDiscordWebhookEmbed({
          webhookUrl: "",
          title: "✅ ¡Pago Aprobado por el CEO!",
          description: `El pago de **${payment.customerName}** (Ref: #${payment.reference}) ha sido **APROBADO**. Su Party Pass PRO (${planTitle}) ya se desbloqueó automáticamente.`,
          color: 0x10b981,
          fields: [
            { name: "👤 Cliente", value: payment.customerName, inline: true },
            { name: "💵 Monto", value: payment.amountFormatted, inline: true },
            {
              name: "📦 Plan",
              value: planTitle,
              inline: true,
            },
          ],
        });
      }
    } else {
      payment.status = "rejected";
      await persistVaultSnapshot();
      await sendDiscordWebhookEmbed({
        webhookUrl: "",
        title: "❌ Pago Rechazado",
        description: `El pago de **${payment.customerName}** (Ref: #${payment.reference}) fue marcado como rechazado por el CEO.`,
        color: 0xf43f5e,
        fields: [
          { name: "👤 Cliente", value: payment.customerName, inline: true },
          { name: "🔢 Referencia", value: `#${payment.reference}`, inline: true },
          { name: "📦 Plan", value: planTitle, inline: true },
        ],
      });
    }

    const updatedList = Array.from(store.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 40);

    return { success: true, payments: updatedList };
  });

/**
 * Obtiene la lista completa de Miembros Fundadores y el estado de sus 5 pases (solo CEO).
 */
export const getFoundersDataServerFn = createServerFn({ method: "POST" })
  .validator((input: { ceoToken: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.ceoToken)) {
      return { success: false, founders: [] };
    }
    const store = getServerFoundersMap();
    const list = Array.from(store.values()).sort((a, b) => a.number - b.number);
    return { success: true, founders: list };
  });

/**
 * Emite un nuevo Pase Fundador correlativo con sus 5 pases de embajador (solo CEO).
 */
export const issueFounderServerFn = createServerFn({ method: "POST" })
  .validator((input: { ceoToken: string; name?: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.ceoToken)) {
      return { success: false, error: "No autorizado" };
    }
    const store = getServerFoundersMap();
    const existingNumbers = Array.from(store.keys());
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const code = generateFounderCode(nextNumber);
    const guestPasses = [1, 2, 3, 4, 5].map((idx) => ({
      passIndex: idx,
      code: generateGuestPass(nextNumber, idx),
      redeemedAt: null as number | null,
    }));

    const founder: FounderRecord = {
      number: nextNumber,
      code,
      name: data.name?.trim() || `Fundador #${nextNumber}`,
      issuedAt: Date.now(),
      redeemedAt: null,
      guestPasses,
    };

    store.set(nextNumber, founder);
    await persistVaultSnapshot();

    return { success: true, founder };
  });

/**
 * Permite al CEO confirmar/activar manualmente un Pase Fundador, reiniciarlo o eliminar uno de prueba.
 */
export const manageFounderStatusServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: { ceoToken: string; founderNumber: number; action: "activate" | "reset" | "delete" }) =>
      input,
  )
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    if (!isServerCeoTokenValid(data.ceoToken)) {
      return { success: false, error: "No autorizado" };
    }
    const store = getServerFoundersMap();
    const founder = store.get(data.founderNumber);
    if (!founder) {
      return { success: false, error: "Fundador no encontrado" };
    }

    if (data.action === "delete") {
      store.delete(data.founderNumber);
    } else if (data.action === "activate") {
      founder.redeemedAt = Date.now();
    } else if (data.action === "reset") {
      founder.redeemedAt = null;
    }

    await persistVaultSnapshot();
    const list = Array.from(store.values()).sort((a, b) => a.number - b.number);
    return { success: true, founders: list };
  });

/**
 * Registra el canje de un Pase Fundador en el servidor y notifica a Discord.
 */
export const consumeFounderServerFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; founderName?: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const check = isValidFounderCode(data.code);
    if (!check.valid || check.number === null) {
      return { success: false, error: "Código de fundador inválido" };
    }

    const store = getServerFoundersMap();
    let founder = store.get(check.number);
    if (!founder) {
      // Auto-registrar si fue generado pero el store en memoria de este worker aún no lo tenía
      const guestPasses = [1, 2, 3, 4, 5].map((idx) => ({
        passIndex: idx,
        code: generateGuestPass(check.number!, idx),
        redeemedAt: null as number | null,
      }));
      founder = {
        number: check.number,
        code: data.code,
        name: data.founderName?.trim() || `Fundador #${check.number}`,
        issuedAt: Date.now(),
        redeemedAt: Date.now(),
        guestPasses,
      };
      store.set(check.number, founder);
    } else {
      if (founder.redeemedAt !== null) {
        return {
          success: false,
          error: "Este Pase Fundador ya fue reclamado anteriormente.",
        };
      }
      founder.redeemedAt = Date.now();
      if (data.founderName?.trim()) {
        founder.name = data.founderName.trim();
      }
    }

    await persistVaultSnapshot();

    await sendDiscordWebhookEmbed({
      webhookUrl: "",
      title: "👑 ¡NUEVO MIEMBRO FUNDADOR VITALICIO ACTIVADO! 🎉",
      description: `¡Un cliente VIP acaba de activar su **Pase Fundador Vitalicio ($9.80)**!`,
      color: 0xf59e0b,
      fields: [
        { name: "👑 Número", value: `#${founder.number}`, inline: true },
        { name: "👤 Nombre", value: founder.name, inline: true },
        { name: "🔑 Código Canjeado", value: `\`${data.code}\``, inline: true },
        {
          name: "⚡ Acción Requerida",
          value:
            "Asigna el rol `@⭐ Miembro Fundador VIP` en Discord para darle acceso a `#fundador-vip`.",
          inline: false,
        },
      ],
    });

    return { success: true, founder };
  });

/**
 * Obtiene los 5 pases de invitado de un fundador por su número.
 */
export const getFounderGuestPassesServerFn = createServerFn({ method: "POST" })
  .validator((input: { founderNumber: number }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const store = getServerFoundersMap();
    let founder = store.get(data.founderNumber);
    if (!founder) {
      // Auto-generar si el worker es nuevo
      const guestPasses = [1, 2, 3, 4, 5].map((idx) => ({
        passIndex: idx,
        code: generateGuestPass(data.founderNumber, idx),
        redeemedAt: null as number | null,
      }));
      founder = {
        number: data.founderNumber,
        code: generateFounderCode(data.founderNumber),
        name: `Fundador #${data.founderNumber}`,
        issuedAt: Date.now(),
        redeemedAt: Date.now(),
        guestPasses,
      };
      store.set(data.founderNumber, founder);
      await persistVaultSnapshot();
    }
    return { success: true, guestPasses: founder.guestPasses };
  });

/**
 * Registra el canje de un Pase de Invitado (24h) y notifica a Discord.
 */
export const consumeGuestPassServerFn = createServerFn({ method: "POST" })
  .validator((input: { passCode: string; guestName?: string }) => input)
  .handler(async ({ data }) => {
    await ensureVaultHydrated();
    const check = isValidGuestPass(data.passCode);
    if (!check.valid || check.founderNumber === null || check.passIndex === null) {
      return { success: false, error: "Pase de invitado inválido" };
    }

    const store = getServerFoundersMap();
    let founder = store.get(check.founderNumber);
    if (!founder) {
      const guestPasses = [1, 2, 3, 4, 5].map((idx) => ({
        passIndex: idx,
        code: generateGuestPass(check.founderNumber!, idx),
        redeemedAt: null as number | null,
      }));
      founder = {
        number: check.founderNumber,
        code: generateFounderCode(check.founderNumber),
        name: `Fundador #${check.founderNumber}`,
        issuedAt: Date.now(),
        redeemedAt: Date.now(),
        guestPasses,
      };
      store.set(check.founderNumber, founder);
    }

    const pass = founder.guestPasses.find((p) => p.passIndex === check.passIndex);
    if (pass) {
      if (pass.redeemedAt !== null) {
        return { success: false, error: "Este pase de invitado ya fue utilizado" };
      }
      pass.redeemedAt = Date.now();
      pass.redeemedBy = data.guestName?.trim() || "Invitado";
    }

    await persistVaultSnapshot();

    const usedCount = founder.guestPasses.filter((p) => p.redeemedAt !== null).length;

    await sendDiscordWebhookEmbed({
      webhookUrl: "",
      title: "🎟️ ¡PASE DE EMBAJADOR CANJEADO EN VIVO!",
      description: `Un jugador acaba de canjear un **Pase Fiesta 24h** regalado por un Miembro Fundador.`,
      color: 0x10b981,
      fields: [
        {
          name: "👑 Fundador Anfitrión",
          value: `${founder.name} (#${founder.number})`,
          inline: true,
        },
        { name: "🎟️ Pase Canjeado", value: `Pase #${check.passIndex} de 5`, inline: true },
        {
          name: "📊 Balance del Fundador",
          value: `${usedCount} de 5 usados (${5 - usedCount} restantes)`,
          inline: true,
        },
      ],
    });

    return { success: true, durationHours: 24, founderName: founder.name };
  });
