import { useState } from "react";
import { RefreshCw, Edit3, Save, MessageCircle, Check, Copy } from "lucide-react";
import { VIP_COUPON_HASHES_ORDERED, STORAGE_KEYS } from "@/lib/security";

export interface CeoTestersTabProps {
  decryptedCodes: string[];
  usedCoupons: string[];
  couponNames: Record<number, string>;
  setCouponNames: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  fetchTesterStatuses: () => Promise<void>;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

export function CeoTestersTab({
  decryptedCodes,
  usedCoupons,
  couponNames,
  setCouponNames,
  fetchTesterStatuses,
  copiedKey,
  copyToClipboard,
}: CeoTestersTabProps) {
  const [editingCouponIdx, setEditingCouponIdx] = useState<number | null>(null);
  const [editingNameInput, setEditingNameInput] = useState("");

  const handleSaveTesterName = (num: number) => {
    const clean = editingNameInput.trim() || (num === 1 ? "Ivana" : `Tester #${num}`);
    const updated = { ...couponNames, [num]: clean };
    setCouponNames(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.COUPON_NAMES, JSON.stringify(updated));
    }
    setEditingCouponIdx(null);
    setEditingNameInput("");
  };

  const buildTesterWhatsAppUrl = (code: string, testerName: string) => {
    const name = testerName?.trim() || "Tester VIP";
    const text = `¡Hola ${name}! 🧪 Aquí tienes tu cupón exclusivo de Tester VIP para Imposter (48 horas de acceso PRO gratuito).

🔑 Tu Cupón: ${code}
📲 Juega aquí: https://imposter.manu-07games.workers.dev

Pasos para activar:
1. Abre el enlace en tu navegador móvil.
2. Toca la corona dorada en la barra superior.
3. Ingresa tu código en "¿Tienes un código o cupón PRO?".
4. ¡Listo! Tienes 48h con todas las categorías y modos desbloqueados.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-2xl glass-panel p-5 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg text-foreground mb-1">
              10 CUPONES VIP DE PRUEBA (48 HORAS)
            </h3>
            <p className="text-xs text-muted-foreground">
              Cada cupón es de 1 solo uso estricto y desbloquea el juego por 48 horas a tus sujetos
              de prueba.
            </p>
          </div>
          <button
            onClick={() => fetchTesterStatuses()}
            className="flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <RefreshCw size={13} /> Sincronizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decryptedCodes.map((code, idx) => {
            const num = idx + 1;
            const hash = VIP_COUPON_HASHES_ORDERED[idx] || "";
            const isUsed = usedCoupons.includes(hash);
            const assignedName = couponNames[num] || (num === 1 ? "Ivana" : `Tester #${num}`);
            const isEditing = editingCouponIdx === num;

            return (
              <div
                key={num}
                className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/10 p-3 text-xs gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-muted-foreground">#{num}:</span>
                    <span className="font-mono font-bold text-foreground">{code}</span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={editingNameInput}
                        onChange={(e) => setEditingNameInput(e.target.value)}
                        placeholder="Nombre..."
                        className="rounded-lg bg-white/10 border border-white/20 px-2 py-0.5 text-xs text-foreground focus:outline-none focus:border-primary w-28"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTesterName(num);
                          if (e.key === "Escape") setEditingCouponIdx(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveTesterName(num)}
                        className="rounded-md bg-primary text-primary-foreground p-1 hover:brightness-110 cursor-pointer"
                        title="Guardar nombre"
                      >
                        <Save size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5">
                      <span>
                        Asignado: <strong>{assignedName}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setEditingCouponIdx(num);
                          setEditingNameInput(assignedName);
                        }}
                        className="text-muted-foreground hover:text-foreground transition p-0.5 rounded cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit3 size={11} />
                      </button>
                    </div>
                  )}

                  <span
                    className={`text-[10px] font-semibold mt-0.5 inline-block ${
                      isUsed ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {isUsed ? "Consumido" : "Disponible"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Botón WhatsApp */}
                  <a
                    href={buildTesterWhatsAppUrl(code, assignedName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 flex items-center gap-1 transition"
                    title="Enviar cupón por WhatsApp"
                  >
                    <MessageCircle size={14} />
                    <span className="text-[11px] font-semibold hidden md:inline">WhatsApp</span>
                  </a>

                  {/* Botón Copiar */}
                  <button
                    onClick={() => copyToClipboard(code, `tester-${num}`)}
                    className="rounded-lg bg-white/5 hover:bg-white/10 p-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title="Copiar código"
                  >
                    {copiedKey === `tester-${num}` ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
