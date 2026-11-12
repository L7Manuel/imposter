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
} from "lucide-react";
import { DEFAULT_CATEGORIES, ADULT_CATEGORY, ADULT_WORDS, PRO_CATEGORIES } from "@/data/categories";
import { CategoryIcon } from "@/components/CategoryIcon";

const FREE_MAX_PLAYERS = 6;

export interface PhaseSetupProps {
  setupStep: 1 | 2;
  setSetupStep: (step: 1 | 2) => void;
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
  randomEventsEnabled: boolean;
  toggleRandomEvents: () => void;
  jesterEnabled: boolean;
  toggleJester: () => void;
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
  randomEventsEnabled,
  toggleRandomEvents,
  jesterEnabled,
  toggleJester,
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
          <span className="truncate">2. {category === "Aleatoria" ? "Categoría" : category}</span>
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
              <span className="text-xs font-semibold text-muted-foreground">Tiempo de debate</span>
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
              <span className="text-[10px] text-muted-foreground text-center">1 a 15 minutos</span>
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
                {accompliceMode ? <Users size={13} /> : <Shuffle size={13} />}
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
                <Zap size={13} className="text-amber-400" />
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
                <Sparkles size={13} className="text-purple-300" />
                <span className="truncate">Bufón</span>
                {!hasPro && <Crown size={11} className="text-amber-400 shrink-0" />}
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-tight">
              {accompliceMode
                ? "Los impostores se conocen entre sí"
                : "Modo Caos: los impostores no saben quién es su aliado"}
              {randomEventsEnabled && hasPro ? " · Con retos por ronda" : ""}
              {jesterEnabled && hasPro ? " · Bufón infiltrado" : ""}
            </p>
          </div>

          {/* Botón Flotante Inteligente */}
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
                      <span className="text-xs font-semibold leading-tight line-clamp-1">{c}</span>
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
                    openPinModal("unlock");
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

          {/* Botón Flotante Inteligente */}
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
                  {category === "Aleatoria" ? "Aleatoria" : category}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
