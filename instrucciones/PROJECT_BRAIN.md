# 🧠 PROJECT BRAIN — PLANOS MAESTROS Y MANUAL DE VUELO DE IMPOSTER (v2.0.2)

> **Documento Oficial de Relevo Técnico y Arquitectura de Negocio**  
> **Para el CEO (L7Manuel) y cualquier Desarrollador o Inteligencia Artificial que trabaje en este proyecto.**  
> _Última actualización: Noviembre 2026 (`v2.0.2`) | Estado del Sistema: 100% Operativo en Producción con Persistencia en Cloudflare KV (`IMPOSTER_KV`), arranque optimizado y Service Worker Workbox con precache completo._

---

## ⚡ 1. PROMPT DE ACTIVACIÓN INMEDIATA PARA CUALQUIER OTRA IA

_(Si en algún momento usas otra herramienta de IA, copia y pega el siguiente bloque exacto en el primer mensaje junto a este archivo):_

```text
Actúa como el Desarrollador Principal y Arquitecto de Software de "Imposter" (v2.0.2).
He cargado el archivo PROJECT_BRAIN.md que contiene la arquitectura completa, las decisiones de negocio, las reglas intocables y el mapa de código del repositorio.

Por favor confirma que entiendes:
1. El stack: TanStack Start (SSR/React 19) + Cloudflare Workers + Cloudflare KV (`IMPOSTER_KV`) + Vite + Nitro + Tailwind CSS v4 + Lucide React (0% emojis en la UI).
2. La infraestructura auxiliar: Bot de Discord "Atlas" en Node.js desplegado en Render (`https://atlas-bot-2xh4.onrender.com`).
3. La persistencia permanente: Todo el estado de negocio (`imposter:vault:v2`) y telemetría (`imposter:telemetry:v2`) se guarda en Cloudflare KV (`IMPOSTER_KV`, id `7180313d223a4cb795b35e141478d18c`) y en `.wrangler/` durante desarrollo local.
4. El filtro de telemetría: El dispositivo del CEO está excluido de métricas y alertas en Discord.
5. Los comandos de despliegue: `npm run deploy` compila, inyecta `IMPOSTER_KV` en `.output/server/wrangler.json` y despliega en Cloudflare Workers (`--name imposter`).
6. El rendimiento: modales cargados con `React.lazy`, cronómetro de debate aislado en `PhaseDiscuss`, fuentes autoalojadas en `public/fonts`, Service Worker Workbox con precache de ~30 assets y Modo Rendimiento opcional (sin `backdrop-filter`).

