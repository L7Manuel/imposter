import React from "react";
import { Fingerprint, ShieldAlert, Sparkles, EyeOff } from "lucide-react";

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
  undercoverMode: boolean;
  word: string;
  impostorWord: string;
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
  undercoverMode,
  word,
  impostorWord,
  playedCategory,
  hasSeenRole,
  nextTurn,
  btnPrimary,
}: PhaseRevealProps) {
  const isTurnImpostor = impostors.includes(turn);
  const isTurnJester = turn === jesterIndex;

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
                className={`h-1.5 flex-1 rounded-full transition duration-300 ${
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
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground font-bold">
          <span>
            Agente {turn + 1} de {names.length}
          </span>
          <span>{undercoverMode ? "Pista Camaleón" : "Modo Clásico"}</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          Entrega el teléfono en mano a
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm ${
              getPlayerBadge(turn).bg
            } ${getPlayerBadge(turn).text} border ${getPlayerBadge(turn).border} shadow-md`}
          >
            {getPlayerInitial(turn)}
          </div>
          <h2 className="font-sans text-3xl font-black text-primary tracking-wide">
            {getPlayerName(turn)}
          </h2>
        </div>
      </div>

      {/* Classified Biometric Dossier Card — Visor Superior + Sensor Inferior para que el dedo NUNCA tape la palabra */}
      <div
        onPointerDown={handleStartHold}
        onPointerUp={handleEndHold}
        onPointerLeave={handleEndHold}
        onPointerCancel={handleEndHold}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative flex min-h-[360px] w-full max-w-xs cursor-pointer select-none touch-none flex-col justify-between overflow-hidden rounded-3xl p-5 transition duration-200 border-2 ${
          isHolding
            ? isTurnImpostor
              ? "bg-destructive text-destructive-foreground border-red-300 glow-danger scale-[1.02]"
              : isTurnJester
                ? "bg-purple-700 text-white border-purple-300 shadow-[0_0_35px_rgba(147,51,234,0.7)] scale-[1.02]"
                : "bg-primary text-primary-foreground border-amber-200 glow-primary scale-[1.02]"
            : "glass-panel border-white/20 hover:border-primary/50 active:scale-[0.99] shadow-2xl"
        }`}
      >
        {/* Tactical HUD Corner Brackets */}
        <div className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-current opacity-40 rounded-tl" />
        <div className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-current opacity-40 rounded-tr" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-current opacity-40 rounded-bl" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-current opacity-40 rounded-br" />

        {/* Animated Laser Sweep (transform en el compositor, sin layout) */}
        {isHolding && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden animate-laser">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_#fff]" />
          </div>
        )}

        {/* ZONA SUPERIOR: VISOR DESPEJADO (Encima del dedo) */}
        <div className="flex flex-1 flex-col items-center justify-center py-2">
          {!isHolding ? (
            <div className="flex flex-col items-center gap-2.5 text-center">
              <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Expediente Confidencial
              </span>
              <p className="font-sans text-lg font-extrabold text-foreground leading-snug px-2">
                Tu rol y palabra aparecerán aquí arriba
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed px-3">
                Apoya tu pulgar en el sensor inferior para ver sin tapar la pantalla.
              </p>
            </div>
          ) : isTurnImpostor ? (
            <div className="flex w-full flex-col items-center gap-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2">
                <ShieldAlert size={30} className="text-white shrink-0" />
                <span className="font-sans text-3xl font-black tracking-wide leading-none text-white">
                  ¡IMPOSTOR!
                </span>
              </div>

              {undercoverMode && impostorWord && (
                <div className="w-full rounded-2xl bg-black/45 px-4 py-2.5 border border-amber-300/50 shadow-inner">
                  <span className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-amber-300 font-extrabold">
                    <EyeOff size={13} /> Pista Camaleón
                  </span>
                  <span className="mt-0.5 block font-sans text-2xl font-black text-amber-100 tracking-wide">
                    {impostorWord}
                  </span>
                </div>
              )}

              {impostors.length > 1 && accompliceMode && (
                <div className="w-full rounded-xl bg-black/40 px-3 py-1.5 text-xs border border-white/20 text-white">
                  <span>{impostors.length === 2 ? "Tu cómplice:" : "Tus cómplices:"} </span>
                  <strong className="font-extrabold underline underline-offset-2">
                    {impostors
                      .filter((idx) => idx !== turn)
                      .map((idx) => getPlayerName(idx))
                      .join(", ")}
                  </strong>
                </div>
              )}
              {impostors.length > 1 && !accompliceMode && (
                <div className="w-full rounded-xl bg-black/40 px-3 py-1.5 text-xs border border-white/20 text-white">
                  Modo Caos: Hay {impostors.length - 1} cómplice(s) oculto(s)
                </div>
              )}

              <div className="rounded-full bg-black/35 px-3.5 py-1 text-xs font-bold border border-white/20 text-white">
                Tema: {playedCategory}
              </div>
              <p className="text-xs font-medium text-white/95 leading-snug px-2">
                {undercoverMode && impostorWord
                  ? "La palabra real es parecida a tu señuelo. ¡Camúflate!"
                  : "Escucha las pistas del grupo y finge conocer la palabra."}
              </p>
            </div>
          ) : isTurnJester ? (
            <div className="flex w-full flex-col items-center gap-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2">
                <Sparkles size={28} className="text-purple-200 shrink-0" />
                <span className="font-sans text-2xl font-black tracking-wide text-white">
                  ¡ERES EL BUFÓN!
                </span>
              </div>
              <div className="w-full rounded-2xl bg-black/35 px-4 py-2.5 border border-purple-200/30">
                <span className="block text-xs uppercase tracking-wider text-purple-200 font-bold">
                  Palabra de la mesa
                </span>
                <span className="mt-0.5 block font-sans text-2xl font-black text-white tracking-wide">
                  {word}
                </span>
              </div>
              <div className="rounded-full bg-black/30 px-3.5 py-1 text-xs font-bold border border-white/20 text-white">
                Categoría: {playedCategory}
              </div>
              <p className="text-xs font-medium text-white/95 px-2 leading-snug">
                ¡Actúa sospechoso a propósito! Si el grupo te vota, ganas tú solo.
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-2.5 animate-in zoom-in-95 duration-150">
              <span className="text-xs uppercase tracking-widest font-extrabold opacity-85">
                Tu palabra secreta
              </span>
              <div className="w-full rounded-2xl bg-black/15 border border-black/15 px-4 py-3 shadow-inner">
                <span className="font-sans text-3xl sm:text-4xl font-black tracking-wide leading-tight break-words">
                  {word}
                </span>
              </div>
              <div className="rounded-full bg-black/15 px-3.5 py-1 text-xs font-extrabold border border-black/15">
                Categoría: {playedCategory}
              </div>
              <p className="text-xs font-bold opacity-90 px-2 leading-snug">
                Eres Inocente. Da una pista sutil sin regalar la palabra.
              </p>
            </div>
          )}
        </div>

        {/* ZONA INFERIOR: SENSOR BIOMÉTRICO PARA EL PULGAR */}
        <div
          className={`mt-2 flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 transition ${
            isHolding
              ? isTurnImpostor || isTurnJester
                ? "bg-black/35 border-white/25 text-white"
                : "bg-black/15 border-black/20 text-primary-foreground"
              : "bg-primary/10 border-primary/35 shadow-[0_0_20px_rgba(234,179,8,0.12)]"
          }`}
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-current/30 bg-black/15">
            {!isHolding && (
              <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-30" />
            )}
            <Fingerprint
              size={30}
              className={isHolding ? "scale-110 transition-transform" : "text-primary"}
            />
          </div>
          <div className="text-left">
            <p className="font-sans text-sm font-black uppercase tracking-wide leading-tight">
              {isHolding ? "Suelta para ocultar" : "Mantén el dedo aquí"}
            </p>
            <p className="text-xs opacity-80 leading-tight mt-0.5">
              {isHolding ? "Lectura activa" : "Toca y sostén sin soltar"}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        <button
          disabled={!hasSeenRole}
          onClick={nextTurn}
          className={`${btnPrimary} w-full py-3.5 text-sm font-extrabold`}
        >
          {turn + 1 >= names.length ? "Comenzar debate" : "Ocultar y pasar al siguiente"}
        </button>

        {!hasSeenRole && (
          <p className="text-xs font-medium text-muted-foreground">
            Debes escanear tu rol sosteniendo el sensor antes de continuar.
          </p>
        )}
      </div>
    </section>
  );
}
