import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Volume2,
  VolumeX,
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  Fingerprint,
  Target,
  User,
  Lock,
  Unlock,
  KeyRound,
  Delete,
  Play,
  LogOut,
  Settings,
  Smartphone,
  Users,
  Share2,
  Download,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  Crown,
  QrCode,
  Copy,
  BarChart3,
  ShieldCheck,
  Bell,
  Clock,
  Edit3,
  Sun,
  CreditCard,
  Wallet,
  Building2,
  ExternalLink,
  Send,
  Ticket,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Activity,
  RefreshCw,
} from "lucide-react";
import { acquireScreenWakeLock, releaseScreenWakeLock } from "@/lib/wake-lock";
import { ConfettiCanvas } from "@/lib/confetti";
import {
  initPwaInstallPrompt,
  isStandaloneMode,
  isIosDevice,
  hasDeferredInstallPrompt,
  promptPwaInstall,
  subscribeToPwaState,
} from "@/lib/pwa-install";
import {
  verifyAccessCode,
  isValidStoredToken,
  sanitizeImportedCategories,
  createSignedExpiry,
  parseSignedExpiry,
  TESTER_COUPON_DURATION_MS,
  VIP_COUPON_HASHES_ORDERED,
  STORAGE_KEYS,
  getDecryptedVipCodes,
} from "@/lib/security";
import {
  consumeSingleUseCouponServerFn,
  getCouponServerStatusServerFn,
  testDiscordWebhookServerFn,
  getPaymentConfigServerFn,
  savePaymentConfigServerFn,
  notifyPaymentIntentServerFn,
  submitPaymentProofServerFn,
  checkPaymentStatusServerFn,
  getPendingPaymentsServerFn,
  reviewPaymentServerFn,
} from "@/lib/coupon-server";
import { trackGameEvent } from "@/lib/telemetry";
import { getGlobalMetricsServerFn, GlobalMetrics } from "@/lib/telemetry-server";
import {
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  sanitizePaymentConfig,
  PendingPayment,
  PartyPassPlan,
  PARTY_PASS_PLANS,
} from "@/lib/payment-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imposter — Descubre al traidor" },
      {
        name: "description",
        content:
          "Juego de fiesta: pasa el teléfono, recibe tu palabra y descubre quién es el impostor.",
      },
      { property: "og:title", content: "Imposter — Descubre al traidor" },
      {
        property: "og:description",
        content: "Pasa el teléfono, recibe tu palabra y descubre al impostor del grupo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

const DEFAULT_CATEGORIES: Record<string, string[]> = {
  Comida: [
    "Pizza",
    "Hamburguesa",
    "Sushi",
    "Tacos",
    "Arepa",
    "Helado",
    "Empanada",
    "Paella",
    "Chocolate",
    "Espaguetis",
    "Asado",
    "Ceviche",
    "Lasaña",
    "Pancakes",
    "Croissant",
    "Churros",
    "Hot Dog",
    "Burrito",
    "Ramen",
    "Ensalada",
    "Pastel",
    "Donas",
    "Quesadilla",
    "Sopa",
    "Pollo frito",
    "Nachos",
    "Guacamole",
    "Tiramisú",
    "Waffles",
    "Milanesa",
    "Tequeños",
    "Cachapa",
    "Tamales",
    "Bandeja paisa",
    "Pupusa",
    "Shawarma",
    "Falafel",
    "Kebab",
    "Salchipapa",
    "Churrasco",
    "Fondue",
    "Risotto",
    "Gnocchi",
    "Croquetas",
    "Tortilla española",
    "Gazpacho",
    "Papas fritas",
    "Palomitas",
    "Algodón de azúcar",
    "Brownie",
  ],
  Lugares: [
    "Playa",
    "Hospital",
    "Aeropuerto",
    "Escuela",
    "Cine",
    "Supermercado",
    "Gimnasio",
    "Iglesia",
    "Biblioteca",
    "Zoológico",
    "Museo",
    "Hotel",
    "Parque de diversiones",
    "Estadio",
    "Casino",
    "Farmacia",
    "Banco",
    "Restaurante",
    "Cementerio",
    "Castillo",
    "Cárcel",
    "Bosque",
    "Discoteca",
    "Gasolinera",
    "Teatro",
    "Universidad",
    "Acuario",
    "Planetario",
    "Centro comercial",
    "Peluquería",
    "Panadería",
    "Comisaría",
    "Estación de bomberos",
    "Crucero",
    "Submarino",
    "Estación espacial",
    "Pirámide",
    "Volcán",
    "Desierto",
    "Cueva",
    "Isla desierta",
    "Sauna",
    "Spa",
    "Bolera",
    "Pista de hielo",
    "Circo",
    "Faro",
    "Mercado",
    "Bodega",
    "Mirador",
  ],
  Animales: [
    "León",
    "Pingüino",
    "Elefante",
    "Delfín",
    "Gato",
    "Jirafa",
    "Tiburón",
    "Loro",
    "Perro",
    "Tigre",
    "Canguro",
    "Oso panda",
    "Águila",
    "Serpiente",
    "Caballo",
    "Mono",
    "Cocodrilo",
    "Lobo",
    "Búho",
    "Tortuga",
    "Camello",
    "Rinoceronte",
    "Murciélago",
    "Cebra",
    "Pulpo",
    "Ballena",
    "Gorila",
    "Koala",
    "Flamenco",
    "Pavo real",
    "Hipopótamo",
    "Guepardo",
    "Oso polar",
    "Zorro",
    "Mapache",
    "Castor",
    "Ornitorrinco",
    "Camaleón",
    "Iguana",
    "Rana",
    "Escorpión",
    "Abeja",
    "Mariposa",
    "Hormiga",
    "Medusa",
    "Caballito de mar",
    "Estrella de mar",
    "Cangrejo",
    "Avestruz",
    "Tucán",
  ],
  Objetos: [
    "Paraguas",
    "Guitarra",
    "Reloj",
    "Espejo",
    "Bicicleta",
    "Teléfono",
    "Llave",
    "Vela",
    "Tijeras",
    "Mochila",
    "Lámpara",
    "Cepillo de dientes",
    "Gafas de sol",
    "Cámara",
    "Auriculares",
    "Silla",
    "Martillo",
    "Almohada",
    "Libro",
    "Zapatos",
    "Botella",
    "Maleta",
    "Plancha",
    "Microondas",
    "Sartén",
    "Telescopio",
    "Microscopio",
    "Brújula",
    "Prismáticos",
    "Candado",
    "Linterna",
    "Batería",
    "Control remoto",
    "Teclado",
    "Ratón",
    "ventilador",
    "Aspiradora",
    "Licuadora",
    "Tostadora",
    "Cafetera",
    "Sacacorchos",
    "Abrelatas",
    "Cuchara",
    "Tenedor",
    "Peine",
    "Secador de pelo",
    "Perfume",
    "Anillo",
    "Collar",
    "Billetera",
  ],
  Profesiones: [
    "Médico",
    "Bombero",
    "Chef",
    "Piloto",
    "Profesor",
    "Policía",
    "Astronauta",
    "Payaso",
    "Abogado",
    "Carpintero",
    "Dentista",
    "Fotógrafo",
    "Mecánico",
    "Actor",
    "Juez",
    "Científico",
    "Veterinario",
    "Arquitecto",
    "Pintor",
    "Periodista",
    "Electricista",
    "Fontanero",
    "Programador",
    "Bailarín",
    "Espía",
    "Detective",
    "Enfermero",
    "Psicólogo",
    "Cirujano",
    "Farmacéutico",
    "Panadero",
    "Carnicero",
    "Peluquero",
    "Maquillador",
    "Diseñador",
    "Modelo",
    "Cantante",
    "Músico",
    "DJ",
    "Director de cine",
    "Guionista",
    "Locutor",
    "Youtuber",
    "Streamer",
    "Político",
    "Militar",
    "Marinero",
    "Salvavidas",
    "Entrenador",
    "Árbitro",
  ],
  "Cine y Series": [
    "Titanic",
    "Harry Potter",
    "Star Wars",
    "Jurassic Park",
    "El Rey León",
    "Avatar",
    "Shrek",
    "Batman",
    "Spider-Man",
    "Los Vengadores",
    "Matrix",
    "Stranger Things",
    "Game of Thrones",
    "Breaking Bad",
    "La Casa de Papel",
    "Friends",
    "Squid Game",
    "Toy Story",
    "Gladiator",
    "Piratas del Caribe",
    "Coco",
    "Interestelar",
    "Joker",
    "Los Simpson",
    "Frozen",
    "El Padrino",
    "Pulp Fiction",
    "Forrest Gump",
    "Volver al Futuro",
    "Indiana Jones",
    "Terminator",
    "Alien",
    "Rocky",
    "Rápidos y Furiosos",
    "John Wick",
    "Deadpool",
    "Iron Man",
    "Superman",
    "Wonder Woman",
    "El Señor de los Anillos",
    "Buscando a Nemo",
    "Los Increíbles",
    "Monsters Inc",
    "Ratatouille",
    "Up",
    "Wall-E",
    "Mi Villano Favorito",
    " Kung Fu Panda",
    "Wednesday",
    "The Mandalorian",
  ],
  Deportes: [
    "Fútbol",
    "Baloncesto",
    "Tenis",
    "Natación",
    "Boxeo",
    "Voleibol",
    "Béisbol",
    "Golf",
    "Ciclismo",
    "Ajedrez",
    "Rugby",
    "Surf",
    "Esquí",
    "Pádel",
    "Gimnasia",
    "Boliche",
    "Fórmula 1",
    "Escalada",
    "Patinaje",
    "Bádminton",
    "Atletismo",
    "Maratón",
    "Triatlón",
    "Karate",
    "Taekwondo",
    "Judo",
    "Lucha libre",
    "MMA",
    "Esgrima",
    "Tiro con arco",
    "Equitación",
    "Polo",
    "Waterpolo",
    "Clavados",
    "Remo",
    "Kayak",
    "Vela",
    "Windsurf",
    "Kitesurf",
    "Snowboard",
    "Hockey sobre hielo",
    "Fútbol americano",
    "Críquet",
    "Balonmano",
    "Ping Pong",
    "Billar",
    "Dardos",
    "Skateboarding",
    "BMX",
    "Motocross",
  ],
  "Videojuegos y Geek": [
    "Mario Bros",
    "Minecraft",
    "Fortnite",
    "Grand Theft Auto",
    "Pokémon",
    "Pikachu",
    "Zelda",
    "Sonic",
    "Pac-Man",
    "Tetris",
    "League of Legends",
    "Valorant",
    "Counter-Strike",
    "Call of Duty",
    "FIFA",
    "Among Us",
    "Roblox",
    "Clash Royale",
    "Brawl Stars",
    "Candy Crush",
    "Angry Birds",
    "Plantas vs Zombies",
    "Free Fire",
    "God of War",
    "The Last of Us",
    "Resident Evil",
    "Silent Hill",
    "Halo",
    "Gears of War",
    "Red Dead Redemption",
    "Cyberpunk",
    "Elden Ring",
    "Dark Souls",
    "Skyrim",
    "World of Warcraft",
    "Overwatch",
    "Apex Legends",
    "Rocket League",
    "Street Fighter",
    "Mortal Kombat",
    "Tekken",
    "Super Smash Bros",
    "Animal Crossing",
    "Los Sims",
    "PlayStation",
    "Xbox",
    "Nintendo Switch",
    "Game Boy",
    "Realidad Virtual",
    "Arcade",
  ],
  "Música y Artistas": [
    "Shakira",
    "Bad Bunny",
    "Michael Jackson",
    "Queen",
    "The Beatles",
    "Madonna",
    "Eminem",
    "Rihanna",
    "Beyoncé",
    "Taylor Swift",
    "Bruno Mars",
    "Ed Sheeran",
    "Coldplay",
    "Imagine Dragons",
    "Daddy Yankee",
    "Karol G",
    "Rosalía",
    "Luis Miguel",
    "Juanes",
    "Carlos Vives",
    "Romeo Santos",
    "Marc Anthony",
    "Celia Cruz",
    "Bob Marley",
    "Elvis Presley",
    "Freddie Mercury",
    "Kurt Cobain",
    "Metallica",
    "AC/DC",
    "Guns N' Roses",
    "Daft Punk",
    "David Guetta",
    "Reggaetón",
    "Salsa",
    "Merengue",
    "Bachata",
    "Cumbia",
    "Tango",
    "Flamenco",
    "Mariachi",
    "Rock",
    "Pop",
    "Hip Hop",
    "Rap",
    "Jazz",
    "Blues",
    "Música Clásica",
    "Ópera",
    "Karaoke",
    "Concierto",
  ],
  "Países y Maravillas": [
    "Japón",
    "Egipto",
    "Italia",
    "Francia",
    "España",
    "México",
    "Brasil",
    "Argentina",
    "Colombia",
    "Perú",
    "Chile",
    "Venezuela",
    "Estados Unidos",
    "Canadá",
    "Reino Unido",
    "Alemania",
    "China",
    "India",
    "Rusia",
    "Australia",
    "Grecia",
    "Turquía",
    "Marruecos",
    "Sudáfrica",
    "Corea del Sur",
    "Torre Eiffel",
    "Estatua de la Libertad",
    "Coliseo Romano",
    "Machu Picchu",
    "Chichén Itzá",
    "Cristo Redentor",
    "Muralla China",
    "Taj Mahal",
    "Pirámides de Giza",
    "Big Ben",
    "Sagrada Familia",
    "Monte Everest",
    "Río Amazonas",
    "Cataratas del Niágara",
    "Salto Ángel",
    "Gran Cañón",
    "Desierto del Sahara",
    "Antártida",
    "Hawái",
    "Islas Maldivas",
    "Venecia",
    "Las Vegas",
    "Hollywood",
    "Disneyland",
    "Triángulo de las Bermudas",
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  Aleatoria: "🎲",
  Comida: "🍕",
  Lugares: "🏖️",
  Animales: "🦁",
  Objetos: "🎸",
  Profesiones: "🕵️",
  "Cine y Series": "🎬",
  Deportes: "⚽",
  "Videojuegos y Geek": "🎮",
  "Música y Artistas": "🎵",
  "Países y Maravillas": "🌍",
};

const ADULT_CATEGORY = "🔞 Fiesta +18";
const ADULT_WORDS = [
  "Tequila",
  "Resaca",
  "Cita a ciegas",
  "Beso de tres",
  "Stripper",
  "Condón",
  "Trío",
  "Bikini",
  "Lencería",
  "Tinder",
  "Chupito",
  "Cerveza",
  "Bar secreto",
  "Discoteca",
  "Madrugada",
  "Confesión",
  "Juego de la botella",
  "Verdad o reto",
  "Kamikaze",
  "Censura",
  "After party",
  "Romance prohibido",
  "Tatuaje secreto",
  "Infidelidad",
  "Baile sensual",
  "Despedida de soltero",
  "Juegos previos",
  "Masaje con final feliz",
  "Fantasía",
  "Vip lounge",
  "Motel",
  "Esposas",
  "Látigo",
  "Hielo",
  "Noche loca",
  "Amigo con derechos",
  "Ex tóxico",
  "Sugar Daddy",
  "OnlyFans",
  "Sexting",
  "Foto prohibida",
  "Beso negro",
  "Kamasutra",
  "Lubricante",
  "Juguete íntimo",
  "Disfraz erótico",
  "Jacuzzi",
  "Champagne",
  "Fetiche",
  "Dominación",
  "Mordisco",
  "Chupetón",
  "Cama redonda",
  "Espejo en el techo",
  "Striptease",
  "Barra libre",
  "Borrachera",
  "Laguna mental",
  "Cucaracha (trago)",
  "Pecado",
];

interface RoundEvent {
  icon: string;
  title: string;
  description: string;
}

const ROUND_EVENTS: RoundEvent[] = [
  {
    icon: "🤫",
    title: "Ronda de Mímica",
    description:
      "En la primera vuelta está prohibido hablar: cada jugador debe dar su pista solo con gestos.",
  },
  {
    icon: "✌️",
    title: "Doble Pista",
    description:
      "Cada jugador debe decir exactamente 2 palabras seguidas en su turno en lugar de una.",
  },
  {
    icon: "👉",
    title: "Interrogatorio Cruzado",
    description:
      "No hay orden en círculo: quien termina su pista señala directamente quién habla después.",
  },
  {
    icon: "😐",
    title: "Rostro de Póker",
    description:
      "Prohibido reírse al dar tu pista. Quien se ría recibe automáticamente sospecha del grupo.",
  },
  {
    icon: "⚡",
    title: "Pista Relámpago",
    description:
      "Nadie puede tardar más de 3 segundos pensando su palabra cuando le toca el turno.",
  },
  {
    icon: "🚫",
    title: "Inicial Prohibida",
    description:
      "Está prohibido decir pistas que empiecen con la misma letra inicial de la palabra secreta.",
  },
];

const PLAYER_PALETTE = [
  { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/50" },
  { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/50" },
  { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/50" },
  { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/50" },
  { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/50" },
  { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/50" },
  { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/50" },
  { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/50" },
  { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" },
  { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50" },
];

function getPlayerBadge(index: number) {
  return PLAYER_PALETTE[index % PLAYER_PALETTE.length]!;
}

let audioContextInstance: AudioContext | null = null;

function unlockAudio(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!audioContextInstance) {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContextInstance = new AudioCtx();
      }
    }
    if (audioContextInstance && audioContextInstance.state === "suspended") {
      void audioContextInstance.resume();
    }
    return audioContextInstance;
  } catch {
    return null;
  }
}

function playBeep(duration: number, freq: number, soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* ignore */
  }
}

function playPop(soundEnabled: boolean, haptic: boolean = true) {
  // Micropulso háptico de 10ms en Android para sensación de switch arcade
  if (haptic && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }

  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Capa Mecánica Transitoria (Chasquido de switch arcade de 12ms)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = "sine";
    oscClick.frequency.setValueAtTime(2400, now);
    oscClick.frequency.exponentialRampToValueAtTime(800, now + 0.012);
    gainClick.gain.setValueAtTime(0.35, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.014);
    oscClick.connect(gainClick).connect(ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.015);

    // 2. Capa de Resonancia Cálida (Cuerpo acústico táctil de 55ms)
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = "triangle";
    oscBody.frequency.setValueAtTime(360, now);
    oscBody.frequency.exponentialRampToValueAtTime(130, now + 0.055);
    gainBody.gain.setValueAtTime(0.42, now);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    oscBody.connect(gainBody).connect(ctx.destination);
    oscBody.start(now);
    oscBody.stop(now + 0.06);
  } catch {
    /* ignore */
  }
}

let scanOsc: OscillatorNode | null = null;
let scanGain: GainNode | null = null;

function startScanSound(soundEnabled: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([20, 60, 25, 60, 30, 60]);
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    stopScanSound();
    const now = ctx.currentTime;
    scanOsc = ctx.createOscillator();
    scanGain = ctx.createGain();
    scanOsc.type = "sawtooth";
    scanOsc.frequency.setValueAtTime(140, now);
    scanOsc.frequency.exponentialRampToValueAtTime(320, now + 0.5);
    scanGain.gain.setValueAtTime(0.06, now);
    scanGain.gain.linearRampToValueAtTime(0.16, now + 0.3);
    scanOsc.connect(scanGain).connect(ctx.destination);
    scanOsc.start(now);
  } catch {
    /* ignore */
  }
}

function stopScanSound() {
  try {
    if (scanOsc) {
      scanOsc.stop();
      scanOsc.disconnect();
      scanOsc = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Alerta íntima y sutil de suspenso (Acorde oscuro en baja frecuencia).
 * Suena ÚNICAMENTE si eres el Impostor sin alertar a nadie en la mesa.
 */
function playImpostorReveal(soundEnabled: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([40, 50, 70]);
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    [110, 130.81].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    });
  } catch {
    /* ignore */
  }
}

/**
 * Impacto dramático de baja frecuencia para la transición al veredicto.
 */
function playDramaticImpact(soundEnabled: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([40, 60, 50]);
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    gain.gain.setValueAtTime(0.48, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  } catch {
    /* ignore */
  }
}

/**
 * Tensión sonora en los últimos 15 segundos del debate (Latido de corazón + Reloj).
 */
function playDebateTension(timeLeft: number, soundEnabled: boolean, vibrationEnabled: boolean) {
  if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (timeLeft <= 5) {
        navigator.vibrate([20, 40, 20]);
      } else {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Latido de corazón sutil
    const oscHeart = ctx.createOscillator();
    const gainHeart = ctx.createGain();
    oscHeart.type = "sine";
    const heartFreq = timeLeft <= 5 ? 85 : 68;
    oscHeart.frequency.setValueAtTime(heartFreq, now);
    oscHeart.frequency.exponentialRampToValueAtTime(35, now + 0.08);
    const heartVol = timeLeft <= 5 ? 0.38 : 0.22;
    gainHeart.gain.setValueAtTime(heartVol, now);
    gainHeart.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    oscHeart.connect(gainHeart).connect(ctx.destination);
    oscHeart.start(now);
    oscHeart.stop(now + 0.09);

    // Tic-tac mecánico de reloj
    const oscTick = ctx.createOscillator();
    const gainTick = ctx.createGain();
    oscTick.type = "triangle";
    oscTick.frequency.setValueAtTime(timeLeft <= 5 ? 1600 : 1200, now + 0.04);
    gainTick.gain.setValueAtTime(timeLeft <= 5 ? 0.28 : 0.15, now + 0.04);
    gainTick.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    oscTick.connect(gainTick).connect(ctx.destination);
    oscTick.start(now + 0.04);
    oscTick.stop(now + 0.07);
  } catch {
    /* ignore */
  }
}

function playFanfare(isVictory: boolean, soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isVictory ? [440, 554, 659, 880] : [440, 370, 311, 220];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isVictory ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.38, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.22);
    });
  } catch {
    /* ignore */
  }
}

function formatRemainingTime(activatedAt: number): {
  isExpired: boolean;
  hours: number;
  minutes: number;
  text: string;
  percentElapsed: number;
} {
  const expiresAt = activatedAt + TESTER_COUPON_DURATION_MS;
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    return {
      isExpired: true,
      hours: 0,
      minutes: 0,
      text: "Expirado",
      percentElapsed: 100,
    };
  }
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const elapsedMs = Math.max(0, Date.now() - activatedAt);
  const percentElapsed = Math.min(100, Math.round((elapsedMs / TESTER_COUPON_DURATION_MS) * 100));

  return {
    isExpired: false,
    hours,
    minutes,
    text: hours > 0 ? `Restan ${hours}h ${minutes}m` : `Restan ${minutes}m`,
    percentElapsed,
  };
}

function formatCouponDate(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    const day = d.getDate();
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const month = months[d.getMonth()] ?? "";
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${day}-${month} ${h12}:${mins} ${ampm}`;
  } catch {
    return "";
  }
}

type Phase = "setup" | "reveal" | "discuss" | "vote" | "result";

interface ScoreState {
  innocents: number;
  impostors: number;
}

interface AnalyticsState {
  roundsPlayed: number;
  roundsCompleted: number;
  paywallViews: number;
  categoryCounts: Record<string, number>;
}

const PRO_CATEGORIES = [
  "Objetos",
  "Profesiones",
  "Cine y Series",
  "Deportes",
  "Videojuegos y Geek",
  "Música y Artistas",
  "Países y Maravillas",
];
const FREE_MAX_PLAYERS = 6;

const btn =
  "rounded-xl px-4 py-3 font-semibold transition-all duration-150 active:scale-95 disabled:opacity-30 select-none cursor-pointer";
const btnPrimary = `${btn} bg-primary text-primary-foreground glow-primary hover:brightness-110 shadow-lg active:brightness-125`;
const btnGhost = `${btn} bg-white/10 hover:bg-white/15 text-foreground border border-white/10 active:brightness-125`;
const btnDanger = `${btn} bg-destructive text-destructive-foreground glow-danger hover:brightness-110 active:brightness-125`;

function Game() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [isResolvingResult, setIsResolvingResult] = useState<boolean>(false);

  // Config State (SSR-safe defaults, hydrated in useEffect)
  const [names, setNames] = useState<string[]>([
    "Jugador 1",
    "Jugador 2",
    "Jugador 3",
    "Jugador 4",
  ]);
  const [impostorCount, setImpostorCount] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [accompliceMode, setAccompliceMode] = useState<boolean>(true);
  const [randomEventsEnabled, setRandomEventsEnabled] = useState<boolean>(false);
  const [jesterEnabled, setJesterEnabled] = useState<boolean>(false);
  const [scores, setScores] = useState<ScoreState>({ innocents: 0, impostors: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [packStatus, setPackStatus] = useState<string>("");

  // PRO / VIP & CEO Admin State
  const [isProUnlocked, setIsProUnlocked] = useState<boolean>(false);
  const [isCeoAdmin, setIsCeoAdmin] = useState<boolean>(false);
  const [ceoSimulateFree, setCeoSimulateFree] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [showCeoModal, setShowCeoModal] = useState<boolean>(false);
  const [proModalView, setProModalView] = useState<"perks" | "checkout">("perks");
  const [selectedPayMethod, setSelectedPayMethod] = useState<
    "pagomovil" | "binance" | "international"
  >("pagomovil");
  const [copiedPayField, setCopiedPayField] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [editingPaymentConfig, setEditingPaymentConfig] =
    useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [tasaInput, setTasaInput] = useState<string>(
    String(DEFAULT_PAYMENT_CONFIG.pagoMovil.tasaBs || 55),
  );
  const [ceoModalTab, setCeoModalTab] = useState<"coupons" | "payments" | "metrics">("coupons");
  const [paymentSavedFeedback, setPaymentSavedFeedback] = useState<string>("");

  // Notificación de Pago y Auto-Aprobación en Vivo
  const [payProofName, setPayProofName] = useState<string>("");
  const [payProofRef, setPayProofRef] = useState<string>("");
  const [payProofDiscordContact, setPayProofDiscordContact] = useState<string>("");
  const [payProofSubmitting, setPayProofSubmitting] = useState<boolean>(false);
  const [payProofFeedback, setPayProofFeedback] = useState<string>("");
  const [activePaymentTracker, setActivePaymentTracker] = useState<{
    paymentId: string;
    customerName: string;
    reference: string;
    plan: PartyPassPlan | "lifetime";
    amountFormatted: string;
    method: "Pago Móvil" | "Binance Pay";
  } | null>(null);

  // CEO Pagos Pendientes State
  const [ceoPendingPayments, setCeoPendingPayments] = useState<PendingPayment[]>([]);
  const [ceoLoadingPayments, setCeoLoadingPayments] = useState<boolean>(false);
  const [ceoReviewingId, setCeoReviewingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PartyPassPlan>("weekend");
  const [proCodeInput, setProCodeInput] = useState<string>("");
  const [proCodeFeedback, setProCodeFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [failedCodeAttempts, setFailedCodeAttempts] = useState<number>(0);
  const [codeLockoutUntil, setCodeLockoutUntil] = useState<number>(0);
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);
  const [proExpiresAt, setProExpiresAt] = useState<number | null>(null);

  // CEO Coupon Monitor & Discord Webhook State
  const [couponNames, setCouponNames] = useState<Record<number, string>>({ 1: "Ivana" });
  const [serverCouponsMap, setServerCouponsMap] = useState<
    Record<string, { activatedAt: number; couponNumber: number }>
  >({
    "2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78": {
      activatedAt: 1794103200000, // Ivana: Sábado 07-Nov 10:00 PM (-04:00)
      couponNumber: 1,
    },
  });
  const [discordWebhookInput, setDiscordWebhookInput] = useState<string>("");
  const [discordConnected, setDiscordConnected] = useState<boolean>(false);
  const [discordFeedback, setDiscordFeedback] = useState<string>("");
  const [editingCouponIdx, setEditingCouponIdx] = useState<number | null>(null);
  const [editingNameInput, setEditingNameInput] = useState<string>("");
  const [ceoDecryptedCodes, setCeoDecryptedCodes] = useState<string[]>([]);
  const [copiedCouponIdx, setCopiedCouponIdx] = useState<number | null>(null);

  // Share / QR Modal State
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("https://imposter.manu-07games.workers.dev");
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Mobile Native (Bloque B) State: Wake Lock & PWA Install
  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(true);
  const [isWakeLockActiveState, setIsWakeLockActiveState] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Local Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    roundsPlayed: 0,
    roundsCompleted: 0,
    paywallViews: 0,
    categoryCounts: {},
  });

  const hasPro = (isProUnlocked || isCeoAdmin) && !ceoSimulateFree;

  // Adult Mode State (+18)
  const [isAdultUnlocked, setIsAdultUnlocked] = useState<boolean>(false);
  const [adultPin, setAdultPin] = useState<string>("1234");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"unlock" | "change">("unlock");
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showPinHint, setShowPinHint] = useState(false);
  const [pinFailedAttempts, setPinFailedAttempts] = useState<number>(0);
  const [pinLockoutUntil, setPinLockoutUntil] = useState<number>(0);

  // Global Telemetry State (Radar CEO)
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [loadingGlobalMetrics, setLoadingGlobalMetrics] = useState<boolean>(false);

  const [custom, setCustom] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState("Aleatoria");
  const [newCat, setNewCat] = useState("");
  const [newWords, setNewWords] = useState("");

  // Round State
  const [word, setWord] = useState("");
  const [playedCategory, setPlayedCategory] = useState("");
  const [impostors, setImpostors] = useState<number[]>([]);
  const [jesterIndex, setJesterIndex] = useState<number | null>(null);
  const [turn, setTurn] = useState(0);
  const [starter, setStarter] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [usedWords, setUsedWords] = useState<Record<string, string[]>>({});
  const [activeEvent, setActiveEvent] = useState<RoundEvent | null>(null);

  // Reveal screen state
  const [isHolding, setIsHolding] = useState(false);
  const [hasSeenRole, setHasSeenRole] = useState(false);

  // Voting & Resolution
  const [accusedIndex, setAccusedIndex] = useState<number | null>(null);
  const [caughtImpostors, setCaughtImpostors] = useState<number[]>([]);
  const [roundWinner, setRoundWinner] = useState<"innocents" | "impostors" | "jester" | null>(null);
  const [winReason, setWinReason] = useState<string>("");
  const [showImpostorGuessModal, setShowImpostorGuessModal] = useState(false);

  // Hydrate persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const savedNames = localStorage.getItem("impostor-names");
      if (savedNames) setNames(JSON.parse(savedNames));

      const savedCount = localStorage.getItem("impostor-count");
      if (savedCount) setImpostorCount(Number(savedCount) || 1);

      const savedMinutes = localStorage.getItem("impostor-minutes");
      if (savedMinutes) setMinutes(Number(savedMinutes) || 3);

      const savedSound = localStorage.getItem("impostor-sound");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");

      const savedVibration = localStorage.getItem("impostor-vibration");
      if (savedVibration !== null) setVibrationEnabled(savedVibration === "true");

      const savedWakeLock = localStorage.getItem("impostor-wake-lock");
      if (savedWakeLock !== null) setWakeLockEnabled(savedWakeLock === "true");

      const savedAccomplice = localStorage.getItem("impostor-accomplice");
      if (savedAccomplice !== null) setAccompliceMode(savedAccomplice === "true");

      const savedEvents = localStorage.getItem("impostor-events");
      if (savedEvents !== null) setRandomEventsEnabled(savedEvents === "true");

      const savedJester = localStorage.getItem("impostor-jester");
      if (savedJester !== null) setJesterEnabled(savedJester === "true");

      const savedScores = localStorage.getItem("impostor-scores");
      if (savedScores) setScores(JSON.parse(savedScores));

      if (localStorage.getItem("impostor-adult-unlocked") === "true") {
        setIsAdultUnlocked(true);
      }

      const savedPin = localStorage.getItem("impostor-adult-pin");
      if (savedPin && /^\d{4}$/.test(savedPin)) {
        setAdultPin(savedPin);
      }

      const savedCats = localStorage.getItem("impostor-cats");
      if (savedCats) {
        const sanitizedCats = sanitizeImportedCategories(JSON.parse(savedCats), [
          "Aleatoria",
          ADULT_CATEGORY,
          ...Object.keys(DEFAULT_CATEGORIES),
        ]);
        if (sanitizedCats) setCustom(sanitizedCats);
      }

      // Purgar banderas antiguas en texto plano si existen
      localStorage.removeItem("impostor-pro-unlocked");
      localStorage.removeItem("impostor-ceo-admin");

      // Verificación criptográfica anti-manipulación (Doble Hash SHA-256 + Expiración 48h firmada)
      const storedProToken = localStorage.getItem(STORAGE_KEYS.PRO_TOKEN);
      const storedProExpires = localStorage.getItem(STORAGE_KEYS.PRO_EXPIRES);
      if (isValidStoredToken(storedProToken, "pro", storedProExpires)) {
        setIsProUnlocked(true);
        const parsedExp = parseSignedExpiry(storedProToken, storedProExpires);
        if (parsedExp) setProExpiresAt(parsedExp);
      } else if (storedProToken || storedProExpires) {
        localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      }

      const storedCeoToken = localStorage.getItem(STORAGE_KEYS.CEO_TOKEN);
      if (isValidStoredToken(storedCeoToken, "ceo")) {
        setIsCeoAdmin(true);
        setIsProUnlocked(true);
        const codes = getDecryptedVipCodes(storedCeoToken);
        if (codes.length > 0) setCeoDecryptedCodes(codes);
      } else if (storedCeoToken) {
        localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
      }

      const savedAnalytics = localStorage.getItem("impostor-analytics");
      if (savedAnalytics) {
        setAnalytics(JSON.parse(savedAnalytics));
      }

      const savedUsedCoupons = localStorage.getItem(STORAGE_KEYS.USED_COUPONS);
      if (savedUsedCoupons) {
        const parsedCoupons = JSON.parse(savedUsedCoupons);
        if (Array.isArray(parsedCoupons)) {
          setUsedCoupons(parsedCoupons.filter((c): c is string => typeof c === "string"));
        }
      }

      const savedWebhook = localStorage.getItem(STORAGE_KEYS.DISCORD_WEBHOOK);
      if (savedWebhook) {
        setDiscordWebhookInput(savedWebhook);
        setDiscordConnected(true);
      }

      const savedTesterNames = localStorage.getItem(STORAGE_KEYS.COUPON_NAMES);
      if (savedTesterNames) {
        try {
          setCouponNames({ 1: "Ivana", ...JSON.parse(savedTesterNames) });
        } catch {
          /* ignore */
        }
      }

      const savedRegistry = localStorage.getItem("impostor-coupon-registry");
      if (savedRegistry) {
        try {
          const parsed = JSON.parse(savedRegistry) as Record<
            string,
            { activatedAt: number; couponNumber: number }
          >;
          // Garantizar que el cupón de Ivana conserve su fecha histórica real de activación (07-Nov 10:00 PM)
          if (parsed["2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"]) {
            parsed["2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"].activatedAt =
              1794103200000;
          }
          setServerCouponsMap((prev) => ({ ...prev, ...parsed }));
        } catch {
          /* ignore */
        }
      }

      // Sincronizar en segundo plano con el servidor de Cloudflare
      getCouponServerStatusServerFn({ data: { defaultWebhook: savedWebhook || "" } })
        .then((res) => {
          if (res?.usedCoupons?.length) {
            setServerCouponsMap((prev) => {
              const updated = { ...prev };
              res.usedCoupons.forEach((c) => {
                updated[c.hash] = { activatedAt: c.activatedAt, couponNumber: c.couponNumber };
              });
              // Conservar siempre el timestamp real de Ivana
              if (updated["2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"]) {
                updated[
                  "2cdab88d098bfede40e38a9111c08f70168be515988fe433de30ff6a83ed5b78"
                ].activatedAt = 1794103200000;
              }
              try {
                localStorage.setItem("impostor-coupon-registry", JSON.stringify(updated));
              } catch {
                /* ignore */
              }
              return updated;
            });
          }
        })
        .catch(() => {
          /* offline fallback */
        });

      // Cargar e hidratar Métodos de Pago
      const savedPayConfig = localStorage.getItem("impostor-payment-config");
      let initialPayConfig = DEFAULT_PAYMENT_CONFIG;
      if (savedPayConfig) {
        try {
          initialPayConfig = sanitizePaymentConfig(JSON.parse(savedPayConfig));
          setPaymentConfig(initialPayConfig);
          setEditingPaymentConfig(initialPayConfig);
          setTasaInput(String(initialPayConfig.pagoMovil.tasaBs || 55));
        } catch {
          /* ignore */
        }
      }

      getPaymentConfigServerFn({ data: { defaultFallback: initialPayConfig } })
        .then((res) => {
          if (res?.config) {
            setPaymentConfig(res.config);
            setEditingPaymentConfig(res.config);
            setTasaInput(String(res.config.pagoMovil.tasaBs || 55));
            try {
              localStorage.setItem("impostor-payment-config", JSON.stringify(res.config));
            } catch {
              /* ignore */
            }
          }
        })
        .catch(() => {
          /* offline fallback */
        });

      // Hidratar rastreador de pago en proceso
      try {
        const savedTracker = localStorage.getItem("impostor-active-payment-tracker");
        if (savedTracker) {
          setActivePaymentTracker(JSON.parse(savedTracker));
        }
      } catch {
        /* ignore */
      }

      if (typeof window !== "undefined") {
        setShareUrl(window.location.origin);

        // Pre-cargar código VIP si viene en la URL (?code=... o ?vip=... o en hash)
        let codeParam: string | null = null;
        try {
          const urlParams = new URLSearchParams(window.location.search);
          codeParam = urlParams.get("code") || urlParams.get("vip");
          if (!codeParam && window.location.hash.includes("code=")) {
            const hashMatch = window.location.hash.match(/[#&]code=([^&]+)/i);
            if (hashMatch?.[1]) codeParam = decodeURIComponent(hashMatch[1]);
          }
        } catch {
          /* ignore */
        }
        if (codeParam) {
          const cleanCode = codeParam.toUpperCase().trim();
          setProCodeInput(cleanCode);
          setShowSettingsModal(false);
          setShowCeoModal(false);
          setShowProModal(true);
          setProCodeFeedback({
            type: "success",
            text: `🎟️ ¡Invitación VIP detectada (${cleanCode})! Pulsa "Activar" abajo para comenzar tus 48h gratis.`,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Activación de respuesta táctil instantánea (:active en iOS) y pre-calentamiento de AudioContext
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Activar estado :active en Safari iOS (sin retraso táctil)
    const emptyTouchHandler = () => {};
    window.addEventListener("touchstart", emptyTouchHandler, { passive: true });

    // 2. Despertar AudioContext en el primer toque para evitar suspensiones de autoplay
    const unlockOnFirstTouch = () => {
      unlockAudio();
      window.removeEventListener("touchstart", unlockOnFirstTouch);
      window.removeEventListener("pointerdown", unlockOnFirstTouch);
      window.removeEventListener("click", unlockOnFirstTouch);
    };
    window.addEventListener("touchstart", unlockOnFirstTouch, { passive: true, once: true });
    window.addEventListener("pointerdown", unlockOnFirstTouch, { passive: true, once: true });
    window.addEventListener("click", unlockOnFirstTouch, { passive: true, once: true });

    return () => {
      window.removeEventListener("touchstart", emptyTouchHandler);
      window.removeEventListener("touchstart", unlockOnFirstTouch);
      window.removeEventListener("pointerdown", unlockOnFirstTouch);
      window.removeEventListener("click", unlockOnFirstTouch);
    };
  }, []);

  // Suscripción al ciclo de vida PWA (Instalación nativa en Android e iOS)
  useEffect(() => {
    const cleanup = initPwaInstallPrompt();
    const updatePwaState = () => {
      setIsStandalone(isStandaloneMode());
      setCanInstallPwa(hasDeferredInstallPrompt());
    };
    const unsub = subscribeToPwaState(updatePwaState);
    updatePwaState();
    setIsIos(isIosDevice());
    return () => {
      cleanup();
      unsub();
    };
  }, []);

  // Control nativo de Wake Lock: mantiene la pantalla encendida durante rondas activas
  useEffect(() => {
    if (phase !== "setup" && wakeLockEnabled) {
      void acquireScreenWakeLock().then((active) => {
        setIsWakeLockActiveState(active);
      });
    } else {
      void releaseScreenWakeLock();
      setIsWakeLockActiveState(false);
    }
    return () => {
      void releaseScreenWakeLock();
    };
  }, [phase, wakeLockEnabled]);

  // Sincronizar formulario de cobros cuando el CEO abre su panel
  useEffect(() => {
    if (showCeoModal) {
      setEditingPaymentConfig(paymentConfig);
      setTasaInput(String(paymentConfig.pagoMovil.tasaBs || 55));
    }
  }, [showCeoModal, paymentConfig]);

  const trackAnalytics = (updater: (prev: AnalyticsState) => AnalyticsState) => {
    // 🛡️ Filtro de Tráfico Interno: Si el usuario es el CEO, no alterar analíticas
    if (isCeoAdmin) return;
    setAnalytics((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("impostor-analytics", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const openPaywall = () => {
    playPop(soundEnabled);
    setProCodeFeedback(null);
    setProModalView("perks");
    if (!isCeoAdmin) {
      trackAnalytics((prev) => ({
        ...prev,
        paywallViews: prev.paywallViews + 1,
      }));
      void trackGameEvent({ type: "paywall_view", planId: selectedPlan });
    }
    setShowProModal(true);
  };

  const handleShareCoupon = async (
    couponCode: string,
    couponNumber: number,
    testerLabel: string,
  ) => {
    playPop(soundEnabled);
    const baseUrl =
      shareUrl ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://imposter.manu-07games.workers.dev");
    const inviteUrl = `${baseUrl}/?code=${couponCode}`;
    const shareText = `¡Hola ${testerLabel}! 🕵️ Te invito a jugar Imposter con un Party Pass PRO VIP de 48 horas gratis 🎟️✨.\n\nToca aquí para activar tu pase de cortesía:\n${inviteUrl}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Imposter — Party Pass PRO VIP (48h)",
          text: shareText,
          url: inviteUrl,
        });
        return;
      } catch {
        /* fallback al compartir de WhatsApp */
      }
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyCouponLink = async (
    couponCode: string,
    couponNumber: number,
    testerLabel: string,
  ) => {
    playPop(soundEnabled);
    const baseUrl =
      shareUrl ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://imposter.manu-07games.workers.dev");
    const inviteUrl = `${baseUrl}/?code=${couponCode}`;
    const shareText = `¡Hola ${testerLabel}! 🕵️ Te invito a jugar Imposter con un Party Pass PRO VIP de 48 horas gratis 🎟️✨.\n\nToca aquí para activar tu pase:\n${inviteUrl}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = shareText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedCouponIdx(couponNumber);
      setTimeout(() => {
        setCopiedCouponIdx((prev) => (prev === couponNumber ? null : prev));
      }, 2500);
    } catch {
      /* ignore */
    }
  };

  const handleSavePaymentConfig = async () => {
    playPop(soundEnabled);
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) : null;
    if (!token) return;

    const parsedTasa = parseFloat(tasaInput);
    const validTasa = !isNaN(parsedTasa) && parsedTasa > 0 ? parsedTasa : 55;
    const configToSave: PaymentConfig = {
      ...editingPaymentConfig,
      pagoMovil: {
        ...editingPaymentConfig.pagoMovil,
        tasaBs: validTasa,
      },
    };
    setEditingPaymentConfig(configToSave);
    setTasaInput(String(validTasa));

    try {
      const res = await savePaymentConfigServerFn({
        data: {
          ceoToken: token,
          config: configToSave,
        },
      });

      if (res.success && res.config) {
        setPaymentConfig(res.config);
        localStorage.setItem("impostor-payment-config", JSON.stringify(res.config));
        setPaymentSavedFeedback("✓ Métodos de pago guardados exitosamente");
        setTimeout(() => setPaymentSavedFeedback(""), 3500);
      } else {
        setPaymentSavedFeedback("⚠️ Error al guardar en el servidor");
      }
    } catch {
      // Fallback local
      setPaymentConfig(configToSave);
      localStorage.setItem("impostor-payment-config", JSON.stringify(configToSave));
      setPaymentSavedFeedback("✓ Guardado localmente en este dispositivo");
      setTimeout(() => setPaymentSavedFeedback(""), 3500);
    }
  };

  const handleCopyPayField = async (text: string, fieldName: string) => {
    playPop(soundEnabled);
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedPayField(fieldName);
      setTimeout(() => {
        setCopiedPayField((prev) => (prev === fieldName ? null : prev));
      }, 2500);
    } catch {
      /* ignore */
    }
  };

  const handleSubmitPaymentProof = async (method: "Pago Móvil" | "Binance Pay") => {
    playPop(soundEnabled);
    if (!payProofName.trim()) {
      setPayProofFeedback("⚠️ Por favor ingresa tu nombre o apodo.");
      return;
    }
    if (!payProofRef.trim()) {
      setPayProofFeedback("⚠️ Por favor ingresa el número o referencia del pago.");
      return;
    }

    setPayProofSubmitting(true);
    setPayProofFeedback("");

    const planMeta = PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend;
    const priceUsd = planMeta.priceUsd;
    const calculatedBs = Math.round(priceUsd * (paymentConfig.pagoMovil.tasaBs || 55));
    const amountStr =
      method === "Pago Móvil"
        ? `Bs. ${calculatedBs.toLocaleString("es-VE")}`
        : `${priceUsd.toFixed(2)} USDT`;

    try {
      const res = await submitPaymentProofServerFn({
        data: {
          customerName: payProofName.trim(),
          reference: payProofRef.trim(),
          method,
          plan: selectedPlan,
          amountFormatted: amountStr,
          ...(selectedPlan === "founder" && payProofDiscordContact.trim()
            ? { discordContact: payProofDiscordContact.trim() }
            : {}),
        },
      });

      if (res?.success && res.paymentId) {
        const tracker = {
          paymentId: res.paymentId,
          customerName: payProofName.trim(),
          reference: payProofRef.trim(),
          plan: selectedPlan,
          amountFormatted: amountStr,
          method,
        };
        setActivePaymentTracker(tracker);
        try {
          localStorage.setItem("impostor-active-payment-tracker", JSON.stringify(tracker));
        } catch {
          /* ignore */
        }
      } else {
        setPayProofFeedback("⚠️ Error al registrar el pago en el servidor.");
      }
    } catch {
      setPayProofFeedback("⚠️ Error de conexión. Intenta de nuevo.");
    } finally {
      setPayProofSubmitting(false);
    }
  };

  const refreshCeoPayments = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) : null;
    if (!token) return;
    setCeoLoadingPayments(true);
    try {
      const res = await getPendingPaymentsServerFn({ data: { ceoToken: token } });
      if (res?.success && res.payments) {
        setCeoPendingPayments(res.payments);
      }
    } catch {
      /* ignore */
    } finally {
      setCeoLoadingPayments(false);
    }
  };

  const handleReviewPayment = async (paymentId: string, action: "approve" | "reject") => {
    playPop(soundEnabled);
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CEO_TOKEN) : null;
    if (!token) return;
    setCeoReviewingId(paymentId);
    try {
      const res = await reviewPaymentServerFn({
        data: {
          ceoToken: token,
          paymentId,
          action,
        },
      });
      if (res?.success && res.payments) {
        setCeoPendingPayments(res.payments);
      }
    } catch {
      /* ignore */
    } finally {
      setCeoReviewingId(null);
    }
  };

  // Polling de aprobación en vivo para el cliente (cada 3.5s)
  useEffect(() => {
    if (!activePaymentTracker) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await checkPaymentStatusServerFn({
          data: { paymentId: activePaymentTracker.paymentId },
        });
        if (!isMounted) return;

        if (res?.status === "approved" && res.token) {
          playFanfare(true, soundEnabled);
          setIsProUnlocked(true);
          try {
            localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, res.token);
            if (res.signedExpiry && res.expiresAt) {
              setProExpiresAt(res.expiresAt);
              localStorage.setItem(STORAGE_KEYS.PRO_EXPIRES, res.signedExpiry);
            } else {
              setProExpiresAt(null);
              localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
            }
            localStorage.removeItem("impostor-active-payment-tracker");
          } catch {
            /* ignore */
          }
          setActivePaymentTracker(null);
          setShowProModal(false);
        } else if (res?.status === "rejected") {
          setPayProofFeedback(
            "⚠️ Tu referencia no pudo ser confirmada. Por favor verifica tus datos.",
          );
          try {
            localStorage.removeItem("impostor-active-payment-tracker");
          } catch {
            /* ignore */
          }
          setActivePaymentTracker(null);
        }
      } catch {
        /* ignore network hiccups */
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activePaymentTracker, soundEnabled]);

  // Sincronizar pagos pendientes para el CEO en tiempo real
  useEffect(() => {
    if (!showCeoModal || ceoModalTab !== "payments") return;
    void refreshCeoPayments();
    const interval = setInterval(() => {
      void refreshCeoPayments();
    }, 5000);
    return () => clearInterval(interval);
  }, [showCeoModal, ceoModalTab]);

  const refreshGlobalMetrics = async (reset = false) => {
    setLoadingGlobalMetrics(true);
    try {
      const res = await getGlobalMetricsServerFn({ data: { reset } });
      setGlobalMetrics(res);
    } catch {
      /* ignore */
    } finally {
      setLoadingGlobalMetrics(false);
    }
  };

  // Sincronizar telemetría global en vivo para el CEO
  useEffect(() => {
    if (!showCeoModal || ceoModalTab !== "metrics") return;
    void refreshGlobalMetrics();
    const interval = setInterval(() => {
      void refreshGlobalMetrics();
    }, 6000);
    return () => clearInterval(interval);
  }, [showCeoModal, ceoModalTab]);

  const handleRedeemCode = async () => {
    playPop(soundEnabled);
    const now = Date.now();
    if (now < codeLockoutUntil) {
      const remainingSec = Math.ceil((codeLockoutUntil - now) / 1000);
      playBeep(0.3, 200, soundEnabled);
      setProCodeFeedback({
        type: "error",
        text: `Demasiados intentos. Espera ${remainingSec}s por seguridad.`,
      });
      return;
    }

    const { role, token, couponIdHash } = verifyAccessCode(proCodeInput, usedCoupons);
    if (role === "already_used") {
      playBeep(0.3, 200, soundEnabled);
      setProCodeFeedback({
        type: "error",
        text: "⚠️ Este cupón de prueba ya fue utilizado y es de un solo uso.",
      });
      return;
    }

    if (role === "ceo" && token) {
      playFanfare(true, soundEnabled);
      setIsCeoAdmin(true);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(null);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.CEO_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      const codes = getDecryptedVipCodes(token);
      if (codes.length > 0) setCeoDecryptedCodes(codes);
      setProCodeFeedback({
        type: "success",
        text: "¡Bienvenido CEO! Acceso Maestro y Panel Ejecutivo activados.",
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
      }, 1500);
    } else if (role === "vip_unlimited" && token) {
      // VIP-FIESTA-99: Uso libre ilimitado según decida el CEO
      playFanfare(true, soundEnabled);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(null);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
      setProCodeFeedback({
        type: "success",
        text: "¡Party Pass PRO permanente desbloqueado con éxito!",
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
      }, 1500);
    } else if (role === "vip_single" && token && couponIdHash) {
      // Cupones VIP-01 a VIP-10: Uso único estricto + 48 horas de duración
      const couponIdx = VIP_COUPON_HASHES_ORDERED.indexOf(couponIdHash) + 1;
      const assignedName =
        couponNames[couponIdx] || (couponIdx === 1 ? "Ivana" : `Tester #${couponIdx}`);
      try {
        const serverCheck = await consumeSingleUseCouponServerFn({
          data: {
            couponIdHash,
            action: "consume",
            testerName: assignedName,
            ...(discordWebhookInput ? { discordWebhookUrl: discordWebhookInput } : {}),
          },
        });
        if (!serverCheck.allowed) {
          const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
          setUsedCoupons(nextUsed);
          localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));
          playBeep(0.3, 200, soundEnabled);
          setProCodeFeedback({
            type: "error",
            text: "⚠️ Este cupón ya fue canjeado por otro jugador (1 solo uso).",
          });
          return;
        }
      } catch {
        // Fallback offline: el control local en localStorage sigue protegiendo el uso único
      }

      const nextUsed = Array.from(new Set([...usedCoupons, couponIdHash]));
      setUsedCoupons(nextUsed);
      localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));

      const now = Date.now();
      const expiresAt = now + TESTER_COUPON_DURATION_MS;
      const signedExpiry = createSignedExpiry(token, expiresAt);

      setServerCouponsMap((prev) => {
        const updated = {
          ...prev,
          [couponIdHash]: { activatedAt: now, couponNumber: couponIdx },
        };
        try {
          localStorage.setItem("impostor-coupon-registry", JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        return updated;
      });

      playFanfare(true, soundEnabled);
      setIsProUnlocked(true);
      setCeoSimulateFree(false);
      setProExpiresAt(expiresAt);
      setFailedCodeAttempts(0);
      localStorage.setItem(STORAGE_KEYS.PRO_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.PRO_EXPIRES, signedExpiry);
      setProCodeFeedback({
        type: "success",
        text: "¡Cupón de Tester activado! Tienes Party Pass PRO por 48 horas (1/1 uso).",
      });
      setProCodeInput("");
      setTimeout(() => {
        setShowProModal(false);
        setProCodeFeedback(null);
      }, 1500);
    } else {
      playBeep(0.3, 200, soundEnabled);
      const nextAttempts = failedCodeAttempts + 1;
      setFailedCodeAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setCodeLockoutUntil(Date.now() + 30000);
        setFailedCodeAttempts(0);
        setProCodeFeedback({
          type: "error",
          text: "Bloqueado temporalmente por seguridad (30 segundos).",
        });
      } else {
        setProCodeFeedback({
          type: "error",
          text: "Código no válido. Verifica tu clave de acceso.",
        });
      }
    }
  };

  const handleShareGame = async () => {
    playPop(soundEnabled);
    const url = typeof window !== "undefined" ? window.location.origin : shareUrl;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Imposter — Juego de Fiesta",
          text: "¡Únete a nuestra partida de Imposter! Pasa el teléfono o juega desde el tuyo:",
          url,
        });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const resetAnalytics = async () => {
    playPop(soundEnabled);
    const empty: AnalyticsState = {
      roundsPlayed: 0,
      roundsCompleted: 0,
      paywallViews: 0,
      categoryCounts: {},
    };
    setAnalytics(empty);
    localStorage.setItem("impostor-analytics", JSON.stringify(empty));

    // Reiniciar también el radar global del servidor y el bot de Atlas
    try {
      const fresh = await getGlobalMetricsServerFn({ data: { reset: true } });
      setGlobalMetrics(fresh);
    } catch {
      /* ignore */
    }

    try {
      fetch("https://atlas-bot-2xh4.onrender.com/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
        mode: "cors",
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const handleSaveAndTestDiscord = async () => {
    const url = discordWebhookInput.trim();
    if (!url) {
      setDiscordFeedback("Ingresa la URL del Webhook de Discord.");
      return;
    }
    setDiscordFeedback("Probando conexión con Discord...");
    playPop(soundEnabled);
    try {
      const res = await testDiscordWebhookServerFn({ data: { webhookUrl: url } });
      if (res.success) {
        setDiscordConnected(true);
        localStorage.setItem(STORAGE_KEYS.DISCORD_WEBHOOK, url);
        setDiscordFeedback("¡Conectado! Revisa tu canal de Discord (mensaje de prueba enviado).");
      } else {
        setDiscordFeedback(res.error || "Error al conectar con Discord.");
      }
    } catch {
      setDiscordFeedback("Error de red al conectar con Discord.");
    }
    setTimeout(() => setDiscordFeedback(""), 6000);
  };

  const handleSaveTesterName = (idx: number, name: string) => {
    const trimmed = name.trim();
    const updated = { ...couponNames, [idx]: trimmed || (idx === 1 ? "Ivana" : `Tester #${idx}`) };
    setCouponNames(updated);
    localStorage.setItem(STORAGE_KEYS.COUPON_NAMES, JSON.stringify(updated));
    setEditingCouponIdx(null);
  };

  const handleResetSingleCoupon = async (hash: string) => {
    playPop(soundEnabled);
    const nextUsed = usedCoupons.filter((h) => h !== hash);
    setUsedCoupons(nextUsed);
    localStorage.setItem(STORAGE_KEYS.USED_COUPONS, JSON.stringify(nextUsed));

    setServerCouponsMap((prev) => {
      const copy = { ...prev };
      delete copy[hash];
      try {
        localStorage.setItem("impostor-coupon-registry", JSON.stringify(copy));
      } catch {
        /* ignore */
      }
      return copy;
    });

    try {
      await consumeSingleUseCouponServerFn({
        data: { couponIdHash: hash, action: "reset" },
      });
    } catch {
      /* ignore */
    }
  };

  const refreshCouponStatus = async () => {
    playPop(soundEnabled);
    try {
      const res = await getCouponServerStatusServerFn({
        data: { defaultWebhook: discordWebhookInput || "" },
      });
      if (res?.usedCoupons) {
        setServerCouponsMap((prev) => {
          const updated = { ...prev };
          res.usedCoupons.forEach((c) => {
            updated[c.hash] = { activatedAt: c.activatedAt, couponNumber: c.couponNumber };
          });
          try {
            localStorage.setItem("impostor-coupon-registry", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
          return updated;
        });
      }
    } catch {
      /* ignore */
    }
  };

  const saveCustom = (c: Record<string, string[]>) => {
    setCustom(c);
    localStorage.setItem("impostor-cats", JSON.stringify(c));
  };

  // Persist setup changes
  const updateNames = (newNames: string[]) => {
    setNames(newNames);
    localStorage.setItem("impostor-names", JSON.stringify(newNames));
    const newMax = Math.max(1, newNames.length - 2);
    if (impostorCount > newMax) {
      updateImpostorCount(newMax);
    }
  };

  const shufflePlayers = () => {
    playPop(soundEnabled);
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    updateNames(shuffled);
  };

  const updateImpostorCount = (val: number) => {
    setImpostorCount(val);
    localStorage.setItem("impostor-count", String(val));
  };

  const updateMinutes = (val: number) => {
    setMinutes(val);
    localStorage.setItem("impostor-minutes", String(val));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("impostor-sound", String(next));
    if (next) {
      unlockAudio();
      playPop(true);
    }
  };

  const toggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    localStorage.setItem("impostor-vibration", String(next));
    if (next && navigator.vibrate) navigator.vibrate(50);
  };

  const toggleAccompliceMode = () => {
    const next = !accompliceMode;
    setAccompliceMode(next);
    localStorage.setItem("impostor-accomplice", String(next));
  };

  const toggleRandomEvents = () => {
    const next = !randomEventsEnabled;
    setRandomEventsEnabled(next);
    localStorage.setItem("impostor-events", String(next));
  };

  const toggleJester = () => {
    const next = !jesterEnabled;
    setJesterEnabled(next);
    localStorage.setItem("impostor-jester", String(next));
  };

  const deactivateProAndCeo = () => {
    playPop(soundEnabled);
    setIsCeoAdmin(false);
    setIsProUnlocked(false);
    setCeoSimulateFree(false);
    setProExpiresAt(null);
    setCeoDecryptedCodes([]);
    localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
    localStorage.removeItem("impostor-pro-unlocked");
    localStorage.removeItem("impostor-ceo-admin");
    if (PRO_CATEGORIES.includes(category) || category === ADULT_CATEGORY || category in custom) {
      setCategory("Aleatoria");
    }
    if (names.length > FREE_MAX_PLAYERS) {
      updateNames(names.slice(0, FREE_MAX_PLAYERS));
    }
    setRandomEventsEnabled(false);
    setJesterEnabled(false);
    localStorage.setItem("impostor-events", "false");
    localStorage.setItem("impostor-jester", "false");
  };

  const resetFactoryDefaults = () => {
    const defaultPlayers = ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4"];
    setNames(defaultPlayers);
    setImpostorCount(1);
    setMinutes(3);
    setSoundEnabled(true);
    setVibrationEnabled(true);
    setAccompliceMode(true);
    setRandomEventsEnabled(false);
    setJesterEnabled(false);
    setIsAdultUnlocked(false);
    setIsCeoAdmin(false);
    setIsProUnlocked(false);
    setCeoSimulateFree(false);
    setProExpiresAt(null);
    setWakeLockEnabled(true);
    setCategory("Aleatoria");
    setScores({ innocents: 0, impostors: 0 });
    localStorage.removeItem("impostor-names");
    localStorage.removeItem("impostor-count");
    localStorage.removeItem("impostor-minutes");
    localStorage.removeItem("impostor-sound");
    localStorage.removeItem("impostor-vibration");
    localStorage.removeItem("impostor-wake-lock");
    localStorage.removeItem("impostor-accomplice");
    localStorage.removeItem("impostor-events");
    localStorage.removeItem("impostor-jester");
    localStorage.removeItem("impostor-adult-unlocked");
    localStorage.removeItem("impostor-scores");
    localStorage.removeItem(STORAGE_KEYS.CEO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PRO_EXPIRES);
    localStorage.removeItem("impostor-pro-unlocked");
    localStorage.removeItem("impostor-ceo-admin");
    playPop(true);
  };

  const toggleWakeLock = () => {
    playPop(soundEnabled);
    const next = !wakeLockEnabled;
    setWakeLockEnabled(next);
    localStorage.setItem("impostor-wake-lock", String(next));
  };

  const handleInstallPwa = async () => {
    playPop(soundEnabled);
    if (isStandalone) {
      setShowInstallModal(true);
      return;
    }
    if (hasDeferredInstallPrompt()) {
      const outcome = await promptPwaInstall();
      if (outcome === "accepted") {
        setShowInstallModal(false);
        if (!isCeoAdmin) {
          void trackGameEvent({ type: "pwa_install" });
        }
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleExportCategories = async () => {
    try {
      const payload = JSON.stringify(custom);
      await navigator.clipboard.writeText(payload);
      setPackStatus("¡Copiado al portapapeles!");
      setTimeout(() => setPackStatus(""), 2500);
    } catch {
      setPackStatus("No se pudo copiar");
      setTimeout(() => setPackStatus(""), 2500);
    }
  };

  const handleImportCategories = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.length > 50000) {
        setPackStatus("El texto es demasiado grande");
        setTimeout(() => setPackStatus(""), 2500);
        return;
      }
      const parsed = JSON.parse(text);
      const sanitized = sanitizeImportedCategories(parsed, [
        "Aleatoria",
        ADULT_CATEGORY,
        ...Object.keys(DEFAULT_CATEGORIES),
      ]);
      if (sanitized) {
        const merged = { ...custom, ...sanitized };
        saveCustom(merged);
        setPackStatus("¡Categorías importadas y verificadas!");
      } else {
        setPackStatus("Formato o contenido no válido");
      }
    } catch {
      setPackStatus("Copia primero un pack válido");
    }
    setTimeout(() => setPackStatus(""), 2500);
  };

  const updateScore = (winner: "innocents" | "impostors") => {
    setScores((prev) => {
      const updated = {
        ...prev,
        [winner]: prev[winner] + 1,
      };
      localStorage.setItem("impostor-scores", JSON.stringify(updated));
      return updated;
    });
  };

  const resetScores = () => {
    const init = { innocents: 0, impostors: 0 };
    setScores(init);
    localStorage.setItem("impostor-scores", JSON.stringify(init));
  };

  // Assemble all active categories (including adult words only if unlocked)
  const allCats: Record<string, string[]> = {
    ...DEFAULT_CATEGORIES,
    ...(isAdultUnlocked ? { [ADULT_CATEGORY]: ADULT_WORDS } : {}),
    ...custom,
  };

  const maxImp = Math.max(1, names.length - 2);

  const getPlayerName = (idx: number): string => names[idx]?.trim() || `Jugador ${idx + 1}`;
  const getPlayerInitial = (idx: number): string => {
    const n = names[idx];
    return n ? n.trim().charAt(0).toUpperCase() || String(idx + 1) : String(idx + 1);
  };

  // Timer effect (Tensión sutil de escape room en los últimos 15 segundos)
  useEffect(() => {
    if (phase !== "discuss" || paused || timeLeft <= 0) return;
    const t = setTimeout(() => {
      const n = timeLeft - 1;
      if (n <= 15 && n > 0) {
        playDebateTension(n, soundEnabled, vibrationEnabled);
      } else if (n === 0) {
        playDramaticImpact(soundEnabled);
        if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([300, 150, 450]);
        }
      }
      setTimeLeft(n);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, paused, timeLeft, soundEnabled, vibrationEnabled]);

  const startRound = () => {
    unlockAudio();
    playPop(soundEnabled);
    const allKeys = Object.keys(allCats);
    const eligibleRandomKeys = hasPro
      ? allKeys
      : allKeys.filter(
          (k) => !PRO_CATEGORIES.includes(k) && k !== ADULT_CATEGORY && !(k in custom),
        );
    const randomPool = eligibleRandomKeys.length > 0 ? eligibleRandomKeys : allKeys;
    const chosenCat =
      category === "Aleatoria"
        ? randomPool[Math.floor(Math.random() * randomPool.length)]!
        : category;

    setPlayedCategory(chosenCat);

    // Track round start & category popularity
    trackAnalytics((prev) => ({
      ...prev,
      roundsPlayed: prev.roundsPlayed + 1,
      categoryCounts: {
        ...prev.categoryCounts,
        [chosenCat]: (prev.categoryCounts[chosenCat] ?? 0) + 1,
      },
    }));

    const fullList = allCats[chosenCat] ?? [];
    const alreadyPlayed = usedWords[chosenCat] ?? [];
    let availableWords = fullList.filter((w) => !alreadyPlayed.includes(w));

    // Reset history if exhausted
    if (availableWords.length === 0) {
      availableWords = fullList;
      setUsedWords((prev) => ({ ...prev, [chosenCat]: [] }));
    }

    const selectedWord =
      availableWords[Math.floor(Math.random() * availableWords.length)] ?? "Secreto";

    // Update used words
    setUsedWords((prev) => ({
      ...prev,
      [chosenCat]: [...(prev[chosenCat] ?? []), selectedWord],
    }));

    setWord(selectedWord);

    // Pick impostors & optional Jester
    const indices = [...names.keys()].sort(() => Math.random() - 0.5);
    const validCount = Math.min(impostorCount, maxImp);
    const chosenImpostors = indices.slice(0, validCount);
    const remainingPool = indices.slice(validCount);
    setImpostors(chosenImpostors);

    let assignedJester: number | null = null;
    if (jesterEnabled && names.length >= 4 && remainingPool.length >= 2) {
      assignedJester = remainingPool[0] ?? null;
    }
    setJesterIndex(assignedJester);

    const pureInnocents = assignedJester !== null ? remainingPool.slice(1) : remainingPool;

    // Starter is always an innocent so impostors in Expert Mode hear at least one clue
    const starterPool =
      pureInnocents.length > 0 ? pureInnocents : remainingPool.length > 0 ? remainingPool : indices;
    setStarter(starterPool[Math.floor(Math.random() * starterPool.length)] ?? 0);

    // Pick random lightning event if enabled
    if (randomEventsEnabled) {
      const chosenEvent = ROUND_EVENTS[Math.floor(Math.random() * ROUND_EVENTS.length)] ?? null;
      setActiveEvent(chosenEvent);
    } else {
      setActiveEvent(null);
    }

    // State reset for reveal
    setTurn(0);
    setIsHolding(false);
    setHasSeenRole(false);
    setAccusedIndex(null);
    setCaughtImpostors([]);
    setRoundWinner(null);
    setWinReason("");
    setShowImpostorGuessModal(false);

    // 🛰️ Telemetría en vivo (Avisa a Discord #metricas-imposter y al Radar CEO)
    // 🛡️ Filtro de Tráfico Interno: Omite las partidas de prueba del CEO
    if (!isCeoAdmin) {
      void trackGameEvent({
        type: "round_start",
        category: chosenCat,
        playerCount: names.length,
        impostorCount: chosenImpostors.length,
        isAdult: chosenCat === ADULT_CATEGORY,
        isJester: assignedJester !== null,
      });
    }

    setPhase("reveal");
  };

  const handleStartHold = () => {
    unlockAudio();
    setIsHolding(true);
    setHasSeenRole(true);
    startScanSound(soundEnabled);
    // Alerta íntima de suspenso si eres el Impostor
    if (impostors.includes(turn)) {
      playImpostorReveal(soundEnabled);
    }
  };

  const handleEndHold = () => {
    setIsHolding(false);
    stopScanSound();
  };

  const nextTurn = () => {
    playPop(soundEnabled);
    setIsHolding(false);
    stopScanSound();
    setHasSeenRole(false);

    if (turn + 1 >= names.length) {
      setTimeLeft(minutes * 60);
      setPaused(false);
      setPhase("discuss");
    } else {
      setTurn(turn + 1);
    }
  };

  const resolveRoundWithSuspense = (isVictory: boolean) => {
    setIsResolvingResult(true);
    playDramaticImpact(soundEnabled);
    setTimeout(() => {
      setPhase("result");
      setIsResolvingResult(false);
      playFanfare(isVictory, soundEnabled);
    }, 420);
  };

  const handleVoteConfirmation = (accused: number) => {
    playPop(soundEnabled);
    const isImp = impostors.includes(accused);
    setAccusedIndex(accused);

    if (jesterIndex !== null && accused === jesterIndex) {
      // Jester was voted out! Jester steals the win solo!
      setRoundWinner("jester");
      setWinReason(
        `¡Cayeron en su trampa! ${getPlayerName(accused)} era el Bufón y logró que el grupo lo votara.`,
      );
      trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
      if (!isCeoAdmin) {
        void trackGameEvent({
          type: "round_finish",
          winner: "jester",
          category: playedCategory || category,
        });
      }
      resolveRoundWithSuspense(true);
    } else if (isImp) {
      // Impostor was caught! Give chance to guess the secret word
      setShowImpostorGuessModal(true);
    } else {
      // Innocent was falsely accused, Impostors win!
      setRoundWinner("impostors");
      setWinReason(
        `¡${getPlayerName(accused)} era inocente! Los impostores lograron engañar al grupo.`,
      );
      updateScore("impostors");
      trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
      if (!isCeoAdmin) {
        void trackGameEvent({
          type: "round_finish",
          winner: "impostors",
          category: playedCategory || category,
        });
      }
      resolveRoundWithSuspense(false);
    }
  };

  const handleImpostorGuessResult = (guessedCorrectly: boolean) => {
    setShowImpostorGuessModal(false);
    if (guessedCorrectly) {
      setRoundWinner("impostors");
      setWinReason(
        "¡El impostor fue descubierto pero adivinó la palabra secreta y se roba la victoria!",
      );
      updateScore("impostors");
      trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
      if (!isCeoAdmin) {
        void trackGameEvent({
          type: "round_finish",
          winner: "impostors",
          category: playedCategory || category,
        });
      }
      resolveRoundWithSuspense(false);
    } else {
      const updatedCaught =
        accusedIndex !== null ? [...caughtImpostors, accusedIndex] : caughtImpostors;
      setCaughtImpostors(updatedCaught);

      if (updatedCaught.length >= impostors.length) {
        setRoundWinner("innocents");
        setWinReason(
          impostors.length > 1
            ? "¡Todos los impostores fueron descubiertos sin adivinar la palabra! Victoria de los inocentes."
            : "¡El impostor fue descubierto y falló al adivinar la palabra! Victoria de los inocentes.",
        );
        updateScore("innocents");
        trackAnalytics((prev) => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
        if (!isCeoAdmin) {
          void trackGameEvent({
            type: "round_finish",
            winner: "innocents",
            category: playedCategory || category,
          });
        }
        resolveRoundWithSuspense(true);
      } else {
        // Still more impostors to catch! Stay in vote phase
        playPop(soundEnabled);
        setAccusedIndex(null);
      }
    }
  };

  const handleDirectReveal = () => {
    playPop(soundEnabled);
    setRoundWinner(null);
    setWinReason("Ronda finalizada sin votación previa.");
    setPhase("result");
  };

  // PIN Keypad Handlers con Blindaje Anti-Fuerza Bruta (Máx 5 intentos)
  const handlePinInput = (digit: string) => {
    playPop(soundEnabled);
    const now = Date.now();
    if (now < pinLockoutUntil) {
      playBeep(0.3, 200, soundEnabled);
      return;
    }

    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setPinError(false);

      if (next.length === 4) {
        if (pinModalMode === "change") {
          playFanfare(true, soundEnabled);
          setAdultPin(next);
          localStorage.setItem("impostor-adult-pin", next);
          setShowPinModal(false);
          setEnteredPin("");
          setShowPinHint(false);
          setPinFailedAttempts(0);
        } else if (next === adultPin) {
          playFanfare(true, soundEnabled);
          setIsAdultUnlocked(true);
          localStorage.setItem("impostor-adult-unlocked", "true");
          setCategory(ADULT_CATEGORY);
          setShowPinModal(false);
          setEnteredPin("");
          setShowPinHint(false);
          setPinFailedAttempts(0);
        } else {
          setPinError(true);
          playBeep(0.3, 200, soundEnabled);
          const nextAttempts = pinFailedAttempts + 1;
          setPinFailedAttempts(nextAttempts);
          if (nextAttempts >= 5) {
            setPinLockoutUntil(Date.now() + 60000); // 60s de bloqueo
          }
          setTimeout(() => {
            setEnteredPin("");
            setPinError(false);
          }, 600);
        }
      }
    }
  };

  const handlePinDelete = () => {
    playPop(soundEnabled);
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const abortRound = () => {
    playPop(soundEnabled);
    stopScanSound();
    setIsHolding(false);
    setShowImpostorGuessModal(false);
    setPhase("setup");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md sm:max-w-lg flex-col px-4 py-6 select-none">
      {/* Header Minimalista con Cápsula de Cristal Unificada */}
      <header className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-primary drop-shadow-[0_0_15px_rgba(234,179,8,0.35)]">
            IMPOSTER
          </h1>
          <p className="text-[11px] text-muted-foreground/80 font-medium">
            Juego de fiesta y deducción
          </p>
        </div>

        {/* Dock / Cápsula de Cristal Esmerilado Unificada */}
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl shadow-lg">
          {/* Abort / Back to Setup Button during active game */}
          {phase !== "setup" && (
            <>
              <button
                onClick={abortRound}
                title="Salir a configuración"
                aria-label="Salir a configuración"
                className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-destructive/25 hover:text-rose-200 active:scale-95 cursor-pointer"
              >
                <LogOut size={13} />
                <span className="hidden xs:inline">Salir</span>
              </button>
              <div className="mx-0.5 h-3.5 w-px bg-white/10" />
            </>
          )}

          {/* PRO / CEO Trigger Integrado en la Cápsula */}
          <button
            type="button"
            onClick={() => {
              playPop(soundEnabled);
              if (isCeoAdmin) {
                setShowCeoModal(true);
              } else {
                openPaywall();
              }
            }}
            aria-label={isCeoAdmin ? "Abrir Panel Ejecutivo CEO" : "Party Pass PRO"}
            title={
              isCeoAdmin
                ? ceoSimulateFree
                  ? "Modo CEO (Simulando Gratis)"
                  : "Panel Ejecutivo CEO Activo"
                : hasPro
                  ? "Party Pass PRO Activo"
                  : "Desbloquear Party Pass PRO"
            }
            className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 cursor-pointer ${
              isCeoAdmin && !ceoSimulateFree
                ? "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                : hasPro
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                  : "bg-amber-400/15 text-amber-300 border border-amber-400/30 hover:bg-amber-400/25"
            }`}
          >
            <Crown size={14} />
          </button>

          <div className="mx-0.5 h-3.5 w-px bg-white/10" />

          {/* Share / QR Modal Trigger */}
          <button
            onClick={() => {
              playPop(soundEnabled);
              setShowShareModal(true);
            }}
            aria-label="Compartir juego con código QR"
            title="Invitar amigos (QR)"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90 cursor-pointer"
          >
            <QrCode size={15} />
          </button>

          {/* PWA Install Trigger */}
          {!isStandalone && (
            <button
              onClick={handleInstallPwa}
              aria-label="Instalar app en tu teléfono"
              title="Instalar en pantalla de inicio"
              className="flex h-7 items-center gap-1 rounded-full bg-primary/15 hover:bg-primary/25 border border-primary/30 px-2 text-[11px] font-bold text-primary transition active:scale-90 cursor-pointer"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? "Silenciar audio" : "Activar audio"}
            title={soundEnabled ? "Sonido activado" : "Sonido silenciado"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90 cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 size={15} className="text-primary/90" />
            ) : (
              <VolumeX size={15} />
            )}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => {
              playPop(soundEnabled);
              setShowSettingsModal(true);
            }}
            aria-label="Abrir configuración"
            title="Configuración"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90 cursor-pointer"
          >
            <Settings size={15} />
          </button>

          <div className="mx-1 h-3.5 w-px bg-white/10" />

          {/* Score Pill Integrado */}
          <div
            className="flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold"
            title={`Inocentes ${scores.innocents} - ${scores.impostors} Impostores`}
          >
            <Trophy size={11} className="text-primary/90" />
            <span className="text-primary font-bold tabular-nums">{scores.innocents}</span>
            <span className="text-muted-foreground/40">:</span>
            <span className="text-destructive font-bold tabular-nums">{scores.impostors}</span>
          </div>
        </div>
      </header>

      {/* PHASE 1: SETUP (WIZARD EN 2 PASOS) */}
      {phase === "setup" && (
        <section className="flex flex-col gap-4 pb-8 animate-in fade-in duration-200">
          {/* Interactive Stepper Header */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl glass-panel p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                playPop(soundEnabled);
                setSetupStep(1);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                setupStep === 1
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <User size={14} />
              <span>1. Jugadores ({names.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playPop(soundEnabled);
                setSetupStep(2);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                setupStep === 2
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={14} />
              <span className="truncate">
                2. {category === "Aleatoria" ? "Categoría" : category}
              </span>
            </button>
          </div>

          {/* PASO 1: SALA DE JUGADORES, IMPOSTORES Y TIEMPO */}
          {setupStep === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Jugadores */}
              <div className="glass-panel rounded-2xl p-5 shadow-2xl">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    <h2 className="font-semibold text-foreground">Sala de Jugadores</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={shufflePlayers}
                      title="Mezclar orden de jugadores"
                      className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1 text-[11px] font-medium text-foreground/90 border border-white/10 transition active:scale-95 cursor-pointer"
                    >
                      <Shuffle size={11} className="text-primary" /> Mezclar
                    </button>
                    <span className="text-[11px] text-muted-foreground/70">3–15 máx</span>
                  </div>
                </div>

                <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
                  {names.map((n, i) => {
                    const badge = getPlayerBadge(i);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl bg-background/60 p-2 border border-white/10 transition hover:border-white/20"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          {getPlayerInitial(i)}
                        </div>
                        <input
                          value={n}
                          onChange={(e) => {
                            playPop(soundEnabled);
                            updateNames(names.map((x, j) => (j === i ? e.target.value : x)));
                          }}
                          placeholder={`Jugador ${i + 1}`}
                          maxLength={20}
                          className="flex-1 bg-transparent px-2 py-1 text-sm outline-none font-medium text-foreground placeholder:text-muted-foreground/50"
                        />
                        {names.length > 3 && (
                          <button
                            aria-label={`Eliminar a ${n}`}
                            onClick={() => {
                              playPop(soundEnabled);
                              updateNames(names.filter((_, j) => j !== i));
                            }}
                            className="rounded-lg p-2 text-muted-foreground/60 transition hover:bg-destructive/20 hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={names.length >= 15}
                  onClick={() => {
                    if (!hasPro && names.length >= FREE_MAX_PLAYERS) {
                      openPaywall();
                      return;
                    }
                    playPop(soundEnabled);
                    updateNames([...names, `Jugador ${names.length + 1}`]);
                  }}
                  className={
                    !hasPro && names.length >= FREE_MAX_PLAYERS
                      ? "group relative mt-3 flex w-full items-center justify-between overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-amber-400/[0.04] to-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-amber-400/45 hover:from-amber-500/15 active:scale-[0.98] cursor-pointer"
                      : `${btnGhost} mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm`
                  }
                >
                  {!hasPro && names.length >= FREE_MAX_PLAYERS ? (
                    <>
                      <span className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                        <Plus size={15} className="text-amber-300" />
                        Añadir jugador (7–15)
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-300/30 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300">
                        <Crown size={10} /> PRO
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Añadir jugador
                    </>
                  )}
                </button>
              </div>

              {/* Steppers Rediseñados: Impostores y Tiempo */}
              <div className="grid grid-cols-2 gap-3">
                {/* Impostores Box */}
                <div className="flex flex-col justify-between rounded-2xl glass-panel p-4 shadow-2xl">
                  <span className="text-xs font-semibold text-muted-foreground">Impostores</span>
                  <div className="my-2.5 flex items-center justify-between">
                    <button
                      aria-label="Reducir impostores"
                      disabled={impostorCount <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateImpostorCount(Math.max(1, impostorCount - 1));
                      }}
                    >
                      <Minus size={18} className="stroke-[2.5]" />
                    </button>

                    <span className="font-display text-3xl text-destructive tracking-wide drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]">
                      {Math.min(impostorCount, maxImp)}
                    </span>

                    <button
                      aria-label="Aumentar impostores"
                      disabled={impostorCount >= maxImp}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateImpostorCount(Math.min(maxImp, impostorCount + 1));
                      }}
                    >
                      <Plus size={18} className="stroke-[2.5]" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center">
                    {names.length <= 3 ? "Añade 4+ jug. para subir" : `Máximo permitido: ${maxImp}`}
                  </span>
                </div>

                {/* Tiempo Box */}
                <div className="flex flex-col justify-between rounded-2xl glass-panel p-4 shadow-2xl">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Tiempo de debate
                  </span>
                  <div className="my-2.5 flex items-center justify-between">
                    <button
                      aria-label="Reducir tiempo"
                      disabled={minutes <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateMinutes(Math.max(1, minutes - 1));
                      }}
                    >
                      <Minus size={18} className="stroke-[2.5]" />
                    </button>

                    <span className="font-display text-3xl text-accent tracking-wide drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                      {minutes}m
                    </span>

                    <button
                      aria-label="Aumentar tiempo"
                      disabled={minutes >= 15}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold border border-white/20 shadow-md transition cursor-pointer disabled:opacity-30"
                      onClick={() => {
                        playPop(soundEnabled);
                        updateMinutes(Math.min(15, minutes + 1));
                      }}
                    >
                      <Plus size={18} className="stroke-[2.5]" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center">
                    1 a 15 minutos
                  </span>
                </div>
              </div>

              {/* Selector Rápido de Modos de Partida (1-Tap Toggles) */}
              <div className="rounded-2xl glass-panel p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* 1. Cómplices vs Modo Caos */}
                  <button
                    type="button"
                    onClick={() => {
                      playPop(soundEnabled);
                      toggleAccompliceMode();
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      accompliceMode
                        ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                        : "bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-sm"
                    }`}
                  >
                    <span>{accompliceMode ? "🤝" : "🌪️"}</span>
                    <span className="truncate">{accompliceMode ? "Cómplices" : "Modo Caos"}</span>
                  </button>

                  {/* 2. Eventos Relámpago (PRO) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      toggleRandomEvents();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      randomEventsEnabled && hasPro
                        ? "bg-accent/20 text-accent border-accent/40 shadow-sm"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <span>⚡</span>
                    <span className="truncate">Eventos</span>
                    {!hasPro && <Crown size={11} className="text-amber-400 shrink-0" />}
                  </button>

                  {/* 3. El Bufón (PRO) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      toggleJester();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      jesterEnabled && hasPro
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <span>🃏</span>
                    <span className="truncate">Bufón</span>
                    {!hasPro && <Crown size={11} className="text-amber-400 shrink-0" />}
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center leading-tight">
                  {accompliceMode
                    ? "🤝 Los impostores se conocen entre sí"
                    : "🌪️ Caos: los impostores no saben quién es su aliado"}
                  {randomEventsEnabled && hasPro ? " · ⚡ Con retos por ronda" : ""}
                  {jesterEnabled && hasPro ? " · 🃏 Bufón infiltrado" : ""}
                </p>
              </div>

              {/* Botón Flotante Inteligente (Sticky: cerca del contenido en PC y flotante sobre el borde en móvil) */}
              <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
                <button
                  onClick={() => {
                    playPop(soundEnabled);
                    setSetupStep(2);
                  }}
                  className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-6 pr-4 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
                >
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="font-display text-base tracking-wider">CATEGORÍAS</span>
                    <span className="text-[10px] font-bold opacity-80">Paso 2 de 2</span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                    <ArrowRight size={20} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: GALERÍA DE CATEGORÍAS TIPO ARCADE */}
          {setupStep === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="glass-panel rounded-2xl p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">Elige la Categoría</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Selecciona el tema secreto para los {names.length} jugadores
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      setShowSettingsModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/90 transition active:scale-95 cursor-pointer"
                  >
                    {!hasPro ? (
                      <Crown size={12} className="text-amber-300" />
                    ) : (
                      <Plus size={13} className="text-primary" />
                    )}
                    <span>Crear lista</span>
                  </button>
                </div>

                {/* Arcade Deck Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                  {["Aleatoria", ...Object.keys(DEFAULT_CATEGORIES), ...Object.keys(custom)].map(
                    (c) => {
                      const isSelected = c === category;
                      const isProCat = PRO_CATEGORIES.includes(c) || c in custom;
                      const isLockedByPro = isProCat && !hasPro;
                      const icon = CATEGORY_ICONS[c] ?? "✨";
                      const count = allCats[c]?.length ?? 0;
                      const playedCount = usedWords[c]?.length ?? 0;
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            if (isLockedByPro) {
                              openPaywall();
                              return;
                            }
                            playPop(soundEnabled);
                            setCategory(c);
                          }}
                          className={`relative flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all duration-150 cursor-pointer border overflow-hidden ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/50 border-primary scale-[1.02]"
                              : isLockedByPro
                                ? "bg-white/[0.02] hover:bg-amber-400/[0.06] text-foreground/85 border-white/10 hover:border-amber-400/30 active:scale-95"
                                : "bg-background/60 hover:bg-white/10 text-foreground border-white/10 active:scale-95"
                          }`}
                        >
                          {isLockedByPro && (
                            <span
                              title="Categoría Party Pass PRO"
                              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                            >
                              <Crown size={10} />
                            </span>
                          )}
                          <span className="text-2xl mb-1">{icon}</span>
                          <span className="text-xs font-semibold leading-tight line-clamp-1">
                            {c}
                          </span>
                          <span
                            className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isSelected
                                ? "bg-black/20 text-primary-foreground"
                                : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {c === "Aleatoria"
                              ? "Todas las listas"
                              : playedCount > 0
                                ? `${count - playedCount}/${count} libres`
                                : `${count} palabras`}
                          </span>
                        </button>
                      );
                    },
                  )}

                  {/* Tarjeta Especial: Sección +18 con Candado */}
                  <button
                    onClick={() => {
                      if (!hasPro) {
                        openPaywall();
                        return;
                      }
                      playPop(soundEnabled);
                      if (!isAdultUnlocked) {
                        setPinModalMode("unlock");
                        setShowPinModal(true);
                        setEnteredPin("");
                        setPinError(false);
                        setShowPinHint(false);
                      } else {
                        setCategory(ADULT_CATEGORY);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all duration-150 cursor-pointer border overflow-hidden ${
                      category === ADULT_CATEGORY
                        ? "bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-[1.02] font-bold"
                        : isAdultUnlocked
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
                          : "bg-rose-950/35 text-rose-300/80 border-rose-500/30 hover:border-rose-400/60"
                    }`}
                  >
                    {!hasPro && (
                      <span
                        title="Categoría Party Pass PRO"
                        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                      >
                        <Crown size={10} />
                      </span>
                    )}
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-2xl">🔞</span>
                      {isAdultUnlocked && hasPro ? (
                        <Unlock size={13} className="text-emerald-400" />
                      ) : (
                        <Lock size={13} className="text-rose-400" />
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-tight">Fiesta +18</span>
                    <span
                      className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        category === ADULT_CATEGORY
                          ? "bg-black/25 text-white"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {isAdultUnlocked && hasPro
                        ? `${ADULT_WORDS.length} palabras`
                        : !hasPro
                          ? "Pack PRO"
                          : "Con PIN"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setSetupStep(1);
                }}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start px-2 py-1 transition cursor-pointer"
              >
                <ArrowLeft size={14} /> Volver a Jugadores ({names.length} jug,{" "}
                {Math.min(impostorCount, maxImp)} imp)
              </button>

              {/* Botón Flotante Inteligente (Sticky: cerca del contenido en PC y flotante sobre el borde en móvil) */}
              <div className="pointer-events-none sticky bottom-5 z-40 mt-2 flex w-full justify-center">
                <button
                  onClick={startRound}
                  className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-primary pl-4 pr-6 py-3.5 text-primary-foreground glow-primary ring-2 ring-white/25 shadow-2xl transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer animate-float"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground">
                    <Play size={20} className="fill-current ml-0.5" />
                  </div>
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="font-display text-lg tracking-wider">JUGAR</span>
                    <span className="text-[10px] font-bold opacity-80 max-w-[130px] truncate">
                      {category === "Aleatoria" ? "🎲 Aleatoria" : category}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODAL: CENTRO DE CONFIGURACIÓN Y PERSONALIZACIÓN */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex max-h-[88vh] w-full max-w-md flex-col rounded-3xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  CONFIGURACIÓN
                </h3>
              </div>
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowSettingsModal(false);
                }}
                aria-label="Cerrar configuración"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 0. ACCESO RÁPIDO AL PANEL EJECUTIVO CEO */}
              {isCeoAdmin && (
                <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent p-4 border border-amber-400/40 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-black shadow-md font-bold">
                      <Crown size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                        Panel Ejecutivo CEO
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Monitor de cupones, telemetría y Discord
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playPop(soundEnabled);
                      setShowSettingsModal(false);
                      setShowCeoModal(true);
                    }}
                    className="rounded-xl bg-amber-400 text-black px-3.5 py-2 text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    Abrir Panel
                  </button>
                </div>
              )}

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
                          setShowSettingsModal(false);
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
                            setShowSettingsModal(false);
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
                            <span className="font-semibold text-foreground">✨ {catName}</span>
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
                        setShowSettingsModal(false);
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
                          setPinModalMode("change");
                          setEnteredPin("");
                          setPinError(false);
                          setShowPinHint(false);
                          setShowSettingsModal(false);
                          setShowPinModal(true);
                        }}
                        className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-foreground border border-white/15 transition cursor-pointer"
                      >
                        Cambiar PIN
                      </button>
                      <button
                        onClick={() => {
                          playPop(soundEnabled);
                          setIsAdultUnlocked(false);
                          localStorage.removeItem("impostor-adult-unlocked");
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
                        setPinModalMode("unlock");
                        setEnteredPin("");
                        setPinError(false);
                        setShowPinHint(false);
                        setShowSettingsModal(false);
                        setShowPinModal(true);
                      }}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <Unlock size={12} /> Desbloquear
                    </button>
                  )}
                </div>
              </div>

              {/* 4. AUDIO, VIBRACIÓN Y DATOS */}
              <div className="rounded-2xl bg-background/50 p-4 border border-white/10 space-y-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Smartphone size={14} /> Experiencia y Datos
                </span>

                {/* Sonido Switch */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Efectos de Sonido (SFX)
                  </span>
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
                    setShowSettingsModal(false);
                    handleInstallPwa();
                  }}
                  className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 text-xs transition cursor-pointer"
                >
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <Smartphone size={15} className="text-primary" />
                    Instalar en Pantalla de Inicio
                  </span>
                  <span className="rounded-lg bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-bold">
                    {isStandalone ? "✅ Instalada" : "📲 Instalar"}
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
                    <RotateCcw size={13} /> Reiniciar Marcador ({scores.innocents}:
                    {scores.impostors})
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
                        setShowSettingsModal(false);
                        openPaywall();
                      }}
                      className="w-full text-center text-[11px] font-semibold text-amber-400/90 hover:text-amber-300 transition cursor-pointer"
                    >
                      👑 ¿Tienes un código VIP o Clave CEO? Canjear aquí
                    </button>
                    {isProUnlocked && (
                      <div className="space-y-1.5">
                        {proExpiresAt && (
                          <p className="text-center text-[10px] font-semibold text-amber-300/90">
                            ⏳ Pase Tester PRO (48h) — restan{" "}
                            {Math.max(1, Math.ceil((proExpiresAt - Date.now()) / (1000 * 60 * 60)))}
                            h
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={deactivateProAndCeo}
                          className="w-full rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 py-1.5 text-center text-[11px] font-semibold text-rose-300 transition cursor-pointer"
                        >
                          🔒 Desactivar Pase PRO (Volver a versión Normal Gratis)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PANEL EJECUTIVO CEO DEDICADO */}
      {showCeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-3xl glass-panel border-2 border-amber-400/50 shadow-2xl overflow-hidden">
            {/* Header CEO */}
            <div className="relative bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-transparent px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-bold shadow-md">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg tracking-wider text-amber-300">
                    PANEL EJECUTIVO CEO
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.2 text-[9px] font-bold text-amber-200">
                    <ShieldCheck size={10} /> Acceso Maestro Activo
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowCeoModal(false);
                }}
                aria-label="Cerrar Panel CEO"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Selector de Pestañas Ejecutivas */}
            <div className="flex border-b border-white/10 bg-black/40 p-1.5 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setCeoModalTab("coupons");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                  ceoModalTab === "coupons"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md font-extrabold"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Ticket size={13} />
                <span>Cupones</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono font-extrabold ${
                    ceoModalTab === "coupons"
                      ? "bg-black/25 text-black"
                      : "bg-amber-400/20 text-amber-300"
                  }`}
                >
                  {
                    VIP_COUPON_HASHES_ORDERED.filter(
                      (h) => usedCoupons.includes(h) || Boolean(serverCouponsMap[h]),
                    ).length
                  }
                  /10
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setCeoModalTab("payments");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                  ceoModalTab === "payments"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md font-extrabold"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Wallet size={13} />
                <span>Cobros</span>
                {ceoPendingPayments.filter((p) => p.status === "pending").length > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-bold animate-pulse">
                    {ceoPendingPayments.filter((p) => p.status === "pending").length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop(soundEnabled);
                  setCeoModalTab("metrics");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                  ceoModalTab === "metrics"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md font-extrabold"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <BarChart3 size={13} />
                <span>Métricas</span>
              </button>
            </div>

            {/* Scrollable Body según la pestaña activa */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 smooth-scroll">
              {/* TAB 1: MONITOR DE CUPONES VIP (48H) */}
              {ceoModalTab === "coupons" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        🎟️ Monitor Cupones VIP (48h)
                      </span>
                      <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {
                          VIP_COUPON_HASHES_ORDERED.filter(
                            (h) => usedCoupons.includes(h) || Boolean(serverCouponsMap[h]),
                          ).length
                        }
                        /10 en uso
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={refreshCouponStatus}
                      title="Actualizar estado con el servidor"
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-white transition cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10"
                    >
                      <RotateCcw size={12} />
                      <span>Sincronizar</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Comparte invitaciones directas por WhatsApp o copia el mensaje listo para el
                    tester.
                  </p>

                  {/* Listado de los 10 cupones */}
                  <div className="space-y-2">
                    {VIP_COUPON_HASHES_ORDERED.map((hash, idx) => {
                      const num = idx + 1;
                      const isUsed = usedCoupons.includes(hash) || Boolean(serverCouponsMap[hash]);
                      const activatedAt = serverCouponsMap[hash]?.activatedAt;
                      const timeInfo = activatedAt ? formatRemainingTime(activatedAt) : null;
                      const assignedName =
                        couponNames[num] || (num === 1 ? "Ivana" : `Tester #${num}`);
                      const couponCode = ceoDecryptedCodes[idx];

                      return (
                        <div
                          key={hash}
                          className={`rounded-xl p-2.5 border text-xs transition ${
                            isUsed
                              ? timeInfo?.isExpired
                                ? "bg-rose-500/10 border-rose-500/30"
                                : "bg-amber-500/10 border-amber-500/35 shadow-sm"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                                #{String(num).padStart(2, "0")}
                              </span>

                              {editingCouponIdx === num ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    value={editingNameInput}
                                    onChange={(e) => setEditingNameInput(e.target.value)}
                                    placeholder="Nombre..."
                                    className="w-24 rounded-lg bg-black/60 border border-amber-400 px-2 py-0.5 text-xs text-white outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveTesterName(num, editingNameInput);
                                      if (e.key === "Escape") setEditingCouponIdx(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTesterName(num, editingNameInput)}
                                    className="p-1 rounded bg-amber-400 text-black text-xs font-bold"
                                  >
                                    <Check size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-foreground truncate max-w-[110px] sm:max-w-[140px]">
                                    {assignedName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCouponIdx(num);
                                      setEditingNameInput(assignedName);
                                    }}
                                    title="Editar nombre del tester"
                                    className="text-muted-foreground hover:text-white transition p-0.5"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isUsed ? (
                                timeInfo?.isExpired ? (
                                  <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                    Expirado
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                                    <Clock size={10} />
                                    {timeInfo?.text ?? "48h activo"}
                                  </span>
                                )
                              ) : (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  Disponible
                                </span>
                              )}

                              {isUsed && (
                                <button
                                  type="button"
                                  onClick={() => handleResetSingleCoupon(hash)}
                                  title="Liberar cupón para poder reusarlo"
                                  className="text-xs text-muted-foreground hover:text-rose-300 transition p-1 hover:bg-white/10 rounded-md"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Fechas detalladas y barra de progreso */}
                          {isUsed && activatedAt && (
                            <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>🟢 {formatCouponDate(activatedAt)}</span>
                                <span>
                                  🔴 {formatCouponDate(activatedAt + TESTER_COUPON_DURATION_MS)}
                                </span>
                              </div>
                              {timeInfo && (
                                <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      timeInfo.percentElapsed > 85
                                        ? "bg-rose-500"
                                        : "bg-gradient-to-r from-amber-400 to-yellow-500"
                                    }`}
                                    style={{ width: `${timeInfo.percentElapsed}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Herramientas de Invitación Directa para el CEO */}
                          {couponCode && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-[10px] text-amber-300 font-bold bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-md">
                                  {couponCode}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleShareCoupon(couponCode, num, assignedName)}
                                  title="Enviar invitación por WhatsApp"
                                  className="flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/35 px-2.5 py-1 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                                >
                                  <Share2 size={11} />
                                  <span>WhatsApp</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyCouponLink(couponCode, num, assignedName)
                                  }
                                  title="Copiar mensaje con enlace al portapapeles"
                                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition active:scale-95 cursor-pointer ${
                                    copiedCouponIdx === num
                                      ? "bg-emerald-500 text-black border-emerald-400 font-extrabold"
                                      : "bg-white/10 hover:bg-white/20 text-white border-white/15"
                                  }`}
                                >
                                  {copiedCouponIdx === num ? (
                                    <>
                                      <Check size={11} />
                                      <span>¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copiar Link</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {usedCoupons.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          playPop(soundEnabled);
                          setUsedCoupons([]);
                          localStorage.removeItem(STORAGE_KEYS.USED_COUPONS);
                          try {
                            await consumeSingleUseCouponServerFn({
                              data: { couponIdHash: "", action: "reset" },
                            });
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="w-full rounded-xl bg-amber-500/20 hover:bg-amber-500/30 py-2.5 text-xs font-semibold text-amber-300 border border-amber-500/30 transition cursor-pointer text-center"
                      >
                        🔄 Reactivar Todos los Cupones ({usedCoupons.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONFIGURACIÓN DE MÉTODOS DE PAGO Y APROBACIONES */}
              {ceoModalTab === "payments" && (
                <div className="space-y-4">
                  {/* SECCIÓN 1: PAGOS PENDIENTES DE APROBACIÓN */}
                  <div className="rounded-2xl bg-black/40 p-3.5 border border-amber-400/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <Bell size={13} className="text-amber-400" /> Aprobaciones en 1-Toque
                        </span>
                        {ceoPendingPayments.filter((p) => p.status === "pending").length > 0 && (
                          <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[9px] font-bold animate-pulse">
                            {ceoPendingPayments.filter((p) => p.status === "pending").length}{" "}
                            pendientes
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCeoPayments}
                        title="Actualizar pagos desde el servidor"
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-white transition cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10"
                      >
                        <RotateCcw size={11} className={ceoLoadingPayments ? "animate-spin" : ""} />
                        <span>Refrescar</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Revisa tu app de banco o Binance. Al tocar <strong>Aprobar</strong>, el Party
                      Pass PRO del cliente se desbloquea en su teléfono al instante sin enviar
                      códigos a mano.
                    </p>

                    {ceoPendingPayments.filter((p) => p.status === "pending").length > 0 ? (
                      <div className="space-y-2">
                        {ceoPendingPayments
                          .filter((p) => p.status === "pending")
                          .map((pay) => (
                            <div
                              key={pay.id}
                              className="rounded-xl bg-amber-500/10 border border-amber-400/40 p-3 space-y-2 shadow-sm"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-bold text-white truncate max-w-[140px]">
                                    {pay.customerName}
                                  </span>
                                  <span className="rounded-md bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                    {pay.plan === "founder" || pay.plan === "lifetime"
                                      ? "👑 Fundador ($9.80)"
                                      : pay.plan === "month"
                                        ? "30 Días ($3.99)"
                                        : pay.plan === "weekend"
                                          ? "72h ($1.99)"
                                          : "24h ($0.99)"}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {pay.id}
                                </span>
                              </div>

                              {pay.discordContact && (
                                <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                                  <span>Discord:</span>
                                  <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-amber-400/30">
                                    @{pay.discordContact.replace(/^@/, "")}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <span className="text-muted-foreground text-[11px]">
                                  {pay.method}
                                </span>
                                <span className="font-extrabold text-amber-300">
                                  {pay.amountFormatted}
                                </span>
                                <span className="font-mono text-white font-bold bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
                                  Ref: #{pay.reference}
                                </span>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={ceoReviewingId === pay.id}
                                  onClick={() => handleReviewPayment(pay.id, "approve")}
                                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black py-2 text-xs font-extrabold shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  {ceoReviewingId === pay.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  <span>✅ Aprobar Acceso</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={ceoReviewingId === pay.id}
                                  onClick={() => handleReviewPayment(pay.id, "reject")}
                                  className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  <X size={12} />
                                  <span>Rechazar</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Al día: No hay solicitudes de pago pendientes.</span>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 2: DATOS BANCARIOS Y PASARELAS */}
                  <div className="rounded-2xl bg-black/40 p-3.5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Wallet size={13} className="text-amber-400" /> Cuentas para Recibir Pagos
                      </span>
                    </div>

                    {/* Pago Móvil */}
                    <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1">
                        <Building2 size={11} /> 🇻🇪 Datos de Pago Móvil
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editingPaymentConfig.pagoMovil.banco}
                          onChange={(e) =>
                            setEditingPaymentConfig((prev) => ({
                              ...prev,
                              pagoMovil: { ...prev.pagoMovil, banco: e.target.value },
                            }))
                          }
                          placeholder="Banco (ej. Banesco)"
                          className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                        <input
                          value={editingPaymentConfig.pagoMovil.telefono}
                          onChange={(e) =>
                            setEditingPaymentConfig((prev) => ({
                              ...prev,
                              pagoMovil: { ...prev.pagoMovil, telefono: e.target.value },
                            }))
                          }
                          placeholder="Teléfono (0412...)"
                          className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                        <input
                          value={editingPaymentConfig.pagoMovil.cedula}
                          onChange={(e) =>
                            setEditingPaymentConfig((prev) => ({
                              ...prev,
                              pagoMovil: { ...prev.pagoMovil, cedula: e.target.value },
                            }))
                          }
                          placeholder="Cédula (V-12345678)"
                          className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                        <input
                          value={editingPaymentConfig.pagoMovil.titular}
                          onChange={(e) =>
                            setEditingPaymentConfig((prev) => ({
                              ...prev,
                              pagoMovil: { ...prev.pagoMovil, titular: e.target.value },
                            }))
                          }
                          placeholder="Nombre del Titular"
                          className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          Tasa Ref (Bs/$):
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tasaInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            const parts = val.split(".");
                            const cleanVal =
                              parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : val;
                            setTasaInput(cleanVal);
                            const parsed = parseFloat(cleanVal);
                            if (!isNaN(parsed) && parsed > 0) {
                              setEditingPaymentConfig((prev) => ({
                                ...prev,
                                pagoMovil: {
                                  ...prev.pagoMovil,
                                  tasaBs: parsed,
                                },
                              }));
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseFloat(tasaInput);
                            if (isNaN(parsed) || parsed <= 0) {
                              setTasaInput("55");
                              setEditingPaymentConfig((prev) => ({
                                ...prev,
                                pagoMovil: {
                                  ...prev.pagoMovil,
                                  tasaBs: 55,
                                },
                              }));
                            } else {
                              setTasaInput(String(parsed));
                            }
                          }}
                          placeholder="55"
                          className="w-20 rounded-lg border border-white/15 bg-black/50 px-2 py-0.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-400 text-center"
                        />
                      </div>
                    </div>

                    {/* Binance Pay */}
                    <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-yellow-400 flex items-center gap-1">
                        🟡 Binance Pay (USDT)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editingPaymentConfig.binancePay.payId}
                          onChange={(e) =>
                            setEditingPaymentConfig((prev) => ({
                              ...prev,
                              binancePay: { ...prev.binancePay, payId: e.target.value },
                            }))
                          }
                          placeholder="Binance Pay ID"
                          className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                        <input
                          value={editingPaymentConfig.binancePay.nickname}
                          onChange={(e) =>
                            setEditingPaymentConfig((prev) => ({
                              ...prev,
                              binancePay: { ...prev.binancePay, nickname: e.target.value },
                            }))
                          }
                          placeholder="Nickname en Binance"
                          className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-foreground outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Enlace Internacional */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CreditCard size={10} className="text-blue-400" /> Enlace Tarjeta
                        Internacional (Whop / Stripe)
                      </label>
                      <input
                        value={editingPaymentConfig.internationalLink}
                        onChange={(e) =>
                          setEditingPaymentConfig((prev) => ({
                            ...prev,
                            internationalLink: e.target.value,
                          }))
                        }
                        placeholder="https://whop.com/... (opcional)"
                        className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Enlace de Invitación a Discord */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <MessageSquare size={10} className="text-indigo-400" /> Enlace de Invitación
                        a Discord (Pase Fundador)
                      </label>
                      <input
                        value={editingPaymentConfig.discordInviteUrl || ""}
                        onChange={(e) =>
                          setEditingPaymentConfig((prev) => ({
                            ...prev,
                            discordInviteUrl: e.target.value,
                          }))
                        }
                        placeholder="https://discord.gg/..."
                        className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePaymentConfig}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-2.5 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                    >
                      💾 Guardar Configuración de Cobros
                    </button>

                    {paymentSavedFeedback && (
                      <p className="text-[11px] font-semibold text-emerald-400 text-center animate-in fade-in">
                        {paymentSavedFeedback}
                      </p>
                    )}
                  </div>

                  {/* SECCIÓN 3: RECURSOS CEO (LOGO DISCORD) */}
                  <div className="rounded-2xl bg-black/40 p-3.5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Logo Oficial Imposter</p>
                      <p className="text-[10px] text-muted-foreground">
                        PNG en alta resolución (512x512) para tu Discord.
                      </p>
                    </div>
                    <a
                      href="/icon-512.png"
                      download="imposter-logo-512.png"
                      className="rounded-xl bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs font-bold border border-white/15 transition flex items-center gap-1.5 shrink-0"
                    >
                      <Download size={13} />
                      <span>Descargar PNG</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: RADAR GLOBAL DE MÉTRICAS Y AJUSTES */}
              {ceoModalTab === "metrics" && (
                <div className="space-y-4">
                  {/* Encabezado con estado en vivo y botón de refresco */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Radar Global en Vivo
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void refreshGlobalMetrics()}
                      disabled={loadingGlobalMetrics}
                      className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-foreground border border-white/10 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw
                        size={11}
                        className={loadingGlobalMetrics ? "animate-spin text-amber-400" : ""}
                      />
                      <span>{loadingGlobalMetrics ? "Actualizando..." : "Actualizar"}</span>
                    </button>
                  </div>

                  {/* Tarjetas de Métricas Globales */}
                  {(() => {
                    const started = globalMetrics?.totalRoundsStarted ?? analytics.roundsPlayed;
                    const completed =
                      globalMetrics?.totalRoundsCompleted ?? analytics.roundsCompleted;
                    const paywall = globalMetrics?.totalPaywallViews ?? analytics.paywallViews;
                    const pwa = globalMetrics?.totalPwaInstalls ?? 0;

                    return (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-2xl bg-black/40 p-2.5 border border-blue-500/30">
                          <span className="font-display text-xl text-blue-400 block">
                            {started}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                            Iniciadas
                          </span>
                        </div>
                        <div className="rounded-2xl bg-black/40 p-2.5 border border-emerald-500/30">
                          <span className="font-display text-xl text-emerald-400 block">
                            {completed}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                            Completadas
                          </span>
                        </div>
                        <div className="rounded-2xl bg-black/40 p-2.5 border border-amber-500/30">
                          <span className="font-display text-xl text-amber-400 block">
                            {paywall}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                            Clics PRO
                          </span>
                        </div>
                        <div className="rounded-2xl bg-black/40 p-2.5 border border-purple-500/30">
                          <span className="font-display text-xl text-purple-400 block">{pwa}</span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                            PWA Installs
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Desglose de Dispositivos */}
                  {(() => {
                    const android = globalMetrics?.deviceCounts.android ?? 0;
                    const ios = globalMetrics?.deviceCounts.ios ?? 0;
                    const desktop = globalMetrics?.deviceCounts.desktop ?? 0;
                    const totalDev = android + ios + desktop;
                    const pAndroid = totalDev > 0 ? Math.round((android / totalDev) * 100) : 0;
                    const pIos = totalDev > 0 ? Math.round((ios / totalDev) * 100) : 0;
                    const pDesktop = totalDev > 0 ? Math.round((desktop / totalDev) * 100) : 0;

                    return (
                      <div className="rounded-2xl bg-black/30 p-3 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Smartphone size={12} className="text-emerald-400" /> Dispositivos de la
                          Comunidad
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2">
                            <span className="text-xs font-bold text-emerald-300 block">
                              🤖 {android} ({pAndroid}%)
                            </span>
                            <span className="text-[9px] text-muted-foreground">Android</span>
                          </div>
                          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2">
                            <span className="text-xs font-bold text-blue-300 block">
                              🍏 {ios} ({pIos}%)
                            </span>
                            <span className="text-[9px] text-muted-foreground">iPhone / iOS</span>
                          </div>
                          <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-2">
                            <span className="text-xs font-bold text-purple-300 block">
                              💻 {desktop} ({pDesktop}%)
                            </span>
                            <span className="text-[9px] text-muted-foreground">PC / Web</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Categorías más jugadas a nivel global */}
                  {(() => {
                    const catCounts =
                      globalMetrics && Object.keys(globalMetrics.categoryCounts).length > 0
                        ? globalMetrics.categoryCounts
                        : analytics.categoryCounts;

                    if (Object.keys(catCounts).length === 0) return null;

                    return (
                      <div className="rounded-2xl bg-black/30 p-3 border border-white/10 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <BarChart3 size={12} className="text-amber-400" /> Categorías más jugadas
                          (Global)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(catCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([cat, count]) => (
                              <span
                                key={cat}
                                className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-foreground flex items-center gap-1"
                              >
                                {CATEGORY_ICONS[cat] ?? "✨"} {cat}:{" "}
                                <strong className="text-amber-300">{count}</strong>
                              </span>
                            ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actividad en vivo reciente */}
                  {globalMetrics?.recentEvents && globalMetrics.recentEvents.length > 0 && (
                    <div className="rounded-2xl bg-black/30 p-3 border border-white/10 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Activity size={12} className="text-blue-400" /> Registro de Actividad
                        Reciente
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {globalMetrics.recentEvents.slice(0, 4).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between text-[11px] bg-white/5 rounded-lg px-2.5 py-1"
                          >
                            <span className="text-foreground truncate max-w-[190px]">
                              {ev.summary}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                              {ev.device}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alertas en Discord #metricas-imposter */}
                  <div className="rounded-2xl bg-black/40 p-3.5 border border-blue-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                        <Bell size={13} className="text-blue-400" /> Radar en Vivo
                        (#metricas-imposter)
                      </span>
                      {discordConnected && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300 flex items-center gap-1">
                          <Check size={9} /> Conectado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Recibe avisos automáticos en tu canal <strong>#metricas-imposter</strong> cada
                      vez que alguien inicie o termine una partida presencial o descargue la PWA.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={discordWebhookInput}
                        onChange={(e) => setDiscordWebhookInput(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAndTestDiscord}
                        className="rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white transition cursor-pointer shrink-0"
                      >
                        Probar
                      </button>
                    </div>
                    {discordFeedback && (
                      <p
                        className={`text-[11px] font-semibold ${
                          discordFeedback.includes("Error") ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {discordFeedback}
                      </p>
                    )}
                  </div>

                  {/* Simular Usuario Gratis */}
                  <div className="rounded-2xl bg-black/40 p-3.5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Simular Usuario Gratis (Test Paywall)
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ceoSimulateFree
                          ? "Activado: Ves los candados PRO tal como un usuario gratuito."
                          : "Desactivado: Tienes todas las funciones PRO desbloqueadas."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playPop(soundEnabled);
                        const nextSim = !ceoSimulateFree;
                        setCeoSimulateFree(nextSim);
                        if (nextSim) {
                          if (
                            PRO_CATEGORIES.includes(category) ||
                            category === ADULT_CATEGORY ||
                            category in custom
                          ) {
                            setCategory("Aleatoria");
                          }
                          if (names.length > FREE_MAX_PLAYERS) {
                            updateNames(names.slice(0, FREE_MAX_PLAYERS));
                          }
                          setRandomEventsEnabled(false);
                          setJesterEnabled(false);
                        }
                      }}
                      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        ceoSimulateFree ? "bg-amber-400" : "bg-white/20"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          ceoSimulateFree ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Acciones de Ajustes y Salida */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={resetAnalytics}
                      className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2.5 text-xs font-semibold text-foreground transition cursor-pointer"
                    >
                      Limpiar Analíticas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deactivateProAndCeo();
                        setShowCeoModal(false);
                      }}
                      className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 px-3.5 py-2.5 text-xs font-semibold text-rose-300 border border-rose-500/30 transition cursor-pointer"
                    >
                      Salir Modo CEO y PRO
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PARTY PASS PRO & ACCESO CEO */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-3xl glass-panel border-2 border-amber-400/50 shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden">
            {/* Header VIP / Checkout */}
            <div className="relative bg-gradient-to-br from-amber-500/25 via-yellow-500/10 to-transparent px-5 pt-5 pb-4 border-b border-white/10 text-center">
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowProModal(false);
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
                      Hemos notificado al CEO a través de Discord. En cuanto confirme los fondos en
                      su cuenta, tu Party Pass PRO se desbloqueará solo en esta pantalla. ¡No
                      cierres el juego!
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
                      {(
                        PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend
                      ).priceUsd.toFixed(2)}
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
                        {(
                          PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend
                        ).priceUsd.toFixed(2)}
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
                              (PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend)
                                .priceUsd * (paymentConfig.pagoMovil.tasaBs || 55),
                            ).toLocaleString("es-VE")}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyPayField(
                            `Pago Móvil Imposter:\nBanco: ${paymentConfig.pagoMovil.banco}\nTeléfono: ${paymentConfig.pagoMovil.telefono}\nCédula: ${paymentConfig.pagoMovil.cedula}\nTitular: ${paymentConfig.pagoMovil.titular}\nMonto: Bs. ${Math.round(
                              (PARTY_PASS_PLANS[selectedPlan] || PARTY_PASS_PLANS.weekend)
                                .priceUsd * (paymentConfig.pagoMovil.tasaBs || 55),
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
                          Ingresa tu nombre y la referencia bancaria tras transferir. Tu Party Pass
                          PRO se activará automáticamente sin esperar mensajes.
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
                          <p className="text-[10px] text-rose-400 font-semibold">
                            {payProofFeedback}
                          </p>
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
                          <p className="text-[10px] text-rose-400 font-semibold">
                            {payProofFeedback}
                          </p>
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
      )}

      {/* MODAL: COMPARTIR JUEGO Y CÓDIGO QR */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl glass-panel p-6 border border-white/15 shadow-2xl text-center">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-primary" />
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  INVITAR AMIGOS
                </h3>
              </div>
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowShareModal(false);
                }}
                aria-label="Cerrar modal de compartir"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Escanea el código QR para abrir <strong>Imposter</strong> en otro teléfono al
              instante:
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
                onClick={async () => {
                  playPop(soundEnabled);
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2500);
                  } catch {
                    /* ignore */
                  }
                }}
                className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition cursor-pointer"
              >
                <Copy size={12} />
                <span>{shareCopied ? "¡Copiado!" : "Copiar"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareGame}
              className={`${btnPrimary} w-full py-3 text-sm flex items-center justify-center gap-2`}
            >
              <Share2 size={16} /> Compartir enlace con amigos
            </button>

            <button
              type="button"
              onClick={() => {
                setShowShareModal(false);
                handleInstallPwa();
              }}
              className="w-full rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 py-2.5 text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Smartphone size={14} className="text-primary" />
              <span>¿Cómo instalar la app en el teléfono?</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: INSTALACIÓN PWA (ANDROID & IPHONE NATIVO) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] w-full max-w-sm flex-col rounded-3xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-5 pt-5 pb-4 border-b border-white/10 text-center">
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowInstallModal(false);
                }}
                aria-label="Cerrar ventana de instalación"
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-black shadow-lg">
                <Smartphone size={24} />
              </div>
              <h3 className="font-display text-xl tracking-wider text-foreground">
                INSTALAR IMPOSTER
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Juega a pantalla completa sin barras de navegación
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isStandalone ? (
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-center space-y-2">
                  <span className="text-2xl">🎉</span>
                  <h4 className="font-display text-base text-emerald-400">¡App Ya Instalada!</h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Ya estás disfrutando de <strong>Imposter</strong> como una aplicación nativa
                    desde tu pantalla de inicio.
                  </p>
                </div>
              ) : isIos ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3 text-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      🍎 Guía para iPhone & iPad (Safari)
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
                        En la barra inferior de Safari, pulsa el icono de compartir (cuadrado con
                        flecha hacia arriba).
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
                        <span className="inline-flex items-center justify-center rounded bg-white/15 px-1.5 py-0.5 text-primary text-xs font-bold">
                          ➕
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
                      ✨ ¡Listo! Se creará el icono de Imposter en tu pantalla de inicio para jugar
                      al instante.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {canInstallPwa ? (
                    <div className="space-y-3 text-center">
                      <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3.5">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          🤖 Android & Navegadores Web
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
                            setShowInstallModal(false);
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
                          🤖 Android (Chrome / Firefox / Edge)
                        </span>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-display text-xs font-bold">
                          1
                        </div>
                        <div className="text-left text-xs">
                          <p className="font-semibold text-foreground">
                            Abre el menú de opciones (⋮)
                          </p>
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
                          <p className="font-semibold text-foreground">
                            Instalar o Añadir a inicio
                          </p>
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
                  setShowInstallModal(false);
                }}
                className={`${btnGhost} w-full py-2.5 text-xs`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSTALACIÓN PWA (ANDROID & IPHONE NATIVO) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] w-full max-w-sm flex-col rounded-3xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-5 pt-5 pb-4 border-b border-white/10 text-center">
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowInstallModal(false);
                }}
                aria-label="Cerrar ventana de instalación"
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-black shadow-lg">
                <Smartphone size={24} />
              </div>
              <h3 className="font-display text-xl tracking-wider text-foreground">
                INSTALAR IMPOSTER
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Juega a pantalla completa sin barras de navegación
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isStandalone ? (
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-center space-y-2">
                  <span className="text-2xl">🎉</span>
                  <h4 className="font-display text-base text-emerald-400">¡App Ya Instalada!</h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Ya estás disfrutando de <strong>Imposter</strong> como una aplicación nativa
                    desde tu pantalla de inicio.
                  </p>
                </div>
              ) : isIos ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3 text-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      🍎 Guía para iPhone & iPad (Safari)
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
                        En la barra inferior de Safari, pulsa el icono de compartir (cuadrado con
                        flecha hacia arriba).
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
                        <span className="inline-flex items-center justify-center rounded bg-white/15 px-1.5 py-0.5 text-primary text-xs font-bold">
                          ➕
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
                      ✨ ¡Listo! Se creará el icono de Imposter en tu pantalla de inicio para jugar
                      al instante.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {canInstallPwa ? (
                    <div className="space-y-3 text-center">
                      <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3.5">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          🤖 Android & Navegadores Web
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
                            setShowInstallModal(false);
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
                          🤖 Android (Chrome / Firefox / Edge)
                        </span>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-display text-xs font-bold">
                          1
                        </div>
                        <div className="text-left text-xs">
                          <p className="font-semibold text-foreground">
                            Abre el menú de opciones (⋮)
                          </p>
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
                          <p className="font-semibold text-foreground">
                            Instalar o Añadir a inicio
                          </p>
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
                  setShowInstallModal(false);
                }}
                className={`${btnGhost} w-full py-2.5 text-xs`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TECLADO PIN PARA SECCIÓN +18 */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex w-full max-w-xs flex-col gap-4 rounded-3xl glass-panel p-6 border border-rose-500/40 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <KeyRound size={28} />
            </div>

            <div>
              <h3 className="font-display text-2xl text-rose-400 tracking-wide">
                {pinModalMode === "change" ? "NUEVO PIN +18" : "CONTROL PARENTAL"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {pinModalMode === "change" ? (
                  <>
                    Ingresa un nuevo código de 4 dígitos para proteger la sección{" "}
                    <strong>+18 Adultos</strong>
                  </>
                ) : (
                  <>
                    Ingresa el PIN de 4 dígitos para desbloquear la sección{" "}
                    <strong>+18 Adultos</strong>
                  </>
                )}
              </p>
            </div>

            {/* PIN Indicators */}
            <div
              className={`flex items-center justify-center gap-3 my-2 ${pinError ? "animate-shake text-destructive" : ""}`}
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = enteredPin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`h-4 w-4 rounded-full border transition-all duration-200 ${
                      filled
                        ? "bg-rose-500 border-rose-400 scale-110 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                        : "border-white/20 bg-white/5"
                    }`}
                  />
                );
              })}
            </div>

            {Date.now() < pinLockoutUntil ? (
              <p className="text-xs font-semibold text-rose-400 animate-pulse">
                🛡️ Bloqueo de seguridad: Demasiados intentos fallidos. Espera 60 segundos.
              </p>
            ) : pinError ? (
              <p className="text-xs font-semibold text-destructive animate-pulse">
                PIN incorrecto ({pinFailedAttempts}/5 intentos).
              </p>
            ) : null}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 my-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinInput(num)}
                  className="flex h-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 font-display text-xl text-white border border-white/15 transition cursor-pointer shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => {
                  playPop(soundEnabled);
                  setShowPinModal(false);
                  setEnteredPin("");
                  setShowPinHint(false);
                }}
                className="flex h-12 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 text-xs text-muted-foreground border border-white/10 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePinInput("0")}
                className="flex h-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 font-display text-xl text-white border border-white/15 transition cursor-pointer shadow-sm"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                className="flex h-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-muted-foreground hover:text-white border border-white/15 transition cursor-pointer shadow-sm"
              >
                <Delete size={18} />
              </button>
            </div>

            {pinModalMode === "unlock" && (
              <button
                type="button"
                onPointerDown={() => setShowPinHint(true)}
                onPointerUp={() => setShowPinHint(false)}
                onPointerLeave={() => setShowPinHint(false)}
                onPointerCancel={() => setShowPinHint(false)}
                className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition select-none touch-none cursor-pointer"
              >
                {showPinHint ? (
                  <span>
                    PIN actual: <strong className="text-rose-400 font-mono">{adultPin}</strong>
                  </span>
                ) : (
                  "Mantén presionado aquí si olvidaste el PIN"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* PHASE 2: REVEAL (ESCANER BIOMETRICO CON HOLD-TO-REVEAL) */}
      {phase === "reveal" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Segmented Stories Progress Bar */}
          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex w-full gap-1.5">
              {names.map((_, idx) => {
                const isDone = idx < turn;
                const isCurrent = idx === turn;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-primary"
                        : isCurrent
                          ? "bg-primary shadow-[0_0_10px_rgba(234,179,8,0.9)] animate-pulse"
                          : "bg-white/15"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Turno {turn + 1} de {names.length}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Pasa el dispositivo a
            </p>
            <div className="flex items-center justify-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                  getPlayerBadge(turn).bg
                } ${getPlayerBadge(turn).text} border ${getPlayerBadge(turn).border}`}
              >
                {getPlayerInitial(turn)}
              </div>
              <h2 className="font-display text-4xl text-primary">{getPlayerName(turn)}</h2>
            </div>
          </div>

          {/* Biometric Laser Scanner Card */}
          <div
            onPointerDown={handleStartHold}
            onPointerUp={handleEndHold}
            onPointerLeave={handleEndHold}
            onPointerCancel={handleEndHold}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative flex aspect-square w-full max-w-xs cursor-pointer select-none touch-none flex-col items-center justify-center overflow-hidden rounded-3xl p-6 transition-all duration-300 border-2 ${
              isHolding
                ? impostors.includes(turn)
                  ? "bg-destructive/95 text-destructive-foreground border-destructive glow-danger scale-[1.03]"
                  : turn === jesterIndex
                    ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_35px_rgba(147,51,234,0.7)] scale-[1.03]"
                    : "bg-primary text-primary-foreground border-primary glow-primary scale-[1.03]"
                : "glass-panel border-white/15 hover:border-primary/50 active:scale-95 shadow-2xl"
            }`}
          >
            {/* Animated Laser Sweep */}
            {isHolding && (
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_#fff] animate-laser" />
            )}

            {!isHolding ? (
              <div className="relative flex flex-col items-center gap-3">
                {/* Concentric radar rings & biometric target */}
                <div className="relative flex h-28 w-28 items-center justify-center">
                  {/* Outer pulsating sonar aura */}
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-glow" />
                  {/* Subtle ping pulse */}
                  <div className="absolute -inset-1 rounded-full border border-primary/20 animate-ping opacity-25" />
                  {/* Rotating dashed tactical reticle */}
                  <div className="absolute inset-1 rounded-full border border-dashed border-primary/35 animate-spin [animation-duration:12s]" />
                  {/* Inner glowing ring */}
                  <div className="absolute inset-3 rounded-full border border-primary/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
                  <Fingerprint
                    size={58}
                    className="relative z-10 text-primary transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="font-display tracking-wider text-base text-foreground">
                  ESCANEAR IDENTIDAD
                </span>
                <span className="text-xs text-muted-foreground px-4 text-center leading-relaxed">
                  Sostén tu dedo sobre el sensor para decodificar tu rol en secreto. Al soltar se
                  bloqueará.
                </span>
              </div>
            ) : impostors.includes(turn) ? (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in-90 duration-150">
                <ShieldAlert size={52} className="text-destructive-foreground animate-bounce" />
                <span className="font-display text-4xl tracking-widest">¡IMPOSTOR!</span>
                {impostors.length > 1 && accompliceMode && (
                  <div className="rounded-xl bg-black/35 px-3.5 py-1.5 text-xs border border-white/10 backdrop-blur-md">
                    <span className="opacity-90">
                      {impostors.length === 2 ? "Tu cómplice:" : "Tus cómplices:"}{" "}
                    </span>
                    <strong className="underline underline-offset-2">
                      {impostors
                        .filter((idx) => idx !== turn)
                        .map((idx) => getPlayerName(idx))
                        .join(", ")}
                    </strong>
                  </div>
                )}
                {impostors.length > 1 && !accompliceMode && (
                  <div className="rounded-xl bg-black/35 px-3.5 py-1.5 text-xs border border-white/10 backdrop-blur-md">
                    <span className="opacity-90">
                      Modo Caos: Hay {impostors.length - 1} cómplice(s) oculto(s)
                    </span>
                  </div>
                )}
                <p className="mt-1 text-xs opacity-90">¡La categoría es secreta!</p>
                <span className="text-[11px] opacity-80 mt-1">
                  ¡Engaña a los demás y no te delates!
                </span>
              </div>
            ) : turn === jesterIndex ? (
              <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-90 duration-150">
                <span className="text-4xl animate-bounce">🃏</span>
                <span className="font-display text-3xl tracking-wider">¡ERES EL BUFÓN!</span>
                <span className="text-xs uppercase tracking-widest opacity-85 font-bold">
                  Palabra: {word}
                </span>
                <div className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold border border-white/15">
                  Categoría: {playedCategory}
                </div>
                <p className="mt-1.5 text-[11px] opacity-95 px-2 leading-snug">
                  ¡Actúa sospechoso a propósito! Si logras que el grupo vote por ti, ganas tú solo.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-90 duration-150">
                <Sparkles size={40} className="text-primary-foreground animate-pulse" />
                <span className="text-xs uppercase tracking-widest opacity-80 font-bold">
                  Tu palabra secreta
                </span>
                <span className="font-display text-3xl font-extrabold my-2 tracking-wide drop-shadow-md">
                  {word}
                </span>
                <div className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-white/10">
                  Categoría: {playedCategory}
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              disabled={!hasSeenRole}
              onClick={nextTurn}
              className={`${btnPrimary} w-full py-3.5`}
            >
              {turn + 1 >= names.length ? "Comenzar debate" : "Ocultar y pasar al siguiente"}
            </button>

            {!hasSeenRole && (
              <p className="text-[11px] text-muted-foreground">
                Debes escanear tu rol sosteniendo el sensor antes de continuar.
              </p>
            )}
          </div>
        </section>
      )}

      {/* PHASE 3: DISCUSS (RELOJ RADIAL DE TENSION) */}
      {phase === "discuss" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Radial SVG Timer */}
          {(() => {
            const totalSeconds = minutes * 60;
            const progress = Math.max(0, timeLeft / totalSeconds);
            const radius = 80;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);

            const isUrgent = timeLeft <= 10;
            const isWarning = timeLeft <= 30 && !isUrgent;

            return (
              <div
                className={`relative flex items-center justify-center my-2 ${isUrgent ? "animate-heartbeat" : ""}`}
              >
                <svg className="h-52 w-52 -rotate-90 transform" viewBox="0 0 180 180">
                  {/* Background Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    className="stroke-muted/30"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress Ring */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    className={`transition-all duration-1000 ease-linear ${
                      isUrgent
                        ? "stroke-destructive drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                        : isWarning
                          ? "stroke-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                          : "stroke-accent drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    }`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Countdown Display */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    {isUrgent ? "¡ÚLTIMOS SEGUNDOS!" : "DEBATE ACTIVO"}
                  </p>
                  <span
                    className={`font-display text-5xl tabular-nums tracking-tight ${
                      isUrgent
                        ? "text-destructive"
                        : isWarning
                          ? "text-amber-400"
                          : "text-foreground"
                    }`}
                  >
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {paused ? "⏸ PAUSADO" : "En curso"}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Wake Lock Active Badge */}
          {isWakeLockActiveState && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <Sun size={12} className="text-emerald-400 animate-spin" />
              <span>Pantalla siempre activa</span>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              className={`${btnGhost} text-sm px-4`}
              onClick={() => {
                playPop(soundEnabled);
                setPaused(!paused);
              }}
            >
              {paused ? "Reanudar" : "Pausar"}
            </button>
            <button
              className={`${btnGhost} text-sm px-4`}
              onClick={() => {
                playPop(soundEnabled);
                setTimeLeft((s) => s + 30);
              }}
            >
              +30s
            </button>
          </div>

          {/* Active Lightning Event Banner */}
          {activeEvent && (
            <div className="w-full max-w-xs rounded-2xl bg-accent/15 border border-accent/40 p-3.5 text-left shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                <span className="text-base">{activeEvent.icon}</span>
                <span>Evento Relámpago: {activeEvent.title}</span>
              </div>
              <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                {activeEvent.description}
              </p>
            </div>
          )}

          {/* Starter Player Badge */}
          <div className="glass-panel rounded-2xl p-4 max-w-xs text-sm border border-white/10 shadow-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Inicia la ronda de pistas
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs ${
                  getPlayerBadge(starter).bg
                } ${getPlayerBadge(starter).text} border ${getPlayerBadge(starter).border}`}
              >
                {getPlayerInitial(starter)}
              </div>
              <strong className="text-primary text-base font-semibold">
                {getPlayerName(starter)}
              </strong>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Cada jugador dice una sola palabra relacionada con el concepto sin delatarse.
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-2">
            <button
              className={`${btnPrimary} w-full py-3.5`}
              onClick={() => {
                playPop(soundEnabled);
                setPhase("vote");
              }}
            >
              Ir a Votación
            </button>
            <button className={`${btnGhost} text-xs py-2`} onClick={handleDirectReveal}>
              Saltar votación y revelar directamente
            </button>
          </div>
        </section>
      )}

      {/* PHASE 4: VOTE (FICHAS DE SOSPECHOSO) */}
      {phase === "vote" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wide">
              ¿QUIÉN ES EL SOSPECHOSO?
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {impostors.length > 1
                ? `Impostores atrapados: ${caughtImpostors.length} de ${impostors.length}. ¡Elige al siguiente sospechoso!`
                : "El grupo debe deliberar y seleccionar a quién acusar"}
            </p>
          </div>

          {/* Suspect Dossier Cards */}
          <div className="grid w-full max-w-xs grid-cols-2 gap-3">
            {names.map((_, i) => {
              const isCaught = caughtImpostors.includes(i);
              const isSelected = accusedIndex === i;
              const badge = getPlayerBadge(i);
              return (
                <button
                  key={i}
                  disabled={isCaught}
                  onClick={() => {
                    playPop(soundEnabled);
                    setAccusedIndex(i);
                  }}
                  className={`relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-200 border ${
                    isCaught
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 opacity-70 cursor-not-allowed"
                      : isSelected
                        ? "border-destructive bg-destructive/20 text-destructive ring-2 ring-destructive shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-[1.02] cursor-pointer active:scale-95"
                        : "glass-panel text-foreground hover:border-white/20 hover:bg-white/10 cursor-pointer active:scale-95"
                  }`}
                >
                  {isSelected && !isCaught && (
                    <div className="absolute top-2 right-2 flex items-center justify-center text-destructive animate-pulse">
                      <Target size={18} />
                    </div>
                  )}
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-sm mb-2 ${badge.bg} ${badge.text} border ${badge.border}`}
                  >
                    {getPlayerInitial(i)}
                  </div>
                  <span className="font-semibold text-sm truncate max-w-[110px]">
                    {getPlayerName(i)}
                  </span>
                  <span
                    className={`text-[10px] mt-1 uppercase tracking-wider font-bold ${
                      isCaught
                        ? "text-emerald-400"
                        : isSelected
                          ? "text-destructive"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {isCaught ? "Impostor Atrapado" : isSelected ? "Acusado" : "Sospechoso"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full max-w-xs space-y-2">
            <button
              disabled={accusedIndex === null}
              onClick={() => accusedIndex !== null && handleVoteConfirmation(accusedIndex)}
              className={`${btnDanger} w-full py-3.5`}
            >
              Acusar a {accusedIndex !== null ? getPlayerName(accusedIndex) : "..."}
            </button>
            <button className={`${btnGhost} w-full text-xs py-2`} onClick={handleDirectReveal}>
              Saltar votación (Revelar todos los roles)
            </button>
          </div>
        </section>
      )}

      {/* MODAL: IMPRESIÓN / ADIVINANZA DEL IMPOSTOR */}
      {showImpostorGuessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl glass-panel p-6 border border-destructive/40 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 text-destructive border border-destructive/30 animate-pulse">
              <ShieldAlert size={32} />
            </div>

            <div>
              <h3 className="font-display text-2xl text-destructive">¡Impostor Descubierto!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>
                  {accusedIndex !== null ? getPlayerName(accusedIndex) : "El sospechoso"}
                </strong>{" "}
                era efectivamente {impostors.length > 1 ? "uno de los impostores" : "el impostor"}.
              </p>
            </div>

            <div className="rounded-xl bg-background/60 p-3.5 text-xs text-muted-foreground border border-white/5">
              <p className="font-semibold text-foreground mb-1">Última oportunidad del impostor:</p>
              ¿Puede el impostor adivinar exactamente la palabra secreta de la ronda?
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => handleImpostorGuessResult(true)}
                className={`${btnPrimary} flex-1 text-xs py-3 flex items-center justify-center gap-1.5`}
              >
                <Check size={16} /> Adivinó la palabra
              </button>
              <button
                onClick={() => handleImpostorGuessResult(false)}
                className={`${btnDanger} flex-1 text-xs py-3 flex items-center justify-center gap-1.5`}
              >
                <X size={16} /> No la supo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 5: RESULT */}
      {phase === "result" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <ConfettiCanvas winner={roundWinner} />
          {/* Winner Banner with Celebration / Siren Effects */}
          {roundWinner ? (
            <div
              className={`relative overflow-hidden rounded-2xl p-5 w-full max-w-xs border shadow-xl ${
                roundWinner === "innocents"
                  ? "bg-primary/15 border-primary text-primary glow-primary"
                  : roundWinner === "jester"
                    ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                    : "bg-destructive/20 border-destructive text-destructive glow-danger"
              }`}
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                {roundWinner === "innocents" ? (
                  <>
                    <Sparkles size={20} className="text-primary animate-bounce" />
                    <Trophy
                      size={26}
                      className="text-primary drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                    />
                    <Sparkles size={20} className="text-primary animate-bounce" />
                  </>
                ) : roundWinner === "jester" ? (
                  <span className="text-3xl animate-bounce">🃏</span>
                ) : (
                  <ShieldAlert size={28} className="text-destructive animate-pulse" />
                )}
              </div>
              <h2 className="font-display text-2xl tracking-wide">
                {roundWinner === "innocents"
                  ? "¡VICTORIA INOCENTE!"
                  : roundWinner === "jester"
                    ? "¡VICTORIA DEL BUFÓN!"
                    : "¡VICTORIA IMPOSTOR!"}
              </h2>
              <p className="text-xs text-foreground/90 mt-1.5 leading-relaxed">{winReason}</p>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl text-foreground tracking-wide">
                Fin de la Ronda
              </h2>
            </div>
          )}

          {/* Impostores Revelados */}
          <div className="w-full max-w-xs rounded-2xl bg-destructive p-5 text-destructive-foreground glow-danger shadow-xl">
            <span className="text-xs uppercase tracking-widest opacity-80 font-bold">
              {impostors.length > 1 ? "Los impostores eran" : "El impostor era"}
            </span>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {impostors.map((i) => {
                const badge = getPlayerBadge(i);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-1.5 border border-white/10"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded font-bold text-xs ${badge.bg} ${badge.text}`}
                    >
                      {getPlayerInitial(i)}
                    </div>
                    <span className="font-display text-xl">{getPlayerName(i)}</span>
                  </div>
                );
              })}
            </div>
            {jesterIndex !== null && (
              <div className="mt-3 pt-2.5 border-t border-white/15 text-xs">
                <span className="opacity-85">🃏 El Bufón era: </span>
                <strong className="font-display tracking-wide">{getPlayerName(jesterIndex)}</strong>
              </div>
            )}
          </div>

          {/* Palabra Secreta */}
          <div className="w-full max-w-xs rounded-2xl glass-panel p-4 shadow-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              La palabra secreta era
            </p>
            <p className="font-display text-3xl text-primary my-1 drop-shadow-md">{word}</p>
            <p className="text-xs text-muted-foreground">
              Categoría: <span className="font-semibold text-foreground">{playedCategory}</span>
            </p>
          </div>

          {/* Marcador Actual */}
          <div className="flex items-center justify-around w-full max-w-xs rounded-2xl glass-panel p-3.5 shadow-xl text-sm">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Inocentes</span>
              <span className="font-display text-2xl text-primary">{scores.innocents}</span>
            </div>
            <span className="text-muted-foreground/60 text-lg font-bold">vs</span>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Impostores</span>
              <span className="font-display text-2xl text-destructive">{scores.impostors}</span>
            </div>
          </div>

          {/* Next Actions */}
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            <button className={`${btnPrimary} w-full py-3.5`} onClick={startRound}>
              Otra ronda ({category === "Aleatoria" ? "🎲 Aleatoria" : category})
            </button>
            <div className="flex w-full gap-2.5">
              <button
                className={`${btnGhost} flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5`}
                onClick={() => {
                  playPop(soundEnabled);
                  setSetupStep(2);
                  setPhase("setup");
                }}
              >
                <LayoutGrid size={14} /> Cambiar Categoría
              </button>
              <button
                className={`${btnGhost} flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5`}
                onClick={() => {
                  playPop(soundEnabled);
                  setSetupStep(1);
                  setPhase("setup");
                }}
              >
                <User size={14} /> Jugadores
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Cinematic Suspense Blackout Overlay */}
      {isResolvingResult && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <span className="font-display text-2xl tracking-widest text-primary drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">
              VEREDICTO FINAL
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
