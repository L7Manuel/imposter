# 🛡️ Arquitectura de Seguridad y Blindaje — Imposter

Este documento detalla las **4 capas de seguridad (Blindajes)** implementadas en **Imposter** para proteger la aplicación en producción (`https://imposter.manu-07games.workers.dev`) contra inspección de código, manipulación de almacenamiento local, inyección de datos maliciosos y clonación mediante _iframes_.

---

## 🔒 Blindaje 1: Cero Claves en Texto Plano + Hashing Criptográfico SHA-256

### **Amenaza mitigada**

En aplicaciones web cliente (_Single Page Applications_), cualquier usuario curioso puede abrir las Herramientas de Desarrollador (`F12` ➔ _Sources / Red_) y buscar palabras clave como `"CEO"` o `"VIP"` dentro del código JavaScript compilado para robar códigos de acceso.

### **Solución implementada ([`src/lib/security.ts`](./src/lib/security.ts))**

1. **Eliminación total de texto plano**: Ninguna clave de acceso (`CEO` ni `VIP`) existe escrita como texto dentro del código fuente ni en el paquete compilado de producción.
2. **Motor SHA-256 puro (RFC 6234) con _Salt_**:
   - Cuando el usuario introduce un código en el modal `Party Pass PRO`, el texto se normaliza y se combina con una sal criptográfica (`CODE_SALT`).
   - Se calcula el hash irreversible de 256 bits (`token = sha256(CODE_SALT + input)`).
3. **Protección Anti-Fuerza Bruta (_Rate Limiting_)**:
   - Si un usuario o script automatizado falla **5 intentos consecutivos**, el canje de códigos se bloquea automáticamente durante **30 segundos**, mostrando una cuenta regresiva de seguridad.

---

## 🛡️ Blindaje 2: Tokens Firmados de Doble Nivel en `localStorage` (Anti-F12 Tampering)

### **Amenaza mitigada**

Si una aplicación guarda estados simples como `localStorage.setItem("impostor-pro-unlocked", "true")`, un usuario puede abrir `F12` ➔ _Application_ ➔ _Local Storage_ y escribir `"true"` manualmente, o incluso copiar un hash visto en el código fuente y pegarlo en `localStorage`.

### **Solución implementada ([`src/lib/security.ts`](./src/lib/security.ts) & [`src/routes/index.tsx`](./src/routes/index.tsx))**

1. **Esquema de Doble Hash (_Two-Stage Verification_)**:
   - **Nivel 1 (Token de Almacenamiento)**: `token = sha256(CODE_SALT + CLAVE_SECRETA)`. Este valor solo se puede obtener conociendo la clave original y es el que se persiste en `localStorage` (`impostor-pro-token` / `impostor-ceo-token`).
   - **Nivel 2 (Hash de Verificación Pública)**: `verifyHash = sha256(VERIFY_SALT + token)`. Este segundo hash es el **único** valor presente en el código fuente compilado.
2. **Por qué es invulnerable a copiar y pegar desde `F12`**:
   - Si alguien inspecciona el bundle JS y copia el `verifyHash` para pegarlo en `localStorage`, la función `isValidStoredToken()` volverá a aplicar `sha256(VERIFY_SALT + valorPegado)`, dando un resultado completamente distinto.
   - Al detectar un token inválido o manipulado al iniciar la app, el sistema **revoca el acceso y purga automáticamente** la clave adulterada de `localStorage`.

---

## 🧹 Blindaje 3: Sanitización Estricta de JSON y Entradas (Anti-XSS & Prototype Pollution)

### **Amenaza mitigada**

La función de importar paquetes de categorías personalizadas lee un objeto JSON desde el portapapeles. Un JSON manipulado podría intentar:

- **Contaminación de Prototipos (_Prototype Pollution_)** mediante claves como `__proto__`, `constructor` o `prototype`.
- **Sobrescritura de categorías del sistema** (`Aleatoria`, `Fiesta +18`, etc.).
- **Ataques de Denegación de Servicio (_DoS_)** pegando millones de caracteres o arreglos gigantes que congelen el navegador móvil.
- **Inyección de etiquetas HTML/Scripts** (`<script>`, `<img onerror=...>`).

### **Solución implementada (`sanitizeImportedCategories` en [`src/lib/security.ts`](./src/lib/security.ts))**

- **Límite de tamaño de portapapeles**: Rechaza cargas mayores a `50 KB` antes de ejecutar `JSON.parse()`.
- **Bloqueo de claves prohibidas**: Filtra explícitamente `__proto__`, `constructor`, `prototype` y todos los nombres de categorías oficiales reservadas.
- **Limpieza de caracteres y cotas estrictas**:
  - Elimina caracteres `<` y `>` de nombres de categorías y palabras.
  - Máximo **20 categorías** por paquete importado.
  - Máximo **30 caracteres** por título de categoría y **40 caracteres** por palabra.
  - Entre **3 y 150 palabras** válidas (`string`) sin duplicados por categoría.
- **Sanitización en hidratación**: Incluso si alguien modifica `impostor-cats` directamente en `localStorage`, el sanitizador se ejecuta al cargar la aplicación.

---

## 🌐 Blindaje 4: Cabeceras HTTP de Seguridad en Cloudflare ([`public/_headers`](./public/_headers))

### **Amenaza mitigada**

Sitios web de terceros podrían incrustar el juego dentro de un `<iframe>` en páginas llenas de publicidad engañosa (_Clickjacking_ / robo de tráfico), o intentar interceptar recursos mediante _MIME-sniffing_.

### **Solución implementada ([`public/_headers`](./public/_headers))**

Cloudflare aplica automáticamente las siguientes cabeceras de grado empresarial en todas las respuestas:

| Cabecera HTTP             | Valor Configurado                                             | Protección                                                                                    |
| :------------------------ | :------------------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| `X-Frame-Options`         | `DENY`                                                        | Impide que páginas piratas incrusten el juego dentro de un `<frame>` o `<iframe>`.            |
| `Content-Security-Policy` | `frame-ancestors 'none'; object-src 'none'; base-uri 'self';` | Estándar moderno anti-_Clickjacking_ e inyección de objetos externos (`<object>`, `<embed>`). |
| `X-Content-Type-Options`  | `nosniff`                                                     | Bloquea el _MIME-sniffing_ del navegador para evitar ejecución de archivos disfrazados.       |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                             | Protege la privacidad de las rutas internas al navegar hacia enlaces externos.                |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=(), payment=()`        | Bloquea el acceso a sensores sensibles del teléfono que el juego no necesita.                 |

---

## ✅ Verificación Automatizada

El módulo criptográfico y el sanitizador cuentan con pruebas unitarias automatizadas en [`src/test/app-routing.test.tsx`](./src/test/app-routing.test.tsx). Puedes ejecutarlas en cualquier momento con:

```bash
npm test
```
