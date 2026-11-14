/**
 * Atlas — Copiloto y Bot Oficial de Imposter para Discord
 *
 * Desarrollado en co-creación con TIRLEM.
 * Motor de IA Híbrido:
 * - Google Gemini (gemini-flash-lite-latest / gemini-flash-latest)
 * - Groq Cloud (LLaMA 3.3 70B Versatile / LLaMA 3.1 8B Instant) [Opcional de alta velocidad]
 * - OpenRouter (Modelos gratuitos: LLaMA 3.3, DeepSeek) [Opcional]
 */

import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// Cargar variables de entorno manualmente como fallback si no se usó --env-file
function loadEnvFallback() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || "").trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFallback();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

if (!DISCORD_BOT_TOKEN) {
  console.error("❌ ERROR: No se encontró DISCORD_BOT_TOKEN en el archivo .env.");
  process.exit(1);
}

const SYSTEM_PROMPT = `
Eres Atlas, el copiloto de desarrollo y asesor estratégico ejecutivo de "Imposter" (el juego web/PWA de fiesta y engaño social).
Trabajas directamente bajo el liderazgo del equipo fundador y ejecutivo de Imposter:
- TIRLEM: Creador y CEO de Imposter.
- LISVE: Co-CEO y Directora de Marketing de Imposter.

PROTOCOLO DE RESPETO, JERARQUÍA Y AUTORIDAD EJECUTIVA (OBLIGATORIO):
1. RECONOCIMIENTO DE AUTORIDAD Y TRATO EJECUTIVO:
   - Tirlem y Lisve son los FUNDADORES Y CEOS. Tú eres su ASESOR Y COPILOTO, NO su jefe, ni su juez, ni su maestro.
   - JAMÁS los trates como empleados, subordinados o aprendices a los que debas regañar o dar lecciones.
   - ESTÁ ESTRICTAMENTE PROHIBIDO usar tono paternalista, condescendiente o de reprimenda.
     * NUNCA uses frases sermoneadoras como: "entiendo la tentación", "con la cabeza fría antes de gastar cartuchos", "te van a banear", "nadie entra a enlaces sospechosos", ni hables como si estuvieras corrigiendo a un subordinado.
   - Trátalos SIEMPRE con el máximo respeto ejecutivo, cortesía profesional y actitud constructiva de servicio ("A la orden, Lisve / Tirlem", "Excelente iniciativa", "Me parece una buena idea para probar rápido", "Para ejecutar esa acción con el mayor impacto y proteger las cuentas, sugiero esta táctica...").

2. CÓMO RESPONDER A SUS INICIATIVAS:
   - Cuando el CEO o la Co-CEO propongan una idea táctica (ejemplo: comentar en TikTok, hablar con alguien o probar una dinámica):
     a) Primero: Valida su entusiasmo y velocidad con respeto ("Gran iniciativa para movernos rápido, Lisve / Tirlem").
     b) Segundo: Como su asesor, en vez de decirles que "no lo hagan", proponles la MEJOR FORMA PRÁCTICA de ejecutar su idea para maximizar el resultado y evitar bloqueos de algoritmos (por ejemplo, dándoles 3 ejemplos de comentarios listos, cómo llevar el tráfico al perfil o bio de forma natural, etc.).
     c) Tercero: Entrega respuestas directamente aplicables, con textos, copys o ideas completas listas para copiar y pegar.

3. RESPUESTAS COMPLETAS Y FLUIDAS (NUNCA CORTADAS):
   - Cada mensaje debe estar 100% completo, con todas sus ideas, listas y oraciones terminadas hasta el punto final. Jamás dejes una respuesta a medias o una frase cortada.
   - Mantén tus intervenciones estructuradas, visualmente limpias y directamente accionables.
   - CERO VENTA DE HUMO: Hablas siempre desde datos y realidades tangibles, sin inventar ventas ni métricas falsas.

4. REALIDAD ACTUAL DEL PROYECTO (FASE DE VALIDACIÓN BETA):
   - El juego a nivel técnico (código, PWA, frontend, salas, temporizadores y roles) ya está construido y probado.
   - La arquitectura de monetización Party Pass ($0.99 24h, $1.99 Fin de Semana, $3.99 Mensual, $9.80 Vitalicio) con Pago Móvil, Binance Pay y tarjeta se acaba de implementar en el código.
   - FASE REAL: Día Cero de Validación. No hay ventas masivas ni tráfico masivo todavía. El foco actual es:
     * Conseguir que grupos reales de amigos jueguen las primeras partidas de prueba en reuniones o fiestas.
     * Observar si los jugadores entienden la dinámica a la primera sin que nadie se la explique.
     * Probar el flujo de compra y aprobación en teléfonos reales para detectar cualquier fricción.
     * Usar los 10 cupones de prueba para recoger feedback honesto y directo.
   - Si los fundadores te consultan sobre el negocio o el lanzamiento, evalúa hipótesis reales, sugiere experimentos concretos y pregúntales por los resultados tangibles de las pruebas.

5. REGLAS Y CONOCIMIENTO TÉCNICO DE IMPOSTER:
   - Se juega en grupo presencial pasando un único teléfono móvil de mano en mano.
   - Cada jugador sostiene el sensor biométrico táctil en pantalla para ver su rol en secreto.
   - Inocentes: Ven la palabra secreta de la categoría seleccionada (ej. Comida -> Pizza).
   - Impostores: No ven la palabra secreta (ven "ERES EL IMPOSTOR") y deben fingir que la conocen durante la ronda de pistas.
   - Ronda de pistas: Cada participante dice 1 palabra o frase corta relacionada con la palabra secreta.
   - Debate y votación: Discusión con cronómetro radial. Votan para expulsar. Si expulsan al impostor, ganan inocentes; si sobrevive o adivina la palabra, gana el impostor.
   - Rol especial "El Bufón": Busca que duden de él para que lo expulsen a propósito. Si lo expulsan, ¡gana la partida en solitario!
   - Modo Picante Fiesta +18: 60 palabras picantes con PIN de 4 dígitos (por defecto 1234).
   - Precios:
     * ⚡ Pase Fiesta (24 Horas): $0.99 USD
     * 🎉 Fin de Semana (72 Horas): $1.99 USD (Más Popular)
     * 🌟 Pase Mensual (30 Días): $3.99 USD
     * 👑 Edición Fundador Vitalicio: $9.80 USD (Acceso de por vida + Rol VIP en Discord)
   - Métodos de pago: Pago Móvil (Venezuela), Binance Pay (USDT) y tarjetas de crédito/débito.

6. COMUNICACIÓN EN DISCORD:
   - Con usuarios en #soporte-o-dudas: Educado, paciente, claro, conciso y resolutivo. Explica reglas o cómo pagar paso a paso sin rodeos.
   - Con miembros en #fundador-vip: Cercano y cordial, reconociendo el apoyo temprano al proyecto.
   - En el canal privado con Tirlem (#despacho-ceo o similar): Modo asesor ejecutivo. Analítico, evaluando pros, contras, riesgos y prioridades con franqueza y respeto.
   - En el canal #estrategia-marketing con Tirlem y Lisve:
     * Reconoces a Lisve como Co-CEO y Directora de Marketing, y a Tirlem como CEO.
     * Actúas como su Copiloto de Marketing: especialista en ganchos (hooks) de 3 segundos para TikTok y Reels, ideas de desafíos de fiesta ("Reto Impostor"), copys persuasivos para WhatsApp e Instagram, campañas para conseguir los primeros 100 Miembros Fundadores ($9.80) y la meta de negocio de financiar el dominio propio "imposterparty.com" con las primeras ventas.
     * Propones experimentos virales prácticos que no requieran presupuesto publicitario, aprovechando las reuniones presenciales.
   - Siempre respondes en español. Emojis moderados, solo cuando aporten claridad o tono amigable, sin saturar.
`;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Historial breve en memoria por canal/usuario para contexto (últimos 8 mensajes)
const conversationMemory = new Map();