Dime que estás listo y cuál es el estado del proyecto para recibir mi primera instrucción.
```

---

## 🗺️ 2. EL MAPA DE LA CASA (ARQUITECTURA MODULAR v2.0.2)

Toda la aplicación está modularizada en TypeScript estricto y componentes desacoplados para mantener **60/120 FPS** en cualquier teléfono:

```
Imposter/
├── bot/
│   └── index.js                         # 🤖 Bot de Discord "Atlas" (Servidor Node en Render)
├── public/                              # 📱 Manifiesto PWA, iconos, offline.html, _headers
│   └── fonts/                           # 🔤 4 woff2 autoalojados (Bungee + Space Grotesk, 0 Google Fonts)
├── src/
│   ├── components/
│   │   ├── CategoryIcon.tsx             # 🎨 Iconos vectoriales Lucide para todas las categorías
│   │   ├── ceo/                         # 👑 Pestañas modulares del Panel Ejecutivo (/ceo)
│   │   │   ├── CeoFoundersTab.tsx       #    • Gestión de los 100 Pases Fundador y sus 500 Pases de Invitado
│   │   │   ├── CeoPaymentsTab.tsx       #    • Aprobación en 1 toque, Pago Móvil, Binance Pay y Calculadora Bs
│   │   │   ├── CeoTestersTab.tsx        #    • Monitor de los 10 Cupones VIP (48h) con botón "Liberar" individual
│   │   │   └── CeoMetricsTab.tsx        #    • KPIs globales, radar de dispositivos, top categorías y Webhook
│   │   ├── game/                        # 🎮 Fases de Juego y Multijugador Online
│   │   │   ├── PhaseSetup.tsx           #    • Wizard de 3 pasos (1. Jugadores, 2. Reglas, 3. Categorías)
│   │   │   ├── PhaseReveal.tsx          #    • Escáner Biométrico de 2 zonas (visor superior + sensor inferior) + Pista Camaleón
│   │   │   ├── PhaseDiscuss.tsx         #    • Reloj radial de debate (cronómetro interno aislado) + Eventos Relámpago
│   │   │   ├── PhaseVote.tsx            #    • Mesa de votación táctil + Minijuego de 5 opciones del Impostor
│   │   │   ├── PhaseResult.tsx          #    • Pantalla de victoria con confeti + Ruleta de Retos
│   │   │   └── OnlineRoomModal.tsx      #    • Salas Online Multijugador con código de 4 letras en vivo
│   │   └── modals/                      # 🪟 Modales con montaje condicional (0 costo en reposo)
│   │       ├── PaywallModal.tsx         #    • Ventana de la Corona con 2 pestañas (Planes VIP | Canjear Código)
│   │       ├── FounderPassesModal.tsx   #    • Bóveda del Fundador con sus 5 Pases de Invitado para compartir
│   │       ├── SettingsModal.tsx        #    • Ajustes de sonido, vibración, PIN parental y acceso rápido
│   │       ├── AdultPinModal.tsx        #    • Teclado numérico +18 con bloqueo anti-fuerza bruta
│   │       ├── ShareModal.tsx           #    • Código QR dinámico e invitación nativa
│   │       └── InstallPwaModal.tsx      #    • Guía e instalador nativo para Android e iOS
│   ├── data/
│   │   ├── categories.ts                # 📚 11 Categorías (+560 palabras), Pistas Camaleón y Retos de Fiesta
│   │   └── game-events.ts               # ⚡ Eventos Relámpago de ronda
│   ├── lib/
│   │   ├── payment-config.ts            # 💳 Precios de planes, cuentas Pago Móvil, Binance Pay y tipos
│   │   ├── coupon-server.ts             # 🎟️ RPC Server Functions + Persistencia KV + Auto-Entrega Fundador
│   │   ├── room-server.ts               # 🌐 Servidor de Salas Online Multijugador en tiempo real
│   │   ├── telemetry.ts                 # 📊 Captura de eventos cliente (con filtro anti-CEO)
│   │   ├── telemetry-server.ts          # 🛰️ Persistencia KV de telemetría + Reenvío a Atlas y Discord
│   │   ├── security.ts                  # 🛡️ Criptografía SHA-256, firmas FNDR, Llaves CEO dinámicas y sanitizador
│   │   ├── audio-effects.ts             # 🔊 Motor de sonido sintetizado Web Audio API (0 latencia)
│   │   ├── confetti.tsx                 # 🎊 Motor de partículas en Canvas a 60 FPS
│   │   ├── pwa-install.ts               # 📲 Detección e instalación PWA (Android / iOS)
│   │   ├── register-sw.ts               # 🔄 Registro único del SW con updateViaCache "none" y recarga diferida
│   │   └── wake-lock.ts                 # 🔆 Mantiene la pantalla encendida durante las partidas
│   ├── routes/
│   │   ├── index.tsx                    # 🎮 Orquestador principal de partida y sincronización de estados
│   │   └── ceo.tsx                      # 👑 Centro de Mandos Ejecutivo (/ceo) con transición SPA Cero-Parpadeo
│   └── styles.css                       # 🎨 Tailwind v4, animaciones GPU (transform), modo bajo rendimiento y reduced-motion
├── instrucciones/
│   ├── PROJECT_BRAIN.md                 # 🧠 ESTE DOCUMENTO (Planos maestros)
│   └── system prompt_historial.md       # 🧭 Rol, reglas inquebrantables y fase actual
├── README.md                            # 📖 Documentación general del repositorio
├── ROADMAP_MEJORAS.md                   # 🚀 Estado de funcionalidades e hitos completados
├── SEGURIDAD.md                         # 🔒 Explicación técnica de los 9 blindajes de seguridad
├── CEO_CONFIDENCIAL.md                  # 🔐 Manual privado de credenciales (EXCLUIDO DE GIT en .gitignore)
└── package.json                         # 📦 Scripts de build (binding IMPOSTER_KV), test y deploy
```

---

## 💾 3. MEMORIA PERMANENTE EN CLOUDFLARE KV (`IMPOSTER_KV`)

A partir de `v2.0.1`, la aplicación cuenta con persistencia permanente en el Edge mediante el namespace oficial **`IMPOSTER_KV`** (`id: 7180313d223a4cb795b35e141478d18c`):

1. **Bóveda Comercial (`imposter:vault:v2` en `src/lib/coupon-server.ts`)**:
   - Guarda permanentemente:
     - `founders`: Los 100 Pases Fundador emitidos/reclamados y el estado de sus 500 Pases de Invitado (`FNDRXXXX-PX-YYY`).
     - `payments`: Historial de pagos pendientes, aprobados (incluyendo `founderNumber` y `founderCode` auto-entregados) y rechazados.
     - `paymentConfig`: Datos de Pago Móvil, Binance Pay, tasa Bs/\$, WhatsApp y precios editados desde `/ceo`.
     - `usedCoupons`: Estado de uso de los 10 cupones VIP de testers (48h) y sus liberaciones.
     - `activeCeoVerifyHash` & `ceoKeyMeta`: Estado de la Llave Maestra CEO activa y su versión de bóveda.
2. **Bóveda de Telemetría (`imposter:telemetry:v2` en `src/lib/telemetry-server.ts`)**:
   - Conserva el acumulado histórico de partidas iniciadas, partidas finalizadas, instalaciones PWA, vistas a la ventana de la Corona, desglose por dispositivo (Android / iOS / Desktop) y ranking de categorías.
3. **Sincronización Multi-Isolate (Cada 2 segundos) y Fallback Local**:
   - En producción usa `globalThis.__env__.IMPOSTER_KV`.
   - En modo desarrollo (`npm run dev`), persiste automáticamente en `.wrangler/imposter-vault-dev.json` y `.wrangler/imposter-telemetry-dev.json` (excluidos de Git).

---

## 👑 4. AUTO-ENTREGA DEL PASE FUNDADOR Y FLUJO DE COMPRA

1. **Reporte de Pago con Desbloqueo Provisional Instantáneo**:
   - Cuando un jugador reporta su transferencia de cualquier plan (24h, 72h, 30 días o Fundador Vitalicio \$9.99), recibe **acceso provisional inmediato** para que su fiesta no se detenga mientras el CEO revisa la referencia.
2. **Aprobación en 1 Toque en `/ceo` → `Cobros`**:
   - Si el pago corresponde al plan **`founder`** (Edición Fundador Vitalicio):
     - El servidor busca automáticamente el primer número de Fundador libre del `#1` al `#100`.
     - Genera su código oficial `FNDR-XXXX-YYYY` y sus **5 Pases de Invitado (`FNDRXXXX-P1-YYY` a `P5`)**.
     - Registra al comprador como Fundador activo en `IMPOSTER_KV` y adjunta `founderNumber` y `founderCode` al pago aprobado.
   - En el teléfono del comprador (que verifica el estado cada 4 segundos en segundo plano):
     - Se activa su insignia dorada permanente **`FUNDADOR #X`** en la cabecera.
     - Se abre automáticamente su **Bóveda de Fundador (`FounderPassesModal`)** con sus 5 pases de invitado listos para compartir por WhatsApp con sus amigos.

