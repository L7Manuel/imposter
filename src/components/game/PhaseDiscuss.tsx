import React from "react";
import { Sun, Zap } from "lucide-react";

export interface PhaseDiscussProps {
  minutes: number;
  timeLeft: number;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isWakeLockActiveState: boolean;
  activeEvent: { icon: string; title: string; description: string } | null;
  starter: number;
  getPlayerBadge: (idx: number) => { bg: string; text: string; border: string };
  getPlayerInitial: (idx: number) => string;
  getPlayerName: (idx: number) => string;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  setPhase: (phase: "setup" | "reveal" | "discuss" | "vote" | "result") => void;
  handleDirectReveal: () => void;
  btnPrimary: string;
  btnGhost: string;
}

export function PhaseDiscuss({
  minutes,
  timeLeft,
  paused,
  setPaused,
  setTimeLeft,
  isWakeLockActiveState,
  activeEvent,
  starter,
  getPlayerBadge,
  getPlayerInitial,
  getPlayerName,
  soundEnabled,
  playPop,
  setPhase,
  handleDirectReveal,
  btnPrimary,
  btnGhost,
}: PhaseDiscussProps) {
  const totalSeconds = minutes * 60;
  const progress = Math.max(0, timeLeft / totalSeconds);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 30 && !isUrgent;

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Radial SVG Timer */}
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
              isUrgent ? "text-destructive" : isWarning ? "text-amber-400" : "text-foreground"
            }`}
          >
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {paused ? "⏸ PAUSADO" : "En curso"}
          </span>
        </div>
      </div>

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
            <Zap size={14} className="text-accent shrink-0" />
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
          <strong className="text-primary text-base font-semibold">{getPlayerName(starter)}</strong>
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
  );
}