// 🔍 Diagnósticos y estado en vivo para Render / Health-Check
let lastMessageReceived = null;
let lastDiscordError = null;
const botInitTime = new Date().toISOString();

// 🛰️ Radar de Métricas en Vivo de Atlas (Eventos en Tiempo Real)
const botLiveMetrics = {
  roundsStarted: 0,
  roundsCompleted: 0,
  pwaInstalls: 0,
  paywallViews: 0,
  categoryCounts: {},
  deviceCounts: { android: 0, ios: 0, desktop: 0 },
  recentEvents: [],
  lastEventTime: null,
};

async function sendMetricsToDiscordChannel(title, description, color, fields = []) {
  if (!client.isReady()) return false;
  try {
    for (const guild of client.guilds.cache.values()) {
      let channel = guild.channels.cache.find(
        (c) =>
          c.isTextBased() &&
          (c.name === "metricas-imposter" ||
            c.name === "métricas-imposter" ||
            c.name.includes("metricas") ||
            c.name.includes("radar")),
      );

      // Si no existe y el bot tiene permisos, lo creamos automáticamente
      if (!channel && guild.members.me?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
        try {
          channel = await guild.channels.create({
            name: "metricas-imposter",
            type: ChannelType.GuildText,
            topic: "Radar de telemetría y métricas en vivo de Imposter 📊",
          });
          logDebug("✨ Canal #metricas-imposter auto-creado con éxito en:", guild.name);
        } catch (e) {
          logDebug("No se pudo auto-crear #metricas-imposter:", e.message);
        }
      }

      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setFooter({ text: "Imposter Radar • Atlas Live Telemetry" })
          .setTimestamp();

        for (const f of fields) {
          embed.addFields({ name: f.name, value: String(f.value), inline: f.inline ?? true });
        }
        await channel.send({ embeds: [embed] });
        return true;
      }
    }
  } catch (err) {
    logDebug("⚠️ Error al publicar en #metricas-imposter:", err.message);
  }
  return false;
}

function getMemoryKey(message) {
  return message.guildId ? `${message.guildId}-${message.channelId}` : `dm-${message.author.id}`;
}

function logDebug(...args) {
  const line = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  console.log(line);
  try {
    fs.appendFileSync(
      path.resolve(process.cwd(), "bot/debug.log"),
      `[${new Date().toISOString()}] ${line}\n`,
    );
  } catch {
    /* ignore */
  }
}

let cachedWorkingGeminiModel = null;

