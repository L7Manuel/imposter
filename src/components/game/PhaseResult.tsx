import React from "react";
import { Sparkles, Trophy, ShieldAlert, LayoutGrid, User } from "lucide-react";
import { ConfettiCanvas } from "@/lib/confetti";

export interface PhaseResultProps {
  roundWinner: "innocents" | "impostors" | "jester" | null;
  winReason: string;
  impostors: number[];
  jesterIndex: number | null;
  word: string;
  playedCategory: string;
  scores: { innocents: number; impostors: number };
  category: string;
  getPlayerBadge: (idx: number) => { bg: string; text: string; border: string };
  getPlayerInitial: (idx: number) => string;
  getPlayerName: (idx: number) => string;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  startRound: () => void;
  setSetupStep: (step: 1 | 2) => void;
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
  return (
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
            <span className="opacity-85">El Bufón era: </span>
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
          Otra ronda ({category === "Aleatoria" ? "Aleatoria" : category})
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
  );
}
