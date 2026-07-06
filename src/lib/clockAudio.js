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
