import { createServerFn } from "@tanstack/react-start";
import { TelemetryEventPayload } from "@/lib/telemetry";

export interface GlobalMetrics {
  totalRoundsStarted: number;
  totalRoundsCompleted: number;
  totalPaywallViews: number;
  totalPwaInstalls: number;
  categoryCounts: Record<string, number>;
  deviceCounts: {
    android: number;
    ios: number;
    desktop: number;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    timestamp: number;
    summary: string;
    device: string;
  }>;
  lastUpdated: number;
}

declare global {
  var __imposterGlobalMetrics: GlobalMetrics | undefined;
  var __imposterTelemetryRateLimitMap: Map<string, number[]> | undefined;
}

function getGlobalMetricsStore(): GlobalMetrics {
  if (!globalThis.__imposterGlobalMetrics) {
    globalThis.__imposterGlobalMetrics = {
      totalRoundsStarted: 0,
      totalRoundsCompleted: 0,
      totalPaywallViews: 0,
      totalPwaInstalls: 0,
      categoryCounts: {},
      deviceCounts: {
        android: 0,
        ios: 0,
        desktop: 0,
      },
      recentEvents: [],
      lastUpdated: Date.now(),
    };
  }
  return globalThis.__imposterGlobalMetrics;
}

function isTelemetryRateLimited(clientKey: string): boolean {
  if (!globalThis.__imposterTelemetryRateLimitMap) {
    globalThis.__imposterTelemetryRateLimitMap = new Map();
  }
  const now = Date.now();
  const timestamps = globalThis.__imposterTelemetryRateLimitMap.get(clientKey) || [];
  const recent = timestamps.filter((t) => now - t < 60000); // 1 minuto
  if (recent.length >= 15) {
    return true; // Máximo 15 eventos por minuto
  }
  recent.push(now);
  globalThis.__imposterTelemetryRateLimitMap.set(clientKey, recent);
  return false;
}

async function sendDiscordMetricsEmbed(embed: {
  title: string;
  description: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
}): Promise<void> {
  const webhookUrl =
    globalThis.__imposterDiscordWebhookUrl ||
    process.env.DISCORD_METRICS_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Imposter Metrics Radar 🛰️",
        avatar_url: "https://imposter.manu-07games.workers.dev/icon-512.png",
        embeds: [
          {
            ...embed,
            footer: { text: "Imposter Realtime Telemetry • #metricas-imposter" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    /* ignore network / timeout errors silently */
  }
}

export const reportTelemetryServerFn = createServerFn({ method: "POST" })
  .validator((input: TelemetryEventPayload) => input)
  .handler(async ({ data }) => {
    const store = getGlobalMetricsStore();
    const deviceStr = data.device || "Desconocido";

    // Anti-spam de telemetría
    if (isTelemetryRateLimited(deviceStr)) {
      return { ok: false, rateLimited: true };
    }

    const isAndroid = /android/i.test(deviceStr);
    const isIos = /iphone|ipad|ios/i.test(deviceStr);

    if (isAndroid) store.deviceCounts.android++;
    else if (isIos) store.deviceCounts.ios++;
    else store.deviceCounts.desktop++;

    store.lastUpdated = Date.now();

    if (data.type === "round_start") {
      store.totalRoundsStarted++;
      const cat = data.category || "Aleatoria";
      store.categoryCounts[cat] = (store.categoryCounts[cat] || 0) + 1;

      const summary = `🎮 Partida iniciada (${data.playerCount ?? 4} jug.) en ${cat}`;
      store.recentEvents.unshift({
        id: Math.random().toString(36).slice(2, 9),
        type: "round_start",
        timestamp: Date.now(),
        summary,
        device: deviceStr,
      });

      // Notificar a Discord #metricas-imposter
      const fields = [
        { name: "📁 Categoría", value: `**${cat}**`, inline: true },
        { name: "👥 Jugadores", value: `${data.playerCount ?? 4} personas`, inline: true },
        { name: "🕵️‍♂️ Impostores", value: `${data.impostorCount ?? 1}`, inline: true },
        { name: "📱 Dispositivo", value: `**${deviceStr}**`, inline: true },
      ];
      if (data.isAdult) {
        fields.push({ name: "🔞 Modo Picante", value: "Activado (+18)", inline: true });
      }
      if (data.isJester) {
        fields.push({ name: "🃏 El Bufón", value: "En juego", inline: true });
      }

      await sendDiscordMetricsEmbed({
        title: "🎮 ¡Nueva Partida Iniciada!",
        description: `Se acaba de iniciar una partida presencial en **${deviceStr}**.`,
        color: 0x3b82f6, // Azul
        fields,
      });
    } else if (data.type === "round_finish") {
      store.totalRoundsCompleted++;
      const winnerName =
        data.winner === "innocents"
          ? "Inocentes 😇"
          : data.winner === "jester"
            ? "El Bufón 🃏"
            : "Impostores 🕵️‍♂️";

      const summary = `🏆 Partida finalizada: Ganaron ${winnerName}`;
      store.recentEvents.unshift({
        id: Math.random().toString(36).slice(2, 9),
        type: "round_finish",
        timestamp: Date.now(),
        summary,
        device: deviceStr,
      });

      await sendDiscordMetricsEmbed({
        title: "🏆 Partida Concluida con Éxito",
        description: `La partida terminó. Ganador: **${winnerName}**.`,
        color: 0x10b981, // Verde
        fields: [
          { name: "👑 Ganador", value: winnerName, inline: true },
          { name: "📁 Categoría", value: data.category || "Aleatoria", inline: true },
          { name: "📱 Dispositivo", value: deviceStr, inline: true },
        ],
      });
    } else if (data.type === "pwa_install") {
      store.totalPwaInstalls++;
      const summary = `📱 PWA instalada en pantalla de inicio`;
      store.recentEvents.unshift({
        id: Math.random().toString(36).slice(2, 9),
        type: "pwa_install",
        timestamp: Date.now(),
        summary,
        device: deviceStr,
      });

      await sendDiscordMetricsEmbed({
        title: "📱 ¡Nueva Instalación de PWA!",
        description: `Un jugador añadió **Imposter** a la pantalla de inicio de su teléfono.`,
        color: 0x8b5cf6, // Púrpura
        fields: [
          { name: "📱 Dispositivo", value: `**${deviceStr}**`, inline: true },
          { name: "⭐ Estado", value: "Acceso Rápido Nativo", inline: true },
        ],
      });
    } else if (data.type === "paywall_view") {
      store.totalPaywallViews++;
      const summary = `🎟️ Modal Party Pass abierto (${data.planId || "general"})`;
      store.recentEvents.unshift({
        id: Math.random().toString(36).slice(2, 9),
        type: "paywall_view",
        timestamp: Date.now(),
        summary,
        device: deviceStr,
      });
    }

    if (store.recentEvents.length > 20) {
      store.recentEvents = store.recentEvents.slice(0, 20);
    }

    return { ok: true };
  });

export const getGlobalMetricsServerFn = createServerFn({ method: "POST" })
  .validator((input: { reset?: boolean } | undefined) => input)
  .handler(async ({ data }) => {
    const store = getGlobalMetricsStore();
    if (data?.reset) {
      store.totalRoundsStarted = 0;
      store.totalRoundsCompleted = 0;
      store.totalPaywallViews = 0;
      store.totalPwaInstalls = 0;
      store.categoryCounts = {};
      store.deviceCounts = { android: 0, ios: 0, desktop: 0 };
      store.recentEvents = [];
      store.lastUpdated = Date.now();
    }
    return store;
  });
