import React, { useState } from "react";
import {
  Sparkles,
  Trophy,
  ShieldAlert,
  LayoutGrid,
  User,
  RefreshCw,
  Share2,
  Check,
  Flame,
} from "lucide-react";
import { ConfettiCanvas } from "@/lib/confetti";
import { PARTY_PENALTIES } from "@/data/categories";

export interface PhaseResultProps {
  roundWinner: "innocents" | "impostors" | "jester" | null;
  winReason: string;
  impostors: number[];
  jesterIndex: number | null;
  word: string;
  impostorWord: string;
  undercoverMode: boolean;
  playedCategory: string;
  scores: { innocents: number; impostors: number };
  category: string;
  getPlayerBadge: (idx: number) => { bg: string; text: string; border: string };
  getPlayerInitial: (idx: number) => string;
  getPlayerName: (idx: number) => string;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  startRound: () => void;
  setSetupStep: (step: 1 | 2 | 3) => void;
  setPhase: (phase: "setup" | "reveal" | "discuss" | "vote" | "result") => void;
  btnPrimary: string;
  btnGhost: string;
}

export function PhaseResult({
  roundWinner,
  winReason,
  impostors,
  jesterIndex,
  word,
  impostorWord,
  undercoverMode,
  playedCategory,
  scores,
  category,
  getPlayerBadge,
  getPlayerInitial,
  getPlayerName,
  soundEnabled,
  playPop,
  startRound,
  setSetupStep,
  setPhase,
  btnPrimary,
  btnGhost,
}: PhaseResultProps) {
  const [selectedPenalty, setSelectedPenalty] = useState<string | null>(null);
  const [isSpinningPenalty, setIsSpinningPenalty] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);

  const handleSpinPenalty = () => {
    playPop(soundEnabled);
    setIsSpinningPenalty(true);
    let ticks = 0;
    const interval = setInterval(() => {
      const randomItem = PARTY_PENALTIES[Math.floor(Math.random() * PARTY_PENALTIES.length)]!;
      setSelectedPenalty(randomItem);
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        setIsSpinningPenalty(false);
      }
    }, 80);
  };

  const handleShareMatchSummary = async () => {
    playPop(soundEnabled);
    const impNames = impostors.map((i) => getPlayerName(i)).join(" y ");
    const outcomeText =
      roundWinner === "innocents"
        ? `¡Atrapamos a ${impNames} mintiendo en El Impostor!`
        : roundWinner === "jester"
          ? `¡${jesterIndex !== null ? getPlayerName(jesterIndex) : "El Bufón"} nos engañó a todos como Bufón!`
          : `¡${impNames} engañó a toda la mesa siendo el Impostor!`;
    const wordSummary =
      undercoverMode && impostorWord
        ? `Palabra Inocente: "${word}" vs Infiltrado: "${impostorWord}" (${playedCategory}).`
        : `La palabra secreta era "${word}" (${playedCategory}).`;
    const url =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://imposter.manu-07games.workers.dev";
    const fullText = `${outcomeText} ${wordSummary} Juega gratis con tus amigos en: ${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Resultado de nuestra partida en El Impostor",
          text: fullText,
          url,
        });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in-95 duration-200 pb-6">
      <ConfettiCanvas winner={roundWinner} />

      {/* Winner Banner with Celebration / Siren Effects */}
      {roundWinner ? (
        <div
          className={`relative overflow-hidden rounded-3xl p-5 w-full max-w-xs border shadow-xl ${
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
                  size={28}
                  className="text-primary drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                />
                <Sparkles size={20} className="text-primary animate-bounce" />
              </>
            ) : roundWinner === "jester" ? (
              <Sparkles size={32} className="text-purple-300 animate-bounce" />
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
          <h2 className="font-display text-2xl text-foreground tracking-wide">Fin de la Ronda</h2>
        </div>
      )}

      {/* Impostores Revelados */}
      <div className="w-full max-w-xs rounded-3xl bg-destructive p-5 text-destructive-foreground glow-danger shadow-xl">
        <span className="text-xs uppercase tracking-widest opacity-80 font-bold">
          {undercoverMode
            ? impostors.length > 1
              ? "Los infiltrados engañados eran"
              : "El infiltrado engañado era"
            : impostors.length > 1
              ? "Los impostores eran"
              : "El impostor era"}
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
            <span className="opacity-85">El Bufón era: </span>
            <strong className="font-display tracking-wide">{getPlayerName(jesterIndex)}</strong>
          </div>
        )}
      </div>

      {/* Palabra Secreta (y Palabra Gemela si estaba en modo Infiltrado) */}
      <div className="w-full max-w-xs rounded-3xl glass-panel p-4 shadow-xl space-y-2">
        {undercoverMode && impostorWord ? (
          <div className="grid grid-cols-2 gap-2 divide-x divide-white/10">
            <div className="px-1">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Inocentes
              </span>
              <span className="font-display text-2xl text-primary">{word}</span>
            </div>
            <div className="px-1">
              <span className="block text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                Infiltrado
              </span>
              <span className="font-display text-2xl text-amber-300">{impostorWord}</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              La palabra secreta era
            </p>
            <p className="font-display text-3xl text-primary my-1 drop-shadow-md">{word}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-1 border-t border-white/10">
          Categoría: <span className="font-semibold text-foreground">{playedCategory}</span>
        </p>
      </div>

      {/* Ruleta de Penitencia / Reto del Perdedor (Motor Viral) */}
      <div className="w-full max-w-xs rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-4 text-left shadow-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Flame size={15} />
            <span className="font-display text-sm tracking-wider">PENITENCIA DE FIESTA</span>
          </div>
          <button
            type="button"
            disabled={isSpinningPenalty}
            onClick={handleSpinPenalty}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1 text-[11px] font-extrabold text-slate-950 shadow transition hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <RefreshCw size={12} className={isSpinningPenalty ? "animate-spin" : ""} />
            <span>{selectedPenalty ? "Otro Reto" : "Girar Reto"}</span>
          </button>
        </div>
        <p className="text-xs text-foreground/95 leading-relaxed">
          {selectedPenalty ||
            "¿Alguien perdió la ronda? Gira la ruleta para asignarle un reto social o penitencia antes de la siguiente partida."}
        </p>
      </div>

      {/* Marcador Actual + Compartir Crónica */}
      <div className="flex items-center justify-between gap-2 w-full max-w-xs">
        <div className="flex flex-1 items-center justify-around rounded-2xl glass-panel py-2.5 px-3 shadow-xl text-sm">
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Inocentes</span>
            <span className="font-display text-xl text-primary">{scores.innocents}</span>
          </div>
          <span className="text-muted-foreground/60 text-sm font-bold">vs</span>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Impostores</span>
            <span className="font-display text-xl text-destructive">{scores.impostors}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShareMatchSummary}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-accent/15 hover:bg-accent/25 border border-accent/40 px-4 py-2.5 text-accent transition active:scale-95 cursor-pointer shrink-0"
        >
          {copiedStory ? <Check size={16} /> : <Share2 size={16} />}
          <span className="text-[10px] font-bold">{copiedStory ? "¡Copiado!" : "Compartir"}</span>
        </button>
      </div>

      {/* Next Actions */}
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <button className={`${btnPrimary} w-full py-3.5`} onClick={startRound}>
          Otra ronda ({category === "Aleatoria" ? "Aleatoria" : category})
        </button>
        <div className="flex w-full gap-2">
          <button
            className={`${btnGhost} flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5`}
            onClick={() => {
              playPop(soundEnabled);
              setSetupStep(3);
              setPhase("setup");
            }}
          >
            <LayoutGrid size={14} /> Cambiar Tema
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
  );
}