// ==========================================
// 1. DESCUBRIMIENTO DINÁMICO DE MODELOS GEMINI
// ==========================================
async function discoverWorkingGeminiModel() {
  if (cachedWorkingGeminiModel) return cachedWorkingGeminiModel;
  if (!GEMINI_API_KEY) return null;

  logDebug("🔍 Conectando con Google AI para listar modelos disponibles...");

  const versions = ["v1beta", "v1"];
  for (const ver of versions) {
    try {
      const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        headers: { "x-goog-api-key": GEMINI_API_KEY },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => m.name.replace(/^models\//, ""));

        logDebug(
          `[Model Discovery ${ver}] Modelos activos encontrados (${models.length}):`,
          models.slice(0, 15).join(", "),
        );

        // Priorizar modelos Flash Lite y Flash estables (ultra rápidos y con menor tiempo de respuesta)
        const priorityOrder = [
          "gemini-flash-lite-latest",
          "gemini-flash-latest",
          "gemini-2.5-flash-lite",
          "gemini-3.1-flash-lite",
          "gemini-3.5-flash-lite",
          GEMINI_MODEL,
          "gemini-3.8-flash",
          "gemini-pro-latest",
        ];

        let selected = null;
        for (const candidate of priorityOrder) {
          if (models.includes(candidate)) {
            selected = candidate;
            break;
          }
        }

        if (!selected) {
          selected =
            models.find((m) => m.includes("flash") && m.includes("lite")) ||
            models.find((m) => m.includes("flash")) ||
            models[0];
        }

        if (selected) {
          cachedWorkingGeminiModel = { version: ver, model: selected };
          logDebug(`✅ Gemini seleccionado con éxito: ${ver}/models/${selected}`);
          return cachedWorkingGeminiModel;
        }
      } else {
        const errText = await res.text();
        logDebug(`[Model Discovery ${ver} Error ${res.status}]:`, errText.slice(0, 120));
      }
    } catch (e) {
      logDebug(`[Model Discovery ${ver} Exception]:`, e.message);
    }
  }

  const fallback = { version: "v1beta", model: GEMINI_MODEL || "gemini-flash-lite-latest" };
  logDebug(`⚠️ Usando Gemini fallback: ${fallback.version}/models/${fallback.model}`);
  return fallback;
}

// ==========================================
// 2. LLAMADA A GOOGLE GEMINI
// ==========================================
async function callGemini(promptText, history = []) {
  if (!GEMINI_API_KEY) return null;

  const discovery = await discoverWorkingGeminiModel();
  const version = discovery?.version || "v1beta";
  const primaryModel = discovery?.model || "gemini-flash-lite-latest";

  const contents = [
    ...history,
    {
      role: "user",
      parts: [{ text: promptText }],
    },
  ];

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 3000,
    },
  };

  // Modelos candidatos válidos en orden de velocidad (evita 404s antiguos)
  const candidateModels = Array.from(
    new Set([
      primaryModel,
      "gemini-flash-lite-latest",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-3.8-flash",
    ]),
  );

  for (const currentModel of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      logDebug(`⏳ Consultando Gemini (${currentModel}, intento ${attempt})...`);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify(payload),
          // Tiempo de espera ampliado a 35 segundos para evitar abortos prematuros
          signal: AbortSignal.timeout(35000),
        });

        if (res.ok) {
          const data = await res.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            logDebug(
              `✅ Respuesta de Gemini (${currentModel}) recibida (${candidate.length} chars)`,
            );
            return candidate;
          }
        }

        const errText = await res.text();
        logDebug(
          `[Intento ${attempt}] Gemini ${currentModel} Status ${res.status}:`,
          errText.slice(0, 100),
        );

        if (res.status === 503 && attempt === 1) {
          logDebug("⏳ Servidor con alta demanda (503). Esperando 1.5s...");
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        // Si es 404 o 503 persistente, pasar al siguiente modelo
        if (res.status === 404 || res.status === 503) {
          break;
        }
      } catch (err) {
        logDebug(`Error de red con Gemini ${currentModel}:`, err.message);
      }
    }
  }

  return null;
}

// ==========================================
// 3. LLAMADA A GROQ CLOUD (LLaMA 3.3 70B — Ultra Rápido)
// ==========================================
async function callGroq(promptText, history = []) {
  if (!GROQ_API_KEY) return null;

  logDebug(`⚡ Consultando Groq Cloud (${GROQ_MODEL})...`);

  // Transformar historial a formato OpenAI estándar
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: h.role === "model" ? "assistant" : "user",
      content: h.parts?.[0]?.text || "",
    })),
    { role: "user", content: promptText },
  ];

  const modelsToTry = [GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

  for (const model of Array.from(new Set(modelsToTry))) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 3000,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          logDebug(`✅ Respuesta de Groq (${model}) recibida (${text.length} chars)`);
          return text;
        }
      } else {
        const errText = await res.text();
        logDebug(`[Groq Error ${res.status}]:`, errText.slice(0, 120));
      }
    } catch (err) {
      logDebug(`Error de red con Groq (${model}):`, err.message);
    }
  }

  return null;
}

// ==========================================
// 4. LLAMADA A OPENROUTER (Opcional - Modelos Free)
// ==========================================
async function callOpenRouter(promptText, history = []) {
  if (!OPENROUTER_API_KEY) return null;

  logDebug(`🌐 Consultando OpenRouter...`);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: h.role === "model" ? "assistant" : "user",
      content: h.parts?.[0]?.text || "",
    })),
    { role: "user", content: promptText },
  ];

  const candidateModels = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-chat:free",
    "qwen/qwen-2.5-72b-instruct:free",
  ];

  for (const model of candidateModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://imposter-game.local",
          "X-Title": "Imposter Discord Bot",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 3000,
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          logDebug(`✅ Respuesta de OpenRouter (${model}) recibida (${text.length} chars)`);
          return text;
        }
      } else {
        const errText = await res.text();
        logDebug(`[OpenRouter ${model} Status ${res.status}]:`, errText.slice(0, 100));
      }
    } catch (err) {
      logDebug(`Error de red con OpenRouter (${model}):`, err.message);
    }
  }

  return null;
}

