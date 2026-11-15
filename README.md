# 🎮 Imposter v2.0.1 — Party Game Cyber-Arcade (Presencial & Online)

Un juego de fiesta estilo _Spyfall_ y _Among Us_ de deducción social, misterio y engaño. Juega en la misma sala pasando el teléfono (_Pass & Play_) o a distancia creando una **Sala Online Multijugador** en tiempo real. Escanea tu rol con el sensor biométrico y descubre a los traidores ocultos antes de que sea demasiado tarde.

---

## ✨ Características Principales (`v2.0.1`)

- **🧭 Configuración Fluida en 3 Pasos (_3-Step Cyber-Arcade Wizard_)**:
  - **Paso 1 — Jugadores**: Gestiona de 3 a 15 jugadores con avatares numerados, botón **Mezclar** para orden aleatorio y selector visual de quién inicia la ronda.
  - **Paso 2 — Reglas y Roles**: Configura el número de impostores, minutos de debate, **Modo Cómplice / Caos**, **Pista Camaleón**, **El Bufón** y **Eventos Relámpago**.
  - **Paso 3 — Categorías**: Mazo visual de tarjetas temáticas con iconos vectoriales Lucide y contador en vivo de palabras libres para evitar repeticiones.
- **🌐 Salas Online Multijugador en Tiempo Real**:
  - Crea una sala privada con código de **4 letras** o únete desde cualquier teléfono para jugar por llamada de WhatsApp, Discord o Zoom sin pasar físicamente el dispositivo.
  - Sincronización en vivo de sala de espera, revelación individual de cartas, reloj de debate, votación simultánea y resultados.
- **🦎 Pista Camaleón (_Palabra Señuelo para el Impostor_)**:
  - El impostor siempre ve su **Tarjeta Roja de Impostor** garantizada, y cuando este modo está activo recibe además una **Pista Camaleón** (palabra señuelo del mismo campo semántico) para camuflarse durante el debate.
- **🎯 Minijuego de Última Oportunidad (5 Opciones Táctiles)**:
  - Si el grupo descubre al impostor en la votación, este tiene un intento final para robar la victoria eligiendo la palabra secreta real entre **5 botones táctiles** (1 palabra real + 4 señuelos de la misma categoría).
- **🪪 Escáner Biométrico Despejado (_Hold-to-Reveal_)**:
  - Tarjeta de 2 zonas: visor superior de alta legibilidad (`Space Grotesk`) y sensor inferior para apoyar el pulgar sin tapar la palabra secreta. Incluye modo **Oscuro** y **Modo Claro (Día)** en Configuración.
- **📚 11 Categorías Oficiales & +560 Palabras**:
  - **3 Gratuitas (Base)**: _Comida, Lugares, Animales_ (150 palabras).
  - **8 Exclusivas (PRO)**: _Objetos, Profesiones, Cine y Series, Deportes, Videojuegos y Geek, Música y Artistas, Países y Maravillas, Fiesta +18_ (+410 palabras).
  - **🔞 Sección Fiesta +18 (PRO)**: 60 palabras picantes para adultos protegidas con PIN parental personalizable de 4 dígitos.
  - **✨ Categorías Personalizadas (PRO)**: Crea tus propias listas temáticas directamente desde Configuración.
- **🃏 Rol Especial: El Bufón (PRO)**: Un jugador conoce la palabra secreta pero gana en solitario si logra actuar sospechoso y hacer que el grupo lo vote.
- **⚡ Eventos Relámpago de Ronda y Ruleta de Retos (PRO)**: Modificadores sorpresa para el debate y ruleta de penitencias al finalizar la partida.
- **👑 Sistema Party Pass PRO, Prueba Gratuita de 1 Ronda & Auto-Entrega de Fundadores**:
  - Modal de la Corona dividido en **2 pestañas independientes** (`Planes VIP` | `Canjear Código`) optimizado para teclados móviles con botón **Pegar** en 1 toque.
  - **Prueba Gratuita VIP de 1 Ronda** para que cualquier grupo pruebe todas las funciones PRO al instante.
  - **Desbloqueo Provisional Instantáneo** al reportar una transferencia para no interrumpir la fiesta, y **Auto-Entrega del Pase Fundador Vitalicio (`#001` a `#100` + 5 Pases de Invitado de 24h)** al aprobarse el cobro.
- **💾 Persistencia Permanente en Cloudflare KV (`IMPOSTER_KV`)**:
  - Bóveda distribuida en el Edge que conserva permanentemente fundadores, pases de invitado, reportes de cobro, configuración bancaria, cupones de prueba y telemetría global.
- **⚡ Rendimiento Móvil 60/120 FPS (GPU Hardware Accelerated)**:
  - Modales desmontados dinámicamente fuera de uso, capas compuestas aceleradas por GPU (`translateZ(0)`) y navegación SPA con **0 ms de parpadeo** entre el juego y la consola administrativa.

---

## 🎯 Flujo de la Partida

1. **Paso 1 — Sala de Jugadores**:
   - Agrega los nombres de los participantes (3–6 en versión gratuita, hasta 15 en versión PRO) o abre una **Sala Online** para jugar cada uno desde su móvil.
