// Web Audio API beep generator — no audio assets needed.

let ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Plays a single short beep.
export function playBeep({ freq = 880, duration = 0.15, volume = 0.2 } = {}) {
  const audioCtx = getCtx();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

// Repeats a beep pattern until stop() is called. Returns a stop function.
export function startAlarmSound({ freq = 880, onBeep, intervalMs = 600 } = {}) {
  playBeep({ freq });
  onBeep?.();
  const id = setInterval(() => {
    playBeep({ freq });
    onBeep?.();
  }, intervalMs);
  return () => clearInterval(id);
}

// Named alarm "voices" — each is a short synthesized pattern (no audio
// files), selectable per-alarm and repeated every `intervalMs` while ringing.
export const ALARM_SOUNDS = [
  { key: "classic", label: "Classic Beep" },
  { key: "chime", label: "Chime" },
  { key: "digital", label: "Digital Alert" },
  { key: "bell", label: "Gentle Bell" },
];

const SOUND_PLAYERS = {
  classic: () => {
    playBeep({ freq: 1000, duration: 0.18, volume: 0.25 });
  },
  chime: () => {
    playBeep({ freq: 784, duration: 0.16, volume: 0.22 }); // G5
    setTimeout(() => playBeep({ freq: 988, duration: 0.22, volume: 0.22 }), 160); // B5
  },
  digital: () => {
    playBeep({ freq: 1300, duration: 0.07, volume: 0.25 });
    setTimeout(() => playBeep({ freq: 1300, duration: 0.07, volume: 0.25 }), 120);
    setTimeout(() => playBeep({ freq: 1300, duration: 0.07, volume: 0.25 }), 240);
  },
  bell: () => {
    playBeep({ freq: 660, duration: 0.55, volume: 0.16 });
    setTimeout(() => playBeep({ freq: 990, duration: 0.45, volume: 0.09 }), 30);
  },
};

export function playAlarmVoice(soundKey) {
  (SOUND_PLAYERS[soundKey] || SOUND_PLAYERS.classic)();
}

// Same shape as startAlarmSound but plays a named voice pattern on repeat.
export function startNamedAlarmSound(soundKey, intervalMs = 900) {
  const player = SOUND_PLAYERS[soundKey] || SOUND_PLAYERS.classic;
  player();
  const id = setInterval(player, intervalMs);
  return () => clearInterval(id);
}
