import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Volume2,
  VolumeX,
  Trophy,
  Lock,
  LogOut,
  Settings,
  Smartphone,
  Crown,
  QrCode,
  Ticket,
} from "lucide-react";
import { acquireScreenWakeLock, releaseScreenWakeLock } from "@/lib/wake-lock";
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
} from "@/lib/security";
import {
  checkCeoAuthServerFn,
  verifyCeoLoginServerFn,
  consumeSingleUseCouponServerFn,
  getPaymentConfigServerFn,
  submitPaymentProofServerFn,
  checkPaymentStatusServerFn,
  consumeFounderServerFn,
  consumeGuestPassServerFn,
  getFounderGuestPassesServerFn,
} from "@/lib/coupon-server";
import { trackGameEvent, initOfflineTelemetrySync } from "@/lib/telemetry";
import {
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  sanitizePaymentConfig,
  PartyPassPlan,
  PARTY_PASS_PLANS,
} from "@/lib/payment-config";
import {
  DEFAULT_CATEGORIES,
  ADULT_CATEGORY,
  ADULT_WORDS,
  PRO_CATEGORIES,
  getUndercoverWord,
} from "@/data/categories";
import { ROUND_EVENTS, RoundEvent, getPlayerBadge } from "@/data/game-events";
import {
  AdultPinModal,
  FounderPassesModal,
  InstallPwaModal,
  PaywallModal,
  SettingsModal,
  ShareModal,
} from "@/components/modals";
import {
  PhaseDiscuss,
  PhaseResult,
  PhaseReveal,
  PhaseSetup,
  PhaseVote,
  OnlineRoomModal,
} from "@/components/game";
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
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
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
  const [undercoverMode, setUndercoverMode] = useState<boolean>(false);
  const [randomEventsEnabled, setRandomEventsEnabled] = useState<boolean>(false);
  const [jesterEnabled, setJesterEnabled] = useState<boolean>(false);
  const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(false);
  const [isTrialRoundActive, setIsTrialRoundActive] = useState<boolean>(false);
  const [showOnlineRoomModal, setShowOnlineRoomModal] = useState<boolean>(false);
  const [initialOnlineRoomCode, setInitialOnlineRoomCode] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreState>({ innocents: 0, impostors: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

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

  // Share / QR Modal State
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("https://imposter.manu-07games.workers.dev");
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Mobile Native (Bloque B) State: Wake Lock, Tema & PWA Install
  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
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

  const hasPro =
    (isProUnlocked || isCeoAdmin || isTrialRoundActive || Boolean(activePaymentTracker)) &&
    !ceoSimulateFree;

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

  const [custom, setCustom] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState("Aleatoria");
  const [newCat, setNewCat] = useState("");
  const [newWords, setNewWords] = useState("");

  // Round State
  const [word, setWord] = useState("");
  const [impostorWord, setImpostorWord] = useState("");
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
      let countFromStorage = savedCount ? Number(savedCount) : 1;

      // Validación: asegurar que impostorCount no exceda el máximo permitido por la cantidad de jugadores
      const maxImpOnLoad = Math.max(1, names.length - 2);
      if (countFromStorage > maxImpOnLoad) {
        countFromStorage = maxImpOnLoad;
      }

      setImpostorCount(countFromStorage);

      const savedMinutes = localStorage.getItem("impostor-minutes");
      if (savedMinutes) setMinutes(Number(savedMinutes) || 3);

      const savedSound = localStorage.getItem("impostor-sound");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");

      const savedVibration = localStorage.getItem("impostor-vibration");
      if (savedVibration !== null) setVibrationEnabled(savedVibration === "true");

      const savedWakeLock = localStorage.getItem("impostor-wake-lock");
      if (savedWakeLock !== null) setWakeLockEnabled(savedWakeLock === "true");

      const savedTheme = localStorage.getItem("impostor-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeMode(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      }

      const savedAccomplice = localStorage.getItem("impostor-accomplice");
      if (savedAccomplice !== null) setAccompliceMode(savedAccomplice === "true");

      const savedUndercover = localStorage.getItem("impostor-undercover");
      if (savedUndercover !== null) setUndercoverMode(savedUndercover === "true");

      if (localStorage.getItem("impostor-free-trial-used") === "true") {
        setFreeTrialUsed(true);
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get("room");
        if (roomParam && roomParam.trim().length === 4) {
          setInitialOnlineRoomCode(roomParam.trim().toUpperCase());
          setShowOnlineRoomModal(true);
        }
      }

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
      let isUnlockedOnMount = false;
      const storedProToken = localStorage.getItem(STORAGE_KEYS.PRO_TOKEN);
      const storedProExpires = localStorage.getItem(STORAGE_KEYS.PRO_EXPIRES);
      if (isValidStoredToken(storedProToken, "pro", storedProExpires)) {
        isUnlockedOnMount = true;
        setIsProUnlocked(true);
        const parsedExp = parseSignedExpiry(storedProToken, storedProExpires);
        if (parsedExp) setProExpiresAt(parsedExp);
      } else if (storedProToken || storedProExpires) {
        localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      }

      const storedCeoToken = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
      if (isValidStoredToken(storedCeoToken, "ceo")) {
        isUnlockedOnMount = true;
        setIsCeoAdmin(true);
        setIsProUnlocked(true);
        // Verificar en segundo plano si la llave CEO fue rotada desde otro dispositivo
        checkCeoAuthServerFn()
          .then((srvAuth) => {
            if (srvAuth?.activeVerifyHash) {
              localStorage.setItem(STORAGE_KEYS.CEO_ACTIVE_HASH, srvAuth.activeVerifyHash);
            } else if (srvAuth && srvAuth.activeVerifyHash === null) {
              localStorage.removeItem(STORAGE_KEYS.CEO_ACTIVE_HASH);
            }
            if (srvAuth && !srvAuth.isAuthorized) {
              setIsCeoAdmin(false);
              setIsProUnlocked(false);
              setCeoSimulateFree(false);
              setProExpiresAt(null);
              setFounderNumber(null);
              setIsAdultUnlocked(false);
              setRandomEventsEnabled(false);
              setJesterEnabled(false);
              localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
              localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
              localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
              localStorage.removeItem(STORAGE_KEYS.FOUNDER_NUMBER);
              localStorage.removeItem(STORAGE_KEYS.FOUNDER_CODE);
              localStorage.removeItem("impostor-adult-unlocked");
              localStorage.setItem("impostor-events", "false");
              localStorage.setItem("impostor-jester", "false");
              document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
            }
          })
          .catch(() => {});
      } else if (storedCeoToken) {
        localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
        document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
      }

      if (isUnlockedOnMount) {
        const storedFounder = localStorage.getItem(STORAGE_KEYS.FOUNDER_NUMBER);
        if (storedFounder && Number.isFinite(Number(storedFounder))) {
          setFounderNumber(Number(storedFounder));
        }
      } else {
        // Si no tiene PRO ni CEO válido al iniciar, purgar cualquier estado PRO residual
        setIsProUnlocked(false);
        setIsCeoAdmin(false);
        setFounderNumber(null);
        setRandomEventsEnabled(false);
        setJesterEnabled(false);
        setIsAdultUnlocked(false);
        localStorage.removeItem(STORAGE_KEYS.FOUNDER_NUMBER);
        localStorage.removeItem(STORAGE_KEYS.FOUNDER_CODE);
        localStorage.removeItem("impostor-adult-unlocked");
        localStorage.setItem("impostor-events", "false");
        localStorage.setItem("impostor-jester", "false");
        if (savedNames) {
          try {
            const parsedNames = JSON.parse(savedNames);
            if (Array.isArray(parsedNames) && parsedNames.length > FREE_MAX_PLAYERS) {
              const clamped = parsedNames.slice(0, FREE_MAX_PLAYERS);
              setNames(clamped);
              localStorage.setItem("impostor-names", JSON.stringify(clamped));
            }
          } catch {
            /* ignore */
          }
        }
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

      // Cargar e hidratar Métodos de Pago
      const savedPayConfig = localStorage.getItem("impostor-payment-config");
      let initialPayConfig = DEFAULT_PAYMENT_CONFIG;
      if (savedPayConfig) {
        try {
          initialPayConfig = sanitizePaymentConfig(JSON.parse(savedPayConfig));
          setPaymentConfig(initialPayConfig);
        } catch {
          console.error("Error al sanitizar payment config del localStorage");
          /* ignore */
        }
      }

      getPaymentConfigServerFn({ data: { defaultFallback: initialPayConfig } })
        .then((res) => {
          if (res?.config) {
            setPaymentConfig(res.config);
            try {
              localStorage.setItem("impostor-payment-config", JSON.stringify(res.config));
            } catch {
              console.error("Error al guardar payment config en localStorage");
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
            text: `¡Invitación VIP detectada (${cleanCode})! Pulsa "Activar" abajo para comenzar tus 48h gratis.`,
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

  // Suscripción al ciclo de vida PWA (Instalación nativa en Android e iOS) y cola offline
  useEffect(() => {
    initOfflineTelemetrySync();
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
        console.error("Error al guardar analytics en localStorage");
        /* ignore */
      }
      return next;
    });
  };

  const openPaywall = () => {
    playPop(soundEnabled);
    setProCodeFeedback(null);
    setProModalView("perks");
    trackAnalytics((prev) => ({
      ...prev,
      paywallViews: prev.paywallViews + 1,
    }));
    void trackGameEvent({ type: "paywall_view", planId: selectedPlan });
    setShowProModal(true);
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
      setPayProofFeedback("Por favor ingresa tu nombre o apodo.");
      return;
    }
    if (!payProofRef.trim()) {
      setPayProofFeedback("Por favor ingresa el número o referencia del pago.");
      return;
    }

    setPayProofSubmitting(true);
    setPayProofFeedback("");

    const planMeta = PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend;
    const priceUsd = planMeta.priceUsd;
    const calculatedBs = Math.round(
      priceUsd * (paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
    );
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
        setPayProofFeedback("Error al registrar el pago en el servidor.");
      }
    } catch {
      setPayProofFeedback("Error de conexión. Intenta de nuevo.");
    } finally {
      setPayProofSubmitting(false);
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
            if (res.founderNumber && res.founderCode) {
              setFounderNumber(res.founderNumber);
              localStorage.setItem(STORAGE_KEYS.FOUNDER_NUMBER, String(res.founderNumber));
              localStorage.setItem(STORAGE_KEYS.FOUNDER_CODE, res.founderCode);
            }
            localStorage.removeItem("impostor-active-payment-tracker");
          } catch {
            /* ignore */
          }
          setActivePaymentTracker(null);
          setShowProModal(false);
          if (res.founderNumber) {
            setShowFounderPassesModal(true);
          }
        } else if (res?.status === "rejected") {
          setPayProofFeedback(
            "Tu referencia no pudo ser confirmada. Por favor verifica tus datos.",
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

    const initialVerify = verifyAccessCode(proCodeInput, usedCoupons);
    let role = initialVerify.role;
    let token = initialVerify.token;
    const { couponIdHash, meta } = initialVerify;
    if (!role && proCodeInput.trim().length >= 6) {
      try {
        const srvCeo = await verifyCeoLoginServerFn({ data: { rawKey: proCodeInput } });
        if (srvCeo.authorized && srvCeo.token) {
          role = "ceo";
          token = srvCeo.token;
          if (srvCeo.activeVerifyHash) {
            localStorage.setItem(STORAGE_KEYS.CEO_ACTIVE_HASH, srvCeo.activeVerifyHash);
          } else {
            localStorage.removeItem(STORAGE_KEYS.CEO_ACTIVE_HASH);
          }
        }
      } catch {
        /* ignore */
      }
    }
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
      document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=${token}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);

      setProCodeInput("");
      setProCodeFeedback(null);
      setShowProModal(false);
      void navigate({ to: "/ceo" });
    } else if (role === "founder" && token && meta?.founderNumber) {
      try {
        const res = await consumeFounderServerFn({
          data: { code: proCodeInput.trim().toUpperCase() },
        });
        if (res && !res.success && res.error?.includes("ya fue")) {
          if (couponIdHash) {
            const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
            setUsedCoupons(nextUsed);
            localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
          }
          playBeep(0.3, 200, soundEnabled);
          setProCodeFeedback({
            type: "error",
            text: "Este Pase Fundador ya fue reclamado anteriormente.",
          });
          return;
        }
      } catch {
        /* fallback offline */
      }

      if (couponIdHash) {
        const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
        setUsedCoupons(nextUsed);
        localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
      }

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
      try {
        const res = await consumeGuestPassServerFn({
          data: { passCode: proCodeInput.trim().toUpperCase() },
        });
        if (res && !res.success) {
          if (couponIdHash) {
            const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
            setUsedCoupons(nextUsed);
            localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
          }
          playBeep(0.3, 200, soundEnabled);
          setProCodeFeedback({
            type: "error",
            text: res.error || "Este Pase de Invitado ya fue utilizado.",
          });
          return;
        }
      } catch {
        /* fallback offline */
      }

      if (couponIdHash) {
        const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
        setUsedCoupons(nextUsed);
        localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
      }

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
      // Cupón VIP promocional de uso libre ilimitado según decida el CEO
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
      // Cupones de prueba #01 a #10: Uso único estricto + 48 horas de duración
      const couponIdx = VIP_COUPON_HASHES_ORDERED.indexOf(couponIdHash) + 1;
      const assignedName = couponIdx === 1 ? "Ivana" : `Tester #${couponIdx}`;
      try {
        const serverCheck = await consumeSingleUseCouponServerFn({
          data: {
            couponIdHash,
            action: "consume",
            testerName: assignedName,
          },
        });
        if (!serverCheck.allowed) {
          const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
          setUsedCoupons(nextUsed);
          localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
          playBeep(0.3, 200, soundEnabled);
          setProCodeFeedback({
            type: "error",
            text: "Este cupón ya fue canjeado por otro jugador (1 solo uso).",
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

  const toggleUndercoverMode = () => {
    const next = !undercoverMode;
    setUndercoverMode(next);
    localStorage.setItem("impostor-undercover", String(next));
  };

  const activateFreeTrialRound = () => {
    if (freeTrialUsed) return;
    playFanfare(true, soundEnabled);
    setIsTrialRoundActive(true);
    setIsAdultUnlocked(true);
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
    setFounderNumber(null);
    setIsAdultUnlocked(false);
    localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
    localStorage.removeItem(STORAGE_KEYS.FOUNDER_NUMBER);
    localStorage.removeItem(STORAGE_KEYS.FOUNDER_CODE);
    localStorage.removeItem("impostor-pro-unlocked");
    localStorage.removeItem("impostor-ceo-admin");
    localStorage.removeItem("impostor-adult-unlocked");
    document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
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

  // Función helper para limpiar el estado del juego de localStorage
// Esto asegura una limpieza consistente en todo el código
const cleanupGameLocalStorage = () => {
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
  localStorage.removeItem(STORAGE_KEYS.FOUNDER_NUMBER);
  localStorage.removeItem(STORAGE_KEYS.FOUNDER_CODE);
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
    setFounderNumber(null);
    setWakeLockEnabled(true);
    setThemeMode("dark");
    localStorage.removeItem("impostor-theme");
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
    }
    setCategory("Aleatoria");
    setScores({ innocents: 0, impostors: 0 });
    cleanupGameLocalStorage();
    document.cookie = `${STORAGE_KEYS.CEO_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
    playPop(true);
  };

  const toggleWakeLock = () => {
    playPop(soundEnabled);
    const next = !wakeLockEnabled;
    setWakeLockEnabled(next);
    localStorage.setItem("impostor-wake-lock", String(next));
  };

  const toggleThemeMode = () => {
    playPop(soundEnabled);
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem("impostor-theme", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
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
        void trackGameEvent({ type: "pwa_install" });
        return;
      }
    }
    setShowInstallModal(true);
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

  // Assemble all active categories (memoized to prevent child re-renders on timer ticks)
  const allCats: Record<string, string[]> = useMemo(
    () => ({
      ...DEFAULT_CATEGORIES,
      ...(isAdultUnlocked ? { [ADULT_CATEGORY]: ADULT_WORDS } : {}),
      ...custom,
    }),
    [isAdultUnlocked, custom],
  );

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
    setImpostorWord(undercoverMode ? getUndercoverWord(selectedWord, fullList) : "");

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

    // Telemetría en vivo (Avisa a Discord #metricas-imposter y al Radar CEO)
    void trackGameEvent({
      type: "round_start",
      category: chosenCat,
      playerCount: names.length,
      impostorCount: chosenImpostors.length,
      isAdult: chosenCat === ADULT_CATEGORY,
      isJester: assignedJester !== null,
    });

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
    if (isTrialRoundActive) {
      setIsTrialRoundActive(false);
      setFreeTrialUsed(true);
      try {
        localStorage.setItem("impostor-free-trial-used", "true");
      } catch {
        /* ignore */
      }
    }
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
      void trackGameEvent({
        type: "round_finish",
        winner: "jester",
        category: playedCategory || category,
      });
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
      void trackGameEvent({
        type: "round_finish",
        winner: "impostors",
        category: playedCategory || category,
      });
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
      void trackGameEvent({
        type: "round_finish",
        winner: "impostors",
        category: playedCategory || category,
      });
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
        void trackGameEvent({
          type: "round_finish",
          winner: "innocents",
          category: playedCategory || category,
        });
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
                void navigate({ to: "/ceo" });
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

      {/* PHASE 1: SETUP (EXTRAÍDO A COMPONENTE) */}
      {phase === "setup" && (
        <PhaseSetup
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          names={names}
          updateNames={updateNames}
          shufflePlayers={shufflePlayers}
          getPlayerBadge={getPlayerBadge}
          getPlayerInitial={getPlayerInitial}
          hasPro={hasPro}
          openPaywall={openPaywall}
          soundEnabled={soundEnabled}
          playPop={playPop}
          impostorCount={impostorCount}
          updateImpostorCount={updateImpostorCount}
          maxImp={maxImp}
          minutes={minutes}
          updateMinutes={updateMinutes}
          accompliceMode={accompliceMode}
          toggleAccompliceMode={toggleAccompliceMode}
          undercoverMode={undercoverMode}
          toggleUndercoverMode={toggleUndercoverMode}
          randomEventsEnabled={randomEventsEnabled}
          toggleRandomEvents={toggleRandomEvents}
          jesterEnabled={jesterEnabled}
          toggleJester={toggleJester}
          freeTrialUsed={freeTrialUsed}
          isTrialRoundActive={isTrialRoundActive}
          activateFreeTrialRound={activateFreeTrialRound}
          onOpenOnlineRoom={() => setShowOnlineRoomModal(true)}
          category={category}
          setCategory={setCategory}
          custom={custom}
          allCats={allCats}
          usedWords={usedWords}
          isAdultUnlocked={isAdultUnlocked}
          openPinModal={(mode) => {
            playPop(soundEnabled);
            setPinModalMode(mode);
            setShowPinModal(true);
            setEnteredPin("");
            setPinError(false);
            setShowPinHint(false);
          }}
          startRound={startRound}
          setShowSettingsModal={setShowSettingsModal}
          btnGhost={btnGhost}
        />
      )}

      {/* MODAL: SALAS ONLINE EN TIEMPO REAL (QR / 4 LETRAS) */}
      {showOnlineRoomModal && (
        <OnlineRoomModal
          isOpen={showOnlineRoomModal}
          onClose={() => setShowOnlineRoomModal(false)}
          hasPro={hasPro}
          openPaywall={() => {
            setShowOnlineRoomModal(false);
            openPaywall();
          }}
          soundEnabled={soundEnabled}
          playPop={playPop}
          playFanfare={playFanfare}
          defaultPlayerName={names[0] || "Jugador 1"}
          category={category}
          impostorCount={impostorCount}
          minutes={minutes}
          undercoverMode={undercoverMode}
          jesterEnabled={jesterEnabled}
          accompliceMode={accompliceMode}
          initialJoinCode={initialOnlineRoomCode}
        />
      )}

      {/* MODAL: CENTRO DE CONFIGURACIÓN Y PERSONALIZACIÓN (EXTRAÍDO A COMPONENTE) */}
      {showSettingsModal && (
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
          openPaywall={openPaywall}
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
          themeMode={themeMode}
          toggleThemeMode={toggleThemeMode}
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
      )}

      {/* MODAL: TUS 5 PASES DE INVITACIÓN (EXTRAÍDO A COMPONENTE) */}
      {showFounderPassesModal && founderNumber !== null && (
        <FounderPassesModal
          isOpen={showFounderPassesModal}
          onClose={() => setShowFounderPassesModal(false)}
          founderNumber={founderNumber}
          founderGuestPasses={founderGuestPasses}
        />
      )}

      {/* MODAL: PARTY PASS PRO & ACCESO CEO (EXTRAÍDO A COMPONENTE) */}
      {showProModal && (
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
          freeTrialUsed={freeTrialUsed}
          onActivateFreeTrial={activateFreeTrialRound}
        />
      )}

      {/* MODAL: COMPARTIR JUEGO Y CÓDIGO QR (EXTRAÍDO A COMPONENTE) */}
      {showShareModal && (
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
      )}

      {/* MODAL: INSTALACIÓN PWA (EXTRAÍDO A COMPONENTE) */}
      {showInstallModal && (
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
      )}

      {/* MODAL: TECLADO PIN PARA SECCIÓN +18 (EXTRAÍDO A COMPONENTE) */}
      {showPinModal && (
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
      )}

      {/* PHASE 2: REVEAL (EXTRAÍDO A COMPONENTE) */}
      {phase === "reveal" && (
        <PhaseReveal
          names={names}
          turn={turn}
          getPlayerBadge={getPlayerBadge}
          getPlayerInitial={getPlayerInitial}
          getPlayerName={getPlayerName}
          handleStartHold={handleStartHold}
          handleEndHold={handleEndHold}
          isHolding={isHolding}
          impostors={impostors}
          jesterIndex={jesterIndex}
          accompliceMode={accompliceMode}
          undercoverMode={undercoverMode}
          word={word}
          impostorWord={impostorWord}
          playedCategory={playedCategory}
          hasSeenRole={hasSeenRole}
          nextTurn={nextTurn}
          btnPrimary={btnPrimary}
        />
      )}

      {/* PHASE 3: DISCUSS (EXTRAÍDO A COMPONENTE) */}
      {phase === "discuss" && (
        <PhaseDiscuss
          minutes={minutes}
          timeLeft={timeLeft}
          paused={paused}
          setPaused={setPaused}
          setTimeLeft={setTimeLeft}
          isWakeLockActiveState={isWakeLockActiveState}
          activeEvent={activeEvent}
          starter={starter}
          getPlayerBadge={getPlayerBadge}
          getPlayerInitial={getPlayerInitial}
          getPlayerName={getPlayerName}
          soundEnabled={soundEnabled}
          playPop={playPop}
          setPhase={setPhase}
          handleDirectReveal={handleDirectReveal}
          btnPrimary={btnPrimary}
          btnGhost={btnGhost}
        />
      )}

      {/* PHASE 4: VOTE (EXTRAÍDO A COMPONENTE) */}
      {phase === "vote" && (
        <PhaseVote
          names={names}
          impostors={impostors}
          caughtImpostors={caughtImpostors}
          accusedIndex={accusedIndex}
          setAccusedIndex={setAccusedIndex}
          getPlayerBadge={getPlayerBadge}
          getPlayerInitial={getPlayerInitial}
          getPlayerName={getPlayerName}
          soundEnabled={soundEnabled}
          playPop={playPop}
          handleVoteConfirmation={handleVoteConfirmation}
          handleDirectReveal={handleDirectReveal}
          showImpostorGuessModal={showImpostorGuessModal}
          handleImpostorGuessResult={handleImpostorGuessResult}
          word={word}
          categoryPool={allCats[playedCategory] || DEFAULT_CATEGORIES["Comida"] || []}
          btnPrimary={btnPrimary}
          btnDanger={btnDanger}
          btnGhost={btnGhost}
        />
      )}

      {/* PHASE 5: RESULT (EXTRAÍDO A COMPONENTE) */}
      {phase === "result" && (
        <PhaseResult
          roundWinner={roundWinner}
          winReason={winReason}
          impostors={impostors}
          jesterIndex={jesterIndex}
          word={word}
          impostorWord={impostorWord}
          undercoverMode={undercoverMode}
          playedCategory={playedCategory}
          scores={scores}
          category={category}
          getPlayerBadge={getPlayerBadge}
          getPlayerInitial={getPlayerInitial}
          getPlayerName={getPlayerName}
          soundEnabled={soundEnabled}
          playPop={playPop}
          startRound={startRound}
          setSetupStep={setSetupStep}
          setPhase={setPhase}
          btnPrimary={btnPrimary}
          btnGhost={btnGhost}
        />
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
