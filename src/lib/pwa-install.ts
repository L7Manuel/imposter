/**
 * PWA Installation Helper
 *
 * Handles:
 * 1. Chromium / Android / Desktop: beforeinstallprompt capture & triggering native install dialog.
 * 2. iOS Safari: detection & step-by-step "Add to Home Screen" instructions.
 * 3. Standalone mode detection (already installed as PWA).
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isAppInstalled = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isStandaloneDisplay || isIosStandalone || isAppInstalled;
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isMacTouch = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return isIos || isMacTouch;
}

export function isAndroidDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent || "");
}

export function hasDeferredInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

export function initPwaInstallPrompt(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleBeforeInstall = (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  };

  const handleAppInstalled = () => {
    deferredPrompt = null;
    isAppInstalled = true;
    notifyListeners();
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstall);
  window.addEventListener("appinstalled", handleAppInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    window.removeEventListener("appinstalled", handleAppInstalled);
  };
}

export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) {
    return "unavailable";
  }

  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
    return choice.outcome;
  } catch (err) {
    console.debug("[PWA] Install prompt failed:", err);
    deferredPrompt = null;
    notifyListeners();
    return "unavailable";
  }
}

export function subscribeToPwaState(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
