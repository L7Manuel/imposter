import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_CATEGORIES,
  ADULT_CATEGORY,
  ADULT_WORDS,
  getUndercoverWord,
} from "@/data/categories";

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  votedForIndex: number | null;
}

export interface OnlineRoomState {
  code: string;
  hostId: string;
  hasPro: boolean;
  phase: "lobby" | "reveal" | "discuss" | "vote" | "result";
  players: RoomPlayer[];
  impostorCount: number;
  minutes: number;
  category: string;
  playedCategory: string;
  undercoverMode: boolean;
  jesterEnabled: boolean;
  accompliceMode: boolean;
  word: string;
  impostorWord: string;
  impostorIndices: number[];
  jesterIndex: number | null;
  starterPlayerIndex: number;
  roundStartedAt: number | null;
  roundWinner: "innocents" | "impostors" | "jester" | null;
  winReason: string;
  scores: { innocents: number; impostors: number };
  updatedAt: number;
}

interface CloudflareKVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare global {
  var __imposterOnlineRooms: Map<string, OnlineRoomState> | undefined;
  var __imposterRoomLastKvFetch: Map<string, number> | undefined;
}

const ROOM_KV_PREFIX = "imposter:room:";
const ROOM_TTL_SECONDS = 4 * 3600; // 4 horas

function getCloudflareKv(): CloudflareKVNamespace | null {
  return (
    (globalThis as unknown as { __env__?: { IMPOSTER_KV?: CloudflareKVNamespace } }).__env__
      ?.IMPOSTER_KV ?? null
  );
}

function getRoomsStore(): Map<string, OnlineRoomState> {
  if (!globalThis.__imposterOnlineRooms) {
    globalThis.__imposterOnlineRooms = new Map();
  }
  const now = Date.now();
  for (const [code, room] of globalThis.__imposterOnlineRooms.entries()) {
    if (now - room.updatedAt > 4 * 3600 * 1000) {
      globalThis.__imposterOnlineRooms.delete(code);
    }
  }
  return globalThis.__imposterOnlineRooms;
}

function getRoomLastFetchMap(): Map<string, number> {
  if (!globalThis.__imposterRoomLastKvFetch) {
    globalThis.__imposterRoomLastKvFetch = new Map();
  }
  return globalThis.__imposterRoomLastKvFetch;
}

async function loadRoomByCode(rawCode: string): Promise<OnlineRoomState | null> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return null;

  const store = getRoomsStore();
  const fetchMap = getRoomLastFetchMap();
  const now = Date.now();
  const cached = store.get(code);

  // Si se consultó hace menos de 800ms en este isolate, responder desde RAM a 0ms
  if (cached && now - (fetchMap.get(code) ?? 0) < 800) {
    return cached;
  }

  try {
    const kv = getCloudflareKv();
    if (kv) {
      const raw = await kv.get(`${ROOM_KV_PREFIX}${code}`);
      fetchMap.set(code, now);
      if (raw) {
        const parsed = JSON.parse(raw) as OnlineRoomState;
        if (!cached || parsed.updatedAt >= cached.updatedAt) {
          store.set(code, parsed);
          return parsed;
        }
      }
    }
  } catch {
    /* fallback to in-memory store */
  }

  return cached ?? null;
}

async function saveRoomState(room: OnlineRoomState): Promise<void> {
  const store = getRoomsStore();
  const fetchMap = getRoomLastFetchMap();
  store.set(room.code, room);
  fetchMap.set(room.code, Date.now());

  try {
    const kv = getCloudflareKv();
    if (kv) {
      await kv.put(`${ROOM_KV_PREFIX}${room.code}`, JSON.stringify(room), {
        expirationTtl: ROOM_TTL_SECONDS,
      });
    }
  } catch {
    /* ignore KV write error */
  }
}

function generateRoomCode(store: Map<string, OnlineRoomState>): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!store.has(code)) return code;
  }
  return "MESA";
}

