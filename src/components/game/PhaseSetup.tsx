import React from "react";
import {
  User,
  LayoutGrid,
  Shuffle,
  Trash2,
  Plus,
  Crown,
  Minus,
  ArrowRight,
  ArrowLeft,
  Play,
  Flame,
  Unlock,
  Lock,
  Zap,
  Sparkles,
  Users,
  Wifi,
  Smartphone,
  EyeOff,
  Gift,
  Sliders,
} from "lucide-react";
import { DEFAULT_CATEGORIES, ADULT_CATEGORY, ADULT_WORDS, PRO_CATEGORIES } from "@/data/categories";
import { CategoryIcon } from "@/components/CategoryIcon";

const FREE_MAX_PLAYERS = 6;

const CATEGORY_THEME_STYLES: Record<string, string> = {
  Aleatoria: "from-amber-500/20 via-primary/5 to-transparent border-primary/30 text-primary",
  Comida: "from-orange-500/20 via-amber-500/5 to-transparent border-orange-400/30 text-orange-300",
  Lugares: "from-cyan-500/20 via-sky-500/5 to-transparent border-cyan-400/30 text-cyan-300",
  Animales:
    "from-emerald-500/20 via-green-500/5 to-transparent border-emerald-400/30 text-emerald-300",
  Objetos: "from-indigo-500/20 via-blue-500/5 to-transparent border-indigo-400/30 text-indigo-300",
  Profesiones: "from-sky-500/20 via-blue-500/5 to-transparent border-sky-400/30 text-sky-300",
  "Cine y Series":
    "from-purple-500/20 via-violet-500/5 to-transparent border-purple-400/30 text-purple-300",
  Deportes: "from-lime-500/20 via-emerald-500/5 to-transparent border-lime-400/30 text-lime-300",
  "Videojuegos y Geek":
    "from-fuchsia-500/20 via-pink-500/5 to-transparent border-fuchsia-400/30 text-fuchsia-300",
  "Música y Artistas":
    "from-pink-500/20 via-rose-500/5 to-transparent border-pink-400/30 text-pink-300",
  "Países y Maravillas":
    "from-teal-500/20 via-cyan-500/5 to-transparent border-teal-400/30 text-teal-300",
};

export interface PhaseSetupProps {
  setupStep: 1 | 2 | 3;
  setSetupStep: (step: 1 | 2 | 3) => void;
  names: string[];
  updateNames: (names: string[]) => void;
  shufflePlayers: () => void;
  getPlayerBadge: (idx: number) => { bg: string; text: string; border: string };
  getPlayerInitial: (idx: number) => string;
  hasPro: boolean;
  openPaywall: () => void;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  impostorCount: number;
  updateImpostorCount: (count: number) => void;
  maxImp: number;
  minutes: number;
  updateMinutes: (min: number) => void;
  accompliceMode: boolean;
  toggleAccompliceMode: () => void;
  undercoverMode: boolean;
  toggleUndercoverMode: () => void;
  randomEventsEnabled: boolean;
  toggleRandomEvents: () => void;
  jesterEnabled: boolean;
  toggleJester: () => void;
  freeTrialUsed: boolean;
  isTrialRoundActive: boolean;
  activateFreeTrialRound: () => void;
  onOpenOnlineRoom: () => void;
  category: string;
  setCategory: (cat: string) => void;
  custom: Record<string, string[]>;
  allCats: Record<string, string[]>;
  usedWords: Record<string, string[]>;
  isAdultUnlocked: boolean;
  openPinModal: (mode: "unlock" | "change") => void;
  startRound: () => void;
  setShowSettingsModal: (show: boolean) => void;
  btnGhost: string;
}

