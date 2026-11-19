import React from "react";
import {
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Crown,
  Sparkles,
  Check,
  MessageSquare,
  ExternalLink,
  Building2,
  Copy,
  Send,
  CreditCard,
  KeyRound,
  ClipboardPaste,
} from "lucide-react";
import {
  PartyPassPlan,
  PARTY_PASS_PLANS,
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
} from "@/lib/payment-config";

export interface ActivePaymentTracker {
  paymentId: string;
  customerName: string;
  reference: string;
  plan: PartyPassPlan | "lifetime";
  amountFormatted: string;
  method: "Pago Móvil" | "Binance Pay";
}

export interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  activePaymentTracker: ActivePaymentTracker | null;
  setActivePaymentTracker: (val: ActivePaymentTracker | null) => void;
  proModalView: "perks" | "checkout";
  setProModalView: (view: "perks" | "checkout") => void;
  selectedPlan: PartyPassPlan;
  setSelectedPlan: (plan: PartyPassPlan) => void;
  paymentConfig: PaymentConfig;
  selectedPayMethod: "pagomovil" | "binance" | "international";
  setSelectedPayMethod: (method: "pagomovil" | "binance" | "international") => void;
  copiedPayField: string | null;
  handleCopyPayField: (text: string, fieldId: string) => void;
  payProofName: string;
  setPayProofName: (name: string) => void;
  payProofRef: string;
  setPayProofRef: (ref: string) => void;
  payProofDiscordContact: string;
  setPayProofDiscordContact: (val: string) => void;
  payProofFeedback: string;
  setPayProofFeedback: (feedback: string) => void;
  payProofSubmitting: boolean;
  handleSubmitPaymentProof: (method: "Pago Móvil" | "Binance Pay") => void;
  proCodeInput: string;
  setProCodeInput: (code: string) => void;
  handleRedeemCode: () => void;
  proCodeFeedback: { type: "success" | "error"; text: string } | null;
  freeTrialUsed?: boolean;
  onActivateFreeTrial?: () => void;
}

