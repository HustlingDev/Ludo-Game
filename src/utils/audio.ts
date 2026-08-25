// Web Audio API procedural sound synthesizer for Ludo effects & Background Music

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private bgmMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private bgmVolume: number = 0.3;
  private isMutedAll: boolean = false;
  private bgmInterval: NodeJS.Timeout | null = null;
  private isBgmPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuteAll(muted: boolean) {
    this.isMutedAll = muted;
    if (muted && this.isBgmPlaying) {
      this.stopBGM();
    }
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  public setBgmMuted(muted: boolean) {
    this.bgmMuted = muted;
    if (muted) {
      this.stopBGM();
    } else if (this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
  }

  public setMuted(muted: boolean) {
    this.setMuteAll(muted);
  }

  public playButton() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playDiceRoll() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const clackTime = now + i * 0.065 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600 + Math.random() * 600, clackTime);
      filter.Q.setValueAtTime(4, clackTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 200, clackTime);
      osc.frequency.exponentialRampToValueAtTime(80, clackTime + 0.05);

      gain.gain.setValueAtTime(0, clackTime);
      gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, clackTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, clackTime + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(clackTime);
      osc.stop(clackTime + 0.07);
    }
  }

  public playDiceResult(val: number) {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (val === 6) {
      // Special exciting chime for rolling a six!
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const cOsc = this.ctx!.createOscillator();
        const cGain = this.ctx!.createGain();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(freq, now + idx * 0.06);
        cGain.gain.setValueAtTime(0.3 * this.sfxVolume, now + idx * 0.06);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        cOsc.connect(cGain);
        cGain.connect(this.ctx!.destination);
        cOsc.start(now + idx * 0.06);
        cOsc.stop(now + idx * 0.06 + 0.45);
      });
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 300 + val * 60;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.15);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playTokenStep() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playCapture() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Impact whoosh + boom
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.3);

    gain1.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Punch sweep
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    gain2.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.26);
  }

  public playSafeStar() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 783.99, 987.77, 1318.5]; // E5, G5, B5, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.36);
    });
  }

  public playTokenHome() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major triumph
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.45);
    });
  }

  public playVictory() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fanfare = [
      { note: 523.25, time: 0, dur: 0.15 },
      { note: 523.25, time: 0.15, dur: 0.15 },
      { note: 523.25, time: 0.3, dur: 0.15 },
      { note: 659.25, time: 0.45, dur: 0.3 },
      { note: 587.33, time: 0.75, dur: 0.15 },
      { note: 659.25, time: 0.9, dur: 0.15 },
      { note: 783.99, time: 1.05, dur: 0.6 },
    ];

    fanfare.forEach(({ note, time, dur }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, now + time);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  }

  public playDefeat() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      { note: 440, time: 0, dur: 0.3 },
      { note: 415.3, time: 0.3, dur: 0.3 },
      { note: 392, time: 0.6, dur: 0.3 },
      { note: 349.23, time: 0.9, dur: 0.6 },
    ];

    chords.forEach(({ note, time, dur }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, now + time);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  }

  public playCountdownTick() {
    if (this.isMutedAll || this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Procedural Lo-Fi Ambient Background Music
  public startBGM() {
    if (this.isMutedAll || this.bgmMuted) return;
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    const chords = [
      [261.63, 329.63, 392.0], // C
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [196.0, 246.94, 293.66], // G
    ];
    let step = 0;

    const playChordStep = () => {
      if (!this.isBgmPlaying || this.isMutedAll || this.bgmMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = chords[step % chords.length];
      step++;

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06 * this.bgmVolume, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 2.0);
      });
    };

    playChordStep();
    this.bgmInterval = setInterval(playChordStep, 2000);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public toggleBGM(enabled: boolean) {
    if (enabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
  }
}

export const sounds = new SoundEngine();
