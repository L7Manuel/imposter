import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Users,
  Crown,
  Copy,
  Check,
  Share2,
  Play,
  Fingerprint,
  ShieldAlert,
  Sparkles,
  Vote,
  Trophy,
  RefreshCw,
  QrCode,
  Wifi,
  ArrowRight,
} from "lucide-react";
import {
  OnlineRoomState,
  createOnlineRoomServerFn,
  joinOnlineRoomServerFn,
  getOnlineRoomStateServerFn,
  startOnlineRoomRoundServerFn,
  advanceOnlineRoomPhaseServerFn,
  castOnlineVoteServerFn,
} from "@/lib/room-server";
import { PARTY_PENALTIES } from "@/data/categories";

export interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPro: boolean;
  openPaywall: () => void;
  soundEnabled: boolean;
  playPop: (sound: boolean) => void;
  playFanfare: (innocentsWin: boolean, sound: boolean) => void;
  defaultPlayerName: string;
  category: string;
  impostorCount: number;
  minutes: number;
  undercoverMode: boolean;
  jesterEnabled: boolean;
  accompliceMode: boolean;
  initialJoinCode?: string | null;
}

function getOrCreateClientPlayerId(): string {
  if (typeof window === "undefined") return "srv";
  const key = "impostor-online-player-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `plr_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Genera una matriz visual determinista estilo QR a partir del código de sala para escaneo / identificación visual.
 */
function RoomVisualQr({ url, code }: { url: string; code: string }) {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
    url,
  )}`;
  return (
    <div className="mx-auto flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-xl w-fit">
      <img
        src={qrApiUrl}
        alt={`QR Sala ${code}`}
        className="h-36 w-36 rounded-lg object-contain"
        loading="eager"
      />
      <span className="font-mono text-[10px] font-bold tracking-widest text-slate-900 uppercase">
        SALA: {code}
      </span>
    </div>
  );
}

export function OnlineRoomModal({
  isOpen,
  onClose,
  hasPro,
  openPaywall,
  soundEnabled,
  playPop,
  playFanfare,
  defaultPlayerName,
  category,
  impostorCount,
  minutes,
  undercoverMode,
  jesterEnabled,
  accompliceMode,
  initialJoinCode,
}: OnlineRoomModalProps) {
  const [playerId] = useState<string>(() => getOrCreateClientPlayerId());
  const [playerName, setPlayerName] = useState<string>(defaultPlayerName || "Jugador 1");
  const [joinCodeInput, setJoinCodeInput] = useState<string>(initialJoinCode || "");
  const [room, setRoom] = useState<OnlineRoomState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isHoldingCard, setIsHoldingCard] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [activePenalty, setActivePenalty] = useState<string | null>(null);
  const roomUpdatedAtRef = useRef<number>(0);

  useEffect(() => {
    roomUpdatedAtRef.current = room?.updatedAt ?? 0;
    if (typeof window !== "undefined") {
      if (room?.code) {
        sessionStorage.setItem("impostor-active-online-room", room.code);
      }
    }
  }, [room?.updatedAt, room?.code]);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCodeInput(initialJoinCode.toUpperCase());
    }
  }, [initialJoinCode]);

  const pollRoom = useCallback(async (code: string, forceFull = false) => {
    if (typeof document !== "undefined" && document.hidden && !forceFull) return;
    try {
      const res = await getOnlineRoomStateServerFn({
        data: {
          code,
          sinceUpdatedAt: forceFull ? undefined : roomUpdatedAtRef.current || undefined,
        },
      });
      if (res.success && !res.unchanged && res.room) {
        roomUpdatedAtRef.current = res.room.updatedAt;
        setRoom(res.room);
      }
    } catch {
      /* ignore transient poll error */
    }
  }, []);

  // Reconexión instantánea en 0ms si el usuario recargó la pestaña y tenía una sala activa
  useEffect(() => {
    if (!isOpen || room) return;
    if (typeof window !== "undefined") {
      const savedCode = sessionStorage.getItem("impostor-active-online-room");
      if (savedCode && !initialJoinCode) {
        void pollRoom(savedCode, true);
      }
    }
  }, [isOpen, room, initialJoinCode, pollRoom]);

  useEffect(() => {
    if (!isOpen || !room?.code) return;
    const code = room.code;
    const interval = setInterval(() => {
      void pollRoom(code);
    }, 1500);
    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void pollRoom(code, true);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [isOpen, room?.code, pollRoom]);

  if (!isOpen) return null;

  const isHost = room ? room.hostId === playerId : false;
  const myPlayerIndex = room ? room.players.findIndex((p) => p.id === playerId) : -1;
  const myPlayer = myPlayerIndex >= 0 && room ? room.players[myPlayerIndex] : null;
  const inviteUrl =
    typeof window !== "undefined" && room
      ? `${window.location.origin}/?room=${room.code}`
      : `https://imposter.manu-07games.workers.dev/?room=${room?.code || ""}`;

  const handleCreateRoom = async () => {
    playPop(soundEnabled);
    setErrorMsg("");
    setIsLoading(true);
    try {
      const res = await createOnlineRoomServerFn({
        data: {
          hostId: playerId,
          hostName: playerName.trim() || "Anfitrión",
          hasPro,
          category,
          impostorCount,
          minutes,
          undercoverMode,
          jesterEnabled,
          accompliceMode,
        },
      });
      if (res.success && res.room) {
        setRoom(res.room);
      } else {
        setErrorMsg("No se pudo crear la sala. Intenta de nuevo.");
      }
    } catch {
      setErrorMsg("Error de conexión al crear la sala.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    playPop(soundEnabled);
    setErrorMsg("");
    if (joinCodeInput.trim().length < 4) {
      setErrorMsg("Ingresa el código de 4 letras de la sala.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await joinOnlineRoomServerFn({
        data: {
          code: joinCodeInput.trim().toUpperCase(),
          playerId,
          playerName: playerName.trim() || "Invitado",
        },
      });
      if (res.success && res.room) {
        setRoom(res.room);
      } else {
        setErrorMsg(res.error || "No se encontró la sala.");
      }
    } catch {
      setErrorMsg("Error de red al unirse a la sala.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRound = async () => {
    if (!room) return;
    playPop(soundEnabled);
    setErrorMsg("");
    setActivePenalty(null);
    const res = await startOnlineRoomRoundServerFn({
      data: { code: room.code, hostId: playerId },
    });
    if (res.success && res.room) {
      setRoom(res.room);
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleAdvancePhase = async (
    nextPhase: "lobby" | "reveal" | "discuss" | "vote" | "result",
  ) => {
    if (!room) return;
    playPop(soundEnabled);
    const res = await advanceOnlineRoomPhaseServerFn({
      data: { code: room.code, hostId: playerId, nextPhase },
    });
    if (res.success && res.room) {
      setRoom(res.room);
      if (nextPhase === "result" && res.room.roundWinner) {
        playFanfare(res.room.roundWinner === "innocents", soundEnabled);
      }
    }
  };

  const handleCastVote = async (targetIdx: number) => {
    if (!room) return;
    playPop(soundEnabled);
    const res = await castOnlineVoteServerFn({
      data: { code: room.code, playerId, targetIndex: targetIdx },
    });
    if (res.success && res.room) {
      setRoom(res.room);
      if (res.room.phase === "result" && res.room.roundWinner) {
        playFanfare(res.room.roundWinner === "innocents", soundEnabled);
      }
    }
  };

  const handleShareInvite = async () => {
    if (!room) return;
    playPop(soundEnabled);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Sala Imposter #${room.code}`,
          text: `¡Entra a nuestra Sala Online de Imposter! Código: ${room.code}`,
          url: inviteUrl,
        });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const isMyRoleImpostor = room ? room.impostorIndices.includes(myPlayerIndex) : false;
  const isMyRoleJester = room ? room.jesterIndex === myPlayerIndex : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 sm:backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-3xl glass-panel border-2 border-accent/40 shadow-[0_0_45px_rgba(56,189,248,0.2)] overflow-hidden">
        {/* Top Header */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-accent/20 via-primary/10 to-transparent px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent">
              <Wifi size={18} />
            </div>
            <div>
              <h3 className="font-display text-lg tracking-wider text-foreground leading-none">
                {room ? `SALA EN VIVO #${room.code}` : "MULTIJUGADOR ONLINE"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {room
                  ? `${room.players.length} jugadores conectados en sus teléfonos`
                  : "Cada jugador ve su carta secreta en su propio celular"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto smooth-scroll p-5 space-y-4">
          {!room ? (
            /* PANTALLA DE CREAR O UNIRSE A SALA */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Tu Nombre o Apodo en la Sala
                </label>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ej: Manuel"
                  maxLength={18}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-accent"
                />
              </div>

              {/* Crear Sala como Anfitrión */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    ¿Eres el organizador?
                  </span>
                  <span className="rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    {hasPro ? "Hasta 15 amigos" : "Hasta 6 amigos gratis"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Crea una sala instantánea con código de 4 letras y QR. Tus amigos entran gratis
                  desde su navegador.
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleCreateRoom}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground glow-primary transition hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <Play size={16} className="fill-current" />
                  <span>Crear Sala como Anfitrión</span>
                </button>
              </div>

              {/* Unirse a Sala Existente */}
              <form
                onSubmit={handleJoinRoom}
                className="rounded-2xl bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    ¿Tienes un código de invitación?
                  </span>
                  <span className="rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                    Acceso directo
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO (EJ: MESA)"
                    maxLength={4}
                    className="flex-1 rounded-xl bg-black/40 border border-accent/25 px-3.5 py-2.5 text-center font-mono text-base font-bold tracking-widest uppercase text-accent placeholder:text-muted-foreground/50 outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl bg-accent px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.25)] transition hover:brightness-110 active:scale-95 cursor-pointer"
                  >
                    Entrar
                  </button>
                </div>
              </form>

              {errorMsg && (
                <p className="rounded-xl bg-destructive/15 border border-destructive/30 px-3 py-2 text-xs text-destructive text-center font-medium">
                  {errorMsg}
                </p>
              )}
            </div>
          ) : room.phase === "lobby" ? (
            /* LOBBY EN VIVO DE LA SALA */
            <div className="space-y-4">
              {/* Banner del Código + QR */}
              <div className="rounded-2xl bg-black/40 border border-accent/30 p-4 text-center space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Código de Invitación
                </span>
                <div className="font-display text-5xl tracking-[0.2em] text-accent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                  {room.code}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShareInvite}
                    className="flex items-center gap-1.5 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 px-3 py-2 text-xs font-bold text-accent transition cursor-pointer"
                  >
                    {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                    <span>{copiedLink ? "¡Enlace Copiado!" : "Invitar por WhatsApp"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playPop(soundEnabled);
                      setShowQr(!showQr);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-xs font-semibold text-foreground transition cursor-pointer"
                  >
                    <QrCode size={14} />
                    <span>{showQr ? "Ocultar QR" : "Mostrar QR"}</span>
                  </button>
                </div>

                {showQr && (
                  <div className="pt-2 animate-in zoom-in-95 duration-150">
                    <RoomVisualQr url={inviteUrl} code={room.code} />
                  </div>
                )}
              </div>

              {/* Lista de Jugadores Conectados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Users size={14} className="text-accent" />
                    Jugadores en la Sala ({room.players.length}/{room.hasPro ? 15 : 6})
                  </span>
                  {!room.hasPro && isHost && (
                    <button
                      type="button"
                      onClick={openPaywall}
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                    >
                      <Crown size={11} /> Ampliar a 15
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {room.players.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${
                        p.id === playerId
                          ? "bg-accent/15 border-accent/40 text-foreground font-bold"
                          : "bg-white/5 border-white/10 text-foreground/90"
                      }`}
                    >
                      <span className="truncate">
                        {idx + 1}. {p.name}
                      </span>
                      {p.isHost && (
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                          Host
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de Reglas Activas */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                <span>
                  Categoría: <strong className="text-foreground">{room.category}</strong>
                </span>
                <span>
                  Impostores: <strong className="text-destructive">{room.impostorCount}</strong>
                </span>
                <span>
                  Modo:{" "}
                  <strong className="text-primary">
                    {room.undercoverMode ? "Infiltrado Engañado" : "Impostor Clásico"}
                  </strong>
                </span>
              </div>

              {errorMsg && (
                <p className="rounded-xl bg-destructive/15 border border-destructive/30 px-3 py-2 text-xs text-destructive text-center font-medium">
                  {errorMsg}
                </p>
              )}

              {isHost ? (
                <button
                  type="button"
                  disabled={room.players.length < 3}
                  onClick={handleStartRound}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground glow-primary transition hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Play size={17} className="fill-current" />
                  <span>
                    {room.players.length < 3
                      ? `Esperando jugadores (${room.players.length}/3 mín)`
                      : "¡Repartir Cartas a Todos!"}
                  </span>
                </button>
              ) : (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-center text-xs text-muted-foreground animate-pulse">
                  Esperando a que el anfitrión reparta las cartas...
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("impostor-active-online-room");
                  }
                  roomUpdatedAtRef.current = 0;
                  setRoom(null);
                }}
                className="w-full py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Salir de esta sala o ingresar otro código
              </button>
            </div>
          ) : room.phase === "reveal" ? (
            /* CARTA SECRETA INDIVIDUAL EN EL TELÉFONO DE CADA JUGADOR */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                  Expediente Confidencial de {myPlayer?.name}
                </span>
                <p className="text-xs text-muted-foreground">
                  Mantén presionada tu tarjeta para ver tu rol secreto en tu celular
                </p>
              </div>

              <div
                onPointerDown={() => setIsHoldingCard(true)}
                onPointerUp={() => setIsHoldingCard(false)}
                onPointerLeave={() => setIsHoldingCard(false)}
                onPointerCancel={() => setIsHoldingCard(false)}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative flex aspect-square w-full max-w-[260px] cursor-pointer select-none touch-none flex-col items-center justify-center overflow-hidden rounded-3xl p-6 transition-all duration-300 border-2 ${
                  isHoldingCard
                    ? isMyRoleImpostor
                      ? "bg-destructive/95 text-destructive-foreground border-destructive glow-danger scale-[1.02]"
                      : isMyRoleJester
                        ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_35px_rgba(147,51,234,0.7)] scale-[1.02]"
                        : "bg-primary text-primary-foreground border-primary glow-primary scale-[1.02]"
                    : "glass-panel border-white/20 hover:border-accent/50 shadow-2xl"
                }`}
              >
                {!isHoldingCard ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 border border-accent/40 text-accent">
                      <Fingerprint size={44} />
                    </div>
                    <span className="font-display text-lg tracking-wider text-foreground">
                      MANTÉN PARA REVELAR
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Nadie más puede ver tu pantalla
                    </span>
                  </div>
                ) : isMyRoleImpostor ? (
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert size={46} className="animate-bounce" />
                    <span className="font-display text-3xl tracking-widest">¡ERES IMPOSTOR!</span>
                    {room.undercoverMode && room.impostorWord && (
                      <div className="rounded-xl bg-black/35 px-3 py-1.5 border border-amber-300/40">
                        <span className="block text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                          Pista Camaleón (Señuelo)
                        </span>
                        <span className="font-display text-xl text-amber-200">
                          {room.impostorWord}
                        </span>
                      </div>
                    )}
                    <p className="text-xs opacity-90">
                      Categoría: <strong>{room.playedCategory}</strong>
                    </p>
                    <p className="text-[11px] opacity-85">
                      {room.undercoverMode && room.impostorWord
                        ? "Usa tu pista señuelo para camuflarte en el debate."
                        : "Escucha las pistas de los demás y camúflate."}
                    </p>
                  </div>
                ) : isMyRoleJester ? (
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles size={40} className="animate-bounce" />
                    <span className="font-display text-3xl tracking-wider">¡ERES EL BUFÓN!</span>
                    <span className="text-xs font-bold">Palabra: {room.word}</span>
                    <p className="text-[11px] opacity-90">
                      Haz que sospechen de ti y te voten para ganar tú solo.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles size={38} />
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                      Tu Palabra Secreta
                    </span>
                    <span className="font-display text-3xl font-extrabold my-1">{room.word}</span>
                    <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold">
                      Categoría: {room.playedCategory}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 text-xs">
                Empieza dando la primera pista:{" "}
                <strong className="text-primary">
                  {room.players[room.starterPlayerIndex]?.name || "Jugador 1"}
                </strong>
              </div>

              {isHost ? (
                <button
                  type="button"
                  onClick={() => handleAdvancePhase("vote")}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-slate-950 transition hover:brightness-110 cursor-pointer"
                >
                  <Vote size={16} />
                  <span>Abrir Votación en Todos los Teléfonos</span>
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Debatan en voz alta. El anfitrión abrirá la votación cuando estén listos.
                </p>
              )}
            </div>
          ) : room.phase === "vote" ? (
            /* VOTACIÓN EN TIEMPO REAL DESDE CADA CELULAR */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-display text-2xl text-primary tracking-wide">
                  VOTA DESDE TU TELÉFONO
                </h4>
                <p className="text-xs text-muted-foreground">
                  ¿Quién crees que miente? (
                  {room.players.filter((p) => p.votedForIndex !== null).length}/
                  {room.players.length} votos listos)
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {room.players.map((p, idx) => {
                  const isSelected = myPlayer?.votedForIndex === idx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleCastVote(idx)}
                      className={`flex items-center justify-between rounded-2xl p-3.5 border text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-destructive/25 border-destructive text-white shadow-lg"
                          : "bg-white/5 border-white/10 hover:border-white/25 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-sm">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {isSelected ? "Tu voto" : "Acusar"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* RESULTADO DE LA SALA ONLINE + RULETA DE PENITENCIA */
            <div className="space-y-4 text-center">
              <div
                className={`rounded-2xl p-4 border ${
                  room.roundWinner === "innocents"
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-destructive/20 border-destructive text-destructive"
                }`}
              >
                <Trophy size={28} className="mx-auto mb-1" />
                <h4 className="font-display text-2xl">
                  {room.roundWinner === "innocents"
                    ? "¡GANAN LOS INOCENTES!"
                    : room.roundWinner === "jester"
                      ? "¡GANA EL BUFÓN!"
                      : "¡GANAN LOS IMPOSTORES!"}
                </h4>
                <p className="text-xs text-foreground/90 mt-1">{room.winReason}</p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-xs space-y-1.5">
                <p>
                  Impostor(es):{" "}
                  <strong className="text-destructive">
                    {room.impostorIndices.map((i) => room.players[i]?.name).join(", ")}
                  </strong>
                </p>
                <p>
                  Palabra Inocente: <strong className="text-primary">{room.word}</strong>
                </p>
                {room.undercoverMode && room.impostorWord && (
                  <p>
                    Palabra Infiltrado:{" "}
                    <strong className="text-amber-300">{room.impostorWord}</strong>
                  </p>
                )}
              </div>

              {/* Penitencia de Fiesta */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Castigo / Reto de Fiesta
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playPop(soundEnabled);
                      const randomPen =
                        PARTY_PENALTIES[Math.floor(Math.random() * PARTY_PENALTIES.length)]!;
                      setActivePenalty(randomPen);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-400/30 transition cursor-pointer"
                  >
                    <RefreshCw size={11} /> Girar Reto
                  </button>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {activePenalty ||
                    "Pulsa 'Girar Reto' para asignar una penitencia divertida al perdedor de la ronda."}
                </p>
              </div>

              {isHost && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartRound}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground cursor-pointer"
                  >
                    <Play size={14} className="fill-current" /> Otra Ronda Online
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvancePhase("lobby")}
                    className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-semibold text-foreground cursor-pointer"
                  >
                    Lobby
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
