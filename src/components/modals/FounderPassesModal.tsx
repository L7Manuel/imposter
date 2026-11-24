import React from "react";
import { Crown, X, Copy, Send } from "lucide-react";
import { generateGuestPass } from "@/lib/security";

export interface FounderPassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  founderNumber: number | null;
  founderGuestPasses: { passIndex: number; redeemedAt: number | null }[];
}

export function FounderPassesModal({
  isOpen,
  onClose,
  founderNumber,
  founderGuestPasses,
}: FounderPassesModalProps) {
  if (!isOpen || founderNumber === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 sm:backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-3xl glass-panel border border-amber-500/40 p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-400" />
            <h3 className="font-display text-base text-amber-300">TUS 5 PASES DE INVITACIÓN</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground my-3">
          Como Miembro Fundador Vitalicio, tienes 5 Pases Fiesta de 24h para regalar o revender a
          tus amigos:
        </p>

        <div className="flex flex-col gap-2 my-2 overflow-y-auto max-h-[50vh]">
          {[1, 2, 3, 4, 5].map((idx) => {
            const passCode = generateGuestPass(founderNumber, idx);
            const passData = founderGuestPasses.find((p) => p.passIndex === idx);
            const isUsed = passData ? passData.redeemedAt !== null : false;

            const shareText =
              "¡Hola! 🎁 Te regalo este Pase Fiesta Oficial de 24 Horas para Imposter.\n\n🔑 Código: " +
              passCode +
              "\n📲 Entra a jugar: https://imposter.manu-07games.workers.dev\n\nPasos: Abre el enlace, pulsa la corona y canjea tu código para jugar gratis todo el día.";
            const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(shareText);

            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-muted-foreground">Pase #{idx}:</span>
                    <span className="font-mono font-bold text-foreground">{passCode}</span>
                  </div>
                  <span
                    className={
                      "block text-[10px] font-medium mt-0.5 " +
                      (isUsed ? "text-emerald-400" : "text-amber-400/80")
                    }
                  >
                    {isUsed ? "Canjeado" : "Disponible"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(passCode);
                      }
                    }}
                    title="Copiar Código"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition cursor-pointer"
                  >
                    <Copy size={13} />
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Compartir por WhatsApp"
                    className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition"
                  >
                    <Send size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 rounded-xl bg-white/10 hover:bg-white/15 py-2.5 text-xs font-semibold text-foreground transition cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