export function PaywallModal({
  isOpen,
  onClose,
  soundEnabled,
  playPop,
  activePaymentTracker,
  setActivePaymentTracker,
  proModalView,
  setProModalView,
  selectedPlan,
  setSelectedPlan,
  paymentConfig,
  selectedPayMethod,
  setSelectedPayMethod,
  copiedPayField,
  handleCopyPayField,
  payProofName,
  setPayProofName,
  payProofRef,
  setPayProofRef,
  payProofDiscordContact,
  setPayProofDiscordContact,
  payProofFeedback,
  setPayProofFeedback,
  payProofSubmitting,
  handleSubmitPaymentProof,
  proCodeInput,
  setProCodeInput,
  handleRedeemCode,
  proCodeFeedback,
  freeTrialUsed = false,
  onActivateFreeTrial,
}: PaywallModalProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<"plans" | "code">("plans");

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-x-hidden overflow-y-auto flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 ${
        !activePaymentTracker && proModalView === "perks" && activeSubTab === "code"
          ? "items-start sm:items-center pt-8 sm:pt-4"
          : "items-center"
      }`}
    >
      <div className="relative max-h-[95vh] w-full max-w-md rounded-3xl glass-panel border-2 border-amber-400/50 shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden transform scale-100 sm:scale-105">
        {/* Header VIP / Checkout */}
        <div className="relative bg-gradient-to-br from-amber-500/25 via-yellow-500/10 to-transparent px-5 pt-4 pb-3.5 border-b border-white/10 text-center">
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
              setProModalView("perks");
              setActiveSubTab("plans");
            }}
            aria-label="Cerrar Party Pass PRO"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>

          {activePaymentTracker ? (
            <div className="flex items-center gap-2.5 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div>
                <h3 className="font-display text-lg tracking-wider text-amber-300 leading-tight">
                  VERIFICANDO PAGO
                </h3>
                <p className="text-[11px] text-muted-foreground">Confirmación en tiempo real</p>
              </div>
            </div>
          ) : proModalView === "checkout" ? (
            <div className="flex items-center gap-2.5 text-left">
              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setProModalView("perks");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition cursor-pointer shrink-0"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="font-display text-lg tracking-wider text-amber-300 leading-tight">
                  MÉTODOS DE PAGO
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Paga y activa tu pase al instante
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-1.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg">
                <Crown size={24} />
              </div>
              <h3 className="font-display text-2xl tracking-wider text-amber-300">
                PARTY PASS PRO
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Desbloquea la experiencia completa para toda tu fiesta
              </p>

              {/* Selector Superior de 2 Pestañas: Planes VIP | Canjear Código */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl bg-black/50 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setActiveSubTab("plans");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition cursor-pointer ${
                    activeSubTab === "plans"
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Crown size={13} />
                  <span>Planes VIP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setActiveSubTab("code");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition cursor-pointer ${
                    activeSubTab === "code"
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <KeyRound size={13} />
                  <span>Canjear Código</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto smooth-scroll p-5 space-y-4">
          {activePaymentTracker ? (
            <div className="text-center space-y-4 py-2">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/20 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Check size={32} />
              </div>
              <div>
                <h3 className="font-display text-lg text-emerald-300">
                  ¡ACCESO PROVISIONAL ACTIVADO!
                </h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    Cliente:{" "}
                    <strong className="text-white">{activePaymentTracker.customerName}</strong>
                  </p>
                  <p>
                    Referencia:{" "}
                    <strong className="text-amber-300 font-mono">
                      #{activePaymentTracker.reference}
                    </strong>
                  </p>
                  <p>
                    Monto:{" "}
                    <strong className="text-white font-mono">
                      {activePaymentTracker.amountFormatted}
                    </strong>{" "}
                    ({activePaymentTracker.method})
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/35 p-3.5 text-xs text-left space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-emerald-300 text-xs">
                  <Sparkles size={13} /> Confianza en Fiesta: Juega sin Esperar
                </p>
                <p className="text-[11px] text-foreground/90 leading-relaxed">
                  Tu Party Pass PRO ya está desbloqueado provisionalmente para que tu grupo empiece
                  a jugar ahora mismo mientras verificamos la transferencia en segundo plano.
                </p>
              </div>

              {payProofFeedback && (
                <p className="text-xs text-rose-400 font-semibold">{payProofFeedback}</p>
              )}

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  onClose();
                }}
                className="w-full rounded-xl bg-emerald-400 py-3 font-display text-sm tracking-wider text-slate-950 shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                ¡VOLVER A LA MESA Y JUGAR PRO AHORA!
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setActivePaymentTracker(null);
                  setPayProofFeedback("");
                  try {
                    localStorage.removeItem("impostor-active-payment-tracker");
                  } catch {
                    /* ignore */
                  }
                }}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white px-3.5 py-2 text-xs font-semibold transition cursor-pointer"
              >
                Corregir referencia bancaria
              </button>
            </div>
          ) : proModalView === "perks" && activeSubTab === "code" ? (
            /* VISTA EXCLUSIVA SUPERIOR: CANJEAR CÓDIGO (CERO SCROLL EN MÓVIL) */
            <div className="space-y-3.5 py-1">
              <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-sm tracking-wider text-amber-300">
                      CANJEAR CÓDIGO DE ACCESO
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Ingresa tu código promocional o de invitación
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      playPop(soundEnabled);
                      try {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText && clipText.trim()) {
                          setProCodeInput(clipText.trim());
                        }
                      } catch {
                        /* portapapeles bloqueado por navegador */
                      }
                    }}
                    className="flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-400/15 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-400/25 transition cursor-pointer shrink-0"
                    title="Pegar código del portapapeles"
                  >
                    <ClipboardPaste size={13} />
                    <span>Pegar</span>
                  </button>
                </div>

                <input
                  value={proCodeInput}
                  onChange={(e) => setProCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
                  placeholder="Ingresa tu código aquí..."
                  autoFocus
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-xl border-2 border-amber-400/50 bg-black/60 px-3.5 py-3 text-sm font-mono uppercase tracking-wider text-white placeholder:text-muted-foreground/60 outline-none focus:border-amber-300 shadow-inner"
                />

                {proCodeFeedback && (
                  <div
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      proCodeFeedback.type === "success"
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                        : "border-rose-400/40 bg-rose-500/15 text-amber-200"
                    }`}
                  >
                    {proCodeFeedback.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRedeemCode}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-display text-sm tracking-wider text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound size={15} />
                  <span>ACTIVAR CÓDIGO AHORA</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setActiveSubTab("plans");
                  }}
                  className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                >
                  ¿No tienes un código? Ver Planes Party Pass PRO
                </button>
              </div>
            </div>
          ) : proModalView === "perks" ? (
            <>
              {/* Botón de 1 Ronda VIP de Prueba Gratis (si no se ha consumido) */}
              {!freeTrialUsed && onActivateFreeTrial && (
                <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                      ¿Aún no has probado el modo PRO?
                    </span>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-200">
                      1 Partida Gratis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playPop(soundEnabled);
                      onActivateFreeTrial();
                      onClose();
                    }}
                    className="w-full rounded-xl bg-emerald-400 py-2.5 text-xs font-extrabold text-slate-950 shadow transition hover:brightness-110 active:scale-95 cursor-pointer"
                  >
                    Jugar 1 Ronda VIP de Prueba Gratis Ahora
                  </button>
                </div>
              )}

              {/* Lista de Beneficios */}
              <div className="space-y-2 text-xs">
                {[
                  "Salas grandes de 7 hasta 15 jugadores (En Mesa y Online)",
                  "8 Categorías PRO (Cine, Deportes, Geek, Objetos, Profesiones y más)",
                  "Categoría picante Fiesta +18 (60 palabras)",
                  "Rol especial El Bufón, Infiltrado Ciego y Eventos Relámpago",
                  "Creación ilimitada de listas personalizadas",
                ].map((perk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2 border border-white/10"
                  >
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span className="text-foreground/95 font-medium">{perk}</span>
                  </div>
                ))}
              </div>

              {/* Selector de Planes Party Pass */}
              <div className="space-y-2">
                {/* 3 Pases Temporales */}
                <div className="grid grid-cols-3 gap-2">
                  {(["day", "weekend", "month"] as const).map((planKey) => {
                    const plan = PARTY_PASS_PLANS[planKey];
                    const isSelected = selectedPlan === planKey;
                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => {
                          playPop(soundEnabled);
                          setSelectedPlan(planKey);
                        }}
                        className={`relative flex flex-col items-center justify-between rounded-2xl p-2.5 border text-center transition cursor-pointer min-h-[95px] ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-400 text-white shadow-md scale-[1.02]"
                            : "bg-background/50 border-white/10 text-muted-foreground hover:border-white/25"
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2 rounded-full bg-amber-400 px-1.5 py-0.2 text-[8px] font-extrabold uppercase text-black shadow-sm">
                            {plan.badge}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
                          {plan.durationLabel}
                        </span>
                        <span className="font-display text-xl text-amber-300 my-0.5">
                          ${plan.priceUsd.toFixed(2)}
                        </span>
                        <span className="text-[9px] opacity-75 line-clamp-1">
                          {planKey === "day"
                            ? "Pase Fiesta"
                            : planKey === "weekend"
                              ? "Viernes-Dom"
                              : "30 Días"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tarjeta Exclusiva: Edición Fundador Vitalicio ($9.80) */}
                {(() => {
                  const isSelected = selectedPlan === "founder";
                  return (
                    <div
                      onClick={() => {
                        playPop(soundEnabled);
                        setSelectedPlan("founder");
                      }}
                      className={`relative rounded-2xl p-3 border transition cursor-pointer text-left ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-600/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.01]"
                          : "bg-white/5 border-white/10 hover:border-amber-400/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                            <Crown size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-display text-sm tracking-wide text-amber-300">
                                EDICIÓN FUNDADOR
                              </span>
                              <span className="rounded-full bg-amber-400/30 px-1.5 py-0.2 text-[8px] font-bold text-amber-200">
                                Vitalicio
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                              De por vida + Rol VIP en Discord + Soporte directo
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-display text-xl text-amber-300">$9.80</span>
                          <span className="text-[9px] text-muted-foreground block -mt-0.5">
                            USD
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-amber-400/20 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-amber-200/90 font-medium">
                            Acceso permanente para siempre
                          </span>
                          <a
                            href={paymentConfig.discordInviteUrl || "https://discord.gg"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-300 hover:text-white font-bold bg-indigo-600/30 hover:bg-indigo-600/50 px-2 py-1 rounded-lg border border-indigo-400/40 transition"
                          >
                            <MessageSquare size={11} />
                            <span>Consultar en Discord</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setProModalView("checkout");
                }}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-display text-sm tracking-wider text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>
                  PAGAR CON PAGO MÓVIL O BINANCE ($
                  {(PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend).priceUsd.toFixed(2)}
                  )
                </span>
                <ArrowRight size={15} />
              </button>

              {/* Acceso directo a la pestaña de Canjear Código */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setActiveSubTab("code");
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:underline transition cursor-pointer"
                >
                  <KeyRound size={12} />
                  <span>¿Tienes un código o cupón VIP? Toca aquí para canjearlo</span>
                </button>
              </div>
            </>
          ) : (
            /* VISTA DE CHECKOUT / MÉTODOS DE PAGO */
            <div className="space-y-3.5">
              {/* Resumen del Plan */}
              <div className="rounded-2xl bg-amber-500/15 border border-amber-400/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Plan Seleccionado
                  </span>
                  <span className="font-display text-sm text-foreground">
                    {(PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend).title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl text-amber-300">
                    $
                    {(PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend).priceUsd.toFixed(
                      2,
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">USD</span>
                </div>
              </div>

              {selectedPlan === "founder" && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-2.5 text-xs text-left space-y-1">
                  <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                    <Crown size={12} /> Pase Exclusivo de por Vida
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Al transferir se activa tu pase vitalicio. ¿Quieres consultar antes con los
                    desarrolladores o gestionar por Discord?
                  </p>
                  <a
                    href={paymentConfig.discordInviteUrl || "https://discord.gg"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline pt-0.5"
                  >
                    <ExternalLink size={10} />
                    <span>Abrir servidor de Discord</span>
                  </a>
                </div>
              )}

              {/* Selector de Pestañas de Pago */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-black/50 border border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setSelectedPayMethod("pagomovil");
                  }}
                  className={`rounded-xl py-1.5 text-[10px] font-bold transition cursor-pointer ${
                    selectedPayMethod === "pagomovil"
                      ? "bg-amber-400 text-black shadow-sm font-extrabold"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Pago Móvil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setSelectedPayMethod("binance");
                  }}
                  className={`rounded-xl py-1.5 text-[10px] font-bold transition cursor-pointer ${
                    selectedPayMethod === "binance"
                      ? "bg-amber-400 text-black shadow-sm font-extrabold"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Binance Pay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setSelectedPayMethod("international");
                  }}
                  className={`rounded-xl py-1.5 text-[10px] font-bold transition cursor-pointer ${
                    selectedPayMethod === "international"
                      ? "bg-amber-400 text-black shadow-sm font-extrabold"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Tarjeta / Whop
                </button>
              </div>

              {/* CONTENIDO SEGÚN MÉTODO */}
              {selectedPayMethod === "pagomovil" && (
                <div className="rounded-2xl bg-black/40 border border-emerald-500/30 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Building2 size={13} /> Datos para Transferir
                    </span>
                    <span className="text-[10px] text-muted-foreground">0% Comisión</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground text-[11px]">Banco:</span>
                      <span className="font-semibold text-foreground">
                        {paymentConfig.pagoMovil.banco || "Banesco (0134)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground text-[11px]">Teléfono:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-300">
                          {paymentConfig.pagoMovil.telefono || "Consultar por WhatsApp"}
                        </span>
                        {paymentConfig.pagoMovil.telefono && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPayField(paymentConfig.pagoMovil.telefono, "pm_tel")
                            }
                            className="text-[10px] p-1 rounded bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white"
                          >
                            {copiedPayField === "pm_tel" ? (
                              <Check size={10} className="text-emerald-400" />
                            ) : (
                              <Copy size={10} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground text-[11px]">Cédula:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">
                          {paymentConfig.pagoMovil.cedula || "Consultar por WhatsApp"}
                        </span>
                        {paymentConfig.pagoMovil.cedula && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPayField(paymentConfig.pagoMovil.cedula, "pm_ci")
                            }
                            className="text-[10px] p-1 rounded bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white"
                          >
                            {copiedPayField === "pm_ci" ? (
                              <Check size={10} className="text-emerald-400" />
                            ) : (
                              <Copy size={10} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {paymentConfig.pagoMovil.titular && (
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-muted-foreground text-[11px]">Titular:</span>
                        <span className="font-semibold text-foreground">
                          {paymentConfig.pagoMovil.titular}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-white/10 flex justify-between items-center">
                      <span className="text-amber-300 font-bold text-xs">Monto en Bs:</span>
                      <span className="font-mono font-extrabold text-amber-300 text-sm">
                        Bs.{" "}
                        {Math.round(
                          (PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend).priceUsd *
                            (paymentConfig.pagoMovil.tasaBs ||
                              DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
                        ).toLocaleString("es-VE")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyPayField(
                        `Pago Móvil Imposter:\nBanco: ${paymentConfig.pagoMovil.banco}\nTeléfono: ${paymentConfig.pagoMovil.telefono}\nCédula: ${paymentConfig.pagoMovil.cedula}\nTitular: ${paymentConfig.pagoMovil.titular}\nMonto: Bs. ${Math.round(
                          (PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend).priceUsd *
                            (paymentConfig.pagoMovil.tasaBs ||
                              DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
                        )}`,
                        "all_pm",
                      )
                    }
                    className="w-full rounded-xl bg-white/10 hover:bg-white/20 py-2 text-xs font-semibold text-white border border-white/15 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copiedPayField === "all_pm" ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span>¡Todos los datos copiados!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copiar Datos de Pago Móvil</span>
                      </>
                    )}
                  </button>

                  {/* Formulario de Notificación y Auto-Activación */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                      <Sparkles size={12} />
                      <span>Activar Pase al Instante</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Ingresa tu nombre y la referencia bancaria tras transferir. Tu Party Pass PRO
                      se activará automáticamente sin esperar mensajes.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <input
                        value={payProofName}
                        onChange={(e) => setPayProofName(e.target.value)}
                        placeholder="Tu Nombre o Apodo (ej. Carlos)"
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                      />
                      <input
                        value={payProofRef}
                        onChange={(e) => setPayProofRef(e.target.value)}
                        placeholder="N° de Referencia (últimos 4 o completo)"
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-foreground font-mono outline-none focus:border-amber-400"
                      />
                      {selectedPlan === "founder" && (
                        <input
                          value={payProofDiscordContact}
                          onChange={(e) => setPayProofDiscordContact(e.target.value)}
                          placeholder="Tu Usuario de Discord (para asignarte tu rol VIP)"
                          className="w-full rounded-lg border border-amber-400/40 bg-black/50 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                      )}
                    </div>

                    {payProofFeedback && (
                      <p className="text-[10px] text-rose-400 font-semibold">{payProofFeedback}</p>
                    )}

                    <button
                      type="button"
                      disabled={payProofSubmitting}
                      onClick={() => handleSubmitPaymentProof("Pago Móvil")}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black py-2.5 text-xs font-extrabold shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {payProofSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Registrando pago...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Confirmar Pago y Activar mi Pase PRO</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedPayMethod === "binance" && (
                <div className="rounded-2xl bg-black/40 border border-yellow-500/30 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                      Binance Pay (USDT)
                    </span>
                    <span className="text-[10px] text-muted-foreground">Instantáneo</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Binance Pay ID
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-extrabold text-amber-300">
                          {paymentConfig.binancePay.payId || "Consultar por Discord"}
                        </span>
                        {paymentConfig.binancePay.payId && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPayField(paymentConfig.binancePay.payId, "binance_id")
                            }
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white"
                          >
                            {copiedPayField === "binance_id" ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {paymentConfig.binancePay.nickname && (
                      <div className="flex justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">Usuario / Nickname:</span>
                        <span className="font-bold text-foreground">
                          {paymentConfig.binancePay.nickname}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs py-0.5">
                      <span className="text-muted-foreground">Monto exacto:</span>
                      <span className="font-bold text-yellow-300 font-mono">
                        {(
                          PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend
                        ).priceUsd.toFixed(2)}{" "}
                        USDT
                      </span>
                    </div>
                  </div>

                  {/* Formulario de Notificación y Auto-Activación */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                      <Sparkles size={12} />
                      <span>Activar Pase al Instante</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Ingresa tu nombre y el ID / Referencia de Binance tras transferir para
                      activación automática.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <input
                        value={payProofName}
                        onChange={(e) => setPayProofName(e.target.value)}
                        placeholder="Tu Nombre o Nickname"
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                      />
                      <input
                        value={payProofRef}
                        onChange={(e) => setPayProofRef(e.target.value)}
                        placeholder="Order ID / TxID o últimos 4 dígitos"
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-foreground font-mono outline-none focus:border-amber-400"
                      />
                      {selectedPlan === "founder" && (
                        <input
                          value={payProofDiscordContact}
                          onChange={(e) => setPayProofDiscordContact(e.target.value)}
                          placeholder="Tu Usuario de Discord (para asignarte tu rol VIP)"
                          className="w-full rounded-lg border border-amber-400/40 bg-black/50 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                      )}
                    </div>

                    {payProofFeedback && (
                      <p className="text-[10px] text-rose-400 font-semibold">{payProofFeedback}</p>
                    )}

                    <button
                      type="button"
                      disabled={payProofSubmitting}
                      onClick={() => handleSubmitPaymentProof("Binance Pay")}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black py-2.5 text-xs font-extrabold shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {payProofSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Registrando pago...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Confirmar Pago y Activar mi Pase PRO</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedPayMethod === "international" && (
                <div className="rounded-2xl bg-black/40 border border-blue-500/30 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <CreditCard size={13} /> Tarjetas y Apple Pay
                    </span>
                    <span className="text-[10px] text-muted-foreground">Internacional</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Aceptamos tarjetas de crédito y débito Visa, Mastercard y Apple Pay desde
                    cualquier país con activación automática inmediata.
                  </p>

                  {paymentConfig.internationalLink ? (
                    <a
                      href={paymentConfig.internationalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 text-xs font-bold shadow-lg transition hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={13} />
                      <span>
                        Pagar con Tarjeta ($
                        {(
                          PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend
                        ).priceUsd.toFixed(2)}
                        )
                      </span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-white/5 p-3 text-center text-xs text-muted-foreground border border-white/10">
                      Enlace de tarjeta internacional en configuración por el CEO.
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    playPop(soundEnabled);
                    setProModalView("perks");
                    setActiveSubTab("code");
                  }}
                  className="text-[11px] text-amber-300 hover:underline font-semibold cursor-pointer"
                >
                  ¿Ya tienes un código o cupón VIP? Canjéalo aquí
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
