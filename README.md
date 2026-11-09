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
- **👑 Sistema Party Pass PRO & Panel Ejecutivo**: Modelo _Freemium_ integrado con desbloqueo por pase o código promocional y telemetría local de partidas.
- **📲 Invitación Viral con Código QR**: Modal integrado en el encabezado con generador QR dinámico y botón de compartir nativo (`navigator.share`) para que los amigos abran el juego al instante en sus teléfonos.
- **⏳ Reloj Radial de Tensión & SFX Web Audio**: Anillo circular dinámico con latido cardíaco en los últimos 10 segundos y efectos de sonido sintetizados en tiempo real (cero latencia y 100% offline).
- **📱 PWA & Offline First**: Instalable en iOS, Android y escritorio mediante Service Workers.
- **🛡️ Blindaje de Seguridad de 4 Capas**: Protección criptográfica SHA-256 de doble nivel (cero claves en texto plano y anti-manipulación de `localStorage`), bloqueo anti-fuerza bruta, sanitización estricta de JSON y cabeceras HTTP anti-_Clickjacking_ en Cloudflare.

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

## 🛡️ Seguridad y Protección (4 Blindajes Activos)

> 📄 Consulta la guía técnica completa en **[`SEGURIDAD.md`](./SEGURIDAD.md)** para conocer en detalle la arquitectura criptográfica y de protección del proyecto.

1. **🔒 Cero Claves en Texto Plano (Hashing SHA-256 + Anti-Fuerza Bruta)**:
   - Ningún código promocional ni clave administrativa existe en texto plano dentro del bundle JS. Se verifican mediante `SHA-256` con sal criptográfica y bloqueo temporal de 30 segundos tras 5 intentos fallidos.
2. **🛡️ Tokens Firmados de Doble Nivel en `localStorage` (Anti-F12)**:
   - El estado PRO/CEO no usa booleanos (`"true"`), sino tokens criptográficos de primer nivel validados contra un hash de segundo nivel (`sha256(VERIFY_SALT + sha256(CODE_SALT + clave))`). Copiar hashes del código fuente o escribir `"true"` en `localStorage` revoca y limpia el acceso automáticamente.
3. **🧹 Sanitización Estricta de Packs JSON (`sanitizeImportedCategories`)**:
   - Protege la importación de categorías contra _Prototype Pollution_ (`__proto__`, `constructor`), inyección de etiquetas HTML (`< >`), sobrescritura de categorías oficiales y desbordamiento de memoria (_DoS_).
4. **🌐 Cabeceras HTTP Anti-Clonación (`public/_headers`)**:
   - Configura `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` y `Permissions-Policy` en Cloudflare para impedir que sitios de terceros incrusten el juego en un `<iframe>`.

---

## 🚀 Instalación y Ejecución

### **Requisitos**

- **Node.js 18+**

### **Instalar Dependencias**

```bash
npm install
```

### **Servidor de Desarrollo**

```bash
npm run dev
```

Accede en tu navegador a: `http://localhost:8080`

### **Compilar para Producción**

```bash
npm run build
npm run preview
```

### **Ejecutar Pruebas**

```bash
npm test
```

---

## 🏗️ Stack Tecnológico

- **Framework**: React 19 + TypeScript + TanStack Start (Router + SSR)
- **Estilos & Motion**: Tailwind CSS v4 + Glassmorphism + Keyframes personalizados
- **Iconografía**: Lucide React
- **Audio Engine**: Web Audio API sintetizada (_zero-asset / zero-latency_)
- **Bundler & PWA**: Vite + Service Worker
- **Testing**: Vitest + Testing Library
