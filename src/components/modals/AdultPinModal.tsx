import React from "react";
import { KeyRound, Delete } from "lucide-react";

export interface AdultPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinModalMode: "unlock" | "change";
  enteredPin: string;
  pinError: boolean;
  pinLockoutUntil: number;
  pinFailedAttempts: number;
  handlePinInput: (digit: string) => void;
  handlePinDelete: () => void;
  showPinHint: boolean;
  setShowPinHint: (show: boolean) => void;
  adultPin: string;
}

export function AdultPinModal({
  isOpen,
  onClose,
  pinModalMode,
  enteredPin,
  pinError,
  pinLockoutUntil,
  pinFailedAttempts,
  handlePinInput,
  handlePinDelete,
  showPinHint,
  setShowPinHint,
  adultPin,
}: AdultPinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 sm:backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex w-full max-w-xs flex-col gap-4 rounded-3xl glass-panel p-6 border border-rose-500/40 shadow-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <KeyRound size={28} />
        </div>

        <div>
          <h3 className="font-display text-2xl text-rose-400 tracking-wide">
            {pinModalMode === "change" ? "NUEVO PIN +18" : "CONTROL PARENTAL"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {pinModalMode === "change" ? (
              <>
                Ingresa un nuevo código de 4 dígitos para proteger la sección{" "}
                <strong>+18 Adultos</strong>
              </>
            ) : (
              <>
                Ingresa el PIN de 4 dígitos para desbloquear la sección <strong>+18 Adultos</strong>
              </>
            )}
          </p>
        </div>

        {/* PIN Indicators */}
        <div
          className={`flex items-center justify-center gap-3 my-2 ${pinError ? "animate-shake text-destructive" : ""}`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full border transition duration-200 ${
                  filled
                    ? "bg-rose-500 border-rose-400 scale-110 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                    : "border-white/20 bg-white/5"
                }`}
              />
            );
          })}
        </div>

        {Date.now() < pinLockoutUntil ? (
          <p className="text-xs font-semibold text-rose-400 animate-pulse">
            Bloqueo de seguridad: Demasiados intentos fallidos. Espera 60 segundos.
          </p>
        ) : pinError ? (
          <p className="text-xs font-semibold text-destructive animate-pulse">
            PIN incorrecto ({pinFailedAttempts}/5 intentos).
          </p>
        ) : null}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 my-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handlePinInput(num)}
              className="flex h-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 font-display text-xl text-white border border-white/15 transition cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 text-xs text-muted-foreground border border-white/10 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => handlePinInput("0")}
            className="flex h-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 font-display text-xl text-white border border-white/15 transition cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            onClick={handlePinDelete}
            className="flex h-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-muted-foreground hover:text-white border border-white/15 transition cursor-pointer shadow-sm"
          >
            <Delete size={18} />
          </button>
        </div>

        {pinModalMode === "unlock" && (
          <button
            type="button"
            onPointerDown={() => setShowPinHint(true)}
            onPointerUp={() => setShowPinHint(false)}
            onPointerLeave={() => setShowPinHint(false)}
            onPointerCancel={() => setShowPinHint(false)}
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition select-none touch-none cursor-pointer"
          >
            {showPinHint ? (
              <span>
                PIN actual: <strong className="text-rose-400 font-mono">{adultPin}</strong>
              </span>
            ) : (
              "Mantén presionado aquí si olvidaste el PIN"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