export const createOnlineRoomServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      hostId: string;
      hostName: string;
      hasPro: boolean;
      category?: string;
      impostorCount?: number;
      minutes?: number;
      undercoverMode?: boolean;
      jesterEnabled?: boolean;
      accompliceMode?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    const store = getRoomsStore();
    const code = generateRoomCode(store);
    const cleanName = (data.hostName || "Anfitrión").trim().slice(0, 20) || "Anfitrión";

    const room: OnlineRoomState = {
      code,
      hostId: data.hostId,
      hasPro: Boolean(data.hasPro),
      phase: "lobby",
      players: [
        {
          id: data.hostId,
          name: cleanName,
          isHost: true,
          joinedAt: Date.now(),
          votedForIndex: null,
        },
      ],
      impostorCount: data.impostorCount || 1,
      minutes: data.minutes || 3,
      category: data.category || "Aleatoria",
      playedCategory: "Comida",
      undercoverMode: Boolean(data.undercoverMode),
      jesterEnabled: Boolean(data.jesterEnabled && data.hasPro),
      accompliceMode: data.accompliceMode ?? true,
      word: "",
      impostorWord: "",
      impostorIndices: [],
      jesterIndex: null,
      starterPlayerIndex: 0,
      roundStartedAt: null,
      roundWinner: null,
      winReason: "",
      scores: { innocents: 0, impostors: 0 },
      updatedAt: Date.now(),
    };

    await saveRoomState(room);
    return { success: true, room };
  });

export const joinOnlineRoomServerFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; playerId: string; playerName: string }) => input)
  .handler(async ({ data }) => {
    const cleanCode = (data.code || "").trim().toUpperCase();
    const room = await loadRoomByCode(cleanCode);

    if (!room) {
      return { success: false, error: "No existe ninguna sala activa con ese código." };
    }

    const cleanName = (data.playerName || "Jugador").trim().slice(0, 20) || "Jugador";
    const existingIdx = room.players.findIndex((p) => p.id === data.playerId);

    if (existingIdx >= 0) {
      room.players[existingIdx]!.name = cleanName;
      room.updatedAt = Date.now();
      await saveRoomState(room);
      return { success: true, room };
    }

    const maxAllowed = room.hasPro ? 15 : 6;
    if (room.players.length >= maxAllowed) {
      return {
        success: false,
        error: room.hasPro
          ? "La sala alcanzó el límite máximo de 15 jugadores."
          : "Sala llena (máx. 6 jugadores en modo Gratis). El anfitrión necesita Party Pass PRO para salas de 7 a 15 amigos.",
      };
    }

    room.players.push({
      id: data.playerId,
      name: cleanName,
      isHost: false,
      joinedAt: Date.now(),
      votedForIndex: null,
    });
    room.updatedAt = Date.now();
    await saveRoomState(room);
    return { success: true, room };
  });

export const getOnlineRoomStateServerFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; sinceUpdatedAt?: number }) => input)
  .handler(async ({ data }) => {
    const cleanCode = (data.code || "").trim().toUpperCase();
    const room = await loadRoomByCode(cleanCode);
    if (!room) {
      return { success: false, unchanged: false, error: "La sala ha finalizado o no existe." };
    }
    if (data.sinceUpdatedAt && room.updatedAt === data.sinceUpdatedAt) {
      return { success: true, unchanged: true, room: undefined };
    }
    return { success: true, unchanged: false, room };
  });

export const updateOnlineRoomConfigServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      code: string;
      hostId: string;
      category?: string;
      impostorCount?: number;
      minutes?: number;
      undercoverMode?: boolean;
      jesterEnabled?: boolean;
      accompliceMode?: boolean;
      hasPro?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    const room = await loadRoomByCode(data.code);
    if (!room || room.hostId !== data.hostId) {
      return { success: false, error: "No autorizado." };
    }
    if (typeof data.hasPro === "boolean") room.hasPro = data.hasPro;
    if (data.category) room.category = data.category;
    if (typeof data.impostorCount === "number") room.impostorCount = data.impostorCount;
    if (typeof data.minutes === "number") room.minutes = data.minutes;
    if (typeof data.undercoverMode === "boolean") room.undercoverMode = data.undercoverMode;
    if (typeof data.jesterEnabled === "boolean") room.jesterEnabled = data.jesterEnabled;
    if (typeof data.accompliceMode === "boolean") room.accompliceMode = data.accompliceMode;
    room.updatedAt = Date.now();
    await saveRoomState(room);
    return { success: true, room };
  });

export const startOnlineRoomRoundServerFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; hostId: string }) => input)
  .handler(async ({ data }) => {
    const room = await loadRoomByCode(data.code);
    if (!room || room.hostId !== data.hostId) {
      return { success: false, error: "Solo el anfitrión puede iniciar la partida." };
    }
    if (room.players.length < 3) {
      return { success: false, error: "Se necesitan al menos 3 jugadores en la sala para jugar." };
    }

    const catKeys = Object.keys(DEFAULT_CATEGORIES);
    let chosenCat = room.category;
    if (
      chosenCat === "Aleatoria" ||
      (!DEFAULT_CATEGORIES[chosenCat] && chosenCat !== ADULT_CATEGORY)
    ) {
      chosenCat = catKeys[Math.floor(Math.random() * catKeys.length)] || "Comida";
    }
    const pool =
      chosenCat === ADULT_CATEGORY
        ? ADULT_WORDS
        : DEFAULT_CATEGORIES[chosenCat] || DEFAULT_CATEGORIES["Comida"]!;
    const chosenWord = pool[Math.floor(Math.random() * pool.length)] || "Pizza";
    const decoyWord = room.undercoverMode ? getUndercoverWord(chosenWord, pool) : "";

    const totalPlayers = room.players.length;
    const maxImp = Math.max(1, totalPlayers - 2);
    const impCount = Math.min(room.impostorCount, maxImp);

    const indices = Array.from({ length: totalPlayers }, (_, i) => i).sort(
      () => Math.random() - 0.5,
    );
    const impostorIndices = indices.slice(0, impCount);
    let jesterIndex: number | null = null;
    if (room.jesterEnabled && room.hasPro && totalPlayers >= 4 && indices.length > impCount) {
      jesterIndex = indices[impCount]!;
    }

    for (const p of room.players) {
      p.votedForIndex = null;
    }

    room.playedCategory = chosenCat;
    room.word = chosenWord;
    room.impostorWord = decoyWord;
    room.impostorIndices = impostorIndices;
    room.jesterIndex = jesterIndex;
    room.starterPlayerIndex = Math.floor(Math.random() * totalPlayers);
    room.roundStartedAt = Date.now();
    room.roundWinner = null;
    room.winReason = "";
    room.phase = "reveal";
    room.updatedAt = Date.now();

    await saveRoomState(room);
    return { success: true, room };
  });

export const advanceOnlineRoomPhaseServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      code: string;
      hostId: string;
      nextPhase: "lobby" | "reveal" | "discuss" | "vote" | "result";
    }) => input,
  )
  .handler(async ({ data }) => {
    const room = await loadRoomByCode(data.code);
    if (!room || room.hostId !== data.hostId) {
      return { success: false, error: "Solo el anfitrión puede cambiar de fase." };
    }
    room.phase = data.nextPhase;
    if (data.nextPhase === "discuss") {
      room.roundStartedAt = Date.now();
    }
    room.updatedAt = Date.now();
    await saveRoomState(room);
    return { success: true, room };
  });

export const castOnlineVoteServerFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; playerId: string; targetIndex: number }) => input)
  .handler(async ({ data }) => {
    const room = await loadRoomByCode(data.code);
    if (!room || room.phase !== "vote") {
      return { success: false, error: "La votación no está abierta." };
    }
    const voter = room.players.find((p) => p.id === data.playerId);
    if (!voter) {
      return { success: false, error: "Jugador no encontrado en la sala." };
    }
    voter.votedForIndex = data.targetIndex;
    room.updatedAt = Date.now();

    // Si todos los jugadores ya votaron, calcular el resultado automáticamente
    const allVoted = room.players.every((p) => p.votedForIndex !== null);
    if (allVoted) {
      const tally: Record<number, number> = {};
      for (const p of room.players) {
        if (p.votedForIndex !== null) {
          tally[p.votedForIndex] = (tally[p.votedForIndex] || 0) + 1;
        }
      }
      let mostVotedIdx = 0;
      let maxVotes = -1;
      for (const [idxStr, count] of Object.entries(tally)) {
        const idx = Number(idxStr);
        if (count > maxVotes) {
          maxVotes = count;
          mostVotedIdx = idx;
        }
      }

      const accusedName = room.players[mostVotedIdx]?.name || `Jugador ${mostVotedIdx + 1}`;
      if (room.jesterIndex !== null && mostVotedIdx === room.jesterIndex) {
        room.roundWinner = "jester";
        room.winReason = `¡El grupo votó a ${accusedName} (${maxVotes} votos) y era El Bufón! Gana en solitario.`;
      } else if (room.impostorIndices.includes(mostVotedIdx)) {
        room.roundWinner = "innocents";
        room.winReason = `¡El grupo atrapó a ${accusedName} (${maxVotes} votos)! Los Inocentes ganan la ronda.`;
        room.scores.innocents += 1;
      } else {
        room.roundWinner = "impostors";
        room.winReason = `El grupo acusó por error a ${accusedName} (${maxVotes} votos), que era Inocente. ¡Ganan los Impostores!`;
        room.scores.impostors += 1;
      }
      room.phase = "result";
    }

    await saveRoomState(room);
    return { success: true, room };
  });
