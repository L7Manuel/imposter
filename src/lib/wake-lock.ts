/**
 * Wake Lock API Helper
 *
 * Keeps the screen awake during active Imposter game rounds (reveal, debate, voting, result)
 * so Android and iOS devices do not turn off or dim while passed around the table.
 */

// Interface for navigator.wakeLock if not in current TS DOM lib
interface WakeLockSentinelLike extends EventTarget {
  released: boolean;
  type: "screen";
  release: () => Promise<void>;
  onrelease: ((this: WakeLockSentinelLike, ev: Event) => void) | null;
}

let activeWakeLock: WakeLockSentinelLike | null = null;
let shouldBeLocked = false;
let visibilityListenerAttached = false;

export function isWakeLockSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof navigator !== "undefined" && "wakeLock" in navigator
  );
}

export function isWakeLockActive(): boolean {
  return activeWakeLock !== null && !activeWakeLock.released;
}

async function requestLock(): Promise<boolean> {
  if (!isWakeLockSupported()) return false;
  try {
    if (activeWakeLock && !activeWakeLock.released) {
      return true;
    }
    const nav = navigator as unknown as {
      wakeLock: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    };
    activeWakeLock = await nav.wakeLock.request("screen");
    activeWakeLock.addEventListener("release", () => {
      // Released by system (e.g. low battery, lock button, or tab hide)
      if (activeWakeLock?.released) {
        activeWakeLock = null;
      }
    });
    return true;
  } catch (err) {
    // Expected on low battery, background tab or user permission denial
    console.debug("[WakeLock] Could not acquire screen wake lock:", err);
    activeWakeLock = null;
    return false;
  }
}

function handleVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible" && shouldBeLocked) {
    void requestLock();
  }
}

/**
 * Request keeping screen awake while game is active.
 * Automatically handles re-acquiring lock when user returns to app.
 */
export async function acquireScreenWakeLock(): Promise<boolean> {
  shouldBeLocked = true;

  if (typeof document !== "undefined" && !visibilityListenerAttached) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerAttached = true;
  }

  return await requestLock();
}

/**
 * Release wake lock when game returns to setup phase or unmounts.
 */
export async function releaseScreenWakeLock(): Promise<void> {
  shouldBeLocked = false;
  if (activeWakeLock && !activeWakeLock.released) {
    try {
      await activeWakeLock.release();
    } catch {
      // Ignore release error
    } finally {
      activeWakeLock = null;
    }
  }
}
