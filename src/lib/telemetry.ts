import { reportTelemetryServerFn, TelemetryEventPayload } from "./telemetry-server";
import { STORAGE_KEYS } from "./security";

const OFFLINE_QUEUE_KEY = "impostor_offline_telemetry_queue";

/**
 * Detecta de forma anónima y no invasiva el tipo de dispositivo del jugador.
 */
export function detectUserDevice(): string {
  if (typeof window === "undefined") return "Desconocido";
  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isWindows = /windows/i.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua) && !isIos;
  const isLinux = /linux/i.test(ua) && !isAndroid;

  if (isAndroid) return "Android";
  if (isIos) return "iPhone (iOS)";
  if (isWindows) return "Windows PC";
  if (isMac) return "Mac";
  if (isLinux) return "Linux";
  return "Navegador Web";
}

/**
 * Comprueba si el dispositivo actual tiene token de CEO guardado.
 */
export function isCeoDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.CEO_TOKEN));
  } catch {
    return false;
  }
}

/**
 * Guarda un evento en cola local cuando el dispositivo no tiene conexión a internet.
 */
function enqueueOfflineEvent(payload: TelemetryEventPayload) {
  try {
    if (typeof window === "undefined") return;
    const existing = JSON.parse(
      localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]",
    ) as TelemetryEventPayload[];
    existing.push(payload);
    if (existing.length > 50) existing.shift();
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

/**
 * Sincroniza automáticamente los eventos encolados cuando el dispositivo recupera internet.
 */
export function initOfflineTelemetrySync() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", async () => {
    try {
      const queue = JSON.parse(
        localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]",
      ) as TelemetryEventPayload[];
      if (queue.length === 0) return;
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      for (const item of queue) {
        await reportTelemetryServerFn({ data: item }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  });
}

/**
 * Envía un evento de telemetría sin bloquear la interfaz de usuario ni ralentizar el juego.
 * Doble canal: Servidor TanStack (Cloudflare) + Radar de Atlas en Render Cloud.
 * Con soporte offline: si no hay conexión, se encola localmente y se transmite al volver a tener red.
 */
export async function trackGameEvent(
  payload: Omit<TelemetryEventPayload, "device">,
  customDevice?: string,
): Promise<void> {
  const device = customDevice || detectUserDevice();
  const fullPayload: TelemetryEventPayload = { ...payload, device };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflineEvent(fullPayload);
    return;
  }

  // 1. Envío al servidor backend de la app (para actualizar el Panel CEO global)
  try {
    await reportTelemetryServerFn({ data: fullPayload });
  } catch {
    enqueueOfflineEvent(fullPayload);
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
