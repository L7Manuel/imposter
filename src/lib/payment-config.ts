/**
 * Configuración de Métodos de Pago y Pasarelas de Cobro — Imposter
 *
 * Modelo de Monetización y Planes Party Pass PRO:
 * 1. ⚡ Pase Fiesta (24 Horas): $0.99 USD
 * 2. 🎉 Fin de Semana (72 Horas): $1.99 USD (Más Popular)
 * 3. 🌟 Pase Mensual (30 Días): $3.99 USD
 * 4. 👑 Edición Fundador Vitalicio: $9.80 USD (De por vida + Rol VIP en Discord)
 *
 * Métodos de Cobro Soportados:
 * 1. 🇻🇪 Pago Móvil (Bolívares / Venezuela - Tasa Dinámica)
 * 2. 🟡 Binance Pay / Cripto (USDT / 0% Comisión)
 * 3. 💳 Tarjetas Internacionales (Whop.com / Stripe / Apple Pay)
 */

export type PartyPassPlan = "day" | "weekend" | "month" | "founder";

export interface PlanMeta {
  id: PartyPassPlan;
  title: string;
  badge?: string;
  priceUsd: number;
  durationLabel: string;
  durationHours: number | null; // null = permanente de por vida
  description: string;
  isFounder?: boolean;
}

export const PARTY_PASS_PLANS: Record<PartyPassPlan, PlanMeta> = {
  day: {
    id: "day",
    title: "⚡ Pase Fiesta (24h)",
    priceUsd: 0.99,
    durationLabel: "24 Horas",
    durationHours: 24,
    description: "Acceso ilimitado para la rumba de esta noche",
  },
  weekend: {
    id: "weekend",
    title: "🎉 Fin de Semana (72h)",
    badge: "Más Popular",
    priceUsd: 1.99,
    durationLabel: "72 Horas (3 días)",
    durationHours: 72,
    description: "Viernes a domingo completo sin interrupciones",
  },
  month: {
    id: "month",
    title: "🌟 Pase Mensual (30 Días)",
    priceUsd: 3.99,
    durationLabel: "30 Días",
    durationHours: 24 * 30,
    description: "Para jugar todo el mes en cada reunión con amigos",
  },
  founder: {
    id: "founder",
    title: "👑 Edición Fundador Vitalicio",
    badge: "Exclusivo VIP",
    priceUsd: 9.8,
    durationLabel: "De por vida",
    durationHours: null,
    description: "Acceso permanente + Rol VIP en Discord + Atención directa de los devs",
    isFounder: true,
  },
};

export interface PagoMovilConfig {
  banco: string;
  telefono: string;
  cedula: string;
  titular: string;
  tasaBs: number;
}

export interface BinancePayConfig {
  payId: string;
  nickname: string;
}

export interface PendingPayment {
  id: string;
  customerName: string;
  reference: string;
  method: "Pago Móvil" | "Binance Pay";
  plan: PartyPassPlan | "lifetime";
  amountFormatted: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
  approvedAt?: number | undefined;
  discordContact?: string | undefined;
  founderNumber?: number | undefined;
  founderCode?: string | undefined;
  /** Token PRO emitido una sola vez al aprobar; no se regenera en cada consulta. */
  proToken?: string | undefined;
  proExpiresAt?: number | null | undefined;
  proSignedExpiry?: string | null | undefined;
}

export interface PaymentConfig {
  whatsappNumber?: string | undefined;
  discordInviteUrl: string;
  discordWebhookUrl?: string | undefined;
  pagoMovil: PagoMovilConfig;
  binancePay: BinancePayConfig;
  internationalLink: string;
  enabled: boolean;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  whatsappNumber: "04241120138",
  discordInviteUrl: "https://discord.gg",
  discordWebhookUrl: "",
  pagoMovil: {
    banco: "Banesco (0134)",
    telefono: "04241120138",
    cedula: "24974393",
    titular: "Manuel Sanchez",
    tasaBs: 901.61,
  },
  binancePay: {
    payId: "570778528",
    nickname: "||Manu",
  },
  internationalLink: "https://whop.com/imposter",
  enabled: true,
};

export function sanitizePaymentConfig(raw: unknown): PaymentConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_PAYMENT_CONFIG;
  const data = raw as Partial<PaymentConfig>;

  const pm = data.pagoMovil ?? DEFAULT_PAYMENT_CONFIG.pagoMovil;
  const bp = data.binancePay ?? DEFAULT_PAYMENT_CONFIG.binancePay;

  return {
    whatsappNumber:
      typeof data.whatsappNumber === "string" && data.whatsappNumber.trim()
        ? data.whatsappNumber.trim()
        : DEFAULT_PAYMENT_CONFIG.whatsappNumber,
    discordInviteUrl:
      typeof data.discordInviteUrl === "string" && data.discordInviteUrl.trim()
        ? data.discordInviteUrl.trim()
        : DEFAULT_PAYMENT_CONFIG.discordInviteUrl,
    discordWebhookUrl:
      typeof data.discordWebhookUrl === "string" ? data.discordWebhookUrl.trim() : "",
    pagoMovil: {
      banco: typeof pm.banco === "string" && pm.banco.trim() ? pm.banco.trim() : "Banesco (0134)",
      telefono:
        typeof pm.telefono === "string" && pm.telefono.trim()
          ? pm.telefono.trim()
          : DEFAULT_PAYMENT_CONFIG.pagoMovil.telefono,
      cedula:
        typeof pm.cedula === "string" && pm.cedula.trim()
          ? pm.cedula.trim()
          : DEFAULT_PAYMENT_CONFIG.pagoMovil.cedula,
      titular:
        typeof pm.titular === "string" && pm.titular.trim()
          ? pm.titular.trim()
          : DEFAULT_PAYMENT_CONFIG.pagoMovil.titular,
      tasaBs:
        typeof pm.tasaBs === "number" && pm.tasaBs > 0
          ? pm.tasaBs
          : DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs,
    },
    binancePay: {
      payId:
        typeof bp.payId === "string" && bp.payId.trim()
          ? bp.payId.trim()
          : DEFAULT_PAYMENT_CONFIG.binancePay.payId,
      nickname:
        typeof bp.nickname === "string" && bp.nickname.trim()
          ? bp.nickname.trim()
          : DEFAULT_PAYMENT_CONFIG.binancePay.nickname,
    },
    internationalLink:
      typeof data.internationalLink === "string" && data.internationalLink.trim()
        ? data.internationalLink.trim()
        : DEFAULT_PAYMENT_CONFIG.internationalLink,
    enabled: typeof data.enabled === "boolean" ? data.enabled : true,
  };
}
