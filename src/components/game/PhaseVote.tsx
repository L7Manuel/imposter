import React, { useMemo } from "react";
import { Target, ShieldAlert, Check, X, Crosshair } from "lucide-react";

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
  word: string;
  categoryPool: string[];
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
  word,
  categoryPool,
  btnPrimary,
  btnDanger,
  btnGhost,
}: PhaseVoteProps) {
  // Generar 5 opciones interactivas para el Disparo Final del Impostor (la palabra real + 4 señuelos de la misma categoría)
  const finalShotOptions = useMemo(() => {
    if (!word) return [];
    const decoys = categoryPool
      .filter((w) => w.toLowerCase() !== word.toLowerCase())
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    return [word, ...decoys].sort((a, b) => a.localeCompare(b, "es"));
  }, [word, categoryPool]);
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
                className={`relative flex flex-col items-center justify-center rounded-2xl p-4 transition duration-200 border ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 sm:backdrop-blur-md p-4 animate-in fade-in duration-200">
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

            <div className="rounded-2xl bg-background/70 p-3.5 text-xs text-muted-foreground border border-white/10 space-y-2.5">
              <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <Crosshair size={14} />
                <span>Disparo Final del Impostor</span>
              </div>
              <p className="text-[11px] text-foreground/90 leading-relaxed">
                Pásale el teléfono a{" "}
                <strong>
                  {accusedIndex !== null ? getPlayerName(accusedIndex) : "el impostor"}
                </strong>
                . Si toca la palabra secreta correcta entre estas {finalShotOptions.length}{" "}
                opciones, ¡roba la victoria!
              </p>

              {finalShotOptions.length > 1 && (
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {finalShotOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        playPop(soundEnabled);
                        handleImpostorGuessResult(opt === word);
                      }}
                      className="w-full rounded-xl bg-white/5 hover:bg-primary/20 border border-white/15 hover:border-primary/50 py-2.5 px-3 text-xs font-bold text-foreground hover:text-primary transition active:scale-95 cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1 border-t border-white/10">
              <button
                onClick={() => handleImpostorGuessResult(true)}
                className={`${btnPrimary} flex-1 text-[11px] py-2.5 flex items-center justify-center gap-1`}
              >
                <Check size={14} /> La dijo en voz alta
              </button>
              <button
                onClick={() => handleImpostorGuessResult(false)}
                className={`${btnDanger} flex-1 text-[11px] py-2.5 flex items-center justify-center gap-1`}
              >
                <X size={14} /> Se rinde / Falló
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