// ==========================================
// 5. ENRUTADOR MAESTRO DE IA (Multi-proveedor)
// ==========================================
async function askAI(promptText, history = []) {
  // 1. Google Gemini Flash Lite (Titular #1: ultra rápido, verificado y sin bloqueos locales)
  if (GEMINI_API_KEY) {
    const geminiReply = await callGemini(promptText, history);
    if (geminiReply) return geminiReply;
  }

  // 2. OpenRouter (Respaldo #1: modelos libres de bloqueo LLaMA 3.3 / DeepSeek)
  if (OPENROUTER_API_KEY) {
    const routerReply = await callOpenRouter(promptText, history);
    if (routerReply) return routerReply;
  }

  // 3. Groq Cloud (Respaldo #2: listo para velocidad supersónica en la nube EE.UU./Europa)
  if (GROQ_API_KEY) {
    const groqReply = await callGroq(promptText, history);
    if (groqReply) return groqReply;
  }

  return `Hubo un pequeño cortocircuito temporal al conectar con los servidores de IA. Por favor intenta de nuevo en unos momentos o consúltame en #soporte-o-dudas 🕵️‍♂️.`;
}

// ==========================================
// EVENTOS DE DISCORD
// ==========================================
client.on("error", (err) => {
  lastDiscordError = {
    message: err.message,
    type: "CLIENT_ERROR",
    time: new Date().toISOString(),
  };
  logDebug("❌ Error de conexión en cliente Discord:", err.message);
});

client.on("shardError", (err) => {
  lastDiscordError = {
    message: err.message,
    type: "SHARD_ERROR",
    time: new Date().toISOString(),
  };
  logDebug("❌ Error en Shard de Discord:", err.message);
});

client.once("clientReady", async () => {
  console.log(`\n==================================================`);
  console.log(`🤖 ¡Atlas está en línea en Discord!`);
  console.log(`👤 Sesión iniciada como: ${client.user.tag}`);
  console.log(`🌐 Servidores conectados: ${client.guilds.cache.size}`);
  if (GEMINI_API_KEY) console.log(`🧠 Proveedor Google Gemini: TITULAR #1 (Activo)`);
  if (OPENROUTER_API_KEY) console.log(`🌐 Proveedor OpenRouter: RESPALDO #1 (Free)`);
  if (GROQ_API_KEY) console.log(`⚡ Proveedor Groq Cloud: RESPALDO #2 (Cloud Ready)`);
  console.log(`🛡️ Blindaje Multi-Proveedor: ACTIVO`);
  console.log(`==================================================\n`);

  client.user.setActivity("Imposter | Partidas y Soporte 🕵️‍♂️", {
    type: ActivityType.Playing,
  });

  if (GEMINI_API_KEY) {
    await discoverWorkingGeminiModel();
  }

  // Verificar o auto-crear canal de telemetría #metricas-imposter, rol @👑 Co-CEO y canal #estrategia-marketing
  try {
    for (const guild of client.guilds.cache.values()) {
      // 1. Canal #metricas-imposter
      let metricChannel = guild.channels.cache.find(
        (c) => c.name === "metricas-imposter" || c.name === "métricas-imposter",
      );
      if (
        !metricChannel &&
        guild.members.me?.permissions?.has(PermissionFlagsBits.ManageChannels)
      ) {
        metricChannel = await guild.channels.create({
          name: "metricas-imposter",
          type: ChannelType.GuildText,
          topic: "Radar de telemetría y métricas en vivo de Imposter 📊",
        });
        logDebug(`✨ Canal #metricas-imposter auto-creado en ${guild.name}`);
      }
      if (metricChannel) {
        logDebug(`📊 Canal de métricas listo: #${metricChannel.name} en ${guild.name}`);
      }

      // 2. Rol @👑 Co-CEO
      let coCeoRole = guild.roles.cache.find(
        (r) =>
          r.name === "👑 Co-CEO" || r.name === "Co-CEO" || r.name.toLowerCase().includes("co-ceo"),
      );
      if (!coCeoRole && guild.members.me?.permissions?.has(PermissionFlagsBits.ManageRoles)) {
        try {
          coCeoRole = await guild.roles.create({
            name: "👑 Co-CEO",
            color: 0xf59e0b,
            hoist: true,
            mentionable: true,
            reason: "Rol ejecutivo para la Co-CEO y Directora de Marketing de Imposter",
          });
          logDebug(`✨ Rol @👑 Co-CEO auto-creado en ${guild.name}`);
        } catch (e) {
          logDebug("No se pudo crear rol @👑 Co-CEO:", e.message);
        }
      }

      // 3. Asignar rol Co-CEO a Tirlem (dueño del servidor) si no lo tiene
      if (coCeoRole && guild.ownerId) {
        try {
          const owner = await guild.members.fetch(guild.ownerId).catch(() => null);
          if (owner && !owner.roles.cache.has(coCeoRole.id)) {
            await owner.roles.add(coCeoRole);
            logDebug(`👑 Rol @👑 Co-CEO asignado al fundador (Tirlem) en ${guild.name}`);
          }
        } catch (e) {
          /* ignore */
        }
      }

      // 4. Canal #estrategia-marketing
      let mktChannel = guild.channels.cache.find(
        (c) =>
          c.isTextBased() &&
          (c.name === "estrategia-marketing" ||
            c.name === "estrategias-marketing" ||
            c.name.includes("marketing")),
      );
      if (!mktChannel && guild.members.me?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
        try {
          mktChannel = await guild.channels.create({
            name: "estrategia-marketing",
            type: ChannelType.GuildText,
            topic:
              "Laboratorio de Marketing, Contenido Viral y Crecimiento de Imposter (imposterparty.com) 🚀",
          });
          logDebug(`✨ Canal #estrategia-marketing auto-creado en ${guild.name}`);

          const welcomeEmbed = new EmbedBuilder()
            .setTitle("🚀 Laboratorio de Marketing & Crecimiento — Imposter")
            .setDescription(
              "¡Bienvenidos al centro de mando de Marketing y Expansión de **Imposter**! 🎉\n\nAquí coordinamos junto a Tirlem y la Co-CEO la estrategia de contenido para TikTok/Reels, ganchos virales para fiestas y la meta de captación de Miembros Fundadores para financiar nuestro dominio **imposterparty.com**.",
            )
            .setColor(0xf59e0b)
            .addFields([
              {
                name: "👑 Asignar rol a la Co-CEO",
                value:
                  "Tirlem puede escribir `!co-ceo @novia` en este canal y Atlas le asignará el rol ejecutivo al instante con bienvenida oficial.",
                inline: false,
              },
              {
                name: "🎯 ¿Cómo interactuar con Atlas aquí?",
                value:
                  "Escribe directamente en este canal sin necesidad de etiquetarme. Pídeme ideas de videos, guiones de 30 segundos, ganchos de comedia o copys para WhatsApp.",
                inline: false,
              },
            ])
            .setTimestamp();

          await mktChannel.send({ embeds: [welcomeEmbed] });
        } catch (e) {
          logDebug("No se pudo crear canal #estrategia-marketing:", e.message);
        }
      }
    }
  } catch (err) {
    logDebug("⚠️ Error al inicializar canales y roles al inicio:", err.message);
  }
});

