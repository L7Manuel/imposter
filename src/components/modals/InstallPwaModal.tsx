import React from "react";
import { X, Smartphone, Download, Sparkles, Plus, CheckCircle2 } from "lucide-react";

export interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStandalone: boolean;
  isIos: boolean;
  canInstallPwa: boolean;
  promptPwaInstall: () => Promise<string | undefined>;
  btnPrimary: string;
  btnGhost: string;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
}

export function InstallPwaModal({
  isOpen,
  onClose,
  isStandalone,
  isIos,
  canInstallPwa,
  promptPwaInstall,
  btnPrimary,
  btnGhost,
  soundEnabled,
  playPop,
}: InstallPwaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 sm:backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col rounded-3xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-5 pt-5 pb-4 border-b border-white/10 text-center">
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
            }}
            aria-label="Cerrar ventana de instalación"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-black shadow-lg">
            <Smartphone size={24} />
          </div>
          <h3 className="font-display text-xl tracking-wider text-foreground">INSTALAR IMPOSTER</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Juega a pantalla completa sin barras de navegación
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isStandalone ? (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-center space-y-2">
              <CheckCircle2 size={26} className="text-emerald-400 mx-auto" />
              <h4 className="font-display text-base text-emerald-400">¡App Ya Instalada!</h4>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Ya estás disfrutando de <strong>Imposter</strong> como una aplicación nativa desde
                tu pantalla de inicio.
              </p>
            </div>
          ) : isIos ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3 text-center">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Guía para iPhone & iPad (Safari)
                </span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-display text-xs font-bold">
                  1
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    Toca el botón Compartir
                    <span className="inline-flex items-center justify-center rounded bg-white/15 px-1.5 py-0.5 text-primary text-xs font-bold">
                      ⎋
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    En la barra inferior de Safari, pulsa el icono de compartir (cuadrado con flecha
                    hacia arriba).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-display text-xs font-bold">
                  2
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    Añadir a pantalla de inicio
                    <span className="inline-flex items-center justify-center rounded bg-white/15 px-1 py-0.5 text-primary text-xs font-bold">
                      <Plus size={11} />
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    Baja un poco en el menú de opciones y selecciona{" "}
                    <strong>"Añadir a pantalla de inicio"</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-black/30 border border-white/5 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Se creará el icono de Imposter en tu pantalla de inicio para jugar al instante.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {canInstallPwa ? (
                <div className="space-y-3 text-center">
                  <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3.5">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Android & Navegadores Web
                    </span>
                    <p className="text-xs text-foreground/90 mt-1">
                      Instala la app con un solo toque directamente en tu celular:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const outcome = await promptPwaInstall();
                      if (outcome === "accepted") {
                        onClose();
                      }
                    }}
                    className={`${btnPrimary} w-full py-3 text-sm flex items-center justify-center gap-2`}
                  >
                    <Download size={16} /> Instalar Imposter Ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3 text-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Android (Chrome / Firefox / Edge)
                    </span>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-display text-xs font-bold">
                      1
                    </div>
                    <div className="text-left text-xs">
                      <p className="font-semibold text-foreground">Abre el menú de opciones (⋮)</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Toca los tres puntos en la esquina superior derecha del navegador.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-display text-xs font-bold">
                      2
                    </div>
                    <div className="text-left text-xs">
                      <p className="font-semibold text-foreground">Instalar o Añadir a inicio</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Selecciona <strong>"Instalar aplicación"</strong> o{" "}
                        <strong>"Añadir a la pantalla de inicio"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              playPop(soundEnabled);
              onClose();
            }}
            className={`${btnGhost} w-full py-2.5 text-xs`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