---

## ⚡ 5. RENDIMIENTO, ARRANQUE Y PWA (v2.0.2)

### A. Interfaz móvil

- **Cabecera en dos filas**: título + subtítulo arriba y el dock (corona/PRO, QR, volumen, ajustes y marcador) en una fila propia a ancho completo, eliminando el recorte horizontal en pantallas de 360 px.
- **Viewport bloqueado**: `maximum-scale=1, user-scalable=no, viewport-fit=cover` y `overflow-x: hidden` global para evitar zoom accidental y desplazamiento lateral dentro de la TWA.

### B. Presupuesto de JavaScript y render

- **Modales bajo demanda**: `PaywallModal`, `OnlineRoomModal`, `SettingsModal`, `InstallPwaModal`, `AdultPinModal`, `ShareModal` y `FounderPassesModal` se cargan con `React.lazy` + `Suspense` solo al abrirse. El chunk de rutas bajó de ~192 KB a ~103 KB.
- **Cronómetro aislado**: el reloj del debate vive dentro de `PhaseDiscuss.tsx`; ya no re-renderiza el orquestador completo cada segundo.
- **Animaciones compuestas**: el láser del escáner usa `transform: translate3d` con `will-change`, y `transition-all` fue reemplazado por `transition` en los componentes interactivos.
- **Desenfoques acotados**: `backdrop-blur` se aplica solo en `sm:` y en overlays críticos; en móvil no hay blur salvo la ventana de resultado.

