// Web Audio Synthetic Sound & Haptic Feedback (Works 100% Offline with 0 external assets)

export type SoundAction = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'MARK_ALL' | 'SAVE' | 'CLICK';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playTactileFeedback(action: SoundAction, options: { sound?: boolean; haptic?: boolean } = { sound: true, haptic: true }) {
  // 1. Gentle Haptic Vibration (Mobile / iPad)
  if (options.haptic !== false && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (action === 'SAVE' || action === 'MARK_ALL') {
        navigator.vibrate([15, 40, 20]);
      } else {
        navigator.vibrate(12);
      }
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Subtle Web Audio Tone
  if (options.sound === false) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (action === 'PRESENT') {
      // Crisp, friendly upward pip (540Hz -> 840Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.07);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (action === 'ABSENT') {
      // Low subtle tap (320Hz -> 200Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.07);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (action === 'LEAVE') {
      // Warm neutral tone (440Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (action === 'MARK_ALL' || action === 'SAVE') {
      // Pleasant harmonic double chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.06);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Subtle micro-click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // Ignore audio errors
  }
}

/**
 * Deep, mysterious bass ambience for the spotlight intro opening
 */
export function playSpotlightAmbience() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(25); } catch {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.start(now);
    osc.stop(now + 0.9);
  } catch {}
}

/**
 * Spotlight snap ignition click when a team member is revealed
 */
export function playSpotlightSnap(stageIndex: number = 0) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(18); } catch {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const targetFreq = frequencies[stageIndex % frequencies.length];

    // Sharp ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.04);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.18);

    // Subtle low-end click for the switch
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(140, now);
    clickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    clickOsc.start(now);
    clickOsc.stop(now + 0.06);
  } catch {}
}

/**
 * Grand harmonic chime when all spotlights converge into the credits modal
 */
export function playSpotlightChime() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([20, 35, 30]); } catch {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C major chord arpeggio
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.07, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  } catch {}
}
