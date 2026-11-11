import React from "react";
import { Target, ShieldAlert, Check, X } from "lucide-react";

export interface PhaseVoteProps {
  names: string[];
  impostors: number[];
  caughtImpostors: number[];
  accusedIndex: number | null;
  setAccusedIndex: (idx: number | null) => void;
  getPlayerBadge: (idx: number) => { bg: string; text: string; border: string };
  getPlayerInitial: (idx: number) => string;
  getPlayerName: (idx: number) => string;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  handleVoteConfirmation: (accused: number) => void;
  handleDirectReveal: () => void;
  showImpostorGuessModal: boolean;
  handleImpostorGuessResult: (guessed: boolean) => void;
  btnPrimary: string;
  btnDanger: string;
  btnGhost: string;
}

export function PhaseVote({
  names,
  impostors,
  caughtImpostors,
  accusedIndex,
  setAccusedIndex,
  getPlayerBadge,
  getPlayerInitial,
  getPlayerName,
  soundEnabled,
  playPop,
  handleVoteConfirmation,
  handleDirectReveal,
  showImpostorGuessModal,
  handleImpostorGuessResult,
  btnPrimary,
  btnDanger,
  btnGhost,
}: PhaseVoteProps) {
  return (
    <>
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
    </>
  );
}
