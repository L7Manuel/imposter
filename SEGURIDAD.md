# 🛡️ Arquitectura de Seguridad y Blindaje — Imposter (v2.0.1)

Este documento detalla las **9 capas de seguridad (Blindajes)** implementadas en **Imposter** para proteger la aplicación en producción (`https://imposter.manu-07games.workers.dev`) contra inspección de código, manipulación de almacenamiento local, filtración de prefijos internos, inyección de datos maliciosos, clonación mediante _iframes_, fuerza bruta y ataques de saturación en pasarelas de pago.

---

## 🔒 Blindaje 1: Cero Claves en Texto Plano + Hashing Criptográfico SHA-256

### **Amenaza mitigada**
En aplicaciones web cliente (_Single Page Applications_), cualquier usuario curioso puede abrir las Herramientas de Desarrollador (`F12` ➔ _Sources_) y buscar palabras clave dentro del código JavaScript compilado para intentar descubrir códigos de acceso.

### **Solución implementada ([`src/lib/security.ts`](./src/lib/security.ts))**
1. **Eliminación total de texto plano**: Ninguna clave maestra ni cupón promocional existe escrito como texto plano dentro del código fuente ni en el paquete compilado de producción.
2. **Motor SHA-256 puro (RFC 6234) con _Salt_**:
   - Cuando el usuario introduce un código en el modal `Party Pass PRO`, el texto se normaliza y se combina con una sal criptográfica (`CODE_SALT`).
   - Se calcula el hash irreversible de 256 bits (`token = sha256(CODE_SALT + input)`).
3. **Protección Anti-Fuerza Bruta (_Rate Limiting_)**:
   - Si un usuario o script automatizado falla **5 intentos consecutivos**, el canje de códigos se bloquea automáticamente durante **30 segundos**, mostrando una cuenta regresiva de seguridad.

---

## 🛡️ Blindaje 2: Tokens Firmados de Doble Nivel en `localStorage` (Anti-F12 Tampering)

### **Amenaza mitigada**
Si una aplicación guarda estados simples como `localStorage.setItem("impostor-pro-unlocked", "true")`, un usuario puede abrir `F12` ➔ _Application_ ➔ _Local Storage_ y escribir `"true"` manualmente, o copiar un hash visto en el código fuente y pegarlo en `localStorage`.

### **Solución implementada ([`src/lib/security.ts`](./src/lib/security.ts) & [`src/routes/index.tsx`](./src/routes/index.tsx))**
1. **Esquema de Doble Hash (_Two-Stage Verification_)**:
   - **Nivel 1 (Token de Almacenamiento)**: `token = sha256(CODE_SALT + CLAVE_SECRETA)`. Este valor solo se puede obtener conociendo la clave original y es el que se persiste en `localStorage`.
   - **Nivel 2 (Hash de Verificación Pública)**: `verifyHash = sha256(VERIFY_SALT + token)`. Este segundo hash es el **único** valor presente en el código fuente compilado.
2. **Inmunidad ante copiar y pegar desde `F12`**:
   - Si alguien inspecciona el bundle JS y copia el `verifyHash` para pegarlo en `localStorage`, la función `isValidStoredToken()` volverá a aplicar `sha256(VERIFY_SALT + valorPegado)`, dando un resultado distinto y revocando el acceso automáticamente.

---

## 🔑 Blindaje 3: Generador y Rotación Dinámica de Llave Maestra CEO en Vivo

### **Amenaza mitigada**
Si el administrador inicia sesión en un teléfono prestado o desea cambiar periódicamente su credencial maestra sin tocar código ni redesplegar la aplicación.

### **Solución implementada ([`src/routes/ceo.tsx`](./src/routes/ceo.tsx) & [`src/lib/coupon-server.ts`](./src/lib/coupon-server.ts))**
- En la pestaña **`Llave CEO`** del panel `/ceo`, el administrador puede generar nuevas llaves maestras firmadas criptográficamente o escribir una personalizada.
- Al activarla en 1 toque:
  1. Se actualiza el hash maestro activo en **Cloudflare KV (`IMPOSTER_KV`)**.
  2. Cualquier sesión anterior abierta en otros dispositivos queda **revocada de inmediato**.
  3. El bot **Atlas** envía automáticamente una copia de respaldo al canal privado de Discord del CEO.
  4. Incluye botón de emergencia para **Restaurar Llave de Fábrica** en cualquier momento.

---

