import { useState, useEffect } from "react";
import { RefreshCw, Activity, Smartphone, Monitor } from "lucide-react";
import { getGlobalMetricsServerFn, GlobalMetrics } from "@/lib/telemetry-server";
import { testDiscordWebhookServerFn } from "@/lib/coupon-server";
import { STORAGE_KEYS } from "@/lib/security";

export interface CeoMetricsTabProps {
  metrics: GlobalMetrics;
  isLoadingMetrics: boolean;
  fetchMetrics: () => Promise<void>;
}

export function CeoMetricsTab({ metrics, isLoadingMetrics, fetchMetrics }: CeoMetricsTabProps) {
  const [discordWebhookInput, setDiscordWebhookInput] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHook = localStorage.getItem(STORAGE_KEYS.DISCORD_WEBHOOK);
    if (storedHook) setDiscordWebhookInput(storedHook);
  }, []);

  const handleTestDiscordWebhook = async () => {
    const url = discordWebhookInput.trim();
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
      setWebhookFeedback({
        type: "error",
        msg: "La URL debe comenzar con https://discord.com/api/webhooks/",
      });
      return;
    }
    setIsTestingWebhook(true);
    setWebhookFeedback(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.DISCORD_WEBHOOK, url);
      }
      const res = await testDiscordWebhookServerFn({ data: { webhookUrl: url } });
      if (res.success) {
        setWebhookFeedback({
          type: "success",
          msg: "¡Alerta enviada exitosamente a tu canal de Discord!",
        });
        setTimeout(() => setWebhookFeedback(null), 4000);
      } else {
        setWebhookFeedback({
          type: "error",
          msg: res.error || "Discord rechazó el webhook. Verifica el enlace.",
        });
      }
    } catch {
      setWebhookFeedback({
        type: "error",
        msg: "Error de red al conectar con el webhook de Discord.",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleResetMetrics = async () => {
    if (!confirm("¿Deseas reiniciar todas las métricas a 0?")) return;
    try {
      await getGlobalMetricsServerFn({ data: { reset: true } });
      fetchMetrics();
    } catch {
      /* ignore */
    }
  };

  const d = metrics.deviceCounts || { android: 0, ios: 0, desktop: 0 };
  const totalDevices = d.android + d.ios + d.desktop || 1;
  const pAndroid = Math.round((d.android / totalDevices) * 100);
  const pIos = Math.round((d.ios / totalDevices) * 100);
  const pDesktop = Math.round((d.desktop / totalDevices) * 100);

  return (
    <section className="flex flex-col gap-6">
      {/* Header de Telemetría */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-foreground">TELEMETRÍA Y RADAR EN VIVO</h3>
          <p className="text-xs text-muted-foreground">
            Métricas globales de juego y eventos en tiempo real desde Cloudflare Edge
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Última sinc:{" "}
            <span className="font-mono text-foreground font-semibold">
              {metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : "Ahora"}
            </span>
          </span>
          <button
            onClick={() => fetchMetrics()}
            className="flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <RefreshCw size={13} className={isLoadingMetrics ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>
      </div>

      {/* Grid de 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl glass-panel p-4 border border-white/10">
          <span className="text-xs text-muted-foreground">Partidas Iniciadas (Reales)</span>
          <span className="font-display text-3xl text-amber-400 mt-2 block">
            {metrics.totalRoundsStarted}
          </span>
        </div>
        <div className="rounded-2xl glass-panel p-4 border border-white/10">
          <span className="text-xs text-muted-foreground">Partidas Completadas</span>
          <span className="font-display text-3xl text-emerald-400 mt-2 block">
            {metrics.totalRoundsCompleted}
          </span>
        </div>
        <div className="rounded-2xl glass-panel p-4 border border-white/10">
          <span className="text-xs text-muted-foreground">Vistas de Paywall</span>
          <span className="font-display text-3xl text-blue-400 mt-2 block">
            {metrics.totalPaywallViews}
          </span>
        </div>
        <div className="rounded-2xl glass-panel p-4 border border-white/10">
          <span className="text-xs text-muted-foreground">Instalaciones PWA</span>
          <span className="font-display text-3xl text-purple-400 mt-2 block">
            {metrics.totalPwaInstalls}
          </span>
        </div>
      </div>

      {/* Radar de Dispositivos */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10">
        <h4 className="font-display text-sm text-foreground mb-3 flex items-center gap-1.5">
          <Activity size={15} className="text-primary" /> RADAR DE DISPOSITIVOS
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs mb-1">
              <Smartphone size={14} /> Android
            </div>
            <span className="font-display text-xl text-foreground block">{d.android}</span>
            <span className="text-[11px] text-muted-foreground">{pAndroid}%</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-center gap-1 text-blue-400 text-xs mb-1">
              <Smartphone size={14} /> iPhone (iOS)
            </div>
            <span className="font-display text-xl text-foreground block">{d.ios}</span>
            <span className="text-[11px] text-muted-foreground">{pIos}%</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-center gap-1 text-purple-400 text-xs mb-1">
              <Monitor size={14} /> PC / Desktop
            </div>
            <span className="font-display text-xl text-foreground block">{d.desktop}</span>
            <span className="text-[11px] text-muted-foreground">{pDesktop}%</span>
          </div>
        </div>
      </div>

      {/* Top Categorías */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10">
        <h3 className="font-display text-base text-foreground mb-3">CATEGORÍAS MÁS JUGADAS</h3>
        {Object.keys(metrics.categoryCounts || {}).length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay categorías registradas aún.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics.categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs"
                >
                  <span className="text-foreground font-medium">{cat}</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-300 font-bold">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Feed de Actividad en Vivo */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10">
        <h4 className="font-display text-sm text-foreground mb-3">FEED DE ACTIVIDAD EN VIVO</h4>
        {!metrics.recentEvents || metrics.recentEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay eventos recientes registrados.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
            {metrics.recentEvents.slice(0, 10).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2 text-xs"
              >
                <span className="text-foreground font-medium">{ev.summary}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {ev.device}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuración Discord Webhook */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-3">
        <div>
          <h4 className="font-display text-sm text-foreground">
            CANAL DE ALERTAS DISCORD (WEBHOOK)
          </h4>
          <p className="text-xs text-muted-foreground">
            Recibe notificaciones en vivo en tu Discord cada vez que un jugador inicie partida,
            compre un pase o canjee un cupón.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="https://discord.com/api/webhooks/..."
            value={discordWebhookInput}
            onChange={(e) => setDiscordWebhookInput(e.target.value)}
            className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={handleTestDiscordWebhook}
            disabled={isTestingWebhook}
            className="rounded-xl bg-primary hover:brightness-110 px-4 py-2 text-xs font-semibold text-primary-foreground transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isTestingWebhook ? "Probando..." : "Guardar y Probar Alerta"}
          </button>
        </div>

        {webhookFeedback && (
          <p
            className={`text-xs font-medium ${
              webhookFeedback.type === "success" ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {webhookFeedback.msg}
          </p>
        )}

        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Bot Atlas en Render Cloud
          </span>
          <a
            href="https://atlas-bot-2xh4.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
          >
            <span>Verificar Diagnóstico / Despertar Bot</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* Acciones de Mantenimiento */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-sm text-foreground">LIMPIAR ANALÍTICAS</h4>
          <p className="text-xs text-muted-foreground">
            Reinicia los contadores a 0 para una nueva fase de pruebas.
          </p>
        </div>
        <button
          onClick={handleResetMetrics}
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition cursor-pointer"
        >
          Reiniciar Métricas
        </button>
      </div>
    </section>
  );
}