export function PhaseSetup({
  setupStep,
  setSetupStep,
  names,
  updateNames,
  shufflePlayers,
  getPlayerBadge,
  getPlayerInitial,
  hasPro,
  openPaywall,
  soundEnabled,
  playPop,
  impostorCount,
  updateImpostorCount,
  maxImp,
  minutes,
  updateMinutes,
  accompliceMode,
  toggleAccompliceMode,
  undercoverMode,
  toggleUndercoverMode,
  randomEventsEnabled,
  toggleRandomEvents,
  jesterEnabled,
  toggleJester,
  freeTrialUsed,
  isTrialRoundActive,
  activateFreeTrialRound,
  onOpenOnlineRoom,
  category,
  setCategory,
  custom,
  allCats,
  usedWords,
  isAdultUnlocked,
  openPinModal,
  startRound,
  setShowSettingsModal,
  btnGhost,
}: PhaseSetupProps) {
  return (
    <section className="flex flex-col gap-4 pb-8 animate-in fade-in duration-200">
      {/* Selector Principal: 1 Teléfono vs Sala Online Multicelular */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="relative flex items-center gap-2.5 rounded-2xl bg-primary/15 border-2 border-primary/50 p-3 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Smartphone size={18} />
          </div>
          <div className="min-w-0">
            <span className="block font-display text-sm tracking-wider text-primary leading-none">
              1 TELÉFONO
            </span>
            <span className="block text-[10px] text-foreground/80 truncate mt-0.5">
              Pasa el móvil · Offline
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playPop(soundEnabled);
            onOpenOnlineRoom();
          }}
          className="group relative flex items-center gap-2.5 rounded-2xl glass-panel border border-accent/35 hover:border-accent bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-3 text-left transition hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg"
        >
          <span className="absolute -top-2 right-2.5 rounded-full bg-accent px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider text-slate-950 shadow">
            NUEVO · QR
          </span>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent group-hover:bg-accent group-hover:text-slate-950 transition">
            <Wifi size={18} />
          </div>
          <div className="min-w-0">
            <span className="block font-display text-sm tracking-wider text-accent leading-none">
              SALA ONLINE
            </span>
            <span className="block text-[10px] text-muted-foreground group-hover:text-foreground truncate mt-0.5">
              Cada quien en su móvil
            </span>
          </div>
        </button>
      </div>

      {/* Banner de 1 Ronda VIP de Cortesía Gratis (Gancho de Conversión) */}
      {!hasPro && !freeTrialUsed && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent p-3.5 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300">
                <Gift size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Regalo de Bienvenida: 1 Ronda VIP Gratis
                </span>
                <p className="text-[11px] text-foreground/85 leading-tight mt-0.5">
                  Prueba +18, El Bufón, Eventos y hasta 15 amigos por 1 partida sin pagar.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playPop(soundEnabled);
                activateFreeTrialRound();
              }}
              className="shrink-0 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              Activar
            </button>
          </div>
        </div>
      )}

      {isTrialRoundActive && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-center text-xs font-bold text-emerald-300">
          Ronda VIP de Cortesía Activa — ¡Todas las categorías y modos PRO desbloqueados para esta
          partida!
        </div>
      )}

      {/* Barra de Navegación de 3 Pasos (1. Jugadores -> 2. Config -> 3. Categoría) */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl glass-panel p-1.5 shadow-lg border border-white/10">
        <button
          type="button"
          onClick={() => {
            playPop(soundEnabled);
            setSetupStep(1);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition cursor-pointer ${
            setupStep === 1
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <User size={13} />
          <span className="truncate">1. Mesa ({names.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop(soundEnabled);
            setSetupStep(2);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition cursor-pointer ${
            setupStep === 2
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Sliders size={13} />
          <span className="truncate">2. Ajustes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop(soundEnabled);
            setSetupStep(3);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition cursor-pointer ${
            setupStep === 3
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <LayoutGrid size={13} />
          <span className="truncate">3. {category === "Aleatoria" ? "Tema" : category}</span>
        </button>
      </div>

      {/* PASO 1: SALA DE JUGADORES */}
      {setupStep === 1 && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-5 shadow-2xl border border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
                  <User size={16} />
                </div>
                <div>
                  <h2 className="font-display text-xl tracking-wide text-foreground leading-none">
                    JUGADORES EN LA MESA
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Toca cualquier nombre para editarlo ({names.length} de {hasPro ? 15 : 6})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={shufflePlayers}
                title="Mezclar orden de jugadores"
                className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-[11px] font-semibold text-foreground/90 border border-white/10 transition active:scale-95 cursor-pointer"
              >
                <Shuffle size={12} className="text-primary" /> Mezclar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
              {names.map((n, i) => {
                const badge = getPlayerBadge(i);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-2xl bg-background/70 px-3 py-2.5 border border-white/10 transition focus-within:border-primary/50 hover:border-white/20"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${badge.bg} ${badge.text} border ${badge.border} shadow-sm`}
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
                      className="flex-1 min-w-0 bg-transparent px-1 py-0.5 text-sm outline-none font-semibold text-foreground placeholder:text-muted-foreground/50"
                    />
                    {names.length > 3 && (
                      <button
                        aria-label={`Eliminar a ${n}`}
                        onClick={() => {
                          playPop(soundEnabled);
                          updateNames(names.filter((_, j) => j !== i));
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-destructive/20 hover:text-destructive cursor-pointer"
                      >
                        <Trash2 size={15} />
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
                  ? "group relative mt-4 flex w-full items-center justify-between overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-400/[0.06] to-transparent px-4 py-3 text-sm font-medium text-foreground transition hover:border-amber-400/50 active:scale-[0.98] cursor-pointer"
                  : `${btnGhost} mt-4 flex w-full items-center justify-center gap-1.5 py-3 text-sm font-semibold`
              }
            >
              {!hasPro && names.length >= FREE_MAX_PLAYERS ? (
                <>
                  <span className="flex items-center gap-2 text-xs font-bold text-foreground/95">
                    <Plus size={15} className="text-amber-300" />
                    Añadir 7º a 15º amigo a la mesa
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/40 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300">
                    <Crown size={10} /> PRO
                  </span>
                </>
              ) : (
                <>
                  <Plus size={16} /> Añadir jugador ({names.length}/15)
                </>
              )}
            </button>
          </div>

          {/* Botón Flotante Paso 1 -> Paso 2 */}
          <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
            <button
              onClick={() => {
                playPop(soundEnabled);
                setSetupStep(2);
              }}
              className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-6 pr-4 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
            >
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="font-display text-base tracking-wider">CONFIGURAR PARTIDA</span>
                <span className="text-[10px] font-bold opacity-80">
                  Paso 2 de 3 · Modos y Reglas
                </span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: CONFIGURACIÓN DE PARTIDA Y MODOS TÁCTICOS */}
      {setupStep === 2 && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Controles de Impostores y Tiempo */}
          <div className="grid grid-cols-2 gap-3">
            {/* Impostores Box */}
            <div className="flex flex-col justify-between rounded-3xl glass-panel p-4 shadow-2xl border border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Impostores
              </span>
              <div className="my-3 flex items-center justify-between">
                <button
                  aria-label="Reducir impostores"
                  disabled={impostorCount <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                  onClick={() => {
                    playPop(soundEnabled);
                    updateImpostorCount(Math.max(1, impostorCount - 1));
                  }}
                >
                  <Minus size={18} className="stroke-[2.5]" />
                </button>

                <span className="font-display text-4xl text-destructive tracking-wide drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]">
                  {Math.min(impostorCount, maxImp)}
                </span>

                <button
                  aria-label="Aumentar impostores"
                  disabled={impostorCount >= maxImp}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
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
            <div className="flex flex-col justify-between rounded-3xl glass-panel p-4 shadow-2xl border border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tiempo Debate
              </span>
              <div className="my-3 flex items-center justify-between">
                <button
                  aria-label="Reducir tiempo"
                  disabled={minutes <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                  onClick={() => {
                    playPop(soundEnabled);
                    updateMinutes(Math.max(1, minutes - 1));
                  }}
                >
                  <Minus size={18} className="stroke-[2.5]" />
                </button>

                <span className="font-display text-4xl text-accent tracking-wide drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                  {minutes}m
                </span>

                <button
                  aria-label="Aumentar tiempo"
                  disabled={minutes >= 15}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                  onClick={() => {
                    playPop(soundEnabled);
                    updateMinutes(Math.min(15, minutes + 1));
                  }}
                >
                  <Plus size={18} className="stroke-[2.5]" />
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground text-center">1 a 15 minutos</span>
            </div>
          </div>

          {/* Tarjetas Visuales de Modos Especiales (2x2 Arcade Grid) */}
          <div className="rounded-3xl glass-panel p-5 space-y-3.5 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg tracking-wider text-foreground leading-none">
                  MODOS TÁCTICOS DE PARTIDA
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Activa variantes especiales para sorprender a la mesa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. PISTA CAMALEÓN (Palabra Señuelo para el Impostor) */}
              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  toggleUndercoverMode();
                }}
                className={`relative flex flex-col items-start justify-between rounded-2xl p-3.5 text-left border transition active:scale-95 cursor-pointer ${
                  undercoverMode
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.25)]"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <div className="flex w-full items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <EyeOff
                      size={15}
                      className={undercoverMode ? "text-emerald-300" : "text-muted-foreground"}
                    />
                    <span className="text-xs font-extrabold">Pista Camaleón</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      undercoverMode
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {undercoverMode ? "ACTIVO" : "APAGADO"}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  El impostor ve su carta roja + una palabra señuelo parecida para no quedarse en
                  blanco al hablar.
                </p>
              </button>

              {/* 2. CÓMPLICES VS CAOS */}
              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  toggleAccompliceMode();
                }}
                className={`relative flex flex-col items-start justify-between rounded-2xl p-3.5 text-left border transition active:scale-95 cursor-pointer ${
                  accompliceMode
                    ? "bg-primary/15 border-primary/45 text-primary shadow-sm"
                    : "bg-orange-500/15 border-orange-500/45 text-orange-300 shadow-sm"
                }`}
              >
                <div className="flex w-full items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {accompliceMode ? <Users size={15} /> : <Shuffle size={15} />}
                    <span className="text-xs font-extrabold">
                      {accompliceMode ? "Alianza Impostora" : "Modo Caos"}
                    </span>
                  </div>
                  <span className="rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold">
                    {accompliceMode ? "SE CONOCEN" : "A CIEGAS"}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  {accompliceMode
                    ? "Si hay 2+ impostores en la ronda, ven el nombre de su compañero."
                    : "Los impostores no saben quién es su aliado y pueden acusarse entre sí."}
                </p>
              </button>

              {/* 3. EVENTOS RELÁMPAGO (PRO) */}
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
                className={`relative flex flex-col items-start justify-between rounded-2xl p-3.5 text-left border transition active:scale-95 cursor-pointer ${
                  randomEventsEnabled && hasPro
                    ? "bg-accent/20 border-accent text-accent shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <div className="flex w-full items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Zap size={15} className="text-amber-400" />
                    <span className="text-xs font-extrabold">Eventos Relámpago</span>
                  </div>
                  {!hasPro ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                      <Crown size={9} /> PRO
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        randomEventsEnabled
                          ? "bg-accent text-slate-950"
                          : "bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {randomEventsEnabled ? "ACTIVO" : "APAGADO"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  Activa reglas sorpresa al azar en el debate (solo 1 palabra, preguntas, etc.).
                </p>
              </button>

              {/* 4. EL BUFÓN (PRO) */}
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
                className={`relative flex flex-col items-start justify-between rounded-2xl p-3.5 text-left border transition active:scale-95 cursor-pointer ${
                  jesterEnabled && hasPro
                    ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_18px_rgba(147,51,234,0.25)]"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <div className="flex w-full items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} className="text-purple-300" />
                    <span className="text-xs font-extrabold">El Bufón</span>
                  </div>
                  {!hasPro ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                      <Crown size={9} /> PRO
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        jesterEnabled
                          ? "bg-purple-400 text-slate-950"
                          : "bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {jesterEnabled ? "ACTIVO" : "APAGADO"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  Un tercer bando infiltrado que conoce la palabra y gana si logra que lo voten.
                </p>
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
            <ArrowLeft size={14} /> Volver a Jugadores ({names.length})
          </button>

          {/* Botón Flotante Paso 2 -> Paso 3 */}
          <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
            <button
              onClick={() => {
                playPop(soundEnabled);
                setSetupStep(3);
              }}
              className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-6 pr-4 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
            >
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="font-display text-base tracking-wider">ELEGIR CATEGORÍA</span>
                <span className="text-[10px] font-bold opacity-80">Paso 3 de 3 · Mazo Secreto</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: GALERÍA DE CATEGORÍAS CON IDENTIDAD CROMÁTICA */}
      {setupStep === 3 && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-5 shadow-2xl border border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl tracking-wide text-foreground">
                  MAZO DE CATEGORÍAS
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Elige el tema para los {names.length} jugadores ({Math.min(impostorCount, maxImp)}{" "}
                  impostor{Math.min(impostorCount, maxImp) > 1 ? "es" : ""})
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
                  const themeStyle =
                    CATEGORY_THEME_STYLES[c] ||
                    "from-primary/15 via-white/5 to-transparent border-white/15 text-primary";

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
                      className={`relative flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition duration-150 cursor-pointer border overflow-hidden ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/50 border-primary scale-[1.02]"
                          : isLockedByPro
                            ? "bg-white/[0.02] hover:bg-amber-400/[0.06] text-foreground/85 border-white/10 hover:border-amber-400/30 active:scale-95"
                            : `bg-gradient-to-br ${themeStyle} hover:brightness-110 active:scale-95 text-foreground`
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
                            : "bg-black/25 border-white/10 text-current"
                        }`}
                      >
                        <CategoryIcon category={c} size={18} />
                      </div>
                      <span className="text-xs font-semibold leading-tight line-clamp-1">{c}</span>
                      <span
                        className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? "bg-black/20 text-primary-foreground"
                            : "bg-black/25 text-muted-foreground"
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
                    openPinModal("unlock");
                  } else {
                    setCategory(ADULT_CATEGORY);
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition duration-150 cursor-pointer border overflow-hidden ${
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
              setSetupStep(2);
            }}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start px-2 py-1 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver a Ajustes y Modos
          </button>

          {/* Botón Flotante Inteligente: REPARTIR CARTAS */}
          <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
            <button
              onClick={startRound}
              className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-4 pr-6 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                <Play size={20} className="fill-current ml-0.5" />
              </div>
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="font-display text-lg tracking-wider">REPARTIR CARTAS</span>
                <span className="text-[10px] font-bold opacity-80 max-w-[140px] truncate">
                  {category === "Aleatoria" ? "Tema Aleatorio" : category}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
