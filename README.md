# 🎮 Imposter — Party Game Cyber-Arcade

Un juego de fiesta estilo _Spyfall_ y _Among Us_ de deducción social, misterio y engaño. Pasa el teléfono, escanea tu rol con el sensor biométrico y descubre a los traidores ocultos antes de que sea demasiado tarde.

---

## ✨ Características Principales

- **🧭 Configuración en 2 Pasos (_2-Step Wizard_)**:
  - **Paso 1 (Sala de Jugadores)**: Gestiona de 3 a 15 jugadores con avatares cromáticos, botón **🔀 Mezclar** para orden aleatorio, ajustes de impostores y tiempo de debate, y botón flotante (_FAB_) de avance rápido.
  - **Paso 2 (Mazo Arcade de Categorías)**: Galería visual de tarjetas temáticas con iconos grandes y contador en vivo de palabras libres para evitar repeticiones.
- **🕵️ Impostores Flexibles & Modo Cómplice**: Configura hasta `N - 2` impostores. Activa el **Modo Cómplice** (los impostores se conocen entre sí) o el **Modo Caos** (nadie sabe quién más es impostor).
- **🔥 Modo Experto Permanente**: El impostor nunca recibe pistas sobre la categoría; debe deducir el tema escuchando atentamente al grupo. El jugador que inicia la ronda siempre es inocente.
- **🪪 Escáner Biométrico (_Hold-to-Reveal_)**: Tarjeta táctil con haz láser animado y zumbido sintetizado. El rol solo se muestra mientras mantienes presionado el sensor.
- **📚 11 Categorías Oficiales & +560 Palabras**:
  - **3 Gratuitas (Base)**: _Comida, Lugares, Animales_ (150 palabras).
  - **8 Exclusivas (PRO)**: _Objetos, Profesiones, Cine y Series, Deportes, Videojuegos y Geek, Música y Artistas, Países y Maravillas, Fiesta +18_ (+410 palabras).
  - **🔞 Sección Fiesta +18 (PRO)**: 60 palabras picantes para adultos protegidas con PIN parental personalizable de 4 dígitos.
  - **✨ Categorías Personalizadas (PRO)**: Crea tus propias listas o exporta/importa packs completos en JSON desde el portapapeles.
- **🃏 Rol Especial: El Bufón (PRO)**: Un jugador conoce la palabra secreta pero gana en solitario si logra actuar sospechoso y hacer que el grupo lo vote.
- **⚡ Eventos Relámpago de Ronda (PRO)**: Modificadores sorpresa para el debate (_Ronda de Mímica, Doble Pista, Interrogatorio Cruzado, Rostro de Póker, Pista Relámpago, Inicial Prohibida_).
- **👑 Sistema Party Pass PRO & Panel Ejecutivo**: Modelo _Freemium_ integrado con desbloqueo por pase o código promocional y telemetría global en tiempo real.
- **🛰️ Radar de Telemetría en Vivo (Nivel A & Nivel B)**:
  - **Nivel A (Discord `#metricas-imposter`)**: Alertas automáticas con tarjetas enriquecidas cuando un jugador inicia partida, concluye ronda o instala la PWA.
  - **Nivel B (Radar CEO dentro de la App)**: Métricas globales agregadas por dispositivo (Android, iPhone / iOS, PC), ranking de categorías más jugadas y feed de actividad reciente.
- **🤖 Atlas — Copiloto de IA & Bot Oficial de Discord**:
  - Asistente inteligente alojado 24/7 en **Render Cloud** (`https://atlas-bot-2xh4.onrender.com`).
  - Motor híbrido multi-proveedor (**Google Gemini Flash Lite**, **OpenRouter LLaMA 3.3 / DeepSeek**, **Groq Cloud**).
  - Canales dedicados: `#despacho-ceo` (asesoramiento ejecutivo y métricas en tiempo real con TIRLEM), `#soporte-o-dudas` y `#fundador-vip`.
  - Sistema de **Keep-Alive 24/7** automático para operar sin interrupciones en la nube gratuita.
