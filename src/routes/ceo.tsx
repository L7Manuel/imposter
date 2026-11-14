import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Crown,
  CreditCard,
  Ticket,
  BarChart3,
  ArrowLeft,
  Lock,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  isValidStoredToken,
  verifyAccessCode,
  STORAGE_KEYS,
  getDecryptedVipCodes,
  generateDynamicCeoKey,
} from "@/lib/security";
import {
  checkCeoAuthServerFn,
  verifyCeoLoginServerFn,
  rotateCeoMasterKeyServerFn,
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
    let clientToken: string | undefined;
    if (typeof window !== "undefined") {
      try {
        clientToken = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) || undefined;
      } catch {
        /* ignore */
      }
    }
    return await checkCeoAuthServerFn({ data: { clientToken } });
  },
  component: CeoPage,
});

export function CeoPage() {
  const loaderData = Route.useLoaderData();
  const [token, setToken] = useState<string | null>(() => {
    if (loaderData?.token) return loaderData.token;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
      if (stored && isValidStoredToken(stored, "ceo")) return stored;
    }
    return null;
  });
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (loaderData?.isAuthorized) return true;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
      if (stored && isValidStoredToken(stored, "ceo")) return true;
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<
    "fundadores" | "cobros" | "testers" | "metricas" | "seguridad"
  >("fundadores");
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Estado del Generador y Bóveda de Llave Maestra CEO (AAA)
  const [keyVersion, setKeyVersion] = useState<number>(loaderData?.keyVersion ?? 1);
  const [maskedKeyPreview, setMaskedKeyPreview] = useState<string>(
    loaderData?.maskedPreview ?? "CEO-••••-2026 (Fábrica)",
  );
  const [rotatedAt, setRotatedAt] = useState<number | null>(loaderData?.rotatedAt ?? null);
  const [candidateMasterKey, setCandidateMasterKey] = useState<string>(() =>
    generateDynamicCeoKey(),
  );
  const [hasCopiedCandidate, setHasCopiedCandidate] = useState<boolean>(false);
  const [isRotatingKey, setIsRotatingKey] = useState<boolean>(false);
  const [keyVaultFeedback, setKeyVaultFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Founders state (inicializado desde loader para Cero-Parpadeo)
  const [founders, setFounders] = useState<FounderRecord[]>(
    () => loaderData?.initialFounders ?? [],
  );
  const [isLoadingFounders, setIsLoadingFounders] = useState(false);

  // Payments state (inicializado desde loader para Cero-Parpadeo)
  const [payments, setPayments] = useState<PendingPayment[]>(
    () => loaderData?.initialPayments ?? [],
  );
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(
    () => loaderData?.initialPaymentConfig ?? DEFAULT_PAYMENT_CONFIG,
  );

  // Testers state
  const [decryptedCodes, setDecryptedCodes] = useState<string[]>(() => {
    if (loaderData?.token) {
      return getDecryptedVipCodes(loaderData.token);
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
      if (stored && isValidStoredToken(stored, "ceo")) {
        return getDecryptedVipCodes(stored);
      }
    }
    return [];
  });
  const [couponNames, setCouponNames] = useState<Record<number, string>>({});
  const [usedCoupons, setUsedCoupons] = useState<string[]>(
    () => loaderData?.initialUsedCoupons ?? [],
  );

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

    if (loaderData?.activeVerifyHash) {
      localStorage.setItem(STORAGE_KEYS.CEO_ACTIVE_HASH, loaderData.activeVerifyHash);
    } else if (loaderData && loaderData.activeVerifyHash === null) {
      localStorage.removeItem(STORAGE_KEYS.CEO_ACTIVE_HASH);
    }

    const stored = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
    if (stored && isValidStoredToken(stored, "ceo")) {
      setToken(stored);
      setIsAuthorized(true);
      // Sincronizar Cookie para que los futuros SSR carguen directamente sin parpadeos
      document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${stored}; path=/; max-age=31536000; SameSite=Lax`;
      const codes = getDecryptedVipCodes(stored);
      if (codes.length > 0) setDecryptedCodes(codes);
    } else if (loaderData?.isAuthorized && loaderData?.token) {
      // Si el servidor lo autorizó por cookie pero localStorage estaba vacío
      localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, loaderData.token);
      const codes = getDecryptedVipCodes(loaderData.token);
      if (codes.length > 0) setDecryptedCodes(codes);
    } else if (stored) {
      // Si tenía un token viejo que fue revocado al rotar la llave en otro dispositivo
      localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
      document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
      setToken(null);
      setIsAuthorized(false);
    }

    try {
      const storedPayConfig = localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIG);
      if (storedPayConfig && !loaderData?.isAuthorized) {
        setPaymentConfig(sanitizePaymentConfig(JSON.parse(storedPayConfig)));
      }
      const storedNames = localStorage.getItem(STORAGE_KEYS.COUPON_NAMES);
      if (storedNames) setCouponNames(JSON.parse(storedNames));
      if (!loaderData?.initialUsedCoupons?.length) {
        const storedUsed = localStorage.getItem(STORAGE_KEYS.USED_COUPONS);
        if (storedUsed) setUsedCoupons(JSON.parse(storedUsed));
      }
    } catch {
      /* ignore */
    }
  }, [loaderData]);

  // Fetch data on active tab
  const fetchFounders = useCallback(
    async (curToken = token, silent = false) => {
      if (!curToken) return;
      if (!silent) setIsLoadingFounders(true);
      try {
        const res = await getFoundersDataServerFn({ data: { ceoToken: curToken } });
        if (res.success && res.founders) {
          setFounders(res.founders);
        }
      } catch {
        /* ignore */
      } finally {
        if (!silent) setIsLoadingFounders(false);
      }
    },
    [token],
  );

  const fetchPayments = useCallback(
    async (curToken = token, fetchConfig = true, silent = false) => {
      if (!curToken) return;
      if (!silent) setIsLoadingPayments(true);
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
        if (!silent) setIsLoadingPayments(false);
      }
    },
    [token],
  );

  const fetchMetrics = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingMetrics(true);
    try {
      const res = await getGlobalMetricsServerFn({ data: {} });
      if (res && typeof res.totalRoundsStarted === "number") {
        setMetrics(res);
      }
    } catch {
      /* ignore */
    } finally {
      if (!silent) setIsLoadingMetrics(false);
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
    if (activeTab === "fundadores") fetchFounders(token, true);
    if (activeTab === "cobros") fetchPayments(token, true, true);
    if (activeTab === "metricas") fetchMetrics(true);
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
        fetchMetrics(true);
      }, 10000);
      return () => clearInterval(timer);
    }
    if (activeTab === "cobros") {
      const timer = setInterval(() => {
        // En el polling periódico, únicamente refrescamos las transferencias pendientes (payments), sin sobrescribir el formulario de configuración
        fetchPayments(token, false, true);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [isAuthorized, token, activeTab, fetchMetrics, fetchPayments]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const srv = await verifyCeoLoginServerFn({ data: { rawKey: loginInput } });
      if (srv.authorized && srv.token) {
        if (typeof window !== "undefined") {
          if (srv.activeVerifyHash) {
            localStorage.setItem(STORAGE_KEYS.CEO_ACTIVE_HASH, srv.activeVerifyHash);
          } else {
            localStorage.removeItem(STORAGE_KEYS.CEO_ACTIVE_HASH);
          }
          localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, srv.token);
          document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${srv.token}; path=/; max-age=31536000; SameSite=Lax`;
        }
        setToken(srv.token);
        setIsAuthorized(true);
        if (srv.keyVersion) setKeyVersion(srv.keyVersion);
        if (srv.maskedPreview) setMaskedKeyPreview(srv.maskedPreview);
        if (srv.rotatedAt !== undefined) setRotatedAt(srv.rotatedAt);
        const codes = getDecryptedVipCodes(srv.token);
        if (codes.length > 0) setDecryptedCodes(codes);
        fetchFounders(srv.token);
        return;
      }
    } catch {
      /* fallback local */
    }

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
      setLoginError("Clave no autorizada o revocada. Acceso denegado.");
    }
  };

  const handleActivateNewMasterKey = async () => {
    if (!token) return;
    setIsRotatingKey(true);
    setKeyVaultFeedback(null);
    try {
      const res = await rotateCeoMasterKeyServerFn({
        data: {
          currentCeoToken: token,
          action: "rotate",
          newKey: candidateMasterKey,
        },
      });
      if (res.success && res.token) {
        if (typeof window !== "undefined") {
          if (res.activeVerifyHash) {
            localStorage.setItem(STORAGE_KEYS.CEO_ACTIVE_HASH, res.activeVerifyHash);
          }
          localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, res.token);
          document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${res.token}; path=/; max-age=31536000; SameSite=Lax`;
        }
        setToken(res.token);
        setKeyVersion(res.keyVersion);
        setRotatedAt(res.rotatedAt);
        setMaskedKeyPreview(res.maskedPreview);
        setDecryptedCodes(getDecryptedVipCodes(res.token));
        setKeyVaultFeedback({
          type: "success",
          text: `¡Nueva Llave Maestra (${res.normalizedKey}) activada! Otros dispositivos fueron desconectados y se envió copia de respaldo a tu Discord.`,
        });
      } else {
        setKeyVaultFeedback({
          type: "error",
          text: res.error || "No se pudo rotar la llave maestra.",
        });
      }
    } catch {
      setKeyVaultFeedback({
        type: "error",
        text: "Error de red al rotar la llave maestra.",
      });
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleResetFactoryMasterKey = async () => {
    if (!token) return;
    setIsRotatingKey(true);
    setKeyVaultFeedback(null);
    try {
      const res = await rotateCeoMasterKeyServerFn({
        data: {
          currentCeoToken: token,
          action: "reset_factory",
        },
      });
      if (res.success && res.token) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.CEO_ACTIVE_HASH);
          localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, res.token);
          document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${res.token}; path=/; max-age=31536000; SameSite=Lax`;
        }
        setToken(res.token);
        setKeyVersion(res.keyVersion);
        setRotatedAt(res.rotatedAt);
        setMaskedKeyPreview(res.maskedPreview);
        setDecryptedCodes(getDecryptedVipCodes(res.token));
        setKeyVaultFeedback({
          type: "success",
          text: "Llave Maestra restaurada al valor original de fábrica.",
        });
      }
    } catch {
      setKeyVaultFeedback({
        type: "error",
        text: "Error al restaurar la llave de fábrica.",
      });
    } finally {
      setIsRotatingKey(false);
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
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft size={13} /> Volver al Juego
            </Link>
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
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Volver al juego"
          >
            <ArrowLeft size={16} />
          </Link>
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
          <Link
            to="/"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
          >
            Ir a Jugar
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
          >
            Salir Modo CEO
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
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

        <button
          onClick={() => setActiveTab("seguridad")}
          className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === "seguridad"
              ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-lg"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound size={15} />
          <span>Llave CEO</span>
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

      {activeTab === "seguridad" && (
        <section className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Estado Actual de la Bóveda Criptográfica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl glass-panel p-4 border border-emerald-500/30 bg-emerald-500/[0.04]">
              <span className="text-xs text-muted-foreground block">Estado de Bóveda CEO</span>
              <div className="mt-2 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span className="font-display text-xl text-emerald-400 tracking-wide">
                  BLINDAJE ACTIVO
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Versión de seguridad: <strong className="text-foreground">v{keyVersion}.0</strong>
              </span>
            </div>

            <div className="rounded-2xl glass-panel p-4 border border-white/10">
              <span className="text-xs text-muted-foreground block">Llave Maestra en Vigor</span>
              <span className="font-mono text-lg font-bold text-amber-300 mt-2 block">
                {maskedKeyPreview}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                {rotatedAt
                  ? `Rotada: ${new Date(rotatedAt).toLocaleTimeString()}`
                  : "Configuración inicial"}
              </span>
            </div>

            <div className="rounded-2xl glass-panel p-4 border border-white/10">
              <span className="text-xs text-muted-foreground block">Bóveda de 10 Cupones VIP</span>
              <span className="font-display text-xl text-primary mt-2 block">
                {decryptedCodes.length} / 10 Descifrados
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Aislada contra rotación de clave
              </span>
            </div>
          </div>

          {/* Generador Táctico AAA de Llave Maestra CEO */}
          <div className="rounded-3xl glass-panel p-6 border-2 border-amber-400/35 bg-gradient-to-br from-amber-500/10 via-background to-emerald-500/5 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 shadow-lg">
                  <KeyRound size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    Rotación Criptográfica SHA-256 en Caliente
                  </span>
                  <h2 className="font-display text-2xl text-foreground tracking-wide">
                    GENERADOR DE LLAVE MAESTRA CEO
                  </h2>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
                Respaldo automático en Discord
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Genera una nueva Llave Maestra firmada o escribe una personalizada. Al activarla,{" "}
              <strong className="text-foreground">
                tu sesión actual se actualiza sin interrupción
              </strong>
              , cualquier otro teléfono con la llave anterior queda desconectado al instante, y el
              bot Atlas envía una copia de seguridad a tu canal privado de Discord.
            </p>

            {/* Visor Táctico de la Nueva Llave */}
            <div className="rounded-2xl bg-black/50 border border-amber-400/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Nueva Llave Maestra Candidata
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCandidateMasterKey(generateDynamicCeoKey());
                    setHasCopiedCandidate(false);
                    setKeyVaultFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 transition cursor-pointer"
                >
                  <RefreshCw size={12} /> Generar Otra Llave
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={candidateMasterKey}
                  onChange={(e) => {
                    setCandidateMasterKey(e.target.value.toUpperCase());
                    setHasCopiedCandidate(false);
                  }}
                  placeholder="CEO-XXXX-YYYY"
                  maxLength={32}
                  className="flex-1 rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-center font-mono text-xl font-extrabold tracking-widest text-amber-300 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(candidateMasterKey, "candidate-ceo-key");
                    setHasCopiedCandidate(true);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${
                    copiedKey === "candidate-ceo-key" || hasCopiedCandidate
                      ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                      : "bg-white/10 hover:bg-white/15 border border-white/15 text-foreground"
                  }`}
                >
                  {copiedKey === "candidate-ceo-key" || hasCopiedCandidate ? (
                    <>
                      <Check size={15} /> ¡Llave Copiada!
                    </>
                  ) : (
                    <>
                      <Copy size={15} /> 1. Copiar Llave
                    </>
                  )}
                </button>
              </div>
            </div>

            {keyVaultFeedback && (
              <div
                className={`rounded-2xl p-3.5 text-xs font-medium border ${
                  keyVaultFeedback.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                }`}
              >
                {keyVaultFeedback.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={isRotatingKey || candidateMasterKey.trim().length < 6}
                onClick={handleActivateNewMasterKey}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 py-3.5 px-6 text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.35)] transition active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>
                  {isRotatingKey
                    ? "Rotando y Blindando..."
                    : "2. Activar Nueva Llave y Revocar Anterior"}
                </span>
              </button>

              <button
                type="button"
                disabled={isRotatingKey}
                onClick={handleResetFactoryMasterKey}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 py-3.5 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Volver a la clave original de fábrica"
              >
                <RotateCcw size={14} />
                <span>Restaurar Llave de Fábrica</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
