import { useState } from "react";
import { RefreshCw, CheckCircle2, DollarSign, Bell, Coins, CreditCard } from "lucide-react";
import { reviewPaymentServerFn, savePaymentConfigServerFn } from "@/lib/coupon-server";
import { PaymentConfig, PendingPayment, DEFAULT_PAYMENT_CONFIG } from "@/lib/payment-config";
import { STORAGE_KEYS } from "@/lib/security";

export interface CeoPaymentsTabProps {
  token: string | null;
  payments: PendingPayment[];
  setPayments: React.Dispatch<React.SetStateAction<PendingPayment[]>>;
  isLoadingPayments: boolean;
  fetchPayments: () => Promise<void>;
  paymentConfig: PaymentConfig;
  setPaymentConfig: React.Dispatch<React.SetStateAction<PaymentConfig>>;
}

export function CeoPaymentsTab({
  token,
  payments,
  setPayments,
  isLoadingPayments,
  fetchPayments,
  paymentConfig,
  setPaymentConfig,
}: CeoPaymentsTabProps) {
  const [savePaymentSuccess, setSavePaymentSuccess] = useState(false);

  const handleReview = async (paymentId: string, action: "approve" | "reject") => {
    if (!token) return;
    try {
      const res = await reviewPaymentServerFn({
        data: { ceoToken: token, paymentId, action },
      });
      if (res.success && res.payments) setPayments(res.payments);
    } catch {
      /* ignore */
    }
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(paymentConfig));
      }

      const res = await savePaymentConfigServerFn({
        data: {
          ceoToken: token,
          config: paymentConfig,
        },
      });

      if (res.success) {
        setSavePaymentSuccess(true);
        setTimeout(() => setSavePaymentSuccess(false), 3500);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl glass-panel p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg text-foreground">
              BANDEJA DE COBROS Y TRANSFERENCIAS
            </h3>
            <p className="text-xs text-muted-foreground">
              Revisa y aprueba pagos de Pago Móvil, Binance Pay o Tarjeta
            </p>
          </div>
          <button
            onClick={() => fetchPayments()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <RefreshCw size={13} className={isLoadingPayments ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No hay transferencias reportadas en este momento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-foreground">{p.customerName}</span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {p.amountFormatted}
                    </span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                      {p.method}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Plan: <strong>{p.plan}</strong> | Ref: #{p.reference}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {p.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleReview(p.id, "approve")}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Aprobar
                      </button>
                      <button
                        onClick={() => handleReview(p.id, "reject")}
                        className="rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        p.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {p.status === "approved" ? "Aprobado" : "Rechazado"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Encabezado de Sección */}
      <div>
        <h3 className="font-display text-lg text-foreground">
          MÉTODOS DE COBRO Y CUENTAS RECEPTORAS
        </h3>
        <p className="text-xs text-muted-foreground">
          Configura los datos bancarios y wallets que los clientes verán en el Paywall de Imposter.
        </p>
      </div>

      {/* CÉLULA 1: PAGO MÓVIL (BOLÍVARES) */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
              VES
            </span>
            <div>
              <h4 className="font-display text-sm text-foreground">PAGO MÓVIL (BOLÍVARES)</h4>
              <p className="text-[11px] text-muted-foreground">
                Transferencias inmediatas para usuarios en Venezuela
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            Tasa Activa: Bs.{" "}
            {(paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs).toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Banco Receptor</label>
            <input
              type="text"
              value={paymentConfig.pagoMovil.banco}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  pagoMovil: { ...paymentConfig.pagoMovil, banco: e.target.value },
                })
              }
              placeholder="ej: Banesco (0134)"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Teléfono Registrado</label>
            <input
              type="text"
              value={paymentConfig.pagoMovil.telefono}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  pagoMovil: { ...paymentConfig.pagoMovil, telefono: e.target.value },
                })
              }
              placeholder="ej: 0414-1234567"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Cédula / RIF</label>
            <input
              type="text"
              value={paymentConfig.pagoMovil.cedula}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  pagoMovil: { ...paymentConfig.pagoMovil, cedula: e.target.value },
                })
              }
              placeholder="ej: V-12345678"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Titular de la Cuenta</label>
            <input
              type="text"
              value={paymentConfig.pagoMovil.titular}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  pagoMovil: { ...paymentConfig.pagoMovil, titular: e.target.value },
                })
              }
              placeholder="ej: Manuel Lermit"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-amber-300 font-bold block mb-1">
              Tasa de Cambio Fijada (Bs por cada $1 USD)
            </label>
            <input
              type="number"
              step="0.5"
              value={paymentConfig.pagoMovil.tasaBs || ""}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  pagoMovil: {
                    ...paymentConfig.pagoMovil,
                    tasaBs: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="ej: 55.00"
              className="w-full rounded-xl bg-amber-400/5 border border-amber-400/30 px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* CÉLULA 2: BINANCE PAY (CRIPTO) */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-amber-400" />
            <div>
              <h4 className="font-display text-sm text-foreground">BINANCE PAY (USDT / CRIPTO)</h4>
              <p className="text-[11px] text-muted-foreground">
                Cobros instantáneos en criptomonedas sin comisión
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
            0% Comisión
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Binance Pay — ID Numérico
            </label>
            <input
              type="text"
              value={paymentConfig.binancePay.payId}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  binancePay: { ...paymentConfig.binancePay, payId: e.target.value },
                })
              }
              placeholder="ej: 123456789"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Binance — Nickname / Usuario
            </label>
            <input
              type="text"
              value={paymentConfig.binancePay.nickname}
              onChange={(e) =>
                setPaymentConfig({
                  ...paymentConfig,
                  binancePay: { ...paymentConfig.binancePay, nickname: e.target.value },
                })
              }
              placeholder="ej: ManuGamer"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* CÉLULA 3: PASARELA INTERNACIONAL */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-blue-400" />
            <div>
              <h4 className="font-display text-sm text-foreground">
                PASARELA INTERNACIONAL (TARJETAS / STRIPE / WHOP)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Para clientes en el exterior que pagan con tarjeta de crédito, Apple Pay o Google
                Pay
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
            Global
          </span>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Enlace de Checkout Externo
          </label>
          <input
            type="text"
            value={paymentConfig.internationalLink || ""}
            onChange={(e) =>
              setPaymentConfig({
                ...paymentConfig,
                internationalLink: e.target.value,
              })
            }
            placeholder="https://whop.com/imposter"
            className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* CÉLULA 4: CALCULADORA DE CONVERSIÓN EN VIVO */}
      <div className="rounded-2xl glass-panel p-5 border border-amber-400/30 bg-amber-500/[0.03] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-sm text-amber-300 flex items-center gap-1.5">
              <DollarSign size={15} /> CONVERSIÓN EN VIVO PARA EL PAYWALL
            </h4>
            <p className="text-xs text-muted-foreground">
              Así se calcularán los precios automáticamente para los usuarios que elijan Pago Móvil
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/40 px-2.5 py-1 rounded-xl">
            Tasa Activa: Bs.{" "}
            {(paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs).toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl bg-black/40 border border-white/10 p-3">
            <span className="text-[11px] text-muted-foreground block">Pase Fiesta (24h)</span>
            <span className="font-bold text-foreground block mt-0.5">$0.99 USD</span>
            <span className="font-mono text-amber-300 font-bold block mt-1.5 text-sm">
              Bs.{" "}
              {Math.round(
                0.99 * (paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
              ).toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/10 p-3">
            <span className="text-[11px] text-muted-foreground block">Fin de Semana (72h)</span>
            <span className="font-bold text-foreground block mt-0.5">$1.99 USD</span>
            <span className="font-mono text-amber-300 font-bold block mt-1.5 text-sm">
              Bs.{" "}
              {Math.round(
                1.99 * (paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
              ).toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/10 p-3">
            <span className="text-[11px] text-muted-foreground block">Pase Mensual (30d)</span>
            <span className="font-bold text-foreground block mt-0.5">$3.99 USD</span>
            <span className="font-mono text-amber-300 font-bold block mt-1.5 text-sm">
              Bs.{" "}
              {Math.round(
                3.99 * (paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
              ).toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl bg-black/40 border border-amber-400/30 p-3 bg-amber-500/[0.06]">
            <span className="text-[11px] text-amber-300 font-bold block">Fundador Vitalicio</span>
            <span className="font-bold text-foreground block mt-0.5">$9.80 USD</span>
            <span className="font-mono text-amber-300 font-bold block mt-1.5 text-sm">
              Bs.{" "}
              {Math.round(
                9.8 * (paymentConfig.pagoMovil.tasaBs || DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs),
              ).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveConfig}
            className="rounded-xl bg-primary hover:brightness-110 px-5 py-2.5 text-xs font-semibold text-primary-foreground transition cursor-pointer shadow-md"
          >
            {savePaymentSuccess ? "¡Guardado con éxito!" : "Guardar Datos de Cobro"}
          </button>
          {savePaymentSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={14} />
              Guardado en Paywall y sincronizado con Discord
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
          <Bell size={12} className="text-emerald-400" />
          <span>Puente interno con Discord activo</span>
        </div>
      </div>
    </section>
  );
}
