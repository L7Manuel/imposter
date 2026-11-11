import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Crown,
  CreditCard,
  Ticket,
  BarChart3,
  ArrowLeft,
  Copy,
  Check,
  Send,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Users,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  isValidStoredToken,
  verifyAccessCode,
  STORAGE_KEYS,
  VIP_COUPON_HASHES_ORDERED,
  getDecryptedVipCodes,
} from "@/lib/security";
import {
  getFoundersDataServerFn,
  issueFounderServerFn,
  FounderRecord,
  getPendingPaymentsServerFn,
  reviewPaymentServerFn,
  getPaymentConfigServerFn,
  savePaymentConfigServerFn,
  consumeSingleUseCouponServerFn,
  getCouponServerStatusServerFn,
  testDiscordWebhookServerFn,
} from "@/lib/coupon-server";
import { getGlobalMetricsServerFn, GlobalMetrics } from "@/lib/telemetry-server";
import { PaymentConfig, DEFAULT_PAYMENT_CONFIG, PendingPayment } from "@/lib/payment-config";

export const Route = createFileRoute("/ceo")({
  component: CeoPage,
});

export function CeoPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"fundadores" | "cobros" | "testers" | "metricas">(
    "fundadores",
  );
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Founders state
  const [founders, setFounders] = useState<FounderRecord[]>([]);
  const [isLoadingFounders, setIsLoadingFounders] = useState(false);
  const [newFounderName, setNewFounderName] = useState("");
  const [issuedFounder, setIssuedFounder] = useState<FounderRecord | null>(null);
  const [expandedFounder, setExpandedFounder] = useState<number | null>(null);

  // Payments state
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [savePaymentSuccess, setSavePaymentSuccess] = useState(false);

  // Testers state
  const [decryptedCodes, setDecryptedCodes] = useState<string[]>([]);
  const [couponNames, setCouponNames] = useState<Record<number, string>>({});
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);
  const [editingCouponIdx, setEditingCouponIdx] = useState<number | null>(null);
  const [editingNameInput, setEditingNameInput] = useState("");
  const [discordWebhookInput, setDiscordWebhookInput] = useState("");
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  // Metrics state
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    roundsStarted: 0,
    roundsCompleted: 0,
    paywallClicks: 0,
    topCategories: {},
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auth Initialization
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
    if (stored && isValidStoredToken(stored, "ceo")) {
      setToken(stored);
      setIsAuthorized(true);
      const codes = getDecryptedVipCodes(stored);
      if (codes.length > 0) setDecryptedCodes(codes);
    }

    try {
      const storedNames = localStorage.getItem(STORAGE_KEYS.COUPON_NAMES);
      if (storedNames) setCouponNames(JSON.parse(storedNames));
      const storedUsed = localStorage.getItem(STORAGE_KEYS.USED_COUPONS);
      if (storedUsed) setUsedCoupons(JSON.parse(storedUsed));
      const storedHook = localStorage.getItem(STORAGE_KEYS.DISCORD_WEBHOOK);
      if (storedHook) setDiscordWebhookInput(storedHook);
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch data on active tab
  const fetchFounders = useCallback(
    async (curToken = token) => {
      if (!curToken) return;
      setIsLoadingFounders(true);
      try {
        const res = await getFoundersDataServerFn({ data: { ceoToken: curToken } });
        if (res.success && res.founders) {
          setFounders(res.founders);
        }
      } catch {
        /* ignore */
      } finally {
        setIsLoadingFounders(false);
      }
    },
    [token],
  );

  const fetchPayments = useCallback(
    async (curToken = token) => {
      if (!curToken) return;
      setIsLoadingPayments(true);
      try {
        const res = await getPendingPaymentsServerFn({ data: { ceoToken: curToken } });
        if (res.success && res.payments) {
          setPayments(res.payments);
        }
        const cfgRes = await getPaymentConfigServerFn();
        if (cfgRes.success && cfgRes.config) {
          setPaymentConfig(cfgRes.config);
        }
      } catch {
        /* ignore */
      } finally {
        setIsLoadingPayments(false);
      }
    },
    [token],
  );

  const fetchMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await getGlobalMetricsServerFn({ data: {} });
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  const fetchTesterStatuses = useCallback(async () => {
    try {
      const res = await getCouponServerStatusServerFn();
      if (res.success && res.usedHashes) {
        setUsedCoupons(res.usedHashes);
        localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(res.usedHashes));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized || !token) return;
    if (activeTab === "fundadores") fetchFounders(token);
    if (activeTab === "cobros") fetchPayments(token);
    if (activeTab === "metricas") fetchMetrics();
    if (activeTab === "testers") fetchTesterStatuses();
  }, [
    activeTab,
    isAuthorized,
    token,
    fetchFounders,
    fetchPayments,
    fetchMetrics,
    fetchTesterStatuses,
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { role, token: newToken } = verifyAccessCode(loginInput, []);
    if (role === "ceo" && newToken) {
      localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, newToken);
      setToken(newToken);
      setIsAuthorized(true);
      const codes = getDecryptedVipCodes(newToken);
      if (codes.length > 0) setDecryptedCodes(codes);
      fetchFounders(newToken);
    } else {
      setLoginError("Clave no autorizada. Acceso denegado.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
    setToken(null);
    setIsAuthorized(false);
    setLoginInput("");
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleIssueFounder = async () => {
    if (!token) return;
    try {
      const res = await issueFounderServerFn({
        data: {
          ceoToken: token,
          name: newFounderName.trim() || undefined,
        },
      });
      if (res.success && res.founder) {
        setIssuedFounder(res.founder);
        setNewFounderName("");
        setFounders((prev) => [...prev, res.founder!]);
      }
    } catch {
      /* ignore */
    }
  };

  const buildFounderWhatsAppUrl = (code: string, name: string) => {
    const text = `¡Hola ${name || ""}! 👑 Aquí tienes tu Pase Fundador Vitalicio oficial para Imposter.

🔑 Código Exclusivo: ${code}
📲 Entra a jugar: https://imposter.manu-07games.workers.dev

Pasos para activarlo:
1. Abre el enlace en tu navegador.
2. Pulsa el botón de la corona.
3. Escribe tu código en "¿Tienes un código o cupón PRO?".
4. ¡Listo! Tienes acceso ilimitado permanente y 5 Pases Fiesta de 24h para tus amigos.

💬 Únete a nuestro canal VIP en Discord:
https://discord.gg/9W92kXn4kS`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const buildGuestPassWhatsAppUrl = (passCode: string, founderName: string) => {
    const text = `¡Hola! 🎁 ${founderName || "Un Miembro Fundador"} te acaba de regalar un Pase Fiesta Oficial de 24 Horas para Imposter.

🔑 Código de Fiesta: ${passCode}
📲 Entra a jugar: https://imposter.manu-07games.workers.dev

Pasos:
1. Abre el enlace en tu móvil.
2. Pulsa la corona y canjea tu código.
3. ¡Todo desbloqueado para la fiesta de hoy!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Pantalla de Login Restringido
  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center p-4 bg-background select-none">
        <div className="w-full max-w-sm rounded-3xl glass-panel p-6 border border-white/10 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 mb-4">
            <Lock size={28} />
          </div>
          <h1 className="font-display text-2xl text-primary tracking-wide">
            TERMINAL EJECUTIVA CEO
          </h1>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Ingresa tu clave maestra para acceder a la consola de mandos de Imposter.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Clave Maestra CEO..."
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-3 text-sm text-center text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
            {loginError && <p className="text-xs text-destructive">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground glow-primary transition hover:brightness-110 active:scale-95 cursor-pointer text-sm"
            >
              Acceder a Terminal
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft size={13} /> Volver al Juego
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Métricas de Fundadores
  const totalFounders = founders.length;
  const activeFounders = founders.filter((f) => f.redeemedAt !== null).length;
  const totalGuestPassesUsed = founders.reduce(
    (acc, f) => acc + f.guestPasses.filter((p) => p.redeemedAt !== null).length,
    0,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Volver al juego"
          >
            <ArrowLeft size={16} />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-amber-400" />
              <h1 className="font-display text-2xl text-amber-400 tracking-wider">
                PANEL EJECUTIVO CEO
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Centro de operaciones, cobros y monetización
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
          >
            Ir a Jugar
          </a>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
          >
            Salir Modo CEO
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab("fundadores")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === "fundadores"
              ? "bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-lg"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Crown size={15} />
          <span>Fundadores ({totalFounders})</span>
        </button>

        <button
          onClick={() => setActiveTab("cobros")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === "cobros"
              ? "bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-lg"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard size={15} />
          <span>Cobros</span>
          {payments.filter((p) => p.status === "pending").length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-black">
              {payments.filter((p) => p.status === "pending").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("testers")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === "testers"
              ? "bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-lg"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket size={15} />
          <span>Testers (10)</span>
        </button>

        <button
          onClick={() => setActiveTab("metricas")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === "metricas"
              ? "bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-lg"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 size={15} />
          <span>Métricas</span>
        </button>
      </nav>

      {/* TAB 1: FUNDADORES */}
      {activeTab === "fundadores" && (
        <section className="flex flex-col gap-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Pases Fundador Emitidos</span>
              <span className="font-display text-3xl text-amber-400 mt-2">{totalFounders}</span>
            </div>
            <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Fundadores Activos (Canjeados)</span>
              <span className="font-display text-3xl text-emerald-400 mt-2">{activeFounders}</span>
            </div>
            <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Pases de Invitación Canjeados</span>
              <span className="font-display text-3xl text-blue-400 mt-2">
                {totalGuestPassesUsed} / {totalFounders * 5}
              </span>
            </div>
          </div>

          {/* Generador de Pase Fundador */}
          <div className="rounded-2xl glass-panel p-5 border border-amber-500/30 shadow-xl bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus size={18} className="text-amber-400" />
              <h2 className="font-display text-lg text-amber-400 tracking-wide">
                EMITIR NUEVO PASE FUNDADOR ($9.80)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Genera un código criptográfico vitalicio y sus 5 pases de anfitrión para enviarlo
              directamente por WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Nombre del Fundador (ej: Carlos Gómez)"
                value={newFounderName}
                onChange={(e) => setNewFounderName(e.target.value)}
                className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-amber-400 focus:outline-none"
              />
              <button
                onClick={handleIssueFounder}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 font-semibold text-black transition cursor-pointer text-sm shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={16} /> Emitir Pase Fundador
              </button>
            </div>

            {/* Recuadro de código recién emitido */}
            {issuedFounder && (
              <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/40 p-4 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-amber-300">
                    ¡Pase #{issuedFounder.number} emitido para {issuedFounder.name}!
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(issuedFounder.code, `issued-${issuedFounder.number}`)
                      }
                      className="rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-xs text-foreground flex items-center gap-1 transition"
                    >
                      {copiedKey === `issued-${issuedFounder.number}` ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      Copiar
                    </button>
                    <a
                      href={buildFounderWhatsAppUrl(issuedFounder.code, issuedFounder.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs text-white flex items-center gap-1 transition"
                    >
                      <Send size={12} /> WhatsApp
                    </a>
                  </div>
                </div>
                <p className="font-mono text-xl font-bold tracking-wider text-amber-400 text-center py-2 bg-black/40 rounded-lg border border-amber-500/20">
                  {issuedFounder.code}
                </p>
              </div>
            )}
          </div>

          {/* Lista de Fundadores */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base text-foreground">
                REGISTRO DE FUNDADORES Y SUS 5 PASES
              </h3>
              <button
                onClick={() => fetchFounders()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <RefreshCw size={13} className={isLoadingFounders ? "animate-spin" : ""} />{" "}
                Actualizar
              </button>
            </div>

            {founders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Aún no has emitido ningún Pase Fundador. Usa el botón de arriba para generar el
                primero.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {founders.map((f) => {
                  const usedCount = f.guestPasses.filter((p) => p.redeemedAt !== null).length;
                  const isExpanded = expandedFounder === f.number;

                  return (
                    <div
                      key={f.number}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-display text-lg border border-amber-500/20">
                            #{f.number}
                          </div>
                          <div>
                            <h4 className="font-display text-base text-foreground">{f.name}</h4>
                            <p className="font-mono text-xs text-amber-400">{f.code}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                              f.redeemedAt !== null
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {f.redeemedAt !== null ? "Activo" : "Pendiente"}
                          </span>

                          <span className="text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                            {usedCount}/5 Pases Usados
                          </span>

                          <button
                            onClick={() => copyToClipboard(f.code, `fndr-${f.number}`)}
                            title="Copiar Código"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                          >
                            {copiedKey === `fndr-${f.number}` ? (
                              <Check size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>

                          <a
                            href={buildFounderWhatsAppUrl(f.code, f.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar por WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/30"
                          >
                            <Send size={14} />
                          </a>

                          <button
                            onClick={() => setExpandedFounder(isExpanded ? null : f.number)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable 5 Guest Passes Drawer */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2 animate-in fade-in">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            5 Pases de Invitación de 24h de {f.name}:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {f.guestPasses.map((p) => (
                              <div
                                key={p.passIndex}
                                className="flex items-center justify-between rounded-lg bg-black/30 border border-white/10 p-2.5 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-display text-muted-foreground">
                                      Pase #{p.passIndex}:
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {p.code}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-medium block mt-0.5 ${
                                      p.redeemedAt !== null
                                        ? "text-emerald-400"
                                        : "text-amber-400/80"
                                    }`}
                                  >
                                    {p.redeemedAt !== null
                                      ? `Canjeado (${p.redeemedBy || "Invitado"})`
                                      : "Disponible"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      copyToClipboard(p.code, `pass-${f.number}-${p.passIndex}`)
                                    }
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                                  >
                                    {copiedKey === `pass-${f.number}-${p.passIndex}` ? (
                                      <Check size={12} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>

                                  <a
                                    href={buildGuestPassWhatsAppUrl(p.code, f.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/20"
                                  >
                                    <Send size={12} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: COBROS */}
      {activeTab === "cobros" && (
        <section className="flex flex-col gap-6">
          <div className="rounded-2xl glass-panel p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">
                  BANDEJA DE COBROS Y TRANSFERENCIAS
                </h3>
                <p className="text-xs text-muted-foreground">
                  Revisa y aprueba pagos de Pago Móvil, Binance Pay o Tarjeta
                </p>
              </div>
              <button
                onClick={() => fetchPayments()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <RefreshCw size={13} className={isLoadingPayments ? "animate-spin" : ""} />{" "}
                Actualizar
              </button>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No hay transferencias reportadas en este momento.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base text-foreground">
                          {p.customerName}
                        </span>
                        <span className="font-mono text-xs text-amber-400 font-bold">
                          {p.amountFormatted}
                        </span>
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                          {p.method}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Plan: <strong>{p.plan}</strong> | Ref: #{p.reference}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.status === "pending" ? (
                        <>
                          <button
                            onClick={async () => {
                              if (!token) return;
                              const res = await reviewPaymentServerFn({
                                data: { ceoToken: token, paymentId: p.id, action: "approve" },
                              });
                              if (res.success && res.payments) setPayments(res.payments);
                            }}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} /> Aprobar
                          </button>
                          <button
                            onClick={async () => {
                              if (!token) return;
                              const res = await reviewPaymentServerFn({
                                data: { ceoToken: token, paymentId: p.id, action: "reject" },
                              });
                              if (res.success && res.payments) setPayments(res.payments);
                            }}
                            className="rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            p.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {p.status === "approved" ? "Aprobado" : "Rechazado"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuración de Pago Móvil & Binance */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10">
            <h3 className="font-display text-base text-foreground mb-1">
              DATOS BANCARIOS Y WALLETS PARA COBROS
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Los datos que se muestran en el Paywall a los jugadores
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Pago Móvil — Teléfono
                </label>
                <input
                  type="text"
                  value={paymentConfig.pagoMovilPhone}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, pagoMovilPhone: e.target.value })
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Pago Móvil — Cédula
                </label>
                <input
                  type="text"
                  value={paymentConfig.pagoMovilId}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, pagoMovilId: e.target.value })
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Pago Móvil — Banco
                </label>
                <input
                  type="text"
                  value={paymentConfig.pagoMovilBank}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, pagoMovilBank: e.target.value })
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Binance Pay — ID o Correo
                </label>
                <input
                  type="text"
                  value={paymentConfig.binancePayId}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, binancePayId: e.target.value })
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                if (!token) return;
                const res = await savePaymentConfigServerFn({
                  data: { ceoToken: token, config: paymentConfig },
                });
                if (res.success) {
                  setSavePaymentSuccess(true);
                  setTimeout(() => setSavePaymentSuccess(false), 2500);
                }
              }}
              className="rounded-xl bg-primary hover:brightness-110 px-5 py-2.5 text-xs font-semibold text-primary-foreground transition cursor-pointer"
            >
              {savePaymentSuccess ? "¡Guardado con éxito!" : "Guardar Datos de Cobro"}
            </button>
          </div>
        </section>
      )}

      {/* TAB 3: TESTERS */}
      {activeTab === "testers" && (
        <section className="flex flex-col gap-6">
          <div className="rounded-2xl glass-panel p-5 border border-white/10">
            <h3 className="font-display text-lg text-foreground mb-1">
              10 CUPONES VIP DE PRUEBA (48 HORAS)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Cada cupón es de 1 solo uso estricto y desbloquea el juego por 48 horas a tus sujetos
              de prueba.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {decryptedCodes.map((code, idx) => {
                const num = idx + 1;
                const hash = VIP_COUPON_HASHES_ORDERED[idx] || "";
                const isUsed = usedCoupons.includes(hash);
                const assignedName = couponNames[num] || (num === 1 ? "Ivana" : `Tester #${num}`);

                return (
                  <div
                    key={num}
                    className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/10 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-muted-foreground">#{num}:</span>
                        <span className="font-mono font-bold text-foreground">{code}</span>
                      </div>
                      <span className="text-muted-foreground block text-[11px] mt-0.5">
                        Asignado a: <strong>{assignedName}</strong>
                      </span>
                      <span
                        className={`text-[10px] font-semibold mt-0.5 inline-block ${
                          isUsed ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {isUsed ? "Consumido" : "Disponible"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyToClipboard(code, `tester-${num}`)}
                        className="rounded-lg bg-white/5 hover:bg-white/10 p-1.5 text-muted-foreground hover:text-foreground transition"
                      >
                        {copiedKey === `tester-${num}` ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: MÉTRICAS */}
      {activeTab === "metricas" && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl glass-panel p-4 border border-white/10">
              <span className="text-xs text-muted-foreground">Partidas Iniciadas (Reales)</span>
              <span className="font-display text-3xl text-amber-400 mt-2 block">
                {metrics.roundsStarted}
              </span>
            </div>
            <div className="rounded-2xl glass-panel p-4 border border-white/10">
              <span className="text-xs text-muted-foreground">Partidas Completadas</span>
              <span className="font-display text-3xl text-emerald-400 mt-2 block">
                {metrics.roundsCompleted}
              </span>
            </div>
            <div className="rounded-2xl glass-panel p-4 border border-white/10">
              <span className="text-xs text-muted-foreground">Clics en Ofertas PRO</span>
              <span className="font-display text-3xl text-blue-400 mt-2 block">
                {metrics.paywallClicks}
              </span>
            </div>
          </div>

          {/* Top Categorías */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10">
            <h3 className="font-display text-base text-foreground mb-3">CATEGORÍAS MÁS JUGADAS</h3>
            {Object.keys(metrics.topCategories || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay categorías registradas aún.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.topCategories).map(([cat, count]) => (
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

          {/* Acciones de Mantenimiento */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-display text-sm text-foreground">LIMPIAR ANALÍTICAS</h4>
              <p className="text-xs text-muted-foreground">
                Reinicia los contadores a 0 para una nueva fase de pruebas.
              </p>
            </div>
            <button
              onClick={async () => {
                if (!confirm("¿Deseas reiniciar todas las métricas a 0?")) return;
                await getGlobalMetricsServerFn({ data: { reset: true } });
                fetchMetrics();
              }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition cursor-pointer"
            >
              Reiniciar Métricas
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
