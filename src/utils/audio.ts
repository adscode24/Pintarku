/**
 * Audio Synthesizer and Indonesian Female Speech Engine
 * Uses native Android TTS via Capacitor plugin (reliable on APK),
 * falls back to Web Speech API on browser/PWA.
 */

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let voicesCache: SpeechSynthesisVoice[] = [];

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Play sound effects using Web Audio API
 */
export function playSound(type: 'click' | 'correct' | 'wrong' | 'star' | 'victory' | 'badge' | 'pop' | 'jump' | 'apple') {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'apple') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'click' || type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'pop' ? 520 : 400, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'pop' ? 880 : 300, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'star') {
      const freqs = [659.25, 880, 1174.66, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.3, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } else if (type === 'victory' || type === 'badge') {
      const fanfare = [
        { f: 523.25, t: 0, d: 0.15 },
        { f: 659.25, t: 0.12, d: 0.15 },
        { f: 783.99, t: 0.24, d: 0.15 },
        { f: 1046.5, t: 0.36, d: 0.45 },
      ];
      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.3, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    }
  } catch (err) {
    console.warn('Audio effect error:', err);
  }
}

/**
 * Cache voices when they become available (Android Chrome loads async)
 */
function refreshVoices() {
  if (!('speechSynthesis' in window)) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) voicesCache = v;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = () => refreshVoices();
}

/**
 * Text-to-Speech specifically tuned for Indonesian Female voice ("Suara Perempuan")
 * Priority: Native Android TTS (Capacitor) → Web Speech API fallback
 */
export async function speakIndonesian(text: string, rate = 0.85): Promise<void> {
  // 1) Native Android TTS — always available on APK, no voice download needed
  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text,
        lang: 'id-ID',
        rate,
        pitch: 1.1,
        category: 'ambient',
      });
      return;
    } catch (err) {
      console.warn('Native TTS failed, falling back to Web Speech:', err);
    }
  }

  // 2) Web Speech API fallback (browser / PWA)
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.pitch = 1.35;
    utterance.rate = rate;

    // Use cached voices (Android Chrome returns empty on first getVoices call)
    const voices = voicesCache.length > 0 ? voicesCache : window.speechSynthesis.getVoices();
    const idVoices = voices.filter(v => v.lang.startsWith('id') || v.lang.includes('ID'));
    const femaleIdVoice = idVoices.find(v =>
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('perempuan') ||
      v.name.toLowerCase().includes('gadis') ||
      v.name.toLowerCase().includes('siti') ||
      v.name.toLowerCase().includes('indonesia')
    );

    if (femaleIdVoice) {
      utterance.voice = femaleIdVoice;
    } else if (idVoices.length > 0) {
      utterance.voice = idVoices[0];
    } else {
      const fallbackFemale = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('yuna')
      );
      if (fallbackFemale) {
        utterance.voice = fallbackFemale;
      }
    }

    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    utterance.onend = done;
    utterance.onerror = done;
    // Safety timeout — some Android WebViews never fire onend
    setTimeout(done, Math.max(4000, text.length * 120));

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop all speech (native + web)
 */
export async function stopSpeaking(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try { await TextToSpeech.stop(); } catch {}
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