- **📲 Invitación Viral con Código QR**: Modal integrado en el encabezado con generador QR dinámico y botón de compartir nativo (`navigator.share`) para que los amigos abran el juego al instante en sus teléfonos.
- **⏳ Reloj Radial de Tensión & SFX Web Audio**: Anillo circular dinámico con latido cardíaco en los últimos 10 segundos y efectos de sonido sintetizados en tiempo real (cero latencia y 100% offline).
- **📱 PWA & Offline First**: Instalable en iOS, Android y escritorio mediante Service Workers y Wake Lock de pantalla.
- **🛡️ Blindaje de Seguridad de 7 Capas**: Cero claves en texto plano, tokens de doble hash SHA-256 en `localStorage`, bloqueo anti-fuerza bruta en PIN parental (+18), rate-limiting anti-spam en pagos, sanitización estricta de entradas y cabeceras anti-clonación.

---

## 🎯 Flujo de la Partida

1. **Paso 1 — Sala de Jugadores**:
   - Agrega los nombres de los participantes (3–6 en versión gratuita, hasta 15 en versión PRO) y mezcla el orden si lo deseas.
   - Ajusta el número de impostores y los minutos de debate.
2. **Paso 2 — Selección de Categoría**:
   - Elige una tarjeta del mazo temático, selecciona **🎲 Aleatoria** o desbloquea **🔞 Fiesta +18** con tu PIN.
3. **Fase de Revelación (_Pass & Play_)**:
   - Pasa el teléfono siguiendo la barra de progreso superior tipo _Stories_.
   - Cada jugador mantiene presionado el escáner biométrico para ver su palabra secreta (o su rol de Impostor / Bufón).
4. **Fase de Debate**:
   - El jugador inocente seleccionado por el sistema inicia la ronda diciendo una palabra relacionada.
   - El reloj radial marca el tiempo restante y muestra el **Evento Relámpago** si está activo.
5. **Votación & Resolución**:
   - El grupo acusa formalmente a los sospechosos hasta atrapar a todos los impostores.
   - Si un impostor es descubierto, tiene una **última oportunidad**: adivinar la palabra secreta para robarse la victoria.

---

## 👑 Comparativa: Versión Normal (Gratis) vs. Party Pass PRO (Pago)

> 📄 Consulta el documento dedicado **[`ROADMAP_MEJORAS.md`](./ROADMAP_MEJORAS.md)** para ver el plan detallado de próximas actualizaciones y cómo se clasifica cada mejora entre **🟢 Normal (Gratis)** y **👑 PRO (Pago)**.

| Característica                           | 🟢 Normal (Gratis)                         | 👑 Party Pass PRO (Pago)                                        |
| :--------------------------------------- | :----------------------------------------- | :-------------------------------------------------------------- |
| **Límite de Jugadores**                  | 3 a 6 jugadores                            | **Hasta 15 jugadores** (Salas grandes)                          |
| **Categorías Base (150 palabras)**       | ✅ Incluidas (_Comida, Lugares, Animales_) | ✅ Incluidas                                                    |
| **Packs PRO Exclusivos (410+ palabras)** | 🔒 Bloqueado                               | ✅ _Cine, Deportes, Geek, Objetos, Profesiones, Música, Países_ |
| **Categoría Picante 🔞 Fiesta +18**      | 🔒 Bloqueado                               | ✅ **60 palabras para adultos** (con PIN)                       |
| **Modos de Impostor**                    | Modo Cómplice y Modo Caos                  | + **🃏 Rol El Bufón** y **⚡ Eventos Relámpago**                |
| **Listas Personalizadas**                | 🔒 Bloqueado                               | ✅ Creación, exportación e importación JSON                     |
| **Invitación por Código QR**             | ✅ Incluida                                | ✅ Incluida                                                     |

---

## 🛡️ Seguridad y Protección (7 Blindajes Activos)