function splitIntoDiscordChunks(text, maxLength = 1900) {
  if (!text || text.length <= maxLength) return [text || ""];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Buscar el mejor punto de corte natural (párrafos dobles, saltos de línea o espacios)
    let splitIdx = remaining.lastIndexOf("\n\n", maxLength);
    if (splitIdx === -1 || splitIdx < maxLength * 0.4) {
      splitIdx = remaining.lastIndexOf("\n", maxLength);
    }
    if (splitIdx === -1 || splitIdx < maxLength * 0.4) {
      splitIdx = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitIdx === -1) {
      splitIdx = maxLength;
    }

    chunks.push(remaining.slice(0, splitIdx).trim());
    remaining = remaining.slice(splitIdx).trim();
  }

  return chunks.filter(Boolean);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    lastMessageReceived = {
      author: message.author.tag || message.author.username,
      channel: message.channel.name || (message.guild ? "texto" : "DM"),
      content: (message.content || "").slice(0, 100),
      time: new Date().toISOString(),
    };

    // 👑 Comando rápido para nombrar Co-CEO: !co-ceo @mención o !asignar-co-ceo @mención
    if (message.content.startsWith("!co-ceo") || message.content.startsWith("!asignar-co-ceo")) {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply(
          "⚠️ Debes mencionar a tu novia o compañera que deseas nombrar Co-CEO (ejemplo: `!co-ceo @usuario`).",
        );
        return;
      }
      const guild = message.guild;
      if (!guild) return;

      let coCeoRole = guild.roles.cache.find(
        (r) =>
          r.name === "👑 Co-CEO" || r.name === "Co-CEO" || r.name.toLowerCase().includes("co-ceo"),
      );
      if (!coCeoRole && guild.members.me?.permissions?.has(PermissionFlagsBits.ManageRoles)) {
        try {
          coCeoRole = await guild.roles.create({
            name: "👑 Co-CEO",
            color: 0xf59e0b,
            hoist: true,
            mentionable: true,
          });
        } catch (e) {
          /* ignore */
        }
      }

      if (coCeoRole) {
        try {
          await targetMember.roles.add(coCeoRole);
          const embed = new EmbedBuilder()
            .setTitle("👑 ¡Nombramiento Oficial: Co-CEO de Imposter!")
            .setDescription(
              `¡Demos la bienvenida formal a <@${targetMember.id}> al equipo ejecutivo de **Imposter**! 🎉\n\nDesde ahora cuenta con el rol oficial **👑 Co-CEO y Directora de Marketing**. Atlas está a su disposición 24/7 en este canal para armar guiones para TikTok, estrategias virales para fiestas y la venta de pases fundador para financiar **imposterparty.com**.`,
            )
            .setColor(0xf59e0b)
            .setTimestamp();
          await message.channel.send({ embeds: [embed] });
        } catch (err) {
          await message.reply(
            `⚠️ No pude asignar el rol automáticamente (${err.message}). Por favor verifica que el rol del bot esté por encima de los demás roles en la configuración del servidor.`,
          );
        }
        return;
      }
    }

    const isDM = !message.guild;
    const isMentioned = client.user && message.mentions.has(client.user.id);
    const channelName = (message.channel.name || "").toLowerCase();

    // Canales especiales
    const isSoporteChannel = channelName === "soporte-o-dudas";
    const isFundadorChannel = channelName === "fundador-vip";
    const isMarketingChannel =
      channelName === "estrategia-marketing" ||
      channelName === "estrategias-marketing" ||
      channelName.includes("marketing");
    const isCEOChannel =
      channelName.includes("ceo") ||
      channelName.includes("despacho") ||
      channelName.includes("oficina") ||
      channelName.includes("estrategia") ||
      channelName.includes("junta") ||
      channelName.includes("negocio") ||
      channelName.includes("privado") ||
      channelName.includes("tirlem");

    // El bot responde si:
    // 1. Es mensaje directo (DM)
    // 2. Es mencionado en cualquier canal
    // 3. Es el canal privado del CEO o el canal de Marketing (responde sin necesidad de etiquetar)
    // 4. Es el canal #soporte-o-dudas y el mensaje tiene más de 4 caracteres
    const shouldRespond =
      isDM ||
      isMentioned ||
      isCEOChannel ||
      isMarketingChannel ||
      (isSoporteChannel && message.content.length > 4);

    if (!shouldRespond) return;

    let cleanContent = message.content || "";
    if (client.user) {
      cleanContent = cleanContent.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
    }

    if (!cleanContent) {
      const greeting = isCEOChannel
        ? "Buenas, Tirlem. ¿Qué aspecto del proyecto o del lanzamiento revisamos hoy?"
        : "¡Hola! Soy Atlas, asistente y copiloto de **Imposter**. ¿En qué puedo ayudarte?";
      await message.reply(greeting);
      return;
    }

    // 🟢 RESPUESTA INSTANTÁNEA A CHEQUEOS DE VITALIDAD / PING / STATUS (Cero latencia, no depende de la IA externa)
    const normalized = cleanContent
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!]/g, "")
      .trim();

    const isVitalityCheck =
      cleanContent.startsWith("!ping") ||
      cleanContent.startsWith("!status") ||
      cleanContent.startsWith("!activo") ||
      normalized === "atlas estas activo" ||
      normalized === "estas activo" ||
      normalized === "atlas estas en linea" ||
      normalized === "estas en linea" ||
      normalized === "atlas estas despierto" ||
      normalized === "estas despierto" ||
      normalized === "atlas estas ahi" ||
      normalized === "estas ahi" ||
      normalized === "atlas sigues ahi" ||
      normalized === "sigues ahi" ||
      normalized === "hola atlas";

    if (isVitalityCheck) {
      const upMinutes = Math.floor(process.uptime() / 60);
      const pingEmbed = new EmbedBuilder()
        .setTitle("🟢 Atlas está 100% activo y en línea")
        .setDescription(
          `Aquí estoy contigo en el despacho, Tirlem. Conexión estable y copiloto listo para trabajar.\n\n` +
            `• 👑 **Despacho CEO:** Escuchando en vivo 24/7 (sin necesidad de @mención)\n` +
            `• 🎯 **Marketing:** Canal #estrategia-marketing activo para la Co-CEO y para ti\n` +
            `• 🛰️ **Radar Telemetría:** Registrando métricas en tiempo real\n` +
            `• 🧠 **Motor de IA:** ${cachedWorkingGeminiModel || GEMINI_MODEL} (Google Gemini)\n` +
            `• ⏱️ **Tiempo activo (Uptime):** ${upMinutes} minutos\n\n` +
            `¿Qué aspecto de Imposter revisamos hoy? Dime y nos ponemos en marcha.`,
        )
        .setColor(0x10b981)
        .setTimestamp();

      await message.reply({ embeds: [pingEmbed] });
      return;
    }

    try {
      await message.channel.sendTyping();
    } catch {
      /* ignore */
    }

    const memKey = getMemoryKey(message);
    const history = conversationMemory.get(memKey) || [];

    const userTag = message.author.tag || message.author.username;

    // Si estamos en el despacho del CEO o en marketing, inyectamos contexto ejecutivo exclusivo y métricas en vivo
    let promptWithContext = `[Mensaje de ${userTag}]: ${cleanContent}`;
    if (isMarketingChannel) {
      promptWithContext = `[SALA DE JUNTAS EJECUTIVA — MARKETING Y CRECIMIENTO DE IMPOSTER]:
Estás en reunión con la alta dirección de Imposter: Tirlem (Fundador y CEO) y Lisve (Co-CEO y Directora de Marketing).
El mensaje que estás atendiendo proviene de: ${userTag}.

TU ROL: Chief Marketing Copilot (Asesor Estratégico y Creativo de Marketing a su servicio):
1. RECONOCIMIENTO DE AUTORIDAD: Trata a ${userTag} con máximo respeto a su rango ejecutivo (CEO / Co-CEO), cortesía profesional y actitud constructiva de apoyo.
2. CERO PATERNALISMO O REPRENDAS: Jamás des sermones condescendientes ni uses frases de desaprobación como "entiendo la tentación", "con la cabeza fría antes de gastar cartuchos", "te van a banear" o "nadie entra a enlaces sospechosos". NUNCA los trates como empleados cometiendo un error.
3. CÓMO APOYAR SUS INICIATIVAS:
   - Si la Co-CEO o el CEO tienen una idea (por ejemplo, actuar rápido en TikTok, interactuar en comentarios o probar una acción de guerrilla):
     a) Valida primero su iniciativa y velocidad con respeto y entusiasmo.
     b) Como su asesor táctico, en lugar de frenarlos, propón la MEJOR FORMA DE EJECUTARLA con éxito rotundo (ejemplo: cómo comentar con misterio o humor para despertar curiosidad, dirigir tráfico al enlace de la biografía sin que el algoritmo lo oculte, y entrégales 3 ejemplos de comentarios listos para usar).
     c) Entrega siempre respuestas completas, bien estructuradas y listas para usar.
4. COMPLETITUD OBLIGATORIA: Termina SIEMPRE cada punto, lista y oración hasta el punto final. No dejes respuestas cortadas.

[DATOS REALES DEL RADAR DE MÉTRICAS]:
- Partidas iniciadas: ${botLiveMetrics.roundsStarted}
- Vistas a Checkout/Pases: ${botLiveMetrics.paywallViews}
- PWA Instaladas: ${botLiveMetrics.pwaInstalls}
- Dispositivos: Android: ${botLiveMetrics.deviceCounts.android}, iOS: ${botLiveMetrics.deviceCounts.ios}, PC: ${botLiveMetrics.deviceCounts.desktop}

[Mensaje de ${userTag}]: ${cleanContent}`;
    } else if (isCEOChannel) {
      promptWithContext = `[DESPACHO EJECUTIVO — REUNIÓN CON TIRLEM (CEO)]:
Estás hablando con Tirlem (Fundador y CEO de Imposter).
Trátalo con respeto a su autoridad, serenidad, análisis sincero y camaradería ejecutiva.
Eres su copiloto técnico y asesor estratégico: evalúa pros, contras y prioridades con claridad y respeto, enfocándote en la validación real con usuarios.
COMPLETITUD OBLIGATORIA: Termina siempre cada punto, idea y oración hasta el punto final.

[DATOS REALES DEL RADAR DE MÉTRICAS]:
- Partidas iniciadas registradas: ${botLiveMetrics.roundsStarted}
- Partidas completadas: ${botLiveMetrics.roundsCompleted}
- PWA Instaladas: ${botLiveMetrics.pwaInstalls}
- Vistas a Checkout/Pases: ${botLiveMetrics.paywallViews}
- Dispositivos: Android: ${botLiveMetrics.deviceCounts.android}, iOS: ${botLiveMetrics.deviceCounts.ios}, PC/Web: ${botLiveMetrics.deviceCounts.desktop}
- Categorías jugadas: ${JSON.stringify(botLiveMetrics.categoryCounts)}
- Último evento: ${botLiveMetrics.lastEventTime || "Aún sin eventos hoy"}

[Mensaje de Tirlem]: ${cleanContent}`;
    } else if (isFundadorChannel) {
      promptWithContext = `[CANAL EXCLUSIVO FUNDADORES VIP]: El usuario ${userTag} es un Miembro Fundador Vitalicio ($9.80 USD). Trátalo con cordialidad y cercanía.\n\n[Mensaje]: ${cleanContent}`;
    }

    logDebug(`📩 Mensaje recibido en #${channelName || "DM"} de ${userTag}: "${cleanContent}"`);

    const aiReply = await askAI(promptWithContext, history);
    logDebug(`📤 Enviando respuesta a Discord (${aiReply.length} chars)`);

    // Actualizar memoria
    history.push({ role: "user", parts: [{ text: cleanContent }] });
    history.push({ role: "model", parts: [{ text: aiReply }] });
    if (history.length > 8) history.splice(0, history.length - 8);
    conversationMemory.set(memKey, history);

    // Envío segmentado limpio y secuencial para evitar límites o cortes
    const chunks = splitIntoDiscordChunks(aiReply, 1900);
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        await message.reply(chunks[i]);
      } else {
        await message.channel.send(chunks[i]);
      }
      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    logDebug(`✅ Respuesta enviada a Discord exitosamente (${chunks.length} partes).`);
  } catch (err) {
    lastDiscordError = {
      message: err.message,
      stack: err.stack?.slice(0, 300),
      time: new Date().toISOString(),
    };
    logDebug("❌ Error procesando mensaje de Discord:", err.message);
    try {
      await message.reply(
        "⚠️ Tuve un micro-corte temporal al conectar con la IA de Google. Mi conexión a Discord y el despacho siguen 100% activos. Por favor repíteme tu mensaje o prueba con `!ping`.",
      );
    } catch {
      /* ignore */
    }
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Servidor HTTP ligero para Render/Koyeb (Health-Check 24/7 y Receptor de Métricas)
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    // Cabeceras CORS para permitir telemetría desde la web y PWA
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && (req.url === "/api/telemetry" || req.url === "/api/metrics")) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 25000) req.destroy();
      });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body || "{}");

          // 🧹 Reinicio autorizado por el CEO para arrancar métricas limpias
          if (data.action === "reset" || data.type === "reset") {
            botLiveMetrics.roundsStarted = 0;
            botLiveMetrics.roundsCompleted = 0;
            botLiveMetrics.pwaInstalls = 0;
            botLiveMetrics.paywallViews = 0;
            botLiveMetrics.categoryCounts = {};
            botLiveMetrics.deviceCounts = { android: 0, ios: 0, desktop: 0 };
            botLiveMetrics.recentEvents = [];
            botLiveMetrics.lastEventTime = null;
            logDebug("🧹 Métricas de Atlas reiniciadas a cero por orden del CEO.");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, reset: true, metrics: botLiveMetrics }));
            return;
          }

          const deviceStr = data.device || "Desconocido";
          const nowStr = new Date().toLocaleTimeString();
          botLiveMetrics.lastEventTime = `${nowStr} (${deviceStr})`;

          const isAndroid = /android/i.test(deviceStr);
          const isIos = /iphone|ipad|ios/i.test(deviceStr);
          if (isAndroid) botLiveMetrics.deviceCounts.android++;
          else if (isIos) botLiveMetrics.deviceCounts.ios++;
          else botLiveMetrics.deviceCounts.desktop++;

          if (data.type === "round_start") {
            botLiveMetrics.roundsStarted++;
            const cat = data.category || "Aleatoria";
            botLiveMetrics.categoryCounts[cat] = (botLiveMetrics.categoryCounts[cat] || 0) + 1;

            const fields = [
              { name: "📁 Categoría", value: `**${cat}**`, inline: true },
              { name: "👥 Jugadores", value: `${data.playerCount ?? 4} personas`, inline: true },
              { name: "🕵️‍♂️ Impostores", value: `${data.impostorCount ?? 1}`, inline: true },
              { name: "📱 Dispositivo", value: `**${deviceStr}**`, inline: true },
            ];
            if (data.isAdult) {
              fields.push({ name: "🔞 Modo Picante", value: "Activado (+18)", inline: true });
            }
            if (data.isJester) {
              fields.push({ name: "🃏 El Bufón", value: "En juego", inline: true });
            }

            await sendMetricsToDiscordChannel(
              "🎮 ¡Nueva Partida Iniciada!",
              `Se acaba de iniciar una partida presencial en **${deviceStr}**.`,
              0x3b82f6,
              fields,
            );
          } else if (data.type === "round_finish") {
            botLiveMetrics.roundsCompleted++;
            const winnerName =
              data.winner === "innocents"
                ? "Inocentes 😇"
                : data.winner === "jester"
                  ? "El Bufón 🃏"
                  : "Impostores 🕵️‍♂️";

            await sendMetricsToDiscordChannel(
              "🏆 Partida Concluida con Éxito",
              `Partida terminada. Ganador: **${winnerName}**.`,
              0x10b981,
              [
                { name: "👑 Ganador", value: winnerName, inline: true },
                { name: "📁 Categoría", value: data.category || "Aleatoria", inline: true },
                { name: "📱 Dispositivo", value: deviceStr, inline: true },
              ],
            );
          } else if (data.type === "pwa_install") {
            botLiveMetrics.pwaInstalls++;
            await sendMetricsToDiscordChannel(
              "📱 ¡PWA Instalada en Pantalla de Inicio!",
              `Un jugador añadió **Imposter** como app nativa a su teléfono.`,
              0x8b5cf6,
              [
                { name: "📱 Dispositivo", value: `**${deviceStr}**`, inline: true },
                { name: "⭐ Estado", value: "Acceso Rápido Nativo", inline: true },
              ],
            );
          } else if (data.type === "paywall_view") {
            botLiveMetrics.paywallViews++;
          } else if (data.type === "commerce_embed" && data.title) {
            await sendMetricsToDiscordChannel(
              data.title,
              data.description || "",
              typeof data.color === "number" ? data.color : 0xf59e0b,
              Array.isArray(data.fields) ? data.fields : [],
            );
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, metrics: botLiveMetrics }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }
      });
      return;
    }

    // Default GET status (Diagnóstico completo para monitoreo en vivo)
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "online",
          bot: "Atlas",
          version: "1.2.0",
          uptimeSeconds: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
          initTime: botInitTime,
          discord: {
            ready: client.isReady(),
            user: client.user ? client.user.tag : null,
            userId: client.user ? client.user.id : null,
            guildCount: client.guilds.cache.size,
            guilds: client.guilds.cache.map((g) => ({
              id: g.id,
              name: g.name,
              memberCount: g.memberCount,
              canManageChannels: !!g.members.me?.permissions?.has(
                PermissionFlagsBits.ManageChannels,
              ),
              canManageRoles: !!g.members.me?.permissions?.has(PermissionFlagsBits.ManageRoles),
            })),
            lastMessageReceived,
            lastDiscordError,
          },
          ai: {
            geminiActive: !!GEMINI_API_KEY,
            groqActive: !!GROQ_API_KEY,
            openRouterActive: !!OPENROUTER_API_KEY,
            activeModel: cachedWorkingGeminiModel || GEMINI_MODEL,
          },
          metrics: botLiveMetrics,
        },
        null,
        2,
      ),
    );
  })
  .listen(PORT, () => {
    console.log(`🌐 Servidor de monitoreo HTTP activo en el puerto ${PORT}`);

    // 💓 Keep-Alive Automático: Previene que Render duerma el bot por inactividad
    const RENDER_EXTERNAL_URL =
      process.env.RENDER_EXTERNAL_URL || "https://atlas-bot-2xh4.onrender.com";
    if (RENDER_EXTERNAL_URL) {
      logDebug(`💓 Keep-alive activado hacia: ${RENDER_EXTERNAL_URL} (cada 10 min)`);
      setInterval(
        () => {
          fetch(RENDER_EXTERNAL_URL)
            .then(() => logDebug("💓 Keep-alive ping enviado a Render exitosamente"))
            .catch(() => {});
        },
        10 * 60 * 1000,
      ); // Ping cada 10 minutos (Render duerme a los 15 min)
    }
  });

client.login(DISCORD_BOT_TOKEN).catch((err) => {
  lastDiscordError = {
    message: err.message,
    type: "LOGIN_ERROR",
    time: new Date().toISOString(),
  };
  console.error("❌ Error al iniciar sesión en Discord:", err.message);
});
