// Single guarded service worker registration. Never registers in dev, iframes or Lovable previews.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

function isRefused(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  const previewDomain = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"].some((d) =>
    host.endsWith(d),
  );
  if (previewDomain && PREVIEW_LABEL.test(label)) return true;
  if (previewDomain && /^project--.+-dev$/.test(label)) return true;
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === d || host.endsWith("." + d)) return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

// Evita recargas dobles si varios eventos de control llegan seguidos.
let reloading = false;
// Recarga diferida: si hay una actualización mientras la app está en primer
// plano, esperamos a que pase a segundo plano para no cortar una partida.
let pendingReload = false;

function reloadSafely() {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefused()) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()),
    );
    return;
  }

  try {
    // updateViaCache: "none" evita que el propio sw.js se sirva desde la caché
    // HTTP del navegador, que es la causa típica de "el deploy no aparece".
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    // Si ya había un SW controlando la app y se activa uno nuevo (nuevo deploy),
    // recargamos una sola vez para que documento y assets queden sincronizados.
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (document.visibilityState === "hidden") reloadSafely();
        else pendingReload = true;
      });
    }

    let lastUpdateCheck = 0;
    const checkForUpdate = () => {
      const now = Date.now();
      if (now - lastUpdateCheck < 60_000) return;
      lastUpdateCheck = now;
      void reg.update().catch(() => {});
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        if (pendingReload) reloadSafely();
        return;
      }
      // Al volver a la app (móvil: desbloquear/abrir) buscamos versión nueva.
      checkForUpdate();
    });
    window.addEventListener("online", checkForUpdate);

    // Primera comprobación en segundo plano, sin bloquear el arranque.
    checkForUpdate();
  } catch {
    /* ignore */
  }
}
