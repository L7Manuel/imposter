/**
 * Motor de Síntesis de Audio Web Audio API y Retroalimentación Háptica — Imposter
 *
 * Cero archivos MP3 externos. Sonidos sintetizados en tiempo real por el oscilador
 * del dispositivo para latencia 0ms, ahorro de ancho de banda y soporte offline.
 */

let audioContextInstance: AudioContext | null = null;

export function unlockAudio(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!audioContextInstance) {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContextInstance = new AudioCtx();
      }
    }
    if (audioContextInstance && audioContextInstance.state === "suspended") {
      void audioContextInstance.resume();
    }
    return audioContextInstance;
  } catch {
    return null;
  }
}

export function playBeep(duration: number, freq: number, soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* ignore */
  }
}

export function playPop(soundEnabled: boolean, haptic: boolean = true) {
  // Micropulso háptico de 10ms en Android para sensación de switch arcade
  if (haptic && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }

  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Capa Mecánica Transitoria (Chasquido de switch arcade de 12ms)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = "sine";
    oscClick.frequency.setValueAtTime(2400, now);
    oscClick.frequency.exponentialRampToValueAtTime(800, now + 0.012);
    gainClick.gain.setValueAtTime(0.35, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.014);
    oscClick.connect(gainClick).connect(ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.015);

    // 2. Capa de Resonancia Cálida (Cuerpo acústico táctil de 55ms)
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = "triangle";
    oscBody.frequency.setValueAtTime(360, now);
    oscBody.frequency.exponentialRampToValueAtTime(130, now + 0.055);
    gainBody.gain.setValueAtTime(0.42, now);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    oscBody.connect(gainBody).connect(ctx.destination);
    oscBody.start(now);
    oscBody.stop(now + 0.06);
  } catch {
    /* ignore */
  }
}

let scanOsc: OscillatorNode | null = null;
let scanGain: GainNode | null = null;

export function startScanSound(soundEnabled: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([20, 60, 25, 60, 30, 60]);
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    stopScanSound();
    const now = ctx.currentTime;
    scanOsc = ctx.createOscillator();
    scanGain = ctx.createGain();
    scanOsc.type = "sawtooth";
    scanOsc.frequency.setValueAtTime(140, now);
    scanOsc.frequency.exponentialRampToValueAtTime(320, now + 0.5);
    scanGain.gain.setValueAtTime(0.06, now);
    scanGain.gain.linearRampToValueAtTime(0.16, now + 0.3);
    scanOsc.connect(scanGain).connect(ctx.destination);
    scanOsc.start(now);
  } catch {
    /* ignore */
  }
}

export function stopScanSound() {
  try {
    if (scanOsc) {
      scanOsc.stop();
      scanOsc.disconnect();
      scanOsc = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Alerta íntima y sutil de suspenso (Acorde oscuro en baja frecuencia).
 * Suena ÚNICAMENTE si eres el Impostor sin alertar a nadie en la mesa.
 */
export function playImpostorReveal(soundEnabled: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([40, 50, 70]);
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    [110, 130.81].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    });
  } catch {
    /* ignore */
  }
}

/**
 * Impacto dramático de baja frecuencia para la transición al veredicto.
 */
export function playDramaticImpact(soundEnabled: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([40, 60, 50]);
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    gain.gain.setValueAtTime(0.48, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  } catch {
    /* ignore */
  }
}

/**
 * Tensión sonora en los últimos 15 segundos del debate (Latido de corazón + Reloj).
 */
export function playDebateTension(
  timeLeft: number,
  soundEnabled: boolean,
  vibrationEnabled: boolean,
) {
  if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (timeLeft <= 5) {
        navigator.vibrate([20, 40, 20]);
      } else {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore */
    }
  }
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Latido de corazón sutil
    const oscHeart = ctx.createOscillator();
    const gainHeart = ctx.createGain();
    oscHeart.type = "sine";
    const heartFreq = timeLeft <= 5 ? 85 : 68;
    oscHeart.frequency.setValueAtTime(heartFreq, now);
    oscHeart.frequency.exponentialRampToValueAtTime(35, now + 0.08);
    const heartVol = timeLeft <= 5 ? 0.38 : 0.22;
    gainHeart.gain.setValueAtTime(heartVol, now);
    gainHeart.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    oscHeart.connect(gainHeart).connect(ctx.destination);
    oscHeart.start(now);
    oscHeart.stop(now + 0.09);

    // Tic-tac mecánico de reloj
    const oscTick = ctx.createOscillator();
    const gainTick = ctx.createGain();
    oscTick.type = "triangle";
    oscTick.frequency.setValueAtTime(timeLeft <= 5 ? 1600 : 1200, now + 0.04);
    gainTick.gain.setValueAtTime(timeLeft <= 5 ? 0.28 : 0.15, now + 0.04);
    gainTick.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    oscTick.connect(gainTick).connect(ctx.destination);
    oscTick.start(now + 0.04);
    oscTick.stop(now + 0.07);
  } catch {
    /* ignore */
  }
}

export function playFanfare(isVictory: boolean, soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isVictory ? [440, 554, 659, 880] : [440, 370, 311, 220];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isVictory ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.38, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.22);
    });
  } catch {
    /* ignore */
  }
}
