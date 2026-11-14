# 🚀 Roadmap de Mejoras y Estado del Producto — Imposter (v2.0.1)

Este documento resume el estado actual de todas las funciones implementadas en **Imposter (`v2.0.1`)** y cómo se estructura la experiencia entre **🟢 Normal (Gratis)** y **👑 Party Pass PRO (Pago)**.

---

## 📊 1. Matriz Completa de Funciones Implementadas (`v2.0.1`)

| Función / Característica                                      |         Nivel          | Estado en Producción |
| :------------------------------------------------------------ | :--------------------: | :------------------: |
| **Wizard de Configuración en 3 Pasos (Jugadores / Reglas / Categorías)** | 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **Salas Presenciales de 3 a 6 Jugadores**                     | 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **Salas Grandes de 7 a 15 Jugadores**                         |   👑 **PRO (Pago)**    | ✅ **Activo** |
| **Prueba Gratuita VIP de 1 Ronda Completa**                   | 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **Salas Online Multijugador en Tiempo Real (Código 4 Letras)**| 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **Tarjeta Roja Garantizada del Impostor en Escáner**          | 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **Pista Camaleón (Palabra Señuelo para el Impostor)**         |   👑 **PRO (Pago)**    | ✅ **Activo** |
| **Minijuego de Última Oportunidad (5 Palabras en Botones)**   | 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **3 Categorías Esenciales (150 palabras)**                    | 🟢 **Normal (Gratis)** | ✅ **Activo** |
| **8 Categorías Premium & Fiesta +18 (+410 palabras)**         |   👑 **PRO (Pago)**    | ✅ **Activo** |
| **Rol Especial: El Bufón**                                    |   👑 **PRO (Pago)**    | ✅ **Activo** |
| **Eventos Relámpago de Ronda y Ruleta de Retos**              |   👑 **PRO (Pago)**    | ✅ **Activo** |
| **Creador e Importador de Listas Propias (JSON)**             |   👑 **PRO (Pago)**    | ✅ **Activo** |
| **Desbloqueo Provisional Instantáneo al Reportar Pago**       | 🟢 **Conversión VIP**  | ✅ **Activo** |
| **Auto-Entrega de Pase Fundador (`#001`–`#100`) + 5 Pases Invitado** | 👑 **Fundador VIP** | ✅ **Activo** |
| **Ventana de la Corona en 2 Pestañas (`Planes VIP` \| `Canjear Código`)** | 🟢 **UX Móvil** | ✅ **Activo** |
| **Memoria Permanente en Cloudflare KV (`IMPOSTER_KV`)**       | 🛡️ **Infraestructura** | ✅ **Activo** |
| **Panel Ejecutivo `/ceo` Cero-Parpadeo + Generador Llave CEO**|    🛡️ **Admin CEO**    | ✅ **Activo** |
| **Optimización Móvil 60/120 FPS (GPU Accelerated)**           | 🛡️ **Rendimiento**     | ✅ **Activo** |

---

## 🏆 2. Hitos Completados en `v2.0.0` y `v2.0.1`

### ✅ Bloque A: Jugabilidad y Mecánicas de Fiesta
1. **Tarjeta Roja Garantizada + Pista Camaleón**: El impostor siempre identifica claramente su rol con la tarjeta roja y, si la Pista Camaleón está activa, recibe una palabra señuelo para camuflarse en el debate.
2. **Minijuego de 5 Opciones para el Impostor Descubierto**: Cuando el grupo atrapa al impostor, este puede robar la victoria eligiendo la palabra secreta correcta entre 5 opciones táctiles de la misma categoría.
3. **Salas Online Multijugador (`OnlineRoomModal.tsx` & `room-server.ts`)**: Permite jugar a distancia sincronizando fases, cartas individuales y votaciones en tiempo real.
4. **Ruleta de Retos de Fiesta**: Penitencias familiares en modo normal y retos picantes en modo PRO al finalizar cada partida.

### ✅ Bloque B: Monetización sin Fricción y Bóveda Permanente
5. **Prueba Gratuita VIP de 1 Ronda**: Cualquier grupo puede probar todas las funciones PRO durante 1 partida completa con 1 toque.
6. **Acceso Provisional Instantáneo + Auto-Entrega de Fundadores**:
   - Al enviar la referencia de Pago Móvil o Binance Pay, el jugador recibe acceso inmediato para seguir jugando mientras el CEO aprueba el cobro.
   - Al aprobar un pago de **Edición Fundador Vitalicio (\$9.99)** en `/ceo`, el servidor asigna automáticamente su número correlativo (`#001` a `#100`), genera su código `FNDR-XXXX` y le entrega en su pantalla sus **5 Pases de Invitado de 24h**.
7. **Persistencia Permanente en Cloudflare KV (`IMPOSTER_KV`)**: Todos los pagos, fundadores, cupones de testers, configuraciones de cobro y métricas quedan respaldados permanentemente en la nube de Cloudflare.

### ✅ Bloque C: Experiencia Móvil 60/120 FPS y Seguridad
8. **Separación de Pestañas en la Corona (`PaywallModal.tsx`)**: Pestaña exclusiva para `Canjear Código` alineada en la parte superior para que el teclado móvil nunca tape el botón de activación, con botón **Pegar** y cero exposición de formatos internos.
9. **Transición SPA Cero-Parpadeo en `/ceo`**: Carga instantánea en el Frame 0 combinando `loaderData` y `localStorage` sin recargas de página.
10. **Aceleración por Hardware GPU**: Modales desmontados cuando están cerrados y animaciones promovidas a capas GPU (`will-change`, `translateZ(0)`).