> 📄 Consulta la guía técnica completa en **[`SEGURIDAD.md`](./SEGURIDAD.md)** para conocer en detalle la arquitectura criptográfica y de protección del proyecto.

1. **🔒 Cero Claves en Texto Plano (Hashing SHA-256 + Anti-Fuerza Bruta)**:
   - Ningún código promocional ni clave administrativa existe en texto plano dentro del bundle JS. Se verifican mediante `SHA-256` con sal criptográfica y bloqueo temporal tras 5 intentos fallidos.
2. **🛡️ Tokens Firmados de Doble Nivel en `localStorage` (Anti-F12)**:
   - El estado PRO/CEO no usa booleanos (`"true"`), sino tokens criptográficos de primer nivel validados contra un hash de segundo nivel (`sha256(VERIFY_SALT + sha256(CODE_SALT + clave))`). Copiar hashes del código fuente o escribir `"true"` en `localStorage` revoca y limpia el acceso automáticamente.
3. **🧹 Sanitización Estricta de Packs JSON (`sanitizeImportedCategories`)**:
   - Protege la importación de categorías contra _Prototype Pollution_ (`__proto__`, `constructor`), inyección de etiquetas HTML (`< >`), sobrescritura de categorías oficiales y desbordamiento de memoria (_DoS_).
4. **🌐 Cabeceras HTTP Anti-Clonación (`public/_headers`)**:
   - Configura `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` y `Permissions-Policy` en Cloudflare para impedir que sitios de terceros incrusten el juego en un `<iframe>`.
5. **🔞 Anti-Fuerza Bruta en PIN Parental (+18)**:
   - Bloqueo automático del teclado numérico por **60 segundos** tras **5 intentos erróneos** al intentar acceder a la sección de adultos.
6. **🚦 Anti-Spam Rate Limiting en Pasarela de Pagos**:
   - Máximo **3 envíos de comprobantes cada 2 minutos** por cliente en `submitPaymentProofServerFn`, previniendo ataques de saturación.
7. **🧼 Sanitización Anti-XSS en Formularios de Cobro y Discord**:
   - Limpieza automática de nombres de cliente, números de referencia bancaria y tags de Discord antes de procesar o despachar alertas a Webhooks.

---

## 🚀 Instalación, Ejecución y Despliegue

### **Requisitos**

- **Node.js 18+**
- **npm 9+**

### **Instalar Dependencias**

```bash
npm install
```

### **Servidor de Desarrollo Local**

```bash
npm run dev
```

Accede en tu navegador a: `http://localhost:8080`

### **Ejecutar el Bot Atlas Localmente**

```bash
npm run bot
```

### **Ejecutar Pruebas Automatizadas**

```bash
npm test
```

### **Despliegue a Producción**

- **📱 App Web / PWA (Cloudflare Workers)**:
  Compila y despliega la aplicación a la URL pública oficial (`https://imposter.manu-07games.workers.dev`):
  ```bash
  npm run deploy
  ```
- **🤖 Bot de Discord Atlas (Render Cloud)**:
  Alojado en Render (`https://atlas-bot-2xh4.onrender.com`). Se actualiza y despliega **automáticamente** en cada `git push origin main`. Cuenta con latido interno Keep-Alive para permanecer despierto 24/7 sin costo.

---

## 🏗️ Stack Tecnológico

- **Frontend & SSR**: React 19 + TypeScript + TanStack Start (Router + SSR)
- **Estilos & Motion**: Tailwind CSS v4 + Glassmorphism + Keyframes personalizados
- **Iconografía**: Lucide React
- **Audio Engine**: Web Audio API sintetizada (_zero-asset / zero-latency_)
- **Bundler & PWA**: Vite + Workbox + Service Worker nativo + Screen Wake Lock
- **Edge Deployment**: Cloudflare Workers (vía Nitro + Wrangler)
- **Bot & Copiloto IA**: Discord.js v14 + Google Gemini Flash Lite + OpenRouter + Groq Cloud en Render
- **Testing**: Vitest + Testing Library
