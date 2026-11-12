import React from "react";
import {
  Settings,
  X,
  Sparkles,
  Crown,
  Share2,
  Download,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  Smartphone,
  Sun,
  RotateCcw,
} from "lucide-react";
import { ADULT_CATEGORY } from "@/data/categories";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPro: boolean;
  custom: Record<string, string[]>;
  saveCustom: (val: Record<string, string[]>) => void;
  category: string;
  setCategory: (cat: string) => void;
  newCat: string;
  setNewCat: (cat: string) => void;
  newWords: string;
  setNewWords: (words: string) => void;
  handleExportCategories: () => void;
  handleImportCategories: () => void;
  openPaywall: () => void;
  packStatus: string | null;
  isAdultUnlocked: boolean;
  setIsAdultUnlocked: (unlocked: boolean) => void;
  openPinModal: (mode: "unlock" | "change") => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  vibrationEnabled: boolean;
  toggleVibration: () => void;
  wakeLockEnabled: boolean;
  toggleWakeLock: () => void;
  handleInstallPwa: () => void;
  isStandalone: boolean;
  scores: { innocents: number; impostors: number };
  resetScores: () => void;
  resetFactoryDefaults: () => void;
  isCeoAdmin: boolean;
  isProUnlocked: boolean;
  proExpiresAt: number | null;
  deactivateProAndCeo: () => void;
  btnPrimary: string;
  btnGhost: string;
  playPop: (sound: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  hasPro,
  custom,
  saveCustom,
  category,
  setCategory,
  newCat,
  setNewCat,
  newWords,
  setNewWords,
  handleExportCategories,
  handleImportCategories,
  openPaywall,
  packStatus,
  isAdultUnlocked,
  setIsAdultUnlocked,
  openPinModal,
  soundEnabled,
  toggleSound,
  vibrationEnabled,
  toggleVibration,
  wakeLockEnabled,
  toggleWakeLock,
  handleInstallPwa,
  isStandalone,
  scores,
  resetScores,
  resetFactoryDefaults,
  isCeoAdmin,
  isProUnlocked,
  proExpiresAt,
  deactivateProAndCeo,
  btnPrimary,
  btnGhost,
  playPop,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col rounded-3xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            <h3 className="font-display text-xl tracking-wide text-foreground">CONFIGURACIÓN</h3>
          </div>
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
            }}
            aria-label="Cerrar configuración"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. GESTOR DE CATEGORÍAS PERSONALIZADAS */}
          <div className="rounded-2xl bg-background/50 p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles size={14} /> Categorías Personalizadas
                {!hasPro && (
                  <span className="ml-1 flex items-center gap-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-300">
                    <Crown size={9} /> PRO
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                {Object.keys(custom).length > 0 && (
                  <button
                    onClick={handleExportCategories}
                    title="Copiar pack al portapapeles"
                    className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-semibold text-foreground transition cursor-pointer"
                  >
                    <Share2 size={11} /> Copiar Pack
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!hasPro) {
                      onClose();
                      openPaywall();
                      return;
                    }
                    handleImportCategories();
                  }}
                  title="Pegar pack desde el portapapeles"
                  className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-semibold text-foreground transition cursor-pointer"
                >
                  <Download size={11} /> Importar
                </button>
              </div>
            </div>

            {packStatus && (
              <p className="text-[11px] font-semibold text-emerald-400 animate-pulse">
                {packStatus}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nombre de la lista (ej. Anime, Youtubers)"
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                value={newWords}
                onChange={(e) => setNewWords(e.target.value)}
                placeholder="Palabras separadas por comas (mínimo 3)"
                rows={2}
                className="resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {(() => {
                const list = newWords
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean);
                const name = newCat.trim();
                const isValid =
                  name && list.length >= 3 && name !== "Aleatoria" && name !== ADULT_CATEGORY;
                return (
                  <button
                    className={`${btnPrimary} py-2.5 text-xs flex items-center justify-center gap-1.5`}
                    disabled={hasPro && !isValid}
                    onClick={() => {
                      if (!hasPro) {
                        onClose();
                        openPaywall();
                        return;
                      }
                      if (!isValid) return;
                      playPop(soundEnabled);
                      saveCustom({ ...custom, [name]: list });
                      setCategory(name);
                      setNewCat("");
                      setNewWords("");
                    }}
                  >
                    {!hasPro && <Crown size={13} />}
                    <span>
                      {!hasPro
                        ? "Desbloquear Listas Personalizadas (PRO)"
                        : `+ Guardar categoría (${list.length} palabras)`}
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* Lista de categorías creadas */}
            {Object.keys(custom).length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Tus listas guardadas:
                </span>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(custom).map(([catName, wordsList]) => (
                    <div
                      key={catName}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs border border-white/10"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{catName}</span>
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          ({wordsList.length} palabras)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          playPop(soundEnabled);
                          const { [catName]: _, ...rest } = custom;
                          saveCustom(rest);
                          if (category === catName) setCategory("Aleatoria");
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition cursor-pointer"
                        title={`Eliminar ${catName}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. CONTROL PARENTAL Y SECCIÓN +18 */}
          <div className="rounded-2xl bg-background/50 p-4 border border-rose-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <KeyRound size={14} /> Control Parental (+18)
              </span>
              {!hasPro && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-300">
                  <Crown size={9} /> PRO
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Sección Fiesta +18</p>
                <p className="text-[11px] text-muted-foreground">
                  {!hasPro
                    ? "Requiere Party Pass PRO"
                    : isAdultUnlocked
                      ? "Desbloqueada actualmente"
                      : "Protegida con código PIN"}
                </p>
              </div>

              {!hasPro ? (
                <button
                  onClick={() => {
                    onClose();
                    openPaywall();
                  }}
                  className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-300 border border-amber-400/40 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Crown size={12} /> Desbloquear PRO
                </button>
              ) : isAdultUnlocked ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playPop(soundEnabled);
                      openPinModal("change");
                    }}
                    className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-foreground border border-white/15 transition cursor-pointer"
                  >
                    Cambiar PIN
                  </button>
                  <button
                    onClick={() => {
                      playPop(soundEnabled);
                      setIsAdultUnlocked(false);
                      try {
                        localStorage.removeItem("impostor-adult-unlocked");
                      } catch {
                        /* ignore */
                      }
                      if (category === ADULT_CATEGORY) setCategory("Aleatoria");
                    }}
                    className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 border border-rose-500/30 transition cursor-pointer flex items-center gap-1"
                  >
                    <Lock size={12} /> Bloquear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    playPop(soundEnabled);
                    openPinModal("unlock");
                  }}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Unlock size={12} /> Desbloquear
                </button>
              )}
            </div>
          </div>

          {/* 3. AUDIO, VIBRACIÓN Y DATOS */}
          <div className="rounded-2xl bg-background/50 p-4 border border-white/10 space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone size={14} /> Experiencia y Datos
            </span>

            {/* Sonido Switch */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Efectos de Sonido (SFX)</span>
              <button
                type="button"
                onClick={toggleSound}
                className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer overflow-hidden ${
                  soundEnabled ? "bg-primary" : "bg-white/20"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Vibración Switch */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Vibración Háptica</span>
              <button
                type="button"
                onClick={toggleVibration}
                className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer overflow-hidden ${
                  vibrationEnabled ? "bg-primary" : "bg-white/20"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    vibrationEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Pantalla Siempre Activa (Wake Lock) */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Sun size={14} className="text-amber-400" />
                  Pantalla Siempre Activa
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Evita que el teléfono se bloquee durante el debate
                </p>
              </div>
              <button
                type="button"
                onClick={toggleWakeLock}
                className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer overflow-hidden ${
                  wakeLockEnabled ? "bg-primary" : "bg-white/20"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    wakeLockEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Instalar App en el Teléfono (PWA) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                handleInstallPwa();
              }}
              className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 text-xs transition cursor-pointer"
            >
              <span className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone size={15} className="text-primary" />
                Instalar en Pantalla de Inicio
              </span>
              <span className="rounded-lg bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-bold">
                {isStandalone ? "Instalada" : "Instalar"}
              </span>
            </button>

            {/* Botones de Reinicio */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  resetScores();
                }}
                className={`${btnGhost} flex-1 py-2 text-xs flex items-center justify-center gap-1.5`}
              >
                <RotateCcw size={13} /> Reiniciar Marcador ({scores.innocents}:{scores.impostors})
              </button>
              <button
                onClick={resetFactoryDefaults}
                className="rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/30 px-3 py-2 text-xs font-semibold transition cursor-pointer"
                title="Restablecer jugadores y ajustes por defecto"
              >
                Restablecer Todo
              </button>
            </div>

            {/* Acceso a Código VIP / Clave CEO o Regreso a Versión Normal */}
            {!isCeoAdmin && (
              <div className="flex flex-col gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openPaywall();
                  }}
                  className="w-full text-center text-[11px] font-semibold text-amber-400/90 hover:text-amber-300 transition cursor-pointer"
                >
                  ¿Tienes un código VIP o Clave CEO? Canjear aquí
                </button>
                {isProUnlocked && (
                  <div className="space-y-1.5">
                    {proExpiresAt && (
                      <p className="text-center text-[10px] font-semibold text-amber-300/90">
                        Pase Tester PRO (48h) — restan{" "}
                        {Math.max(1, Math.ceil((proExpiresAt - Date.now()) / (1000 * 60 * 60)))}h
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={deactivateProAndCeo}
                      className="w-full rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 py-1.5 text-center text-[11px] font-semibold text-rose-300 transition cursor-pointer"
                    >
                      Desactivar Pase PRO (Volver a versión Normal Gratis)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
