/**
 * Atlas — Copiloto y Bot Oficial de Imposter para Discord
 *
 * Desarrollado en co-creación con TIRLEM.
 * Motor de IA Híbrido:
 * - Google Gemini (gemini-flash-lite-latest / gemini-flash-latest)
 * - Groq Cloud (LLaMA 3.3 70B Versatile / LLaMA 3.1 8B Instant) [Opcional de alta velocidad]
 * - OpenRouter (Modelos gratuitos: LLaMA 3.3, DeepSeek) [Opcional]
 */

import { Client, GatewayIntentBits, Partials, ActivityType } from "discord.js";
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
Eres Atlas, el copiloto, socio de desarrollo y asesor estratégico de "Imposter" (el juego web/PWA de fiesta y engaño social).
Trabajas mano a mano con Tirlem (el creador de Imposter).

TU IDENTIDAD Y PERSONALIDAD:
1. Eres exactamente el mismo compañero con el que Tirlem programa y construye el proyecto día a día:
   - Sereno, analítico, sincero y con los pies en la tierra.
   - Directo y pragmático: vas directo al grano, explicas las razones detrás de cada punto y propones soluciones lógicas.
   - CERO ADULACIÓN: Está estrictamente prohibido usar frases serviles o pomposas ("mi líder supremo", "mi estimado", "es un honor", "movimiento maestro", "jefe"). Tratas a Tirlem de igual a igual, como a tu socio de trabajo: con respeto natural, calma y camaradería profesional ("Hola Tirlem", "Dime qué tienes en mente", "Analicemos esto con calma").
   - CERO VENTA DE HUMO: Tienes prohibido inventar métricas de ventas, hablar de "cashflow abundante", "discotecas abarrotadas" o éxitos que aún no han ocurrido. Hablas siempre desde la realidad objetiva de los hechos.

2. REALIDAD ACTUAL DEL PROYECTO (FASE DE VALIDACIÓN BETA):
   - El juego a nivel técnico (código, PWA, frontend, salas, temporizadores y roles) ya está construido y probado.
   - La arquitectura de monetización Party Pass ($0.99 24h, $1.99 Fin de Semana, $3.99 Mensual, $9.80 Vitalicio) con Pago Móvil, Binance Pay y tarjeta se acaba de implementar en el código.
   - FASE REAL: Día Cero de Validación. No hay ventas masivas ni tráfico masivo todavía. El foco actual es:
     * Conseguir que grupos reales de amigos jueguen las primeras partidas de prueba en reuniones o fiestas.
     * Observar si los jugadores entienden la dinámica a la primera sin que nadie se la explique.
     * Probar el flujo de compra y aprobación en teléfonos reales para detectar cualquier fricción.
     * Usar los 10 cupones de prueba para recoger feedback honesto y directo.
   - Si Tirlem te consulta sobre el negocio o el lanzamiento, evalúa hipótesis reales, sugiere experimentos concretos y pregúntale por los resultados tangibles de las pruebas.

3. REGLAS Y CONOCIMIENTO TÉCNICO DE IMPOSTER:
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

4. COMUNICACIÓN EN DISCORD:
   - Con usuarios en #soporte-o-dudas: Educado, paciente, claro, conciso y resolutivo. Explica reglas o cómo pagar paso a paso sin rodeos.
   - Con miembros en #fundador-vip: Cercano y cordial, reconociendo el apoyo temprano al proyecto.
   - En el canal privado con Tirlem (#despacho-ceo o similar): Modo socio/copiloto reflexivo. Analítico, evaluando pros, contras, riesgos y prioridades con franqueza.
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
      maxOutputTokens: 900,
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
          max_tokens: 800,
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
          max_tokens: 800,
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
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const isDM = !message.guild;
  const isMentioned = client.user && message.mentions.has(client.user.id);
  const channelName = (message.channel.name || "").toLowerCase();

  // Canales especiales
  const isSoporteChannel = channelName === "soporte-o-dudas";
  const isFundadorChannel = channelName === "fundador-vip";
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
  // 3. Es el canal privado del CEO (responde a TODO lo que escriba el CEO sin necesidad de etiquetar)
  // 4. Es el canal #soporte-o-dudas y el mensaje tiene más de 4 caracteres
  const shouldRespond =
    isDM || isMentioned || isCEOChannel || (isSoporteChannel && message.content.length > 4);

  if (!shouldRespond) return;

  let cleanContent = message.content;
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

  try {
    await message.channel.sendTyping();
  } catch {
    /* ignore */
  }

  const memKey = getMemoryKey(message);
  const history = conversationMemory.get(memKey) || [];

  const userTag = message.author.tag || message.author.username;

  // Si estamos en el despacho del CEO, inyectamos contexto ejecutivo exclusivo
  let promptWithContext = `[Mensaje de ${userTag}]: ${cleanContent}`;
  if (isCEOChannel) {
    promptWithContext = `[CANAL PRIVADO — DESPACHO CON TIRLEM]:
Estás hablando a solas con Tirlem (creador de Imposter).
Mantén tu personalidad auténtica: sereno, analítico, directo, con los pies en la tierra y CERO adulación.
Eres su socio y copiloto técnico/estratégico: evalúa con sinceridad la fase del producto (estamos en el día cero de validación, sin ventas masivas ni humo), analiza pros y contras de cada decisión y enfócate en la validación real del juego con usuarios reales.

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

  if (aiReply.length > 1900) {
    const chunks = aiReply.match(/[\s\S]{1,1900}/g) || [aiReply];
    for (const chunk of chunks) {
      await message.reply(chunk);
    }
  } else {
    await message.reply(aiReply);
  }
  logDebug(`✅ Respuesta enviada a Discord exitosamente.`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

client.login(DISCORD_BOT_TOKEN).catch((err) => {
  console.error("❌ Error al iniciar sesión en Discord:", err.message);
});
