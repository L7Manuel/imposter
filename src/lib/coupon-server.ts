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

declare global {
  var __imposterUsedCouponsMap:
    Map<string, { activatedAt: number; couponNumber: number }> | undefined;
  var __imposterDiscordWebhookUrl: string | undefined;
  var __imposterPaymentConfig: PaymentConfig | undefined;
  var __imposterPendingPayments: Map<string, PendingPayment> | undefined;
  var __imposterPaymentRateLimitMap: Map<string, number[]> | undefined;
  var __imposterFoundersMap: Map<number, FounderRecord> | undefined;
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
  const url = webhookUrl || globalThis.__imposterDiscordWebhookUrl;
  if (!url || !url.startsWith("https://discord.com/api/webhooks/")) {
    return false;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Imposter CEO Bot 👑",
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
    });
    return res.ok;
  } catch {
    return false;
  }
}

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
  .validator((input: { webhookUrl: string }) => input)
  .handler(async ({ data }) => {
    const url = data.webhookUrl.trim();
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
      return {
        success: false,
        error: "La URL debe comenzar con https://discord.com/api/webhooks/",
      };
    }
    globalThis.__imposterDiscordWebhookUrl = url;
    const ok = await sendDiscordWebhookEmbed({
      webhookUrl: url,
      title: "👑 ¡Bot de Imposter Conectado Exitosamente!",
      description:
        "Las notificaciones en tiempo real para tu juego **Imposter** están activas. Recibirás aquí un aviso instantáneo cada vez que un cliente pague o un tester canjee un cupón.",
      fields: [
        { name: "Plataforma", value: "Cloudflare Workers", inline: true },
        { name: "Estado", value: "🟢 En Línea y Monitoreando", inline: true },
      ],
    });
    return {
      success: ok,
      error: ok
        ? null
        : "Discord rechazó el webhook. Verifica que el enlace esté completo y activo.",
    };
  });

export const getPaymentConfigServerFn = createServerFn({ method: "POST" })
  .validator((input?: { defaultFallback?: PaymentConfig | undefined } | undefined) => input ?? {})
  .handler(async ({ data }) => {
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
  .validator((input: { ceoToken: string; config: PaymentConfig }) => input)
  .handler(async ({ data }) => {
    if (!isValidStoredToken(data.ceoToken, "ceo")) {
      return { success: false, error: "No autorizado. Clave CEO no válida." };
    }

    const sanitized = sanitizePaymentConfig(data.config);
    globalThis.__imposterPaymentConfig = sanitized;

    // Notificar a Discord si hay webhook
    await sendDiscordWebhookEmbed({
      webhookUrl: "",
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
    };
  });

export const getPendingPaymentsServerFn = createServerFn({ method: "POST" })
  .validator((input: { ceoToken: string }) => input)
  .handler(async ({ data }) => {
    if (!isValidStoredToken(data.ceoToken, "ceo")) {
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
    if (!isValidStoredToken(data.ceoToken, "ceo")) {
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
        await sendDiscordWebhookEmbed({
          webhookUrl: "",
          title: "👑 ¡PASE FUNDADOR VITALICIO APROBADO! 🌟",
          description: `El pago de **${payment.customerName}** (Ref: #${payment.reference}) ha sido **APROBADO** por el CEO. Su acceso vitalicio permanente ya está desbloqueado.`,
          color: 0x10b981,
          fields: [
            { name: "👤 Cliente", value: payment.customerName, inline: true },
            { name: "💵 Monto", value: payment.amountFormatted, inline: true },
            { name: "👑 Plan", value: "Edición Fundador Vitalicio", inline: true },
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
    if (!isValidStoredToken(data.ceoToken, "ceo")) {
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
    if (!isValidStoredToken(data.ceoToken, "ceo")) {
      return { success: false, error: "No autorizado" };
    }
    const store = getServerFoundersMap();
    const nextNumber = store.size + 1;
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

    return { success: true, founder };
  });

/**
 * Registra el canje de un Pase Fundador en el servidor y notifica a Discord.
 */
export const consumeFounderServerFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; founderName?: string }) => input)
  .handler(async ({ data }) => {
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
      founder.redeemedAt = Date.now();
      if (data.founderName?.trim()) {
        founder.name = data.founderName.trim();
      }
    }

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
    }
    return { success: true, guestPasses: founder.guestPasses };
  });

/**
 * Registra el canje de un Pase de Invitado (24h) y notifica a Discord.
 */
export const consumeGuestPassServerFn = createServerFn({ method: "POST" })
  .validator((input: { passCode: string; guestName?: string }) => input)
  .handler(async ({ data }) => {
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
