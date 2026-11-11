import React from "react";
import { Fingerprint, ShieldAlert, Sparkles } from "lucide-react";

export interface PhaseRevealProps {
  names: string[];
  turn: number;
  getPlayerBadge: (idx: number) => { bg: string; text: string; border: string };
  getPlayerInitial: (idx: number) => string;
  getPlayerName: (idx: number) => string;
  handleStartHold: (e: React.PointerEvent) => void;
  handleEndHold: (e: React.PointerEvent) => void;
  isHolding: boolean;
  impostors: number[];
  jesterIndex: number | null;
  accompliceMode: boolean;
  word: string;
  playedCategory: string;
  hasSeenRole: boolean;
  nextTurn: () => void;
  btnPrimary: string;
}

export function PhaseReveal({
  names,
  turn,
  getPlayerBadge,
  getPlayerInitial,
  getPlayerName,
  handleStartHold,
  handleEndHold,
  isHolding,
  impostors,
  jesterIndex,
  accompliceMode,
  word,
  playedCategory,
  hasSeenRole,
  nextTurn,
  btnPrimary,
}: PhaseRevealProps) {
  return (
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
  );
}
