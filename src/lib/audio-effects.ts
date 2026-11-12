/**
 * Motor de Síntesis de Audio Web Audio API y Retroalimentación Háptica — Imposter
 *
 * Cero archivos MP3 externos. Sonidos sintetizados en tiempo real por el oscilador
 * del dispositivo para latencia 0ms, ahorro de ancho de banda y soporte offline.
 * Calibrado acústicamente para altavoces móviles de teléfonos y tablets.
 */

let audioContextInstance: AudioContext | null = null;
let iosUnlocked = false;

/**
 * Despierta y desbloquea el canal de audio del navegador en iOS y Android.
 */
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

    if (audioContextInstance) {
      if (audioContextInstance.state === "suspended") {
        void audioContextInstance.resume();
      }

      // Desbloqueo forzado de hardware en iOS/Android reproduciendo 1 muestra silenciosa
      if (!iosUnlocked) {
        try {
          const buffer = audioContextInstance.createBuffer(1, 1, 22050);
          const source = audioContextInstance.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextInstance.destination);
          source.start(0);
          iosUnlocked = true;
        } catch {
          /* ignore */
        }
      }
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

/**
 * Clic Arcade Táctil ("Pop" nítido y satisfactorio para botones).
 * Diseñado con envolvente de 70ms y frecuencias de 720Hz a 260Hz para alta presencia en altavoces móviles.
 */
export function playPop(soundEnabled: boolean, haptic: boolean = true) {
  // Micropulso háptico de 12ms en Android
  if (haptic && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(12);
    } catch {
      /* ignore */
    }
  }

  if (!soundEnabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Capa Mecánica Transitoria (Chasquido inicial agradable de 720Hz a 340Hz)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = "sine";
    oscClick.frequency.setValueAtTime(720, now);
    oscClick.frequency.exponentialRampToValueAtTime(340, now + 0.035);
    gainClick.gain.setValueAtTime(0.38, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    oscClick.connect(gainClick).connect(ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.045);

    // 2. Capa de Cuerpo Táctil Cálido (260Hz a 130Hz durante 65ms)
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = "triangle";
    oscBody.frequency.setValueAtTime(260, now);
    oscBody.frequency.exponentialRampToValueAtTime(130, now + 0.065);
    gainBody.gain.setValueAtTime(0.32, now);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    oscBody.connect(gainBody).connect(ctx.destination);
    oscBody.start(now);
    oscBody.stop(now + 0.075);
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
    scanOsc.frequency.setValueAtTime(180, now);
    scanOsc.frequency.exponentialRampToValueAtTime(380, now + 0.5);
    scanGain.gain.setValueAtTime(0.12, now);
    scanGain.gain.linearRampToValueAtTime(0.24, now + 0.35);
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
 * Alerta íntima y sutil de suspenso (Acorde oscuro en frecuencia audible para celular).
 * Suena ÚNICAMENTE si eres el Impostor sin delatarte con los demás.
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
    [145, 175].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.45);
      gain.gain.setValueAtTime(0.28, now);
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
 * Impacto dramático con presencia real en altavoces de teléfono (160Hz cayendo a 65Hz).
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

    // Capa de golpe principal
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    gain.gain.setValueAtTime(0.48, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);

    // Armónico triangular superior para presencia acústica en parlante de celular
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();
    oscHarmonic.type = "triangle";
    oscHarmonic.frequency.setValueAtTime(240, now);
    oscHarmonic.frequency.exponentialRampToValueAtTime(90, now + 0.28);
    gainHarmonic.gain.setValueAtTime(0.25, now);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    oscHarmonic.connect(gainHarmonic).connect(ctx.destination);
    oscHarmonic.start(now);
    oscHarmonic.stop(now + 0.3);
  } catch {
    /* ignore */
  }
}

/**
 * Tensión sonora en los últimos 15 segundos del debate (Doble latido "lub-dub" + Reloj).
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
        navigator.vibrate(15);
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

    // Doble latido de corazón ("lub-dub" acústicamente visible en teléfono)
    const heartBaseFreq = timeLeft <= 5 ? 150 : 130;
    const heartVol = timeLeft <= 5 ? 0.42 : 0.28;

    // Primer pulso (lub)
    const oscHeart1 = ctx.createOscillator();
    const gainHeart1 = ctx.createGain();
    oscHeart1.type = "sine";
    oscHeart1.frequency.setValueAtTime(heartBaseFreq, now);
    oscHeart1.frequency.exponentialRampToValueAtTime(65, now + 0.05);
    gainHeart1.gain.setValueAtTime(heartVol, now);
    gainHeart1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    oscHeart1.connect(gainHeart1).connect(ctx.destination);
    oscHeart1.start(now);
    oscHeart1.stop(now + 0.065);

    // Segundo pulso (dub) 80ms después
    const oscHeart2 = ctx.createOscillator();
    const gainHeart2 = ctx.createGain();
    oscHeart2.type = "sine";
    oscHeart2.frequency.setValueAtTime(heartBaseFreq * 0.9, now + 0.08);
    oscHeart2.frequency.exponentialRampToValueAtTime(55, now + 0.13);
    gainHeart2.gain.setValueAtTime(heartVol * 0.85, now + 0.08);
    gainHeart2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    oscHeart2.connect(gainHeart2).connect(ctx.destination);
    oscHeart2.start(now + 0.08);
    oscHeart2.stop(now + 0.145);

    // Tic-tac mecánico de reloj en altas frecuencias
    const oscTick = ctx.createOscillator();
    const gainTick = ctx.createGain();
    oscTick.type = "triangle";
    oscTick.frequency.setValueAtTime(timeLeft <= 5 ? 1600 : 1250, now + 0.16);
    gainTick.gain.setValueAtTime(timeLeft <= 5 ? 0.32 : 0.18, now + 0.16);
    gainTick.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    oscTick.connect(gainTick).connect(ctx.destination);
    oscTick.start(now + 0.16);
    oscTick.stop(now + 0.21);
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
