// Thin wrapper around the Web Speech API so the rest of the game doesn't
// need to worry about browser support or queued utterances.

const SpeechBox = {
  supported: "speechSynthesis" in window,
  voice: null,

  init() {
    if (!this.supported) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      this.voice =
        voices.find((v) => /en-AU/i.test(v.lang)) ||
        voices.find((v) => /en-GB/i.test(v.lang)) ||
        voices.find((v) => /en/i.test(v.lang)) ||
        voices[0] ||
        null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  },

  speak(text, { rate = 0.9, pitch = 1.1 } = {}) {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (this.voice) utter.voice = this.voice;
      utter.rate = rate;
      utter.pitch = pitch;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  },

  speakWord(word) {
    this.speak(word, { rate: 0.85, pitch: 1.15 });
  },

  speakQuestion(text) {
    this.speak(text, { rate: 0.92, pitch: 1.05 });
  },

  speakLetter(letter) {
    this.speak(letter.toUpperCase(), { rate: 0.8, pitch: 1.2 });
  }
};

// A tiny synthesized pop / buzz sound effect using the Web Audio API,
// so the game has satisfying feedback even with speech synthesis disabled.
const SfxBox = {
  ctx: null,

  ensureCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    return this.ctx;
  },

  playTone(freqStart, freqEnd, duration, type = "sine") {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  },

  correct() {
    this.playTone(520, 900, 0.22, "triangle");
  },

  wrong() {
    this.playTone(220, 90, 0.28, "sawtooth");
  },

  wordComplete() {
    this.playTone(440, 1200, 0.4, "triangle");
  }
};