## 🕵️ Blindaje 4: Limpieza Total de Formatos y Pistas Internas en la Ventana Pública

### **Amenaza mitigada**
Mostrar placeholders o etiquetas de ejemplo con el formato interno de los códigos (`FNDR-...`, `VIP-...` o menciones a llaves administrativas) en la ventana pública de canje incita a los usuarios a intentar adivinar combinaciones.

### **Solución implementada ([`src/components/modals/PaywallModal.tsx`](./src/components/modals/PaywallModal.tsx))**
- La pestaña pública **`Canjear Código`** utiliza únicamente textos genéricos (`"Ingresa tu código promocional o pase de invitado"`, placeholder `"ESCRIBE TU CÓDIGO AQUÍ..."`).
- Cero menciones a códigos de fundador, cupones de tester o llaves ejecutivas en la interfaz pública de los jugadores.

---

## 💾 Blindaje 5: Bóveda Persistente en Cloudflare KV (`IMPOSTER_KV`)

### **Amenaza mitigada**
Los entornos serverless reinician su memoria RAM periódicamente; si los cupones de 1 solo uso o los pases de fundador solo vivieran en RAM, un reinicio de instancia permitiría reutilizar un cupón ya gastado.

### **Solución implementada ([`src/lib/coupon-server.ts`](./src/lib/coupon-server.ts) & [`src/lib/telemetry-server.ts`](./src/lib/telemetry-server.ts))**
- Todos los canjes de cupones, pases de fundador, pases de invitado de 24h y aprobaciones de cobro se sincronizan y persisten en **Cloudflare KV (`IMPOSTER_KV`)**, garantizando que un código de 1 solo uso jamás pueda reutilizarse aunque el Worker escale o se reinicie.

---

## 🧹 Blindaje 6: Sanitización Estricta de JSON y Entradas (Anti-XSS & Prototype Pollution)

### **Solución implementada (`sanitizeImportedCategories` en [`src/lib/security.ts`](./src/lib/security.ts))**
- Rechaza cargas mayores a `50 KB` antes de ejecutar `JSON.parse()`.
- Filtra `__proto__`, `constructor`, `prototype` y todos los nombres de categorías oficiales reservadas.
- Elimina caracteres `<` y `>`, limita a 20 categorías por paquete y entre 3 y 150 palabras válidas sin duplicados.

---

## 🌐 Blindaje 7: Cabeceras HTTP de Seguridad en Cloudflare ([`public/_headers`](./public/_headers))

| Cabecera HTTP             | Valor Configurado                                             | Protección                                                                              |
| :------------------------ | :------------------------------------------------------------ | :-------------------------------------------------------------------------------------- |
| `X-Frame-Options`         | `DENY`                                                        | Impide que páginas piratas incrusten el juego dentro de un `<frame>` o `<iframe>`.      |
| `Content-Security-Policy` | `frame-ancestors 'none'; object-src 'none'; base-uri 'self';` | Estándar anti-_Clickjacking_ e inyección de objetos externos.                           |
| `X-Content-Type-Options`  | `nosniff`                                                     | Bloquea el _MIME-sniffing_ del navegador.                                               |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                             | Protege la privacidad de las rutas internas al navegar hacia enlaces externos.          |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=(), payment=()`        | Bloquea el acceso a sensores sensibles del teléfono que el juego no necesita.           |

---

## 🔞 Blindaje 8: Protección Anti-Fuerza Bruta en PIN Parental (+18)

- Al llegar a **5 intentos fallidos consecutivos** en el teclado numérico de la categoría **Fiesta +18**, el teclado se bloquea automáticamente durante **60 segundos** con cuenta regresiva en vivo.

---

## 🚦 Blindaje 9: Anti-Spam Rate Limiting y Sanitización Anti-XSS en Pagos

- **Límite Estricto**: Máximo **3 envíos de comprobantes cada 2 minutos** en `submitPaymentProofServerFn`.
- **Purga de Caracteres Peligrosos**: Limpieza de `<` y `>` y validación alfanumérica estricta en referencias bancarias antes de guardar en `IMPOSTER_KV` o enviar embeds a Discord.

---

## ✅ Verificación Automatizada

El módulo criptográfico, la rotación de llaves maestras, los pases de fundador y el sanitizador cuentan con **9 pruebas unitarias automatizadas** en [`src/test/app-routing.test.tsx`](./src/test/app-routing.test.tsx):

```bash
npm test
```
