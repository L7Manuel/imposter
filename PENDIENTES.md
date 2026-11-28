# 📌 Pendientes técnicos — Imposter

Actualizado: **2026-11-28**

Checklist vivo de la auditoría. Marcar cada punto al completarlo y verificar el criterio de aceptación antes de desplegar.

---

## ✅ Bloque 1 — Build del Service Worker (HECHO)

Verificado el 2026-11-28:

- El script `build` ya **no** copia `dist/sw.js` sobre `.output/public/sw.js`.
- El `sw.js` servido en producción contiene `hashed-assets` y manifiesto de precache, y **ya no** usa `StaleWhileRevalidate`.
- El build inyecta el binding `IMPOSTER_KV` en `.output/server/wrangler.json`.

> Nota: `dist/sw.js` (del 12-11-2026) sigue en disco pero ya no se usa. Se puede borrar la carpeta `dist/` sin riesgo.

---

## ⏳ Bloque 2 — Cerrar endpoints sin autorización (PENDIENTE)

Hoy estos endpoints son públicos y permiten abuso:

- [ ] `src/lib/coupon-server.ts:514` — `consumeSingleUseCouponServerFn`: exigir `ceoToken` para `action: "reset"` y **no aceptar `discordWebhookUrl` del cliente**.
- [ ] `src/lib/coupon-server.ts:577` — `getCouponServerStatusServerFn`: exigir `ceoToken`.
- [ ] `src/lib/coupon-server.ts:595` — `testDiscordWebhookServerFn`: exigir `ceoToken`.
- [ ] `src/lib/coupon-server.ts:1175` — `getFounderGuestPassesServerFn`: exigir `ceoToken` (o sesión de fundador verificada) y **no auto-generar** pases para cualquier `founderNumber`.
- [ ] `src/lib/coupon-server.ts:362` — `verifyCeoLoginServerFn`: rate-limit por IP (`CF-Connecting-IP`).
- [ ] `src/components/ceo/CeoTestersTab.tsx` — pasar `token` al tab (hoy no lo recibe) y a `fetchTesterStatuses`.
- [ ] `src/routes/ceo.tsx` — propagar el token a `CeoTestersTab`.
- [ ] `src/routes/index.tsx` — adaptar la llamada a `getCouponServerStatusServerFn` si aplica.

**Criterio de aceptación:** sin token, todos responden `success: false` / no autorizado; con token, el panel CEO sigue funcionando igual.

**Riesgo si se olvida:** cualquiera puede borrar los cupones usados, redirigir los webhooks de pago a su Discord y pedir los 5 pases de cualquier fundador.

---

## ⏳ Bloque 3 — Expiración real de los pagos (PENDIENTE)

- [ ] `src/lib/coupon-server.ts:875` — calcular `expiresAt` desde la aprobación:
  `expiresAt = (payment.approvedAt ?? Date.now()) + durationHours * 3600 * 1000`.
- [ ] `src/lib/coupon-server.ts:837` — no regenerar token/fecha en cada consulta (devolver el mismo resultado para el mismo pago).
- [ ] `src/lib/security.ts:547` — rechazar tokens de compra **sin** `rawExpiry` (fail closed).

**Criterio de aceptación:** un pase de 24h dura 24h; borrar `impostor-pro-expires` de `localStorage` no otorga PRO permanente; consultar el estado repetidamente no extiende el pase.

**Riesgo si se olvida:** un pase de $0.99 se puede renovar indefinidamente y un pase de 24h se vuelve vitalicio borrando una clave.

---

## 🧊 Backlog del audit (no urgente)

- [ ] P0-2: mover secretos de `security.ts` a módulo server-only y emitir sesiones desde el servidor.
- [ ] P1-6: `getOnlineRoomStateServerFn` filtra `word`, `impostorIndices` y `jesterIndex` a todos los jugadores.
- [ ] P1-7: `hasPro` de las salas viene del cliente (`OnlineRoomModal.tsx:201`).
- [ ] P1-8: empates de votación, desconectados que bloquean la ronda, `leave`/`kick`.
- [ ] P2-14: un `JSON.parse` corrupto aborta toda la hidratación de `index.tsx`.
- [ ] P2-15: validar `impostorCount` (NaN/negativo) y corregir el warning de hooks.
- [ ] P2-16: comprobar `proExpiresAt` en caliente.
- [ ] P2-17: temporizador basado en `Date.now()` (deriva y segundo plano).
- [ ] P2-18: Fisher-Yates en lugar de `sort(() => Math.random() - 0.5)`.
- [ ] P2-19: quitar `playPop` de cada tecla en `PhaseSetup`.
- [ ] P2-20: persistir/acotar telemetría y limpiar el listener `online`.
