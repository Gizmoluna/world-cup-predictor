// Tiny WebAudio sound kit — no asset files. Respects a per-device mute flag.
// All calls are no-ops on the server or when the audio context is blocked.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem("cvj_muted") === "1";
  } catch {
    return false;
  }
}

export function setMuted(m: boolean): void {
  try {
    localStorage.setItem("cvj_muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.1) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur);
}

/** Rising arpeggio — a goal/correct-result celebration. */
export function playSuccess(big = false): void {
  if (isMuted()) return;
  const notes = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
  notes.forEach((f, i) => tone(f, i * 0.09, 0.28, "triangle", 0.09));
}

/** Soft two-note confirm — locking a prediction. */
export function playLock(): void {
  if (isMuted()) return;
  tone(660, 0, 0.12, "sine", 0.07);
  tone(990, 0.07, 0.14, "sine", 0.07);
}

/** Light tick — taps. */
export function playClick(): void {
  if (isMuted()) return;
  tone(420, 0, 0.05, "square", 0.03);
}
