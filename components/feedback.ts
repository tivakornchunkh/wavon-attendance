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
