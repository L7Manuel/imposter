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
} from "lucide-react";
import {
  PartyPassPlan,
  PARTY_PASS_PLANS,
  PaymentConfig,
  PendingPayment,
} from "@/lib/payment-config";

export interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  activePaymentTracker: PendingPayment | null;
  setActivePaymentTracker: (val: PendingPayment | null) => void;
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
}: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-3xl glass-panel border-2 border-amber-400/50 shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Header VIP / Checkout */}
        <div className="relative bg-gradient-to-br from-amber-500/25 via-yellow-500/10 to-transparent px-5 pt-5 pb-4 border-b border-white/10 text-center">
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
              setProModalView("perks");
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
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg">
                <Crown size={26} />
              </div>
              <h3 className="font-display text-2xl tracking-wider text-amber-300">
                PARTY PASS PRO
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desbloquea la experiencia completa para toda tu fiesta
              </p>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activePaymentTracker ? (
            <div className="text-center space-y-4 py-2">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 border-2 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <div>
                <h3 className="font-display text-lg text-amber-300">
                  Verificando Transferencia en Vivo
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

              <div className="rounded-2xl bg-black/40 border border-amber-400/30 p-3.5 text-xs text-left space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                  <Sparkles size={13} /> Desbloqueo Automático Instantáneo
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Hemos notificado al CEO a través de Discord. En cuanto confirme los fondos en su
                  cuenta, tu Party Pass PRO se desbloqueará solo en esta pantalla. ¡No cierres el
                  juego!
                </p>
              </div>

              {payProofFeedback && (
                <p className="text-xs text-rose-400 font-semibold">{payProofFeedback}</p>
              )}

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
                Ingresar otra referencia o volver
              </button>
            </div>
          ) : proModalView === "perks" ? (
            <>
              {/* Lista de Beneficios */}
              <div className="space-y-2 text-xs">
                {[
                  "👥 Salas grandes de 7 hasta 15 jugadores",
                  "🔥 8 Categorías PRO (Cine, Deportes, Geek, Objetos, Profesiones y más)",
                  "🔞 Categoría picante Fiesta +18 (60 palabras)",
                  "🃏 Rol especial El Bufón + ⚡ Eventos Relámpago",
                  "✨ Creación e importación ilimitada de listas propias",
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
                                👑 EDICIÓN FUNDADOR
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
                            ⭐ Acceso permanente para siempre
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

              {/* Canje de Código VIP / Clave Maestro CEO */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  ¿Tienes un Código Promo o Clave Ejecutiva CEO?
                </label>
                <div className="flex gap-2">
                  <input
                    value={proCodeInput}
                    onChange={(e) => setProCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
                    placeholder="Ingresa tu código..."
                    className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-mono uppercase text-foreground outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleRedeemCode}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md ${
                      proCodeInput.trim().length > 0
                        ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold hover:brightness-110 active:scale-95"
                        : "bg-white/15 hover:bg-white/25 text-white border border-white/15"
                    }`}
                  >
                    Activar
                  </button>
                </div>
                {proCodeFeedback && (
                  <p
                    className={`text-[11px] font-semibold ${
                      proCodeFeedback.type === "success" ? "text-emerald-400" : "text-amber-300"
                    }`}
                  >
                    {proCodeFeedback.text}
                  </p>
                )}
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
                  🇻🇪 Pago Móvil
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
                  🟡 Binance
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
                  💳 Tarjeta
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
                            (paymentConfig.pagoMovil.tasaBs || 55),
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
                            (paymentConfig.pagoMovil.tasaBs || 55),
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
                          <span>🚀 Ya Transferí, Activar mi Pase PRO</span>
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
                      🟡 Binance Pay (USDT)
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
                          <span>🚀 Ya Transferí, Activar mi Pase PRO</span>
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
