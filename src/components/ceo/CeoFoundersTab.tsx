import { useState } from "react";
import {
  UserPlus,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FounderRecord, issueFounderServerFn } from "@/lib/coupon-server";

export interface CeoFoundersTabProps {
  token: string | null;
  founders: FounderRecord[];
  setFounders: React.Dispatch<React.SetStateAction<FounderRecord[]>>;
  isLoadingFounders: boolean;
  fetchFounders: () => Promise<void>;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

export function CeoFoundersTab({
  token,
  founders,
  setFounders,
  isLoadingFounders,
  fetchFounders,
  copiedKey,
  copyToClipboard,
}: CeoFoundersTabProps) {
  const [newFounderName, setNewFounderName] = useState("");
  const [issuedFounder, setIssuedFounder] = useState<FounderRecord | null>(null);
  const [expandedFounder, setExpandedFounder] = useState<number | null>(null);

  const totalFounders = founders.length;
  const activeFounders = founders.filter((f) => f.redeemedAt !== null).length;
  const totalGuestPassesUsed = founders.reduce(
    (acc, f) => acc + f.guestPasses.filter((p) => p.redeemedAt !== null).length,
    0,
  );

  const handleIssueFounder = async () => {
    if (!token) return;
    try {
      const res = await issueFounderServerFn({
        data: {
          ceoToken: token,
          name: newFounderName.trim() || undefined,
        },
      });
      if (res.success && res.founder) {
        setIssuedFounder(res.founder);
        setNewFounderName("");
        setFounders((prev) => [...prev, res.founder!]);
      }
    } catch {
      /* ignore */
    }
  };

  const buildFounderWhatsAppUrl = (code: string, name: string) => {
    const text = `¡Hola ${name || ""}! 👑 Aquí tienes tu Pase Fundador Vitalicio oficial para Imposter.

🔑 Código Exclusivo: ${code}
📲 Entra a jugar: https://imposter.manu-07games.workers.dev

Pasos para activarlo:
1. Abre el enlace en tu navegador.
2. Pulsa el botón de la corona.
3. Escribe tu código en "¿Tienes un código o cupón PRO?".
4. ¡Listo! Tienes acceso ilimitado permanente y 5 Pases Fiesta de 24h para tus amigos.

💬 Únete a nuestro canal VIP en Discord:
https://discord.gg/9W92kXn4kS`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const buildGuestPassWhatsAppUrl = (passCode: string, founderName: string) => {
    const text = `¡Hola! 🎁 ${founderName || "Un Miembro Fundador"} te acaba de regalar un Pase Fiesta Oficial de 24 Horas para Imposter.

🔑 Código de Fiesta: ${passCode}
📲 Entra a jugar: https://imposter.manu-07games.workers.dev

Pasos:
1. Abre el enlace en tu móvil.
2. Pulsa la corona y canjea tu código.
3. ¡Todo desbloqueado para la fiesta de hoy!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground">Pases Fundador Emitidos</span>
          <span className="font-display text-3xl text-amber-400 mt-2">{totalFounders}</span>
        </div>
        <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground">Fundadores Activos (Canjeados)</span>
          <span className="font-display text-3xl text-emerald-400 mt-2">{activeFounders}</span>
        </div>
        <div className="rounded-2xl glass-panel p-4 border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground">Pases de Invitación Canjeados</span>
          <span className="font-display text-3xl text-blue-400 mt-2">
            {totalGuestPassesUsed} / {totalFounders * 5}
          </span>
        </div>
      </div>

      {/* Generador de Pase Fundador */}
      <div className="rounded-2xl glass-panel p-5 border border-amber-500/30 shadow-xl bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={18} className="text-amber-400" />
          <h2 className="font-display text-lg text-amber-400 tracking-wide">
            EMITIR NUEVO PASE FUNDADOR ($9.80)
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Genera un código criptográfico vitalicio y sus 5 pases de anfitrión para enviarlo
          directamente por WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Nombre del Fundador (ej: Carlos Gómez)"
            value={newFounderName}
            onChange={(e) => setNewFounderName(e.target.value)}
            className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={handleIssueFounder}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 font-semibold text-black transition cursor-pointer text-sm shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Sparkles size={16} /> Emitir Pase Fundador
          </button>
        </div>

        {/* Recuadro de código recién emitido */}
        {issuedFounder && (
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/40 p-4 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-300">
                ¡Pase #{issuedFounder.number} emitido para {issuedFounder.name}!
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(issuedFounder.code, `issued-${issuedFounder.number}`)
                  }
                  className="rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-xs text-foreground flex items-center gap-1 transition"
                >
                  {copiedKey === `issued-${issuedFounder.number}` ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                  Copiar
                </button>
                <a
                  href={buildFounderWhatsAppUrl(issuedFounder.code, issuedFounder.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs text-white flex items-center gap-1 transition"
                >
                  <Send size={12} /> WhatsApp
                </a>
              </div>
            </div>
            <p className="font-mono text-xl font-bold tracking-wider text-amber-400 text-center py-2 bg-black/40 rounded-lg border border-amber-500/20">
              {issuedFounder.code}
            </p>
          </div>
        )}
      </div>

      {/* Lista de Fundadores */}
      <div className="rounded-2xl glass-panel p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base text-foreground">
            REGISTRO DE FUNDADORES Y SUS 5 PASES
          </h3>
          <button
            onClick={() => fetchFounders()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <RefreshCw size={13} className={isLoadingFounders ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {founders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aún no has emitido ningún Pase Fundador. Usa el botón de arriba para generar el primero.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {founders.map((f) => {
              const usedCount = f.guestPasses.filter((p) => p.redeemedAt !== null).length;
              const isExpanded = expandedFounder === f.number;

              return (
                <div
                  key={f.number}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-display text-lg border border-amber-500/20">
                        #{f.number}
                      </div>
                      <div>
                        <h4 className="font-display text-base text-foreground">{f.name}</h4>
                        <p className="font-mono text-xs text-amber-400">{f.code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          f.redeemedAt !== null
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {f.redeemedAt !== null ? "Activo" : "Pendiente"}
                      </span>

                      <span className="text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {usedCount}/5 Pases Usados
                      </span>

                      <button
                        onClick={() => copyToClipboard(f.code, `fndr-${f.number}`)}
                        title="Copiar Código"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                      >
                        {copiedKey === `fndr-${f.number}` ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>

                      <a
                        href={buildFounderWhatsAppUrl(f.code, f.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar por WhatsApp"
                        className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/30"
                      >
                        <Send size={14} />
                      </a>

                      <button
                        onClick={() => setExpandedFounder(isExpanded ? null : f.number)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable 5 Guest Passes Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2 animate-in fade-in">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        5 Pases de Invitación de 24h de {f.name}:
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {f.guestPasses.map((p) => (
                          <div
                            key={p.passIndex}
                            className="flex items-center justify-between rounded-lg bg-black/30 border border-white/10 p-2.5 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-display text-muted-foreground">
                                  Pase #{p.passIndex}:
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  {p.code}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-medium block mt-0.5 ${
                                  p.redeemedAt !== null ? "text-emerald-400" : "text-amber-400/80"
                                }`}
                              >
                                {p.redeemedAt !== null
                                  ? `Canjeado (${p.redeemedBy || "Invitado"})`
                                  : "Disponible"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  copyToClipboard(p.code, `pass-${f.number}-${p.passIndex}`)
                                }
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                              >
                                {copiedKey === `pass-${f.number}-${p.passIndex}` ? (
                                  <Check size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>

                              <a
                                href={buildGuestPassWhatsAppUrl(p.code, f.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/20"
                              >
                                <Send size={12} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
