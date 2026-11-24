import React from "react";
import { QrCode, X, Copy, Share2, Smartphone } from "lucide-react";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  shareCopied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onOpenInstallPwa: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  shareCopied,
  onCopy,
  onShare,
  onOpenInstallPwa,
}: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 sm:backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl glass-panel p-6 border border-white/15 shadow-2xl text-center">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-primary" />
            <h3 className="font-display text-xl tracking-wide text-foreground">INVITAR AMIGOS</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de compartir"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Escanea el código QR para abrir <strong>Imposter</strong> en otro teléfono al instante:
        </p>

        {/* QR Frame */}
        <div className="rounded-2xl bg-white p-3.5 shadow-xl">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(
              shareUrl,
            )}`}
            alt="Código QR del juego Imposter"
            width={180}
            height={180}
            className="h-44 w-44 rounded-lg object-contain"
          />
        </div>

        {/* Enlace Directo */}
        <div className="flex w-full items-center gap-2 rounded-xl bg-black/40 p-2 border border-white/10">
          <span className="flex-1 truncate text-left text-[11px] font-mono text-muted-foreground px-1">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition cursor-pointer"
          >
            <Copy size={12} />
            <span>{shareCopied ? "¡Copiado!" : "Copiar"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onShare}
          className="rounded-xl px-4 py-3 font-semibold transition duration-150 active:scale-95 disabled:opacity-30 select-none cursor-pointer bg-primary text-primary-foreground glow-primary hover:brightness-110 shadow-lg active:brightness-125 w-full text-sm flex items-center justify-center gap-2"
        >
          <Share2 size={16} /> Compartir enlace con amigos
        </button>

        <button
          type="button"
          onClick={onOpenInstallPwa}
          className="w-full rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 py-2.5 text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Smartphone size={14} className="text-primary" />
          <span>¿Cómo instalar la app en el teléfono?</span>
        </button>
      </div>
    </div>
  );
}
