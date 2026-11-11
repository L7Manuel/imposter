import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Volume2,
  VolumeX,
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  Fingerprint,
  Target,
  User,
  Lock,
  Unlock,
  KeyRound,
  Delete,
  Play,
  LogOut,
  Settings,
  Smartphone,
  Users,
  Share2,
  Download,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  Crown,
  QrCode,
  Copy,
  BarChart3,
  ShieldCheck,
  Bell,
  Clock,
  Edit3,
  Sun,
  CreditCard,
  Wallet,
  Building2,
  ExternalLink,
  Send,
  Ticket,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Activity,
  RefreshCw,
  Utensils,
  MapPin,
  PawPrint,
  Briefcase,
  Film,
  Gamepad2,
  Music2,
  Globe2,
  Dices,
  Flame,
  Package,
} from "lucide-react";
import { acquireScreenWakeLock, releaseScreenWakeLock } from "@/lib/wake-lock";
import { ConfettiCanvas } from "@/lib/confetti";
import {
  initPwaInstallPrompt,
  isStandaloneMode,
  isIosDevice,
  hasDeferredInstallPrompt,
  promptPwaInstall,
  subscribeToPwaState,
} from "@/lib/pwa-install";
import {
  verifyAccessCode,
  isValidStoredToken,
  sanitizeImportedCategories,
  createSignedExpiry,
  parseSignedExpiry,
  TESTER_COUPON_DURATION_MS,
  VIP_COUPON_HASHES_ORDERED,
  STORAGE_KEYS,
  getDecryptedVipCodes,
  generateGuestPass,
} from "@/lib/security";
import {
  consumeSingleUseCouponServerFn,
  getCouponServerStatusServerFn,
  testDiscordWebhookServerFn,
  getPaymentConfigServerFn,
  savePaymentConfigServerFn,
  notifyPaymentIntentServerFn,
  submitPaymentProofServerFn,
  checkPaymentStatusServerFn,
  getPendingPaymentsServerFn,
  reviewPaymentServerFn,
  consumeFounderServerFn,
  consumeGuestPassServerFn,
  getFounderGuestPassesServerFn,
} from "@/lib/coupon-server";
import { trackGameEvent } from "@/lib/telemetry";
import { getGlobalMetricsServerFn, GlobalMetrics } from "@/lib/telemetry-server";
import {
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  sanitizePaymentConfig,
  PendingPayment,
  PartyPassPlan,
  PARTY_PASS_PLANS,
} from "@/lib/payment-config";
import { DEFAULT_CATEGORIES, ADULT_CATEGORY, ADULT_WORDS, PRO_CATEGORIES } from "@/data/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ROUND_EVENTS, PLAYER_PALETTE, getPlayerBadge } from "@/data/game-events";
import {
  AdultPinModal,
  FounderPassesModal,
  InstallPwaModal,
  PaywallModal,
  SettingsModal,
  ShareModal,
} from "@/components/modals";
import {
  unlockAudio,
  playBeep,
  playPop,
  startScanSound,
  stopScanSound,
  playImpostorReveal,
  playDramaticImpact,
  playDebateTension,
  playFanfare,
} from "@/lib/audio-effects";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "El Impostor — Juego de Fiesta y Engaño Social para Jugar con Amigos" },
      {
        name: "description",
        content:
          "El juego definitivo para tus reuniones y fiestas. Pasa el teléfono, descubre la palabra secreta y desenmascara al impostor. Gratis, online y sin descargas obligatorias.",
      },
      {
        name: "keywords",
        content:
          "juego del impostor, juego de fiesta, el impostor online, pass and play, juegos para beber, quien es el impostor, undercover en español, spyfall español, imposter party",
      },
      {
        property: "og:title",
        content: "El Impostor — Juego de Fiesta y Engaño Social para Jugar con Amigos",
      },
      {
        property: "og:description",
        content:
          "Pasa el teléfono, descubre tu palabra secreta y desenmascara al impostor del grupo. ¡Juega gratis sin descargar nada!",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://imposter.manu-07games.workers.dev/icon-512.png" },
      { property: "og:url", content: "https://imposter.manu-07games.workers.dev" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "El Impostor — Juego de Fiesta y Engaño Social",
      },
      {
        name: "twitter:description",
        content: "Pasa el teléfono, mantén el sensor táctil y descubre al mentiroso.",
      },
      { name: "twitter:image", content: "https://imposter.manu-07games.workers.dev/icon-512.png" },
    ],
  }),
  component: Game,
});

function formatRemainingTime(activatedAt: number): {
  isExpired: boolean;
  hours: number;
  minutes: number;
  text: string;
  percentElapsed: number;
} {
  const expiresAt = activatedAt + TESTER_COUPON_DURATION_MS;
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    return {
      isExpired: true,
      hours: 0,
      minutes: 0,
      text: "Expirado",
      percentElapsed: 100,
    };
  }
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const elapsedMs = Math.max(0, Date.now() - activatedAt);
  const percentElapsed = Math.min(100, Math.round((elapsedMs / TESTER_COUPON_DURATION_MS) * 100));

  return {
    isExpired: false,
    hours,
    minutes,
    text: hours > 0 ? `Restan ${hours}h ${minutes}m` : `Restan ${minutes}m`,
    percentElapsed,
  };
}

