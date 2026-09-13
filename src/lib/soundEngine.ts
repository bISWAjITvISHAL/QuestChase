// Web Audio API Procedural Sound Engine for CASEFILE
// Zero external audio files required - works 100% offline and immediately on user interaction!

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private soundEnabled = true;

  /**
   * Safely obtain or initialize the single shared AudioContext instance.
   * Handles browser autoplay policies by attempting to resume suspended contexts.
   */
  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.isInitialized = true;
        }
      } catch (err) {
        console.warn('Web Audio API not supported or blocked by browser.', err);
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Autoplay policy may block resume until first direct user gesture
      });
    }

    return this.ctx;
  }

  public init() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public isAmbienceEnabled(): boolean {
    return false;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setAmbienceEnabled(_enabled: boolean) {
    // Background ambience removed per user request
  }

  // Heavy Detective "SOLVED / CONFIDENTIAL" Rubber Stamp Thud
  public playStampThud() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Sub-bass heavy thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.18);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);

    // Paper impact slap noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  }

  // Typewriter Key Stroke
  public playTypewriter() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Clue Discovered Mysterious Chime
  public playClueFound() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 harmonic arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.65);
    });
  }

  // Red Thread Pin / Yarn Connection Snap
  public playThreadConnected() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Cinematic Level Up Fanfare
  public playLevelUp() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Dramatic mystery triumph chord: D minor to D Major 9th
    const chord = [293.66, 440.0, 587.33, 739.99, 1174.66];

    chord.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.5);

      gain.gain.setValueAtTime(0, t + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, t + i * 0.06 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.06);
      osc.stop(t + 1.9);
    });
  }

  // Folder Open / Document Rustle
  public playPaperRustle() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  // Major Case Solved Victory Fanfare
  public playCaseSolved() {
    this.playStampThud();
    setTimeout(() => {
      this.playLevelUp();
    }, 150);
  }
}

export const soundEngine = new SoundEngine();

