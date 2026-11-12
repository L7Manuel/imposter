/**
 * Módulo de Telemetría y Detección de Dispositivos — Imposter
 *
 * Captura eventos de juego de forma asíncrona ("fire-and-forget")
 * para alimentar las métricas globales del CEO y enviar alertas en vivo a Discord (#metricas-imposter).
 *
 * Cero invasivo: no guarda nombres reales, IPs personales ni datos privados.
 */

import { reportTelemetryServerFn } from "@/lib/telemetry-server";

export interface TelemetryEventPayload {
  type: "round_start" | "round_finish" | "pwa_install" | "paywall_view" | "payment_submit";
  category?: string;
  playerCount?: number;
  impostorCount?: number;
  isAdult?: boolean;
  isJester?: boolean;
  roundsCount?: number;
  winner?: "innocents" | "impostors" | "jester";
  device?: string;
  planId?: string;
}

/**
 * Detecta el entorno de ejecución del usuario (Android, iOS o Desktop).
 */
export function detectUserDevice(): string {
  if (typeof window === "undefined" || !navigator) return "Desconocido";
  const ua = navigator.userAgent.toLowerCase();

  if (/android/.test(ua)) {
    return "Android";
  }
  if (/iphone|ipad|ipod/.test(ua)) {
    return "iPhone / iOS";
  }
  if (/windows/.test(ua)) {
    return "Windows PC";
  }
  if (/macintosh|mac os x/.test(ua)) {
    return "Mac";
  }
  if (/linux/.test(ua)) {
    return "Linux";
  }
  return "Móvil / Web";
}

/**
 * Comprueba si el dispositivo actual pertenece al CEO para no contaminar métricas reales.
 */
export function isCeoDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem("impostor-ceo-token");
    return Boolean(token && token.length > 20);
  } catch {
    return false;
  }
}

/**
 * Envía un evento de telemetría sin bloquear la interfaz de usuario ni ralentizar el juego.
 * Doble canal: Servidor TanStack (Cloudflare) + Radar de Atlas en Render Cloud.
 */
export async function trackGameEvent(
  payload: Omit<TelemetryEventPayload, "device">,
  customDevice?: string,
): Promise<void> {
  const device = customDevice || detectUserDevice();
  const fullPayload: TelemetryEventPayload = { ...payload, device };

  // 1. Envío al servidor backend de la app (para actualizar el Panel CEO global)
  try {
    await reportTelemetryServerFn({ data: fullPayload });
  } catch {
    /* ignore */
  }

  // 2. Envío directo al radar de Atlas en Render Cloud (para alertas inmediatas a #metricas-imposter)
  try {
    fetch("https://atlas-bot-2xh4.onrender.com/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload),
      mode: "cors",
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}