2. **Paso 2 — Reglas y Roles**:
   - Ajusta el número de impostores, el tiempo de debate y activa modificadores como **Pista Camaleón**, **El Bufón** o **Eventos Relámpago**.
3. **Paso 3 — Selección de Categoría**:
   - Elige una tarjeta del mazo temático, selecciona **Aleatoria** o desbloquea **Fiesta +18** con tu PIN.
4. **Fase de Revelación (_Pass & Play_ u _Online_)**:
   - Cada jugador mantiene presionado el escáner biométrico para ver su palabra secreta (o su tarjeta roja de Impostor / tarjeta púrpura de Bufón).
5. **Fase de Debate**:
   - El jugador inocente seleccionado inicia la ronda diciendo una palabra relacionada mientras corre el reloj radial con efectos de sonido Web Audio API.
6. **Votación & Última Oportunidad**:
   - El grupo vota para atrapar a los impostores. Si un impostor es descubierto, se activa el minijuego de **5 palabras** para intentar robar el triunfo.

---

## 👑 Comparativa: Versión Normal (Gratis) vs. Party Pass PRO

| Característica                           | 🟢 Normal (Gratis)                         | 👑 Party Pass PRO (Pago)                                        |
| :--------------------------------------- | :----------------------------------------- | :-------------------------------------------------------------- |
| **Límite de Jugadores**                  | 3 a 6 jugadores                            | **Hasta 15 jugadores** (Salas grandes)                          |
| **Prueba Gratuita VIP**                  | **1 Ronda Completa Gratis** con todo PRO   | Acceso ilimitado durante la vigencia del pase                   |
| **Categorías Base (150 palabras)**       | ✅ Incluidas (_Comida, Lugares, Animales_) | ✅ Incluidas                                                    |
| **Packs PRO Exclusivos (410+ palabras)** | 🔒 Bloqueado                               | ✅ _Cine, Deportes, Geek, Objetos, Profesiones, Música, Países_ |
| **Categoría Picante Fiesta +18**         | 🔒 Bloqueado                               | ✅ **60 palabras para adultos** (con PIN)                       |
| **Modos y Roles Especiales**             | Modo Cómplice y Modo Caos                  | + **Pista Camaleón**, **El Bufón** y **Eventos Relámpago**      |
| **Listas Personalizadas**                | 🔒 Bloqueado                               | ✅ Creación ilimitada de listas propias                         |
| **Salas Online & Código QR**             | ✅ Incluidas                               | ✅ Incluidas                                                    |

---

## 🛡️ Seguridad y Protección (9 Blindajes Activos)

> 📄 Consulta la guía técnica detallada en **[`SEGURIDAD.md`](./SEGURIDAD.md)**.

1. **🔒 Cero Claves en Texto Plano (Hashing SHA-256 + Anti-Fuerza Bruta)**.
2. **🛡️ Tokens Firmados de Doble Nivel en `localStorage` (Anti-F12 Tampering)**.
3. **🔑 Generador y Rotación Dinámica de Llave Maestra en Vivo (Revocación Instantánea)**.
4. **💾 Bóveda Persistente en Cloudflare KV (`IMPOSTER_KV`) con Sincronización Edge**.
5. **🕵️ Cero Exposición de Prefijos o Formatos Internos en la Ventana Pública de Canje**.
6. **🧹 Sanitización Estricta de Packs JSON (`sanitizeImportedCategories`)**.
7. **🌐 Cabeceras HTTP Anti-Clonación (`public/_headers`)**.
8. **🔞 Anti-Fuerza Bruta en PIN Parental (+18)**.
9. **🚦 Anti-Spam Rate Limiting y Sanitización Anti-XSS en Pasarela de Pagos**.

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

### **Ejecutar Pruebas y Linter**

```bash
npm run lint
npm test
```

### **Despliegue a Producción (Cloudflare Workers + KV)**

Compila la aplicación, inyecta automáticamente el enlace a `IMPOSTER_KV` en `.output/server/wrangler.json` y despliega en `https://imposter.manu-07games.workers.dev`:

```bash
npm run deploy
```

---

## 🏗️ Stack Tecnológico

- **Frontend & SSR**: React 19 + TypeScript + TanStack Start (Router + SSR)
- **Estilos & Motion**: Tailwind CSS v4 + Animaciones aceleradas por GPU (`translateZ(0)`)
- **Iconografía**: Lucide React (100% libre de emojis en la interfaz)
- **Audio Engine**: Web Audio API sintetizada (_zero-asset / zero-latency_)
- **Bundler & PWA**: Vite + Service Worker nativo + Screen Wake Lock
- **Edge Runtime & Base de Datos**: Cloudflare Workers + Cloudflare KV (`IMPOSTER_KV`)
- **Bot & Copiloto IA**: Discord.js v14 + Google Gemini Flash Lite + OpenRouter + Groq Cloud en Render (`https://atlas-bot-2xh4.onrender.com`)
- **Testing**: Vitest + Testing Library
