import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Crown, CreditCard, Ticket, BarChart3, ArrowLeft, Lock } from "lucide-react";
import {
  isValidStoredToken,
  verifyAccessCode,
  STORAGE_KEYS,
  getDecryptedVipCodes,
} from "@/lib/security";
import {
  checkCeoAuthServerFn,
  getFoundersDataServerFn,
  FounderRecord,
  getPendingPaymentsServerFn,
  getPaymentConfigServerFn,
  getCouponServerStatusServerFn,
} from "@/lib/coupon-server";
import { getGlobalMetricsServerFn, GlobalMetrics } from "@/lib/telemetry-server";
import {
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  PendingPayment,
  sanitizePaymentConfig,
} from "@/lib/payment-config";
import { CeoFoundersTab, CeoPaymentsTab, CeoTestersTab, CeoMetricsTab } from "@/components/ceo";

export const Route = createFileRoute("/ceo")({
  loader: async () => {
    return await checkCeoAuthServerFn();
  },
  component: CeoPage,
});

export function CeoPage() {
  const loaderData = Route.useLoaderData();
  const [token, setToken] = useState<string | null>(loaderData?.token ?? null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(loaderData?.isAuthorized ?? false);
  const [activeTab, setActiveTab] = useState<"fundadores" | "cobros" | "testers" | "metricas">(
    "fundadores",
  );
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Founders state
  const [founders, setFounders] = useState<FounderRecord[]>([]);
  const [isLoadingFounders, setIsLoadingFounders] = useState(false);

  // Payments state
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);

  // Testers state
  const [decryptedCodes, setDecryptedCodes] = useState<string[]>(() => {
    if (loaderData?.token) {
      return getDecryptedVipCodes(loaderData.token);
    }
    return [];
  });
  const [couponNames, setCouponNames] = useState<Record<number, string>>({});
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);

  // Metrics state
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    totalRoundsStarted: 0,
    totalRoundsCompleted: 0,
    totalPaywallViews: 0,
    totalPwaInstalls: 0,
    categoryCounts: {},
    deviceCounts: { android: 0, ios: 0, desktop: 0 },
    recentEvents: [],
    lastUpdated: Date.now(),
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auth & Storage Sync en Cliente
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
    if (stored && isValidStoredToken(stored, "ceo")) {
      setToken(stored);
      setIsAuthorized(true);
      // Sincronizar Cookie para que los futuros SSR carguen directamente sin parpadeos
      document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${stored}; path=/; max-age=31536000; SameSite=Lax`;
      const codes = getDecryptedVipCodes(stored);
      if (codes.length > 0) setDecryptedCodes(codes);
    } else if (loaderData?.token) {
      // Si el servidor lo autorizó por cookie pero localStorage estaba vacío
      localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, loaderData.token);
      const codes = getDecryptedVipCodes(loaderData.token);
      if (codes.length > 0) setDecryptedCodes(codes);
    }

    try {
      const storedPayConfig = localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIG);
      if (storedPayConfig) {
        setPaymentConfig(sanitizePaymentConfig(JSON.parse(storedPayConfig)));
      }
      const storedNames = localStorage.getItem(STORAGE_KEYS.COUPON_NAMES);
      if (storedNames) setCouponNames(JSON.parse(storedNames));
      const storedUsed = localStorage.getItem(STORAGE_KEYS.USED_COUPONS);
      if (storedUsed) setUsedCoupons(JSON.parse(storedUsed));
    } catch {
      /* ignore */
    }
  }, [loaderData?.token]);

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
    async (curToken = token, fetchConfig = true) => {
      if (!curToken) return;
      setIsLoadingPayments(true);
      try {
        const res = await getPendingPaymentsServerFn({ data: { ceoToken: curToken } });
        if (res.success && res.payments) {
          setPayments(res.payments);
        }
        if (fetchConfig) {
          let fallback: PaymentConfig | undefined;
          if (typeof window !== "undefined") {
            const savedPay = localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIG);
            if (savedPay) {
              try {
                fallback = sanitizePaymentConfig(JSON.parse(savedPay));
              } catch {
                /* ignore */
              }
            }
          }
          const cfgRes = await getPaymentConfigServerFn({
            data: { defaultFallback: fallback },
          });
          if (cfgRes.success && cfgRes.config) {
            setPaymentConfig(cfgRes.config);
          }
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
      if (res && typeof res.totalRoundsStarted === "number") {
        setMetrics(res);
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
      if (res && Array.isArray(res.usedCoupons)) {
        const hashes = res.usedCoupons.map((c: { hash: string }) => c.hash);
        setUsedCoupons(hashes);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(hashes));
        }
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

  // Auto-refresh activo para métricas (cada 10s) y cobros (cada 15s)
  useEffect(() => {
    if (!isAuthorized || !token) return;
    if (activeTab === "metricas") {
      const timer = setInterval(() => {
        fetchMetrics();
      }, 10000);
      return () => clearInterval(timer);
    }
    if (activeTab === "cobros") {
      const timer = setInterval(() => {
        // En el polling periódico, únicamente refrescamos las transferencias pendientes (payments), sin sobrescribir el formulario de configuración
        fetchPayments(token, false);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [isAuthorized, token, activeTab, fetchMetrics, fetchPayments]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { role, token: newToken } = verifyAccessCode(loginInput, []);
    if (role === "ceo" && newToken) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, newToken);
        document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${newToken}; path=/; max-age=31536000; SameSite=Lax`;
      }
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      localStorage.removeItem(STORAGE_KEYS.FOUNDER_NUMBER);
      localStorage.removeItem(STORAGE_KEYS.FOUNDER_CODE);
      localStorage.removeItem("impostor-pro-unlocked");
      localStorage.removeItem("impostor-ceo-admin");
      localStorage.removeItem("impostor-adult-unlocked");
      localStorage.setItem("impostor-events", "false");
      localStorage.setItem("impostor-jester", "false");
      try {
        const savedNames = localStorage.getItem("impostor-names");
        if (savedNames) {
          const parsedNames = JSON.parse(savedNames);
          if (Array.isArray(parsedNames) && parsedNames.length > 6) {
            localStorage.setItem("impostor-names", JSON.stringify(parsedNames.slice(0, 6)));
          }
        }
      } catch {
        /* ignore */
      }
      document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
    }
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

  const totalFounders = founders.length;
  const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;

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
          {pendingPaymentsCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-black">
              {pendingPaymentsCount}
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

      {/* TABS CONTENT */}
      {activeTab === "fundadores" && (
        <CeoFoundersTab
          token={token}
          founders={founders}
          setFounders={setFounders}
          isLoadingFounders={isLoadingFounders}
          fetchFounders={fetchFounders}
          copiedKey={copiedKey}
          copyToClipboard={copyToClipboard}
        />
      )}

      {activeTab === "cobros" && (
        <CeoPaymentsTab
          token={token}
          payments={payments}
          setPayments={setPayments}
          isLoadingPayments={isLoadingPayments}
          fetchPayments={fetchPayments}
          paymentConfig={paymentConfig}
          setPaymentConfig={setPaymentConfig}
        />
      )}

      {activeTab === "testers" && (
        <CeoTestersTab
          decryptedCodes={decryptedCodes}
          usedCoupons={usedCoupons}
          couponNames={couponNames}
          setCouponNames={setCouponNames}
          fetchTesterStatuses={fetchTesterStatuses}
          copiedKey={copiedKey}
          copyToClipboard={copyToClipboard}
        />
      )}

      {activeTab === "metricas" && (
        <CeoMetricsTab
          metrics={metrics}
          isLoadingMetrics={isLoadingMetrics}
          fetchMetrics={fetchMetrics}
        />
      )}
    </main>
  );
}