function formatCouponDate(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    const day = d.getDate();
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const month = months[d.getMonth()] ?? "";
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${day}-${month} ${h12}:${mins} ${ampm}`;
  } catch {
    return "";
  }
}

type Phase = "setup" | "reveal" | "discuss" | "vote" | "result";

interface ScoreState {
  innocents: number;
  impostors: number;
}

interface AnalyticsState {
  roundsPlayed: number;
  roundsCompleted: number;
  paywallViews: number;
  categoryCounts: Record<string, number>;
}

const FREE_MAX_PLAYERS = 6;

const btn =
  "rounded-xl px-4 py-3 font-semibold transition-all duration-150 active:scale-95 disabled:opacity-30 select-none cursor-pointer";
const btnPrimary = `${btn} bg-primary text-primary-foreground glow-primary hover:brightness-110 shadow-lg active:brightness-125`;
const btnGhost = `${btn} bg-white/10 hover:bg-white/15 text-foreground border border-white/10 active:brightness-125`;
const btnDanger = `${btn} bg-destructive text-destructive-foreground glow-danger hover:brightness-110 active:brightness-125`;

function Game() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [isResolvingResult, setIsResolvingResult] = useState<boolean>(false);

  // Config State (SSR-safe defaults, hydrated in useEffect)
  const [names, setNames] = useState<string[]>([
    "Jugador 1",
    "Jugador 2",
    "Jugador 3",
    "Jugador 4",
  ]);
  const [impostorCount, setImpostorCount] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [accompliceMode, setAccompliceMode] = useState<boolean>(true);
  const [randomEventsEnabled, setRandomEventsEnabled] = useState<boolean>(false);
  const [jesterEnabled, setJesterEnabled] = useState<boolean>(false);
  const [scores, setScores] = useState<ScoreState>({ innocents: 0, impostors: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [packStatus, setPackStatus] = useState<string>("");

  // PRO / VIP & CEO Admin State
  const [isProUnlocked, setIsProUnlocked] = useState<boolean>(false);
  const [isCeoAdmin, setIsCeoAdmin] = useState<boolean>(false);
  const [ceoSimulateFree, setCeoSimulateFree] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const [showFounderPassesModal, setShowFounderPassesModal] = useState<boolean>(false);
  const [founderGuestPasses, setFounderGuestPasses] = useState<
    Array<{ passIndex: number; code: string; redeemedAt: number | null }>
  >([]);
  const [proModalView, setProModalView] = useState<"perks" | "checkout">("perks");
  const [selectedPayMethod, setSelectedPayMethod] = useState<
    "pagomovil" | "binance" | "international"
  >("pagomovil");
  const [copiedPayField, setCopiedPayField] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [editingPaymentConfig, setEditingPaymentConfig] =
    useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [tasaInput, setTasaInput] = useState<string>(
    String(DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs || 55),
  );
  const [paymentSavedFeedback, setPaymentSavedFeedback] = useState<string>("");

  // Notificación de Pago y Auto-Aprobación en Vivo
  const [payProofName, setPayProofName] = useState<string>("");
  const [payProofRef, setPayProofRef] = useState<string>("");
  const [payProofDiscordContact, setPayProofDiscordContact] = useState<string>("");
  const [payProofSubmitting, setPayProofSubmitting] = useState<boolean>(false);
  const [payProofFeedback, setPayProofFeedback] = useState<string>("");
  const [activePaymentTracker, setActivePaymentTracker] = useState<{
    paymentId: string;
    customerName: string;
    reference: string;
    plan: PartyPassPlan | "lifetime";
    amountFormatted: string;
    method: "Pago Móvil" | "Binance Pay";
  } | null>(null);

  // CEO Pagos Pendientes State
  const [ceoPendingPayments, setCeoPendingPayments] = useState<PendingPayment[]>([]);
  const [ceoLoadingPayments, setCeoLoadingPayments] = useState<boolean>(false);
  const [ceoReviewingId, setCeoReviewingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PartyPassPlan>("weekend");
  const [proCodeInput, setProCodeInput] = useState<string>("");
  const [proCodeFeedback, setProCodeFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [failedCodeAttempts, setFailedCodeAttempts] = useState<number>(0);
  const [codeLockoutUntil, setCodeLockoutUntil] = useState<number>(0);
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);
  const [proExpiresAt, setProExpiresAt] = useState<number | null>(null);

  // CEO Coupon Monitor & Discord Webhook State
  const [couponNames, setCouponNames] = useState<Record<number, string>>({ 1: "Ivana" });
  const [serverCouponsMap, setServerCouponsMap] = useState<
    Record<string, { activatedAt: number; couponNumber: number }>
  >({
    "2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78": {
      activatedAt: 1794103200000, // Ivana: Sábado 07-Nov 10:00 PM (-04:00)
      couponNumber: 1,
    },
  });
  const [discordWebhookInput, setDiscordWebhookInput] = useState<string>("");
  const [discordConnected, setDiscordConnected] = useState<boolean>(false);
  const [discordFeedback, setDiscordFeedback] = useState<string>("");
  const [editingCouponIdx, setEditingCouponIdx] = useState<number | null>(null);
  const [editingNameInput, setEditingNameInput] = useState<string>("");
  const [ceoDecryptedCodes, setCeoDecryptedCodes] = useState<string[]>([]);
  const [copiedCouponIdx, setCopiedCouponIdx] = useState<number | null>(null);

  // Share / QR Modal State
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("https://imposter.manu-07games.workers.dev");
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Mobile Native (Bloque B) State: Wake Lock & PWA Install
  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(true);
  const [isWakeLockActiveState, setIsWakeLockActiveState] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Local Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    roundsPlayed: 0,
    roundsCompleted: 0,
    paywallViews: 0,
    categoryCounts: {},
  });

  const hasPro = (isProUnlocked || isCeoAdmin) && !ceoSimulateFree;

  // Adult Mode State (+18)
  const [isAdultUnlocked, setIsAdultUnlocked] = useState<boolean>(false);
  const [adultPin, setAdultPin] = useState<string>("1234");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"unlock" | "change">("unlock");
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showPinHint, setShowPinHint] = useState(false);
  const [pinFailedAttempts, setPinFailedAttempts] = useState<number>(0);
  const [pinLockoutUntil, setPinLockoutUntil] = useState<number>(0);

  // Global Telemetry State (Radar CEO)
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [loadingGlobalMetrics, setLoadingGlobalMetrics] = useState<boolean>(false);

  const [custom, setCustom] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState("Aleatoria");
  const [newCat, setNewCat] = useState("");
  const [newWords, setNewWords] = useState("");

  // Round State
  const [word, setWord] = useState("");
  const [playedCategory, setPlayedCategory] = useState("");
  const [impostors, setImpostors] = useState<number[]>([]);
  const [jesterIndex, setJesterIndex] = useState<number | null>(null);
  const [turn, setTurn] = useState(0);
  const [starter, setStarter] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [usedWords, setUsedWords] = useState<Record<string, string[]>>({});
  const [activeEvent, setActiveEvent] = useState<RoundEvent | null>(null);

  // Reveal screen state
  const [isHolding, setIsHolding] = useState(false);
  const [hasSeenRole, setHasSeenRole] = useState(false);

  // Voting & Resolution
  const [accusedIndex, setAccusedIndex] = useState<number | null>(null);
  const [caughtImpostors, setCaughtImpostors] = useState<number[]>([]);
  const [roundWinner, setRoundWinner] = useState<"innocents" | "impostors" | "jester" | null>(null);
  const [winReason, setWinReason] = useState<string>("");
  const [showImpostorGuessModal, setShowImpostorGuessModal] = useState(false);

  // Hydrate persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const savedNames = localStorage.getItem("impostor-names");
      if (savedNames) setNames(JSON.parse(savedNames));

      const savedCount = localStorage.getItem("impostor-count");
      if (savedCount) setImpostorCount(Number(savedCount) || 1);

      const savedMinutes = localStorage.getItem("impostor-minutes");
      if (savedMinutes) setMinutes(Number(savedMinutes) || 3);

      const savedSound = localStorage.getItem("impostor-sound");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");

      const savedVibration = localStorage.getItem("impostor-vibration");
      if (savedVibration !== null) setVibrationEnabled(savedVibration === "true");

      const savedWakeLock = localStorage.getItem("impostor-wake-lock");
      if (savedWakeLock !== null) setWakeLockEnabled(savedWakeLock === "true");

      const savedAccomplice = localStorage.getItem("impostor-accomplice");
      if (savedAccomplice !== null) setAccompliceMode(savedAccomplice === "true");

      const savedEvents = localStorage.getItem("impostor-events");
      if (savedEvents !== null) setRandomEventsEnabled(savedEvents === "true");

      const savedJester = localStorage.getItem("impostor-jester");
      if (savedJester !== null) setJesterEnabled(savedJester === "true");

      const savedScores = localStorage.getItem("impostor-scores");
      if (savedScores) setScores(JSON.parse(savedScores));

      if (localStorage.getItem("impostor-adult-unlocked") === "true") {
        setIsAdultUnlocked(true);
      }

      const savedPin = localStorage.getItem("impostor-adult-pin");
      if (savedPin && /^\d{4}$/.test(savedPin)) {
        setAdultPin(savedPin);
      }

      const savedCats = localStorage.getItem("impostor-cats");
      if (savedCats) {
        const sanitizedCats = sanitizeImportedCategories(JSON.parse(savedCats), [
          "Aleatoria",
          ADULT_CATEGORY,
          ...Object.keys(DEFAULT_CATEGORIES),
        ]);
        if (sanitizedCats) setCustom(sanitizedCats);
      }

      // Purgar banderas antiguas en texto plano si existen
      localStorage.removeItem("impostor-pro-unlocked");
      localStorage.removeItem("impostor-ceo-admin");

      // Verificación criptográfica anti-manipulación (Doble Hash SHA-256 + Expiración 48h firmada)
      const storedProToken = localStorage.getItem(STORAGE_KEYS.PRO_TOKEN);
      const storedProExpires = localStorage.getItem(STORAGE_KEYS.PRO_EXPIRES);
      if (isValidStoredToken(storedProToken, "pro", storedProExpires)) {
        setIsProUnlocked(true);
        const parsedExp = parseSignedExpiry(storedProToken, storedProExpires);
        if (parsedExp) setProExpiresAt(parsedExp);
      } else if (storedProToken || storedProExpires) {
        localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      }

      const storedCeoToken = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
      if (isValidStoredToken(storedCeoToken, "ceo")) {
        setIsCeoAdmin(true);
        setIsProUnlocked(true);
        const codes = getDecryptedVipCodes(storedCeoToken);
        if (codes.length > 0) setCeoDecryptedCodes(codes);
      } else if (storedCeoToken) {
        localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
      }

      const storedFounder = localStorage.getItem(STORAGE_KEYS.FOUNDER_NUMBER);
      if (storedFounder && Number.isFinite(Number(storedFounder))) {
        setFounderNumber(Number(storedFounder));
      }

      const savedAnalytics = localStorage.getItem("impostor-analytics");
      if (savedAnalytics) {
        setAnalytics(JSON.parse(savedAnalytics));
      }

      const savedUsedCoupons = localStorage.getItem(STORAGE_KEYS.USED_COUPONS);
      if (savedUsedCoupons) {
        const parsedCoupons = JSON.parse(savedUsedCoupons);
        if (Array.isArray(parsedCoupons)) {
          setUsedCoupons(parsedCoupons.filter((c): c is string => typeof c === "string"));
        }
      }

      const savedWebhook = localStorage.getItem(STORAGE_KEYS.DISCORD_WEBHOOK);
      if (savedWebhook) {
        setDiscordWebhookInput(savedWebhook);
        setDiscordConnected(true);
      }

      const savedTesterNames = localStorage.getItem(STORAGE_KEYS.COUPON_NAMES);
      if (savedTesterNames) {
        try {
          setCouponNames({ 1: "Ivana", ...JSON.parse(savedTesterNames) });
        } catch {
          /* ignore */
        }
      }

      const savedRegistry = localStorage.getItem("impostor-coupon-registry");
      if (savedRegistry) {
        try {
          const parsed = JSON.parse(savedRegistry) as Record<
            string,
            { activatedAt: number; couponNumber: number }
          >;
          // Garantizar que el cupón de Ivana conserve su fecha histórica real de activación (07-Nov 10:00 PM)
          if (parsed["2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"]) {
            parsed["2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"].activatedAt =
              1794103200000;
          }
          setServerCouponsMap((prev) => ({ ...prev, ...parsed }));
        } catch {
          /* ignore */
        }
      }

      // Sincronizar en segundo plano con el servidor de Cloudflare
      getCouponServerStatusServerFn({ data: { defaultWebhook: savedWebhook || "" } })
        .then((res) => {
          if (res?.usedCoupons?.length) {
            setServerCouponsMap((prev) => {
              const updated = { ...prev };
              res.usedCoupons.forEach((c) => {
                updated[c.hash] = { activatedAt: c.activatedAt, couponNumber: c.couponNumber };
              });
              // Conservar siempre el timestamp real de Ivana
              if (updated["2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"]) {
                updated[
                  "2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"
                ].activatedAt = 1794103200000;
              }
              try {
                localStorage.setItem("impostor-coupon-registry", JSON.stringify(updated));
              } catch {
                /* ignore */
              }
              return updated;
            });
          }
        })
        .catch(() => {
          /* offline fallback */
        });

      // Cargar e hidratar Métodos de Pago
      const savedPayConfig = localStorage.getItem("impostor-payment-config");
      let initialPayConfig = DEFAULT_PAYMENT_CONFIG;
      if (savedPayConfig) {
        try {
          initialPayConfig = sanitizePaymentConfig(JSON.parse(savedPayConfig));
          setPaymentConfig(initialPayConfig);
          setEditingPaymentConfig(initialPayConfig);
          setTasaInput(String(initialPayConfig.pagoMovil.tasaBs || 55));
        } catch {
          /* ignore */
        }
      }

      getPaymentConfigServerFn({ data: { defaultFallback: initialPayConfig } })
        .then((res) => {
          if (res?.config) {
            setPaymentConfig(res.config);
            setEditingPaymentConfig(res.config);
            setTasaInput(String(res.config.pagoMovil.tasaBs || 55));
            try {
              localStorage.setItem("impostor-payment-config", JSON.stringify(res.config));
            } catch {
              /* ignore */
            }
          }
        })
        .catch(() => {
          /* offline fallback */
        });

      // Hidratar rastreador de pago en proceso
      try {
        const savedTracker = localStorage.getItem("impostor-active-payment-tracker");
        if (savedTracker) {
          setActivePaymentTracker(JSON.parse(savedTracker));
        }
      } catch {
        /* ignore */
      }

      if (typeof window !== "undefined") {
        setShareUrl(window.location.origin);

        // Pre-cargar código VIP si viene en la URL (?code=... o ?vip=... o en hash)
        let codeParam: string | null = null;
        try {
          const urlParams = new URLSearchParams(window.location.search);
          codeParam = urlParams.get("code") || urlParams.get("vip");
          if (!codeParam && window.location.hash.includes("code=")) {
            const hashMatch = window.location.hash.match(/[#&]code=([^&]+)/i);
            if (hashMatch?.[1]) codeParam = decodeURIComponent(hashMatch[1]);
          }
        } catch {
          /* ignore */
        }
        if (codeParam) {
          const cleanCode = codeParam.toUpperCase().trim();
          setProCodeInput(cleanCode);
          setShowSettingsModal(false);
          setShowProModal(true);
          setProCodeFeedback({
            type: "success",
            text: `🎟️ ¡Invitación VIP detectada (${cleanCode})! Pulsa "Activar" abajo para comenzar tus 48h gratis.`,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Activación de respuesta táctil instantánea (:active en iOS) y pre-calentamiento de AudioContext
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Activar estado :active en Safari iOS (sin retraso táctil)
    const emptyTouchHandler = () => {};
    window.addEventListener("touchstart", emptyTouchHandler, { passive: true });

    // 2. Despertar AudioContext en el primer toque para evitar suspensiones de autoplay
    const unlockOnFirstTouch = () => {
      unlockAudio();
      window.removeEventListener("touchstart", unlockOnFirstTouch);
      window.removeEventListener("pointerdown", unlockOnFirstTouch);
      window.removeEventListener("click", unlockOnFirstTouch);
    };
    window.addEventListener("touchstart", unlockOnFirstTouch, { passive: true, once: true });
    window.addEventListener("pointerdown", unlockOnFirstTouch, { passive: true, once: true });
    window.addEventListener("click", unlockOnFirstTouch, { passive: true, once: true });

    return () => {
      window.removeEventListener("touchstart", emptyTouchHandler);
      window.removeEventListener("touchstart", unlockOnFirstTouch);
      window.removeEventListener("pointerdown", unlockOnFirstTouch);
      window.removeEventListener("click", unlockOnFirstTouch);
    };
  }, []);

  // Suscripción al ciclo de vida PWA (Instalación nativa en Android e iOS)
  useEffect(() => {
    const cleanup = initPwaInstallPrompt();
    const updatePwaState = () => {
      setIsStandalone(isStandaloneMode());
      setCanInstallPwa(hasDeferredInstallPrompt());
    };
    const unsub = subscribeToPwaState(updatePwaState);
    updatePwaState();
    setIsIos(isIosDevice());
    return () => {
      cleanup();
      unsub();
    };
  }, []);

  // Control nativo de Wake Lock: mantiene la pantalla encendida durante rondas activas
  useEffect(() => {
    if (phase !== "setup" && wakeLockEnabled) {
      void acquireScreenWakeLock().then((active) => {
        setIsWakeLockActiveState(active);
      });
    } else {
      void releaseScreenWakeLock();
      setIsWakeLockActiveState(false);
    }
    return () => {
      void releaseScreenWakeLock();
    };
  }, [phase, wakeLockEnabled]);

  const trackAnalytics = (updater: (prev: AnalyticsState) => AnalyticsState) => {
    // 🛡️ Filtro de Tráfico Interno: Si el usuario es el CEO, no alterar analíticas
    if (isCeoAdmin) return;
    setAnalytics((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("impostor-analytics", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const openPaywall = () => {
    playPop(soundEnabled);
    setProCodeFeedback(null);
    setProModalView("perks");
    if (!isCeoAdmin) {
      trackAnalytics((prev) => ({
        ...prev,
        paywallViews: prev.paywallViews + 1,
      }));
      void trackGameEvent({ type: "paywall_view", planId: selectedPlan });
    }
    setShowProModal(true);
  };

  const handleShareCoupon = async (
    couponCode: string,
    couponNumber: number,
    testerLabel: string,
  ) => {
    playPop(soundEnabled);
    const baseUrl =
      shareUrl ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://imposter.manu-07games.workers.dev");
    const inviteUrl = `${baseUrl}/?code=${couponCode}`;
    const shareText = `¡Hola ${testerLabel}! 🕵️ Te invito a jugar Imposter con un Party Pass PRO VIP de 48 horas gratis 🎟️✨.\n\nToca aquí para activar tu pase de cortesía:\n${inviteUrl}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Imposter — Party Pass PRO VIP (48h)",
          text: shareText,
          url: inviteUrl,
        });
        return;
      } catch {
        /* fallback al compartir de WhatsApp */
      }
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyCouponLink = async (
    couponCode: string,
    couponNumber: number,
    testerLabel: string,
  ) => {
    playPop(soundEnabled);
    const baseUrl =
      shareUrl ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://imposter.manu-07games.workers.dev");
    const inviteUrl = `${baseUrl}/?code=${couponCode}`;
    const shareText = `¡Hola ${testerLabel}! 🕵️ Te invito a jugar Imposter con un Party Pass PRO VIP de 48 horas gratis 🎟️✨.\n\nToca aquí para activar tu pase:\n${inviteUrl}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = shareText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedCouponIdx(couponNumber);
      setTimeout(() => {
        setCopiedCouponIdx((prev) => (prev === couponNumber ? null : prev));
      }, 2500);
    } catch {
      /* ignore */
    }
  };

  const handleSavePaymentConfig = async () => {
    playPop(soundEnabled);
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) : null;
    if (!token) return;

    const parsedTasa = parseFloat(tasaInput);
    const validTasa = !isNaN(parsedTasa) && parsedTasa > 0 ? parsedTasa : 55;
    const configToSave: PaymentConfig = {
      ...editingPaymentConfig,
      pagoMovil: {
        ...editingPaymentConfig.pagoMovil,
        tasaBs: validTasa,
      },
    };
    setEditingPaymentConfig(configToSave);
    setTasaInput(String(validTasa));

    try {
      const res = await savePaymentConfigServerFn({
        data: {
          ceoToken: token,
          config: configToSave,
        },
      });

      if (res.success && res.config) {
        setPaymentConfig(res.config);
        localStorage.setItem("impostor-payment-config", JSON.stringify(res.config));
        setPaymentSavedFeedback("✓ Métodos de pago guardados exitosamente");
        setTimeout(() => setPaymentSavedFeedback(""), 3500);
      } else {
        setPaymentSavedFeedback("⚠️ Error al guardar en el servidor");
      }
    } catch {
      // Fallback local
      setPaymentConfig(configToSave);
      localStorage.setItem("impostor-payment-config", JSON.stringify(configToSave));
      setPaymentSavedFeedback("✓ Guardado localmente en este dispositivo");
      setTimeout(() => setPaymentSavedFeedback(""), 3500);
    }
  };

  const handleCopyPayField = async (text: string, fieldName: string) => {
    playPop(soundEnabled);
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedPayField(fieldName);
      setTimeout(() => {
        setCopiedPayField((prev) => (prev === fieldName ? null : prev));
      }, 2500);
    } catch {
      /* ignore */
    }
  };

  const handleSubmitPaymentProof = async (method: "Pago Móvil" | "Binance Pay") => {
    playPop(soundEnabled);
    if (!payProofName.trim()) {
      setPayProofFeedback("⚠️ Por favor ingresa tu nombre o apodo.");
      return;
    }
    if (!payProofRef.trim()) {
      setPayProofFeedback("⚠️ Por favor ingresa el número o referencia del pago.");
      return;
    }

    setPayProofSubmitting(true);
    setPayProofFeedback("");

    const planMeta = PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend;
    const priceUsd = planMeta.priceUsd;
    const calculatedBs = Math.round(priceUsd * (paymentConfig.pagoMovil.tasaBs || 55));
    const amountStr =
      method === "Pago Móvil"
        ? `Bs. ${calculatedBs.toLocaleString("es-VE")}`
        : `${priceUsd.toFixed(2)} USDT`;

    try {
      const res = await submitPaymentProofServerFn({
        data: {
          customerName: payProofName.trim(),
          reference: payProofRef.trim(),
          method,
          plan: selectedPlan,
          amountFormatted: amountStr,
          ...(selectedPlan === "founder" && payProofDiscordContact.trim()
            ? { discordContact: payProofDiscordContact.trim() }
            : {}),
        },
      });

      if (res?.success && res.paymentId) {
        const tracker = {
          paymentId: res.paymentId,
          customerName: payProofName.trim(),
          reference: payProofRef.trim(),
          plan: selectedPlan,
          amountFormatted: amountStr,
          method,
        };
        setActivePaymentTracker(tracker);
        try {
          localStorage.setItem("impostor-active-payment-tracker", JSON.stringify(tracker));
        } catch {
          /* ignore */
        }
      } else {
        setPayProofFeedback("⚠️ Error al registrar el pago en el servidor.");
      }
    } catch {
      setPayProofFeedback("⚠️ Error de conexión. Intenta de nuevo.");
    } finally {
      setPayProofSubmitting(false);
    }
  };

  const refreshCeoPayments = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) : null;
    if (!token) return;
    setCeoLoadingPayments(true);
    try {
      const res = await getPendingPaymentsServerFn({ data: { ceoToken: token } });
      if (res?.success && res.payments) {
        setCeoPendingPayments(res.payments);
      }
    } catch {
      /* ignore */
    } finally {
      setCeoLoadingPayments(false);
    }
  };

  const handleReviewPayment = async (paymentId: string, action: "approve" | "reject") => {
    playPop(soundEnabled);
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) : null;
    if (!token) return;
    setCeoReviewingId(paymentId);
    try {
      const res = await reviewPaymentServerFn({
        data: {
          ceoToken: token,
          paymentId,
          action,
        },
      });
      if (res?.success && res.payments) {
        setCeoPendingPayments(res.payments);
      }
    } catch {
      /* ignore */
    } finally {
      setCeoReviewingId(null);
    }
  };

  // Polling de aprobación en vivo para el cliente (cada 3.5s)
  useEffect(() => {
    if (!activePaymentTracker) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await checkPaymentStatusServerFn({
          data: { paymentId: activePaymentTracker.paymentId },
        });
        if (!isMounted) return;

        if (res?.status === "approved" && res.token) {
          playFanfare(true, soundEnabled);
          setIsProUnlocked(true);
          try {
            localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, res.token);
            if (res.signedExpiry && res.expiresAt) {
              setProExpiresAt(res.expiresAt);
              localStorage.setItem(STORAGE_KEYS.PRO_EXPIRES, res.signedExpiry);
            } else {
              setProExpiresAt(null);
              localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
            }
            localStorage.removeItem("impostor-active-payment-tracker");
          } catch {
            /* ignore */
          }
          setActivePaymentTracker(null);
          setShowProModal(false);
        } else if (res?.status === "rejected") {
          setPayProofFeedback(
            "⚠️ Tu referencia no pudo ser confirmada. Por favor verifica tus datos.",
          );
          try {
            localStorage.removeItem("impostor-active-payment-tracker");
          } catch {
            /* ignore */
          }
          setActivePaymentTracker(null);
        }
      } catch {
        /* ignore network hiccups */
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activePaymentTracker, soundEnabled]);

  // Sincronizar pases de embajador del Fundador
  useEffect(() => {
    if (!founderNumber) return;
    getFounderGuestPassesServerFn({ data: { founderNumber } })
      .then((res) => {
        if (res.success && res.guestPasses) {
          setFounderGuestPasses(res.guestPasses);
        }
      })
      .catch(() => {});
  }, [founderNumber, showFounderPassesModal]);

  const handleRedeemCode = async () => {
    playPop(soundEnabled);
    const now = Date.now();
    if (now < codeLockoutUntil) {
      const remainingSec = Math.ceil((codeLockoutUntil - now) / 1000);
      playBeep(0.3, 200, soundEnabled);
      setProCodeFeedback({
        type: "error",
        text: `Demasiados intentos. Espera ${remainingSec}s por seguridad.`,
      });
      return;
    }

    const { role, token, couponIdHash, meta } = verifyAccessCode(proCodeInput, usedCoupons);
    if (role === "already_used") {
      playBeep(0.3, 200, soundEnabled);
      setProCodeFeedback({
        type: "error",
        text: "Este cupón o pase ya fue utilizado y es de un solo uso.",
      });
      return;
    }

    if (role === "ceo" && token) {
      playFanfare(true, soundEnabled);
      setIsCeoAdmin(true);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(null);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      const codes = getDecryptedVipCodes(token);
      if (codes.length > 0) setCeoDecryptedCodes(codes);
      setProCodeFeedback({
        type: "success",
        text: "¡Bienvenido CEO! Redirigiendo a tu Centro de Mandos...",
      });
      setProCodeInput("");
      setTimeout(() => {
        window.location.href = "/ceo";
      }, 1000);
    } else if (role === "founder" && token && meta?.founderNumber) {
      playFanfare(true, soundEnabled);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(null);
      setFounderNumber(meta.founderNumber);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.FOUNDER_NUMBER, String(meta.founderNumber));
      localStorage.setItem(STORAGE_KEYS.FOUNDER_CODE, proCodeInput.trim().toUpperCase());
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);

      consumeFounderServerFn({ data: { code: proCodeInput.trim().toUpperCase() } }).catch(() => {});

      setProCodeFeedback({
        type: "success",
        text: `¡Bienvenido Miembro Fundador #${meta.founderNumber}! Tienes acceso vitalicio y tus 5 Pases de Invitación activos.`,
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
        setShowFounderPassesModal(true);
      }, 1500);
    } else if (role === "guest_pass" && token && meta?.founderNumber) {
      playFanfare(true, soundEnabled);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      const guestNow = Date.now();
      const expiresAt = guestNow + 24 * 3600 * 1000;
      const signedExpiry = createSignedExpiry(token, expiresAt);
      setProExpiresAt(expiresAt);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.PRO_EXPIRES, signedExpiry);

      consumeGuestPassServerFn({ data: { passCode: proCodeInput.trim().toUpperCase() } }).catch(
        () => {},
      );

      setProCodeFeedback({
        type: "success",
        text: "¡Pase de Invitado activado! Tienes 24 Horas de Fiesta PRO desbloqueadas.",
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
      }, 1500);
    } else if (role === "vip_unlimited" && token) {
      // VIP-FIESTA-99: Uso libre ilimitado según decida el CEO
      playFanfare(true, soundEnabled);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(null);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      setProCodeFeedback({
        type: "success",
        text: "¡Party Pass PRO permanente desbloqueado con éxito!",
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
      }, 1500);
    } else if (role === "vip_single" && token && couponIdHash) {
      // Cupones VIP-01 a VIP-10: Uso único estricto + 48 horas de duración
      const couponIdx = VIP_COUPON_HASHES_ORDERED.indexOf(couponIdHash) + 1;
      const assignedName =
        couponNames[couponIdx] || (couponIdx === 1 ? "Ivana" : `Tester #${couponIdx}`);
      try {
        const serverCheck = await consumeSingleUseCouponServerFn({
          data: {
            couponIdHash,
            action: "consume",
            testerName: assignedName,
            ...(discordWebhookInput ? { discordWebhookUrl: discordWebhookInput } : {}),
          },
        });
        if (!serverCheck.allowed) {
          const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
          setUsedCoupons(nextUsed);
          localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
          playBeep(0.3, 200, soundEnabled);
          setProCodeFeedback({
            type: "error",
            text: "⚠️ Este cupón ya fue canjeado por otro jugador (1 solo uso).",
          });
          return;
        }
      } catch {
        // Fallback offline: el control local en localStorage sigue protegiendo el uso único
      }

      const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
      setUsedCoupons(nextUsed);
      localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));

      const now = Date.now();
      const expiresAt = now + TESTER_COUPON_DURATION_MS;
      const signedExpiry = createSignedExpiry(token, expiresAt);

      setServerCouponsMap((prev) => {
        const updated = {
          ...prev,
          [couponIdHash]: { activatedAt: now, couponNumber: couponIdx },
        };
        try {
          localStorage.setItem("impostor-coupon-registry", JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        return updated;
      });

      playFanfare(true, soundEnabled);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(expiresAt);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.PRO_EXPIRES, signedExpiry);
      setProCodeFeedback({
        type: "success",
        text: "¡Cupón de Tester activado! Tienes Party Pass PRO por 48 horas (1/1 uso).",
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
      }, 1500);
    } else {
      playBeep(0.3, 200, soundEnabled);
      const nextAttempts = failedCodeAttempts + 1;
      setFailedCodeAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setCodeLockoutUntil(Date.now() + 30000);
        setFailedCodeAttempts(0);
        setProCodeFeedback({
          type: "error",
          text: "Bloqueado temporalmente por seguridad (30 segundos).",
        });
      } else {
        setProCodeFeedback({
          type: "error",
          text: "Código no válido. Verifica tu clave de acceso.",
        });
      }
    }
  };

  const handleShareGame = async () => {
    playPop(soundEnabled);
    const url = typeof window !== "undefined" ? window.location.origin : shareUrl;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Imposter — Juego de Fiesta",
          text: "¡Únete a nuestra partida de Imposter! Pasa el teléfono o juega desde el tuyo:",
          url,
        });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const resetAnalytics = async () => {
    playPop(soundEnabled);
    const empty: AnalyticsState = {
      roundsPlayed: 0,
      roundsCompleted: 0,
      paywallViews: 0,
      categoryCounts: {},
    };
    setAnalytics(empty);
    localStorage.setItem("impostor-analytics", JSON.stringify(empty));

    // Reiniciar también el radar global del servidor y el bot de Atlas
    try {
      const fresh = await getGlobalMetricsServerFn({ data: { reset: true } });
      setGlobalMetrics(fresh);
    } catch {
      /* ignore */
    }

    try {
      fetch("https://atlas-bot-2xh4.onrender.com/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
        mode: "cors",
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const handleSaveAndTestDiscord = async () => {
    const url = discordWebhookInput.trim();
    if (!url) {
      setDiscordFeedback("Ingresa la URL del Webhook de Discord.");
      return;
    }
    setDiscordFeedback("Probando conexión con Discord...");
    playPop(soundEnabled);
    try {
      const res = await testDiscordWebhookServerFn({ data: { webhookUrl: url } });
      if (res.success) {
        setDiscordConnected(true);
        localStorage.setItem(STORAGE_KEYS.DISCORD_WEBHOOK, url);
        setDiscordFeedback("¡Conectado! Revisa tu canal de Discord (mensaje de prueba enviado).");
      } else {
        setDiscordFeedback(res.error || "Error al conectar con Discord.");
      }
    } catch {
      setDiscordFeedback("Error de red al conectar con Discord.");
    }
    setTimeout(() => setDiscordFeedback(""), 6000);
  };

  const handleSaveTesterName = (idx: number, name: string) => {
    const trimmed = name.trim();
    const updated = { ...couponNames, [idx]: trimmed || (idx === 1 ? "Ivana" : `Tester #${idx}`) };
    setCouponNames(updated);
    localStorage.setItem(STORAGE_KEYS.COUPON_NAMES, JSON.stringify(updated));
    setEditingCouponIdx(null);
  };

  const handleResetSingleCoupon = async (hash: string) => {
    playPop(soundEnabled);
    const nextUsed = usedCoupons.filter((h) => h !== hash);
    setUsedCoupons(nextUsed);
    localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));

    setServerCouponsMap((prev) => {
      const copy = { ...prev };
      delete copy[hash];
      try {
        localStorage.setItem("impostor-coupon-registry", JSON.stringify(copy));
      } catch {
        /* ignore */
      }
      return copy;
    });

    try {
      await consumeSingleUseCouponServerFn({
        data: { couponIdHash: hash, action: "reset" },
      });
    } catch {
      /* ignore */
    }
  };

  const refreshCouponStatus = async () => {
    playPop(soundEnabled);
    try {
      const res = await getCouponServerStatusServerFn({
        data: { defaultWebhook: discordWebhookInput || "" },
      });
      if (res?.usedCoupons) {
        setServerCouponsMap((prev) => {
          const updated = { ...prev };
          res.usedCoupons.forEach((c) => {
            updated[c.hash] = { activatedAt: c.activatedAt, couponNumber: c.couponNumber };
          });
          try {
            localStorage.setItem("impostor-coupon-registry", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
          return updated;
        });
      }
    } catch {
      /* ignore */
    }
  };

  const saveCustom = (c: Record<string, string[]>) => {
    setCustom(c);
    localStorage.setItem("impostor-cats", JSON.stringify(c));
  };

  // Persist setup changes
  const updateNames = (newNames: string[]) => {
    setNames(newNames);
    localStorage.setItem("impostor-names", JSON.stringify(newNames));
    const newMax = Math.max(1, newNames.length - 2);
    if (impostorCount > newMax) {
      updateImpostorCount(newMax);
    }
  };

  const shufflePlayers = () => {
    playPop(soundEnabled);
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    updateNames(shuffled);
  };

  const updateImpostorCount = (val: number) => {
    setImpostorCount(val);
    localStorage.setItem("impostor-count", String(val));
  };

  const updateMinutes = (val: number) => {
    setMinutes(val);
    localStorage.setItem("impostor-minutes", String(val));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("impostor-sound", String(next));
    if (next) {
      unlockAudio();
      playPop(true);
    }
  };

  const toggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    localStorage.setItem("impostor-vibration", String(next));
    if (next && navigator.vibrate) navigator.vibrate(50);
  };

  const toggleAccompliceMode = () => {
    const next = !accompliceMode;
    setAccompliceMode(next);
    localStorage.setItem("impostor-accomplice", String(next));
  };

  const toggleRandomEvents = () => {
    const next = !randomEventsEnabled;
    setRandomEventsEnabled(next);
    localStorage.setItem("impostor-events", String(next));
  };

  const toggleJester = () => {
    const next = !jesterEnabled;
    setJesterEnabled(next);
    localStorage.setItem("impostor-jester", String(next));
  };

  const deactivateProAndCeo = () => {
    playPop(soundEnabled);
    setIsCeoAdmin(false);
    setIsProUnlocked(false);
    setCeoSimulateFree(false);
    setProExpiresAt(null);
    setCeoDecryptedCodes([]);
    localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
    localStorage.removeItem("impostor-pro-unlocked");
    localStorage.removeItem("impostor-ceo-admin");
    if (PRO_CATEGORIES.includes(category) || category === ADULT_CATEGORY || category in custom) {
      setCategory("Aleatoria");
    }
    if (names.length > FREE_MAX_PLAYERS) {
      updateNames(names.slice(0, FREE_MAX_PLAYERS));
    }
    setRandomEventsEnabled(false);
    setJesterEnabled(false);
    localStorage.setItem("impostor-events", "false");
    localStorage.setItem("impostor-jester", "false");
  };

  const resetFactoryDefaults = () => {
    const defaultPlayers = ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4"];
    setNames(defaultPlayers);
    setImpostorCount(1);
    setMinutes(3);
    setSoundEnabled(true);
    setVibrationEnabled(true);
    setAccompliceMode(true);
    setRandomEventsEnabled(false);
    setJesterEnabled(false);
    setIsAdultUnlocked(false);
    setIsCeoAdmin(false);
    setIsProUnlocked(false);
    setCeoSimulateFree(false);
    setProExpiresAt(null);
    setWakeLockEnabled(true);
    setCategory("Aleatoria");
    setScores({ innocents: 0, impostors: 0 });
    localStorage.removeItem("impostor-names");
    localStorage.removeItem("impostor-count");
    localStorage.removeItem("impostor-minutes");
    localStorage.removeItem("impostor-sound");
    localStorage.removeItem("impostor-vibration");
    localStorage.removeItem("impostor-wake-lock");
    localStorage.removeItem("impostor-accomplice");
    localStorage.removeItem("impostor-events");
    localStorage.removeItem("impostor-jester");
    localStorage.removeItem("impostor-adult-unlocked");
    localStorage.removeItem("impostor-scores");
    localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
    localStorage.removeItem("impostor-pro-unlocked");
    localStorage.removeItem("impostor-ceo-admin");
    playPop(true);
  };

  const toggleWakeLock = () => {
    playPop(soundEnabled);
    const next = !wakeLockEnabled;
    setWakeLockEnabled(next);
    localStorage.setItem("impostor-wake-lock", String(next));
  };

  const handleInstallPwa = async () => {
    playPop(soundEnabled);
    if (isStandalone) {
      setShowInstallModal(true);
      return;
    }
    if (hasDeferredInstallPrompt()) {
      const outcome = await promptPwaInstall();
      if (outcome === "accepted") {
        setShowInstallModal(false);
        if (!isCeoAdmin) {
          void trackGameEvent({ type: "pwa_install" });
        }
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleExportCategories = async () => {
    try {
      const payload = JSON.stringify(custom);
      await navigator.clipboard.writeText(payload);
      setPackStatus("¡Copiado al portapapeles!");
      setTimeout(() => setPackStatus(""), 2500);
    } catch {
      setPackStatus("No se pudo copiar");
      setTimeout(() => setPackStatus(""), 2500);
    }
  };

  const handleImportCategories = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.length > 50000) {
        setPackStatus("El texto es demasiado grande");
        setTimeout(() => setPackStatus(""), 2500);
        return;
      }
      const parsed = JSON.parse(text);
      const sanitized = sanitizeImportedCategories(parsed, [
        "Aleatoria",
        ADULT_CATEGORY,
        ...Object.keys(DEFAULT_CATEGORIES),
      ]);
      if (sanitized) {
        const merged = { ...custom, ...sanitized };
        saveCustom(merged);
        setPackStatus("¡Categorías importadas y verificadas!");
      } else {
        setPackStatus("Formato o contenido no válido");
      }
    } catch {
      setPackStatus("Copia primero un pack válido");
    }
    setTimeout(() => setPackStatus(""), 2500);
  };

  const updateScore = (winner: "innocents" | "impostors") => {
    setScores((prev) => {
      const updated = {
        ...prev,
        [winner]: prev[winner] + 1,
      };
      localStorage.setItem("impostor-scores", JSON.stringify(updated));
      return updated;
    });
  };

  const resetScores = () => {
    const init = { innocents: 0, impostors: 0 };
    setScores(init);
    localStorage.setItem("impostor-scores", JSON.stringify(init));
  };

  // Assemble all active categories (including adult words only if unlocked)
  const allCats: Record<string, string[]> = {
    ...DEFAULT_CATEGORIES,
    ...(isAdultUnlocked ? { [ADULT_CATEGORY]: ADULT_WORDS } : {}),
    ...custom,
  };

  const maxImp = Math.max(1, names.length - 2);

  const getPlayerName = (idx: number): string => names[idx]?.trim() || `Jugador ${idx + 1}`;
  const getPlayerInitial = (idx: number): string => {
    const n = names[idx];
    return n ? n.trim().charAt(0).toUpperCase() || String(idx + 1) : String(idx + 1);
  };

  // Timer effect (Tensión sutil de escape room en los últimos 15 segundos)
  useEffect(() => {
    if (phase !== "discuss" || paused || timeLeft <= 0) return;
    const t = setTimeout(() => {
      const n = timeLeft - 1;
      if (n <= 15 && n > 0) {
        playDebateTension(n, soundEnabled, vibrationEnabled);
      } else if (n === 0) {
        playDramaticImpact(soundEnabled);
        if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([300, 150, 450]);
        }
      }
      setTimeLeft(n);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, paused, timeLeft, soundEnabled, vibrationEnabled]);

  const startRound = () => {
    unlockAudio();
    playPop(soundEnabled);
    const allKeys = Object.keys(allCats);
    const eligibleRandomKeys = hasPro
      ? allKeys
      : allKeys.filter(
          (k) => !PRO_CATEGORIES.includes(k) && k !== ADULT_CATEGORY && !(k in custom),
        );
    const randomPool = eligibleRandomKeys.length > 0 ? eligibleRandomKeys : allKeys;
    const chosenCat =
      category === "Aleatoria"
        ? randomPool[Math.floor(Math.random() * randomPool.length)]!
        : category;

    setPlayedCategory(chosenCat);

    // Track round start & category popularity
    trackAnalytics((prev) => ({
      ...prev,
      roundsPlayed: prev.roundsPlayed + 1,
      categoryCounts: {
        ...prev.categoryCounts,
        [chosenCat]: (prev.categoryCounts[chosenCat] ?? 0) + 1,
      },
    }));

    const fullList = allCats[chosenCat] ?? [];
    const alreadyPlayed = usedWords[chosenCat] ?? [];
    let availableWords = fullList.filter((w) => !alreadyPlayed.includes(w));

    // Reset history if exhausted
    if (availableWords.length === 0) {
      availableWords = fullList;
      setUsedWords((prev) => ({ ...prev, [chosenCat]: [] }));
    }

    const selectedWord =
      availableWords[Math.floor(Math.random() * availableWords.length)] ?? "Secreto";

    // Update used words
    setUsedWords((prev) => ({
      ...prev,
      [chosenCat]: [...(prev[chosenCat] ?? []), selectedWord],
    }));

    setWord(selectedWord);

    // Pick impostors & optional Jester
    const indices = [...names.keys()].sort(() => Math.random() - 0.5);
    const validCount = Math.min(impostorCount, maxImp);
    const chosenImpostors = indices.slice(0, validCount);
    const remainingPool = indices.slice(validCount);
    setImpostors(chosenImpostors);

    let assignedJester: number | null = null;
    if (jesterEnabled && names.length >= 4 && remainingPool.length >= 2) {
      assignedJester = remainingPool[0] ?? null;
    }
    setJesterIndex(assignedJester);

    const pureInnocents = assignedJester !== null ? remainingPool.slice(1) : remainingPool;

    // Starter is always an innocent so impostors in Expert Mode hear at least one clue
    const starterPool =
      pureInnocents.length > 0 ? pureInnocents : remainingPool.length > 0 ? remainingPool : indices;
    setStarter(starterPool[Math.floor(Math.random() * starterPool.length)] ?? 0);

    // Pick random lightning event if enabled
    if (randomEventsEnabled) {
      const chosenEvent = ROUND_EVENTS[Math.floor(Math.random() * ROUND_EVENTS.length)] ?? null;
      setActiveEvent(chosenEvent);
    } else {
      setActiveEvent(null);
    }

    // State reset for reveal
    setTurn(0);
    setIsHolding(false);
    setHasSeenRole(false);
    setAccusedIndex(null);
    setCaughtImpostors([]);
    setRoundWinner(null);
    setWinReason("");
    setShowImpostorGuessModal(false);

    // 🛰️ Telemetría en vivo (Avisa a Discord #metricas-imposter y al Radar CEO)
    // 🛡️ Filtro de Tráfico Interno: Omite las partidas de prueba del CEO
    if (!isCeoAdmin) {
      void trackGameEvent({
        type: "round_start",
        category: chosenCat,
        playerCount: names.length,
        impostorCount: chosenImpostors.length,
        isAdult: chosenCat === ADULT_CATEGORY,
        isJester: assignedJester !== null,
      });
    }

    setPhase("reveal");
  };

  const handleStartHold = () => {
    unlockAudio();
    setIsHolding(true);
    setHasSeenRole(true);
    startScanSound(soundEnabled);
    // Alerta íntima de suspenso si eres el Impostor
    if (impostors.includes(turn)) {
      playImpostorReveal(soundEnabled);
    }
  };

  const handleEndHold = () => {
    setIsHolding(false);
    stopScanSound();
  };

  const nextTurn = () => {
    playPop(soundEnabled);
    setIsHolding(false);
    stopScanSound();
    setHasSeenRole(false);

    if (turn + 1 >= names.length) {
      setTimeLeft(minutes * 60);
      setPaused(false);
      setPhase("discuss");
    } else {
      setTurn(turn + 1);
    }
  };

  const resolveRoundWithSuspense = (isVictory: boolean) => {
    setIsResolvingResult(true);
    playDramaticImpact(soundEnabled);
    setTimeout(() => {
      setPhase("result");
      setIsResolvingResult(false);
      playFanfare(isVictory, soundEnabled);
    }, 420);
  };

  const handleVoteConfirmation = (accused: number) => {
    playPop(soundEnabled);
    const isImp = impostors.includes(accused);
    setAccusedIndex(accused);

    if (jesterIndex !== null && accused === jesterIndex) {
      // Jester was voted out! Jester steals the win solo!
      setRoundWinner("jester");
      setWinReason(
        `¡Cayeron en su trampa! ${getPlayerName(accused)} era el Bufón y logró que el grupo lo votara.`,
      );
      trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
      if (!isCeoAdmin) {
        void trackGameEvent({
          type: "round_finish",
          winner: "jester",
          category: playedCategory || category,
        });
      }
      resolveRoundWithSuspense(true);
    } else if (isImp) {
      // Impostor was caught! Give chance to guess the secret word
      setShowImpostorGuessModal(true);
    } else {
      // Innocent was falsely accused, Impostors win!
      setRoundWinner("impostors");
      setWinReason(
        `¡${getPlayerName(accused)} era inocente! Los impostores lograron engañar al grupo.`,
      );
      updateScore("impostors");
      trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
      if (!isCeoAdmin) {
        void trackGameEvent({
          type: "round_finish",
          winner: "impostors",
          category: playedCategory || category,
        });
      }
      resolveRoundWithSuspense(false);
    }
  };

  const handleImpostorGuessResult = (guessedCorrectly: boolean) => {
    setShowImpostorGuessModal(false);
    if (guessedCorrectly) {
      setRoundWinner("impostors");
      setWinReason(
        "¡El impostor fue descubierto pero adivinó la palabra secreta y se roba la victoria!",
      );
      updateScore("impostors");
      trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
      if (!isCeoAdmin) {
        void trackGameEvent({
          type: "round_finish",
          winner: "impostors",
          category: playedCategory || category,
        });
      }
      resolveRoundWithSuspense(false);
    } else {
      const updatedCaught =
        accusedIndex !== null ? [...caughtImpostors, accusedIndex] : caughtImpostors;
      setCaughtImpostors(updatedCaught);

      if (updatedCaught.length >= impostors.length) {
        setRoundWinner("innocents");
        setWinReason(
          impostors.length > 1
            ? "¡Todos los impostores fueron descubiertos sin adivinar la palabra! Victoria de los inocentes."
            : "¡El impostor fue descubierto y falló al adivinar la palabra! Victoria de los inocentes.",
        );
        updateScore("innocents");
        trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
        if (!isCeoAdmin) {
          void trackGameEvent({
            type: "round_finish",
            winner: "innocents",
            category: playedCategory || category,
          });
        }
        resolveRoundWithSuspense(true);
      } else {
        // Still more impostors to catch! Stay in vote phase
        playPop(soundEnabled);
        setAccusedIndex(null);
      }
    }
  };

  const handleDirectReveal = () => {
    playPop(soundEnabled);
    setRoundWinner(null);
    setWinReason("Ronda finalizada sin votación previa.");
    setPhase("result");
  };

  // PIN Keypad Handlers con Blindaje Anti-Fuerza Bruta (Máx 5 intentos)
  const handlePinInput = (digit: string) => {
    playPop(soundEnabled);
    const now = Date.now();
    if (now < pinLockoutUntil) {
      playBeep(0.3, 200, soundEnabled);
      return;
    }

    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setPinError(false);

      if (next.length === 4) {
        if (pinModalMode === "change") {
          playFanfare(true, soundEnabled);
          setAdultPin(next);
          localStorage.setItem("impostor-adult-pin", next);
          setShowPinModal(false);
          setEnteredPin("");
          setShowPinHint(false);
          setPinFailedAttempts(0);
        } else if (next === adultPin) {
          playFanfare(true, soundEnabled);
          setIsAdultUnlocked(true);
          localStorage.setItem("impostor-adult-unlocked", "true");
          setCategory(ADULT_CATEGORY);
          setShowPinModal(false);
          setEnteredPin("");
          setShowPinHint(false);
          setPinFailedAttempts(0);
        } else {
          setPinError(true);
          playBeep(0.3, 200, soundEnabled);
          const nextAttempts = pinFailedAttempts + 1;
          setPinFailedAttempts(nextAttempts);
          if (nextAttempts >= 5) {
            setPinLockoutUntil(Date.now() + 60000); // 60s de bloqueo
          }
          setTimeout(() => {
            setEnteredPin("");
            setPinError(false);
          }, 600);
        }
      }
    }
  };

  const handlePinDelete = () => {
    playPop(soundEnabled);
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const abortRound = () => {
    playPop(soundEnabled);
    stopScanSound();
    setIsHolding(false);
    setShowImpostorGuessModal(false);
    setPhase("setup");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md sm:max-w-lg flex-col px-4 py-6 select-none">
      {/* Header Minimalista con Cápsula de Cristal Unificada */}
      <header className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-primary drop-shadow-[0_0_15px_rgba(234,179,8,0.35)]">
            IMPOSTER
          </h1>
          <p className="text-[11px] text-muted-foreground/80 font-medium">
            Juego de fiesta y deducción
          </p>
        </div>

        {/* Dock / Cápsula de Cristal Esmerilado Unificada */}
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl shadow-lg">
          {/* Abort / Back to Setup Button during active game */}
          {phase !== "setup" && (
            <>
              <button
                onClick={abortRound}
                title="Salir a configuración"
                aria-label="Salir a configuración"
                className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-destructive/25 hover:text-rose-200 active:scale-95 cursor-pointer"
              >
                <LogOut size={13} />
                <span className="hidden xs:inline">Salir</span>
              </button>
              <div className="mx-0.5 h-3.5 w-px bg-white/10" />
            </>
          )}

          {/* PRO / CEO Trigger Integrado en la Cápsula */}
          <button
            type="button"
            onClick={() => {
              playPop(soundEnabled);
              if (isCeoAdmin) {
                window.location.href = "/ceo";
              } else {
                openPaywall();
              }
            }}
            aria-label={isCeoAdmin ? "Abrir Centro de Mandos CEO (/ceo)" : "Party Pass PRO"}
            title={
              isCeoAdmin
                ? ceoSimulateFree
                  ? "Modo CEO (Simulando Gratis) — Clic para abrir /ceo"
                  : "Abrir Centro de Mandos CEO (/ceo)"
                : hasPro
                  ? "Party Pass PRO Activo"
                  : "Desbloquear Party Pass PRO"
            }
            className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 cursor-pointer ${
              isCeoAdmin && !ceoSimulateFree
                ? "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                : hasPro
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                  : "bg-amber-400/15 text-amber-300 border border-amber-400/30 hover:bg-amber-400/25"
            }`}
          >
            <Crown size={14} />
          </button>

          {/* Botón de Pases para Miembros Fundadores */}
          {founderNumber !== null && (
            <>
              <div className="mx-0.5 h-3.5 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setShowFounderPassesModal(true);
                }}
                title="Tus 5 Pases de Invitación"
                className="flex h-7 items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
              >
                <Ticket size={12} />
                <span className="hidden xs:inline">5 Pases</span>
              </button>
            </>
          )}

          <div className="mx-0.5 h-3.5 w-px bg-white/10" />

          {/* Share / QR Modal Trigger */}
          <button
            onClick={() => {
              playPop(soundEnabled);
              setShowShareModal(true);
            }}
            aria-label="Compartir juego con código QR"
            title="Invitar amigos (QR)"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90 cursor-pointer"
          >
            <QrCode size={15} />
          </button>

          {/* PWA Install Trigger */}
          {!isStandalone && (
            <button
              onClick={handleInstallPwa}
              aria-label="Instalar app en tu teléfono"
              title="Instalar en pantalla de inicio"
              className="flex h-7 items-center gap-1 rounded-full bg-primary/15 hover:bg-primary/25 border border-primary/30 px-2 text-[11px] font-bold text-primary transition active:scale-90 cursor-pointer"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? "Silenciar audio" : "Activar audio"}
            title={soundEnabled ? "Sonido activado" : "Sonido silenciado"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90 cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 size={15} className="text-primary/90" />
            ) : (
              <VolumeX size={15} />
            )}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => {
              playPop(soundEnabled);
              setShowSettingsModal(true);
            }}
            aria-label="Abrir configuración"
            title="Configuración"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90 cursor-pointer"
          >
            <Settings size={15} />
          </button>

          <div className="mx-1 h-3.5 w-px bg-white/10" />

          {/* Score Pill Integrado */}
          <div
            className="flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold"
            title={`Inocentes ${scores.innocents} - ${scores.impostors} Impostores`}
          >
            <Trophy size={11} className="text-primary/90" />
            <span className="text-primary font-bold tabular-nums">{scores.innocents}</span>
            <span className="text-muted-foreground/40">:</span>
            <span className="text-destructive font-bold tabular-nums">{scores.impostors}</span>
          </div>
        </div>
      </header>

      {/* PHASE 1: SETUP (WIZARD EN 2 PASOS) */}
      {phase === "setup" && (
        <section className="flex flex-col gap-4 pb-8 animate-in fade-in duration-200">
          {/* Interactive Stepper Header */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl glass-panel p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                playPop(soundEnabled);
                setSetupStep(1);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                setupStep === 1
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <User size={14} />
              <span>1. Jugadores ({names.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playPop(soundEnabled);
                setSetupStep(2);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                setupStep === 2
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={14} />
              <span className="truncate">
                2. {category === "Aleatoria" ? "Categoría" : category}
              </span>
            </button>
          </div>

          {/* PASO 1: SALA DE JUGADORES, IMPOSTORES Y TIEMPO */}
          {setupStep === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Jugadores */}
              <div className="glass-panel rounded-2xl p-5 shadow-2xl">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    <h2 className="font-semibold text-foreground">Sala de Jugadores</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={shufflePlayers}
                      title="Mezclar orden de jugadores"
                      className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1 text-[11px] font-medium text-foreground/90 border border-white/10 transition active:scale-95 cursor-pointer"
                    >
                      <Shuffle size={11} className="text-primary" /> Mezclar
                    </button>
                    <span className="text-[11px] text-muted-foreground/70">3–15 máx</span>
                  </div>
                </div>

                <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
                  {names.map((n, i) => {
                    const badge = getPlayerBadge(i);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl bg-background/60 p-2 border border-white/10 transition hover:border-white/20"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          {getPlayerInitial(i)}
                        </div>
                        <input
                          value={n}
                          onChange={(e) => {
                            playPop(soundEnabled);
                            updateNames(names.map((x, j) => (j === i ? e.target.value : x)));
                          }}
                          placeholder={`Jugador ${i + 1}`}
                          maxLength={20}
                          className="flex-1 bg-transparent px-2 py-1 text-sm outline-none font-medium text-foreground placeholder:text-muted-foreground/50"
                        />
                        {names.length > 3 && (
                          <button
                            aria-label={`Eliminar a ${n}`}
                            onClick={() => {
                              playPop(soundEnabled);
                              updateNames(names.filter((_, j) => j !== i));
                            }}
                            className="rounded-lg p-2 text-muted-foreground/60 transition hover:bg-destructive/20 hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={names.length >= 15}
                  onClick={() => {
                    if (!hasPro && names.length >= FREE_MAX_PLAYERS) {
                      openPaywall();
                      return;
                    }
                    playPop(soundEnabled);
                    updateNames([...names, `Jugador ${names.length + 1}`]);
                  }}
                  className={
                    !hasPro && names.length >= FREE_MAX_PLAYERS
                      ? "group relative mt-3 flex w-full items-center justify-between overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-amber-400/[0.04] to-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-amber-400/45 hover:from-amber-500/15 active:scale-[0.98] cursor-pointer"
                      : `${btnGhost} mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm`
                  }
                >
                  {!hasPro && names.length >= FREE_MAX_PLAYERS ? (
                    <>
                      <span className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                        <Plus size={15} className="text-amber-300" />
                        Añadir jugador (7–15)
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-300/30 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300">
                        <Crown size={10} /> PRO
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Añadir jugador
                    </>
                  )}
                </button>
              </div>

              {/* Steppers Rediseñados: Impostores y Tiempo */}
              <div className="grid grid-cols-2 gap-3">
                {/* Impostores Box */}
                <div className="flex flex-col justify-between rounded-2xl glass-panel p-4 shadow-2xl">
                  <span className="text-xs font-semibold text-muted-foreground">Impostores</span>
                  <div className="my-2.5 flex items-center justify-between">
                    <button
                      aria-label="Reducir impostores"
                      disabled={impostorCount <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateImpostorCount(Math.max(1, impostorCount - 1));
                      }}
                    >
                      <Minus size={18} className="stroke-[2.5]" />
                    </button>

                    <span className="font-display text-3xl text-destructive tracking-wide drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]">
                      {Math.min(impostorCount, maxImp)}
                    </span>

                    <button
                      aria-label="Aumentar impostores"
                      disabled={impostorCount >= maxImp}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateImpostorCount(Math.min(maxImp, impostorCount + 1));
                      }}
                    >
                      <Plus size={18} className="stroke-[2.5]" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center">
                    {names.length <= 3 ? "Añade 4+ jug. para subir" : `Máximo permitido: ${maxImp}`}
                  </span>
                </div>

                {/* Tiempo Box */}
                <div className="flex flex-col justify-between rounded-2xl glass-panel p-4 shadow-2xl">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Tiempo de debate
                  </span>
                  <div className="my-2.5 flex items-center justify-between">
                    <button
                      aria-label="Reducir tiempo"
                      disabled={minutes <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateMinutes(Math.max(1, minutes - 1));
                      }}
                    >
                      <Minus size={18} className="stroke-[2.5]" />
                    </button>

                    <span className="font-display text-3xl text-accent tracking-wide drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                      {minutes}m
                    </span>

                    <button
                      aria-label="Aumentar tiempo"
                      disabled={minutes >= 15}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateMinutes(Math.min(15, minutes + 1));
                      }}
                    >
                      <Plus size={18} className="stroke-[2.5]" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center">
                    1 a 15 minutos
                  </span>
                </div>
              </div>

              {/* Selector Rápido de Modos de Partida (1-Tap Toggles) */}
              <div className="rounded-2xl glass-panel p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* 1. Cómplices vs Modo Caos */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop(soundEnabled);
                      toggleAccompliceMode();
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      accompliceMode
                        ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                        : "bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-sm"
                    }`}
                  >
                    <span>{accompliceMode ? "🤝" : "🌪️"}</span>
                    <span className="truncate">{accompliceMode ? "Cómplices" : "Modo Caos"}</span>
                  </button>

                  {/* 2. Eventos Relámpago (PRO) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      toggleRandomEvents();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      randomEventsEnabled && hasPro
                        ? "bg-accent/20 text-accent border-accent/40 shadow-sm"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <span>⚡</span>
                    <span className="truncate">Eventos</span>
                    {!hasPro && <Crown size={11} className="text-amber-400 shrink-0" />}
                  </button>

                  {/* 3. El Bufón (PRO) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      toggleJester();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      jesterEnabled && hasPro
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <span>🃏</span>
                    <span className="truncate">Bufón</span>
                    {!hasPro && <Crown size={11} className="text-amber-400 shrink-0" />}
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center leading-tight">
                  {accompliceMode
                    ? "🤝 Los impostores se conocen entre sí"
                    : "🌪️ Caos: los impostores no saben quién es su aliado"}
                  {randomEventsEnabled && hasPro ? " · ⚡ Con retos por ronda" : ""}
                  {jesterEnabled && hasPro ? " · 🃏 Bufón infiltrado" : ""}
                </p>
              </div>

              {/* Botón Flotante Inteligente (Sticky: cerca del contenido en PC y flotante sobre el borde en móvil) */}
              <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
                <button
                  onClick={() => {
                    playPop(soundEnabled);
                    setSetupStep(2);
                  }}
                  className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-6 pr-4 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
                >
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="font-display text-base tracking-wider">CATEGORÍAS</span>
                    <span className="text-[10px] font-bold opacity-80">Paso 2 de 2</span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                    <ArrowRight size={20} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: GALERÍA DE CATEGORÍAS TIPO ARCADE */}
          {setupStep === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="glass-panel rounded-2xl p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">Elige la Categoría</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Selecciona el tema secreto para los {names.length} jugadores
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      setShowSettingsModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/90 transition active:scale-95 cursor-pointer"
                  >
                    {!hasPro ? (
                      <Crown size={12} className="text-amber-300" />
                    ) : (
                      <Plus size={13} className="text-primary" />
                    )}
                    <span>Crear lista</span>
                  </button>
                </div>

                {/* Arcade Deck Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                  {["Aleatoria", ...Object.keys(DEFAULT_CATEGORIES), ...Object.keys(custom)].map(
                    (c) => {
                      const isSelected = c === category;
                      const isProCat = PRO_CATEGORIES.includes(c) || c in custom;
                      const isLockedByPro = isProCat && !hasPro;
                      const count = allCats[c]?.length ?? 0;
                      const playedCount = usedWords[c]?.length ?? 0;
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            if (isLockedByPro) {
                              openPaywall();
                              return;
                            }
                            playPop(soundEnabled);
                            setCategory(c);
                          }}
                          className={`relative flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all duration-150 cursor-pointer border overflow-hidden ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/50 border-primary scale-[1.02]"
                              : isLockedByPro
                                ? "bg-white/[0.02] hover:bg-amber-400/[0.06] text-foreground/85 border-white/10 hover:border-amber-400/30 active:scale-95"
                                : "bg-background/60 hover:bg-white/10 text-foreground border-white/10 active:scale-95"
                          }`}
                        >
                          {isLockedByPro && (
                            <span
                              title="Categoría Party Pass PRO"
                              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                            >
                              <Crown size={10} />
                            </span>
                          )}
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl mb-1.5 border transition ${
                              isSelected
                                ? "bg-black/20 border-white/20 text-primary-foreground"
                                : "bg-white/5 border-white/10 text-primary"
                            }`}
                          >
                            <CategoryIcon category={c} size={18} />
                          </div>
                          <span className="text-xs font-semibold leading-tight line-clamp-1">
                            {c}
                          </span>
                          <span
                            className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isSelected
                                ? "bg-black/20 text-primary-foreground"
                                : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {c === "Aleatoria"
                              ? "Todas las listas"
                              : playedCount > 0
                                ? `${count - playedCount}/${count} libres`
                                : `${count} palabras`}
                          </span>
                        </button>
                      );
                    },
                  )}

                  {/* Tarjeta Especial: Sección +18 con Candado */}
                  <button
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      if (!isAdultUnlocked) {
                        setPinModalMode("unlock");
                        setShowPinModal(true);
                        setEnteredPin("");
                        setPinError(false);
                        setShowPinHint(false);
                      } else {
                        setCategory(ADULT_CATEGORY);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all duration-150 cursor-pointer border overflow-hidden ${
                      category === ADULT_CATEGORY
                        ? "bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-[1.02] font-bold"
                        : isAdultUnlocked
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
                          : "bg-rose-950/35 text-rose-300/80 border-rose-500/30 hover:border-rose-400/60"
                    }`}
                  >
                    {!hasPro && (
                      <span
                        title="Categoría Party Pass PRO"
                        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                      >
                        <Crown size={10} />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                        <Flame size={18} />
                      </div>
                      {isAdultUnlocked && hasPro ? (
                        <Unlock size={13} className="text-emerald-400" />
                      ) : (
                        <Lock size={13} className="text-rose-400" />
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-tight">Fiesta +18</span>
                    <span
                      className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        category === ADULT_CATEGORY
                          ? "bg-black/25 text-white"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {isAdultUnlocked && hasPro
                        ? `${ADULT_WORDS.length} palabras`
                        : !hasPro
                          ? "Pack PRO"
                          : "Con PIN"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setSetupStep(1);
                }}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start px-2 py-1 transition cursor-pointer"
              >
                <ArrowLeft size={14} /> Volver a Jugadores ({names.length} jug,{" "}
                {Math.min(impostorCount, maxImp)} imp)
              </button>

              {/* Botón Flotante Inteligente (Sticky: cerca del contenido en PC y flotante sobre el borde en móvil) */}
              <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
                <button
                  onClick={startRound}
                  className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-4 pr-6 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                    <Play size={20} className="fill-current ml-0.5" />
                  </div>
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="font-display text-lg tracking-wider">JUGAR</span>
                    <span className="text-[10px] font-bold opacity-80 max-w-[130px] truncate">
                      {category === "Aleatoria" ? "🎲 Aleatoria" : category}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODAL: CENTRO DE CONFIGURACIÓN Y PERSONALIZACIÓN (EXTRAÍDO A COMPONENTE) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          playPop(soundEnabled);
          setShowSettingsModal(false);
        }}
        hasPro={hasPro}
        custom={custom}
        saveCustom={saveCustom}
        category={category}
        setCategory={setCategory}
        newCat={newCat}
        setNewCat={setNewCat}
        newWords={newWords}
        setNewWords={setNewWords}
        handleExportCategories={handleExportCategories}
        handleImportCategories={handleImportCategories}
        openPaywall={openPaywall}
        packStatus={packStatus}
        isAdultUnlocked={isAdultUnlocked}
        setIsAdultUnlocked={setIsAdultUnlocked}
        openPinModal={(mode) => {
          playPop(soundEnabled);
          setPinModalMode(mode);
          setEnteredPin("");
          setPinError(false);
          setShowPinHint(false);
          setShowSettingsModal(false);
          setShowPinModal(true);
        }}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        vibrationEnabled={vibrationEnabled}
        toggleVibration={toggleVibration}
        wakeLockEnabled={wakeLockEnabled}
        toggleWakeLock={toggleWakeLock}
        handleInstallPwa={handleInstallPwa}
        isStandalone={isStandalone}
        scores={scores}
        resetScores={resetScores}
        resetFactoryDefaults={resetFactoryDefaults}
        isCeoAdmin={isCeoAdmin}
        isProUnlocked={isProUnlocked}
        proExpiresAt={proExpiresAt}
        deactivateProAndCeo={deactivateProAndCeo}
        btnPrimary={btnPrimary}
        btnGhost={btnGhost}
        playPop={playPop}
      />

      {/* MODAL: TUS 5 PASES DE INVITACIÓN (EXTRAÍDO A COMPONENTE) */}
      <FounderPassesModal
        isOpen={showFounderPassesModal && founderNumber !== null}
        onClose={() => setShowFounderPassesModal(false)}
        founderNumber={founderNumber}
        founderGuestPasses={founderGuestPasses}
      />

      {/* MODAL: PARTY PASS PRO & ACCESO CEO (EXTRAÍDO A COMPONENTE) */}
      <PaywallModal
        isOpen={showProModal}
        onClose={() => {
          playPop(soundEnabled);
          setShowProModal(false);
          setProModalView("perks");
        }}
        soundEnabled={soundEnabled}
        playPop={playPop}
        activePaymentTracker={activePaymentTracker}
        setActivePaymentTracker={setActivePaymentTracker}
        proModalView={proModalView}
        setProModalView={setProModalView}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        paymentConfig={paymentConfig}
        selectedPayMethod={selectedPayMethod}
        setSelectedPayMethod={setSelectedPayMethod}
        copiedPayField={copiedPayField}
        handleCopyPayField={handleCopyPayField}
        payProofName={payProofName}
        setPayProofName={setPayProofName}
        payProofRef={payProofRef}
        setPayProofRef={setPayProofRef}
        payProofDiscordContact={payProofDiscordContact}
        setPayProofDiscordContact={setPayProofDiscordContact}
        payProofFeedback={payProofFeedback}
        setPayProofFeedback={setPayProofFeedback}
        payProofSubmitting={payProofSubmitting}
        handleSubmitPaymentProof={handleSubmitPaymentProof}
        proCodeInput={proCodeInput}
        setProCodeInput={setProCodeInput}
        handleRedeemCode={handleRedeemCode}
        proCodeFeedback={proCodeFeedback}
      />

      {/* MODAL: COMPARTIR JUEGO Y CÓDIGO QR (EXTRAÍDO A COMPONENTE) */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          playPop(soundEnabled);
          setShowShareModal(false);
        }}
        shareUrl={shareUrl}
        shareCopied={shareCopied}
        onCopy={async () => {
          playPop(soundEnabled);
          try {
            await navigator.clipboard.writeText(shareUrl);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2500);
          } catch {
            /* ignore */
          }
        }}
        onShare={handleShareGame}
        onOpenInstallPwa={() => {
          setShowShareModal(false);
          handleInstallPwa();
        }}
      />

      {/* MODAL: INSTALACIÓN PWA (EXTRAÍDO A COMPONENTE) */}
      <InstallPwaModal
        isOpen={showInstallModal}
        onClose={() => {
          playPop(soundEnabled);
          setShowInstallModal(false);
        }}
        isStandalone={isStandalone}
        isIos={isIos}
        canInstallPwa={canInstallPwa}
        promptPwaInstall={promptPwaInstall}
        btnPrimary={btnPrimary}
        btnGhost={btnGhost}
        soundEnabled={soundEnabled}
        playPop={playPop}
      />

      {/* MODAL: TECLADO PIN PARA SECCIÓN +18 (EXTRAÍDO A COMPONENTE) */}
      <AdultPinModal
        isOpen={showPinModal}
        onClose={() => {
          playPop(soundEnabled);
          setShowPinModal(false);
          setEnteredPin("");
          setShowPinHint(false);
        }}
        pinModalMode={pinModalMode}
        enteredPin={enteredPin}
        pinError={pinError}
        pinLockoutUntil={pinLockoutUntil}
        pinFailedAttempts={pinFailedAttempts}
        handlePinInput={handlePinInput}
        handlePinDelete={handlePinDelete}
        showPinHint={showPinHint}
        setShowPinHint={setShowPinHint}
        adultPin={adultPin}
      />

      {/* PHASE 2: REVEAL (ESCANER BIOMETRICO CON HOLD-TO-REVEAL) */}
      {phase === "reveal" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Segmented Stories Progress Bar */}
          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex w-full gap-1.5">
              {names.map((_, idx) => {
                const isDone = idx < turn;
                const isCurrent = idx === turn;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-primary"
                        : isCurrent
                          ? "bg-primary shadow-[0_0_10px_rgba(234,179,8,0.9)] animate-pulse"
                          : "bg-white/15"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Turno {turn + 1} de {names.length}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Pasa el dispositivo a
            </p>
            <div className="flex items-center justify-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                  getPlayerBadge(turn).bg
                } ${getPlayerBadge(turn).text} border ${getPlayerBadge(turn).border}`}
              >
                {getPlayerInitial(turn)}
              </div>
              <h2 className="font-display text-4xl text-primary">{getPlayerName(turn)}</h2>
            </div>
          </div>

          {/* Biometric Laser Scanner Card */}
          <div
            onPointerDown={handleStartHold}
            onPointerUp={handleEndHold}
            onPointerLeave={handleEndHold}
            onPointerCancel={handleEndHold}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative flex aspect-square w-full max-w-xs cursor-pointer select-none touch-none flex-col items-center justify-center overflow-hidden rounded-3xl p-6 transition-all duration-300 border-2 ${
              isHolding
                ? impostors.includes(turn)
                  ? "bg-destructive/95 text-destructive-foreground border-destructive glow-danger scale-[1.03]"
                  : turn === jesterIndex
                    ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_35px_rgba(147,51,234,0.7)] scale-[1.03]"
                    : "bg-primary text-primary-foreground border-primary glow-primary scale-[1.03]"
                : "glass-panel border-white/15 hover:border-primary/50 active:scale-95 shadow-2xl"
            }`}
          >
            {/* Animated Laser Sweep */}
            {isHolding && (
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_#fff] animate-laser" />
            )}

            {!isHolding ? (
              <div className="relative flex flex-col items-center gap-3">
                {/* Concentric radar rings & biometric target */}
                <div className="relative flex h-28 w-28 items-center justify-center">
                  {/* Outer pulsating sonar aura */}
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-glow" />
                  {/* Subtle ping pulse */}
                  <div className="absolute -inset-1 rounded-full border border-primary/20 animate-ping opacity-25" />
                  {/* Rotating dashed tactical reticle */}
                  <div className="absolute inset-1 rounded-full border border-dashed border-primary/35 animate-spin [animation-duration:12s]" />
                  {/* Inner glowing ring */}
                  <div className="absolute inset-3 rounded-full border border-primary/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
                  <Fingerprint
                    size={58}
                    className="relative z-10 text-primary transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="font-display tracking-wider text-base text-foreground">
                  ESCANEAR IDENTIDAD
                </span>
                <span className="text-xs text-muted-foreground px-4 text-center leading-relaxed">
                  Sostén tu dedo sobre el sensor para decodificar tu rol en secreto. Al soltar se
                  bloqueará.
                </span>
              </div>
            ) : impostors.includes(turn) ? (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in-90 duration-150">
                <ShieldAlert size={52} className="text-destructive-foreground animate-bounce" />
                <span className="font-display text-4xl tracking-widest">¡IMPOSTOR!</span>
                {impostors.length > 1 && accompliceMode && (
                  <div className="rounded-xl bg-black/35 px-3.5 py-1.5 text-xs border border-white/10 backdrop-blur-md">
                    <span className="opacity-90">
                      {impostors.length === 2 ? "Tu cómplice:" : "Tus cómplices:"}{" "}
                    </span>
                    <strong className="underline underline-offset-2">
                      {impostors
                        .filter((idx) => idx !== turn)
                        .map((idx) => getPlayerName(idx))
                        .join(", ")}
                    </strong>
                  </div>
                )}
                {impostors.length > 1 && !accompliceMode && (
                  <div className="rounded-xl bg-black/35 px-3.5 py-1.5 text-xs border border-white/10 backdrop-blur-md">
                    <span className="opacity-90">
                      Modo Caos: Hay {impostors.length - 1} cómplice(s) oculto(s)
                    </span>
                  </div>
                )}
                <p className="mt-1 text-xs opacity-90">¡La categoría es secreta!</p>
                <span className="text-[11px] opacity-80 mt-1">
                  ¡Engaña a los demás y no te delates!
                </span>
              </div>
            ) : turn === jesterIndex ? (
              <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-90 duration-150">
                <span className="text-4xl animate-bounce">🃏</span>
                <span className="font-display text-3xl tracking-wider">¡ERES EL BUFÓN!</span>
                <span className="text-xs uppercase tracking-widest opacity-85 font-bold">
                  Palabra: {word}
                </span>
                <div className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold border border-white/15">
                  Categoría: {playedCategory}
                </div>
                <p className="mt-1.5 text-[11px] opacity-95 px-2 leading-snug">
                  ¡Actúa sospechoso a propósito! Si logras que el grupo vote por ti, ganas tú solo.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-90 duration-150">
                <Sparkles size={40} className="text-primary-foreground animate-pulse" />
                <span className="text-xs uppercase tracking-widest opacity-80 font-bold">
                  Tu palabra secreta
                </span>
                <span className="font-display text-3xl font-extrabold my-2 tracking-wide drop-shadow-md">
                  {word}
                </span>
                <div className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-white/10">
                  Categoría: {playedCategory}
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              disabled={!hasSeenRole}
              onClick={nextTurn}
              className={`${btnPrimary} w-full py-3.5`}
            >
              {turn + 1 >= names.length ? "Comenzar debate" : "Ocultar y pasar al siguiente"}
            </button>

            {!hasSeenRole && (
              <p className="text-[11px] text-muted-foreground">
                Debes escanear tu rol sosteniendo el sensor antes de continuar.
              </p>
            )}
          </div>
        </section>
      )}

      {/* PHASE 3: DISCUSS (RELOJ RADIAL DE TENSION) */}
      {phase === "discuss" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Radial SVG Timer */}
          {(() => {
            const totalSeconds = minutes * 60;
            const progress = Math.max(0, timeLeft / totalSeconds);
            const radius = 80;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);

            const isUrgent = timeLeft <= 10;
            const isWarning = timeLeft <= 30 && !isUrgent;

            return (
              <div
                className={`relative flex items-center justify-center my-2 ${isUrgent ? "animate-heartbeat" : ""}`}
              >
                <svg className="h-52 w-52 -rotate-90 transform" viewBox="0 0 180 180">
                  {/* Background Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    className="stroke-muted/30"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress Ring */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    className={`transition-all duration-1000 ease-linear ${
                      isUrgent
                        ? "stroke-destructive drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                        : isWarning
                          ? "stroke-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                          : "stroke-accent drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    }`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Countdown Display */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    {isUrgent ? "¡ÚLTIMOS SEGUNDOS!" : "DEBATE ACTIVO"}
                  </p>
                  <span
                    className={`font-display text-5xl tabular-nums tracking-tight ${
                      isUrgent
                        ? "text-destructive"
                        : isWarning
                          ? "text-amber-400"
                          : "text-foreground"
                    }`}
                  >
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {paused ? "⏸ PAUSADO" : "En curso"}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Wake Lock Active Badge */}
          {isWakeLockActiveState && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <Sun size={12} className="text-emerald-400 animate-spin" />
              <span>Pantalla siempre activa</span>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              className={`${btnGhost} text-sm px-4`}
              onClick={() => {
                playPop(soundEnabled);
                setPaused(!paused);
              }}
            >
              {paused ? "Reanudar" : "Pausar"}
            </button>
            <button
              className={`${btnGhost} text-sm px-4`}
              onClick={() => {
                playPop(soundEnabled);
                setTimeLeft((s) => s + 30);
              }}
            >
              +30s
            </button>
          </div>

          {/* Active Lightning Event Banner */}
          {activeEvent && (
            <div className="w-full max-w-xs rounded-2xl bg-accent/15 border border-accent/40 p-3.5 text-left shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                <span className="text-base">{activeEvent.icon}</span>
                <span>Evento Relámpago: {activeEvent.title}</span>
              </div>
              <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                {activeEvent.description}
              </p>
            </div>
          )}

          {/* Starter Player Badge */}
          <div className="glass-panel rounded-2xl p-4 max-w-xs text-sm border border-white/10 shadow-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Inicia la ronda de pistas
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs ${
                  getPlayerBadge(starter).bg
                } ${getPlayerBadge(starter).text} border ${getPlayerBadge(starter).border}`}
              >
                {getPlayerInitial(starter)}
              </div>
              <strong className="text-primary text-base font-semibold">
                {getPlayerName(starter)}
              </strong>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Cada jugador dice una sola palabra relacionada con el concepto sin delatarse.
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-2">
            <button
              className={`${btnPrimary} w-full py-3.5`}
              onClick={() => {
                playPop(soundEnabled);
                setPhase("vote");
              }}
            >
              Ir a Votación
            </button>
            <button className={`${btnGhost} text-xs py-2`} onClick={handleDirectReveal}>
              Saltar votación y revelar directamente
            </button>
          </div>
        </section>
      )}

      {/* PHASE 4: VOTE (FICHAS DE SOSPECHOSO) */}
      {phase === "vote" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wide">
              ¿QUIÉN ES EL SOSPECHOSO?
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {impostors.length > 1
                ? `Impostores atrapados: ${caughtImpostors.length} de ${impostors.length}. ¡Elige al siguiente sospechoso!`
                : "El grupo debe deliberar y seleccionar a quién acusar"}
            </p>
          </div>

          {/* Suspect Dossier Cards */}
          <div className="grid w-full max-w-xs grid-cols-2 gap-3">
            {names.map((_, i) => {
              const isCaught = caughtImpostors.includes(i);
              const isSelected = accusedIndex === i;
              const badge = getPlayerBadge(i);
              return (
                <button
                  key={i}
                  disabled={isCaught}
                  onClick={() => {
                    playPop(soundEnabled);
                    setAccusedIndex(i);
                  }}
                  className={`relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-200 border ${
                    isCaught
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 opacity-70 cursor-not-allowed"
                      : isSelected
                        ? "border-destructive bg-destructive/20 text-destructive ring-2 ring-destructive shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-[1.02] cursor-pointer active:scale-95"
                        : "glass-panel text-foreground hover:border-white/20 hover:bg-white/10 cursor-pointer active:scale-95"
                  }`}
                >
                  {isSelected && !isCaught && (
                    <div className="absolute top-2 right-2 flex items-center justify-center text-destructive animate-pulse">
                      <Target size={18} />
                    </div>
                  )}
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-sm mb-2 ${badge.bg} ${badge.text} border ${badge.border}`}
                  >
                    {getPlayerInitial(i)}
                  </div>
                  <span className="font-semibold text-sm truncate max-w-[110px]">
                    {getPlayerName(i)}
                  </span>
                  <span
                    className={`text-[10px] mt-1 uppercase tracking-wider font-bold ${
                      isCaught
                        ? "text-emerald-400"
                        : isSelected
                          ? "text-destructive"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {isCaught ? "Impostor Atrapado" : isSelected ? "Acusado" : "Sospechoso"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full max-w-xs space-y-2">
            <button
              disabled={accusedIndex === null}
              onClick={() => accusedIndex !== null && handleVoteConfirmation(accusedIndex)}
              className={`${btnDanger} w-full py-3.5`}
            >
              Acusar a {accusedIndex !== null ? getPlayerName(accusedIndex) : "..."}
            </button>
            <button className={`${btnGhost} w-full text-xs py-2`} onClick={handleDirectReveal}>
              Saltar votación (Revelar todos los roles)
            </button>
          </div>
        </section>
      )}

      {/* MODAL: IMPRESIÓN / ADIVINANZA DEL IMPOSTOR */}
      {showImpostorGuessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl glass-panel p-6 border border-destructive/40 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 text-destructive border border-destructive/30 animate-pulse">
              <ShieldAlert size={32} />
            </div>

            <div>
              <h3 className="font-display text-2xl text-destructive">¡Impostor Descubierto!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>
                  {accusedIndex !== null ? getPlayerName(accusedIndex) : "El sospechoso"}
                </strong>{" "}
                era efectivamente {impostors.length > 1 ? "uno de los impostores" : "el impostor"}.
              </p>
            </div>

            <div className="rounded-xl bg-background/60 p-3.5 text-xs text-muted-foreground border border-white/5">
              <p className="font-semibold text-foreground mb-1">Última oportunidad del impostor:</p>
              ¿Puede el impostor adivinar exactamente la palabra secreta de la ronda?
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => handleImpostorGuessResult(true)}
                className={`${btnPrimary} flex-1 text-xs py-3 flex items-center justify-center gap-1.5`}
              >
                <Check size={16} /> Adivinó la palabra
              </button>
              <button
                onClick={() => handleImpostorGuessResult(false)}
                className={`${btnDanger} flex-1 text-xs py-3 flex items-center justify-center gap-1.5`}
              >
                <X size={16} /> No la supo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 5: RESULT */}
      {phase === "result" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <ConfettiCanvas winner={roundWinner} />
          {/* Winner Banner with Celebration / Siren Effects */}
          {roundWinner ? (
            <div
              className={`relative overflow-hidden rounded-2xl p-5 w-full max-w-xs border shadow-xl ${
                roundWinner === "innocents"
                  ? "bg-primary/15 border-primary text-primary glow-primary"
                  : roundWinner === "jester"
                    ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                    : "bg-destructive/20 border-destructive text-destructive glow-danger"
              }`}
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                {roundWinner === "innocents" ? (
                  <>
                    <Sparkles size={20} className="text-primary animate-bounce" />
                    <Trophy
                      size={26}
                      className="text-primary drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                    />
                    <Sparkles size={20} className="text-primary animate-bounce" />
                  </>
                ) : roundWinner === "jester" ? (
                  <span className="text-3xl animate-bounce">🃏</span>
                ) : (
                  <ShieldAlert size={28} className="text-destructive animate-pulse" />
                )}
              </div>
              <h2 className="font-display text-2xl tracking-wide">
                {roundWinner === "innocents"
                  ? "¡VICTORIA INOCENTE!"
                  : roundWinner === "jester"
                    ? "¡VICTORIA DEL BUFÓN!"
                    : "¡VICTORIA IMPOSTOR!"}
              </h2>
              <p className="text-xs text-foreground/90 mt-1.5 leading-relaxed">{winReason}</p>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl text-foreground tracking-wide">
                Fin de la Ronda
              </h2>
            </div>
          )}

          {/* Impostores Revelados */}
          <div className="w-full max-w-xs rounded-2xl bg-destructive p-5 text-destructive-foreground glow-danger shadow-xl">
            <span className="text-xs uppercase tracking-widest opacity-80 font-bold">
              {impostors.length > 1 ? "Los impostores eran" : "El impostor era"}
            </span>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {impostors.map((i) => {
                const badge = getPlayerBadge(i);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-1.5 border border-white/10"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded font-bold text-xs ${badge.bg} ${badge.text}`}
                    >
                      {getPlayerInitial(i)}
                    </div>
                    <span className="font-display text-xl">{getPlayerName(i)}</span>
                  </div>
                );
              })}
            </div>
            {jesterIndex !== null && (
              <div className="mt-3 pt-2.5 border-t border-white/15 text-xs">
                <span className="opacity-85">🃏 El Bufón era: </span>
                <strong className="font-display tracking-wide">{getPlayerName(jesterIndex)}</strong>
              </div>
            )}
          </div>

          {/* Palabra Secreta */}
          <div className="w-full max-w-xs rounded-2xl glass-panel p-4 shadow-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              La palabra secreta era
            </p>
            <p className="font-display text-3xl text-primary my-1 drop-shadow-md">{word}</p>
            <p className="text-xs text-muted-foreground">
              Categoría: <span className="font-semibold text-foreground">{playedCategory}</span>
            </p>
          </div>

          {/* Marcador Actual */}
          <div className="flex items-center justify-around w-full max-w-xs rounded-2xl glass-panel p-3.5 shadow-xl text-sm">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Inocentes</span>
              <span className="font-display text-2xl text-primary">{scores.innocents}</span>
            </div>
            <span className="text-muted-foreground/60 text-lg font-bold">vs</span>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Impostores</span>
              <span className="font-display text-2xl text-destructive">{scores.impostors}</span>
            </div>
          </div>

          {/* Next Actions */}
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            <button className={`${btnPrimary} w-full py-3.5`} onClick={startRound}>
              Otra ronda ({category === "Aleatoria" ? "🎲 Aleatoria" : category})
            </button>
            <div className="flex w-full gap-2.5">
              <button
                className={`${btnGhost} flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5`}
                onClick={() => {
                  playPop(soundEnabled);
                  setSetupStep(2);
                  setPhase("setup");
                }}
              >
                <LayoutGrid size={14} /> Cambiar Categoría
              </button>
              <button
                className={`${btnGhost} flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5`}
                onClick={() => {
                  playPop(soundEnabled);
                  setSetupStep(1);
                  setPhase("setup");
                }}
              >
                <User size={14} /> Jugadores
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Cinematic Suspense Blackout Overlay */}
      {isResolvingResult && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <span className="font-display text-2xl tracking-widest text-primary drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">
              VEREDICTO FINAL
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