### C. Fuentes y assets

- **Fuentes autoalojadas** en `public/fonts/` (Bungee y Space Grotesk, 4 woff2 con `unicode-range`), precargadas en el `<head>`; ya no se hacen peticiones a Google Fonts.
- **Icono `icon-512.png`** recompreso de ~240 KB a ~160 KB sin pérdida visual.
- **Confetti**: máximo 100 partículas (40 en modo rendimiento) y desactivado con `prefers-reduced-motion`.

### D. Modo Rendimiento (opt-in)

- Interruptor en **Ajustes → Modo Rendimiento** que aplica `data-perf="low"` al `<html>`: elimina todos los `backdrop-filter` de la app.
- Se persiste en `localStorage["impostor-perf"]` y un script inline lo aplica **antes del primer paint**, junto con el tema claro.

### E. Service Worker (Workbox)

- `vite-plugin-pwa` genera `sw.js` con **precache de ~30 assets (~1,036 KiB)**, incluidas las 4 fuentes woff2, chunks con hash y `offline.html`.
- Rutas runtime: navegación `NetworkFirst`, assets con hash `CacheFirst`, JS/CSS/JSON y API `NetworkFirst`, imágenes y fuentes `CacheFirst`.
- **Regla de oro**: nunca copiar un `sw.js` manual/antiguo sobre `.output/public/sw.js`; el build debe dejar intacto el SW generado por Workbox para conservar el precache.
- El registro usa `updateViaCache: "none"`, comprueba actualizaciones al volver a primer plano y recarga de forma diferida (nunca durante una partida).

---

## 🕹️ 6. COMANDOS OFICIALES DE OPERACIÓN

Ejecuta estos comandos en PowerShell desde `c:\Users\Lermit\Desktop\Imposter`:

### A. Desarrollo Local

```powershell
npm run dev
```

Abre `http://localhost:8080`.

### B. Verificación de Calidad (Linter + Pruebas + Build)

```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
```

### C. Despliegue a Producción (Cloudflare Workers + KV)

```powershell
npm run deploy
```

1. Compila el cliente y el servidor SSR con Vite y Nitro.
2. Deja intacto el `sw.js` generado por Workbox (precache de ~30 assets, incluidas las fuentes).
3. Inyecta `kv_namespaces: [{ binding: "IMPOSTER_KV", id: "7180313d223a4cb795b35e141478d18c" }]` en `.output/server/wrangler.json`.
4. Publica en `https://imposter.manu-07games.workers.dev` con el Worker `imposter` (bindings esperados: `ASSETS` + `IMPOSTER_KV`).
