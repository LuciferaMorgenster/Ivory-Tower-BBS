/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    // Lazy initialize upon user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Classic Bell (\a) tone - 750Hz sine wave pulse
   */
  public bell() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      // Audio autoplay or sandbox block
    }
  }

  /**
   * Mechanical key press click
   */
  public keyClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch (e) {}
  }

  /**
   * Command executed successfully tone
   */
  public execute() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  /**
   * Error or warning buzzer
   */
  public errorBeep() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * 1-second vintage modem handshake chirp
   */
  public modemConnect() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.2);
      osc.frequency.setValueAtTime(2225, now + 0.3);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.5);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  /**
   * Full simulated vintage modem dialing sequence (Dial tone, DTMF tones, carrier whistle and handshake static)
   */
  public playModemDialingSequence() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Dial Tone (350Hz + 440Hz)
      const dial1 = this.ctx.createOscillator();
      const dial2 = this.ctx.createOscillator();
      const dialGain = this.ctx.createGain();

      dial1.frequency.setValueAtTime(350, now);
      dial2.frequency.setValueAtTime(440, now);
      dialGain.gain.setValueAtTime(0.04, now);
      dialGain.gain.setValueAtTime(0.04, now + 0.4);
      dialGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      dial1.connect(dialGain);
      dial2.connect(dialGain);
      dialGain.connect(this.ctx.destination);

      dial1.start(now);
      dial2.start(now);
      dial1.stop(now + 0.45);
      dial2.stop(now + 0.45);

      // 2. DTMF Tones (dialing 5 simulated digits)
      const dtmfFreqs = [
        [697, 1209], // '1'
        [770, 1336], // '5'
        [852, 1477], // '9'
        [941, 1336], // '0'
        [697, 1477], // '3'
      ];

      dtmfFreqs.forEach(([f1, f2], i) => {
        const start = now + 0.5 + i * 0.12;
        const o1 = this.ctx!.createOscillator();
        const o2 = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();

        o1.frequency.setValueAtTime(f1, start);
        o2.frequency.setValueAtTime(f2, start);
        g.gain.setValueAtTime(0.04, start);
        g.gain.setValueAtTime(0.04, start + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);

        o1.connect(g);
        o2.connect(g);
        g.connect(this.ctx!.destination);

        o1.start(start);
        o2.start(start);
        o1.stop(start + 0.1);
        o2.stop(start + 0.1);
      });

      // 3. Ringback & Carrier Answer Whistle (2100 Hz at now + 1.2s)
      const carrierStart = now + 1.2;
      const carrier = this.ctx.createOscillator();
      const carrierGain = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(2100, carrierStart);
      carrier.frequency.setValueAtTime(2100, carrierStart + 0.6);
      carrier.frequency.linearRampToValueAtTime(1300, carrierStart + 0.9);

      carrierGain.gain.setValueAtTime(0.04, carrierStart);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, carrierStart + 1.2);

      carrier.connect(carrierGain);
      carrierGain.connect(this.ctx.destination);

      carrier.start(carrierStart);
      carrier.stop(carrierStart + 1.2);

      // 4. White noise / phase negotiation hiss at now + 2.4s
      const hissStart = now + 2.4;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, hissStart);
      filter.Q.setValueAtTime(3.0, hissStart);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, hissStart);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, hissStart + 0.8);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(hissStart);
      whiteNoise.stop(hissStart + 0.8);
    } catch (e) {}
  }

  /**
   * Synthesizes 700Hz Morse code (CW) audio beeps for callsigns and emergency alerts
   */
  public playMorseCode(text: string) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const MORSE_MAP: Record<string, string> = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
      I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
      Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
      Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
      '?': '..--..', '/': '-..-.', '.': '.-.-.-', '-': '-....-', ' ': ' ',
    };

    try {
      const ditDuration = 0.06; // 60ms
      let cursor = this.ctx.currentTime + 0.05;
      const cleanUpper = text.toUpperCase().slice(0, 32);

      for (const char of cleanUpper) {
        if (char === ' ') {
          cursor += ditDuration * 5;
          continue;
        }

        const pattern = MORSE_MAP[char];
        if (!pattern) continue;

        for (const symbol of pattern) {
          const isDah = symbol === '-';
          const duration = isDah ? ditDuration * 3 : ditDuration;

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(700, cursor);

          gain.gain.setValueAtTime(0.06, cursor);
          gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(cursor);
          osc.stop(cursor + duration);

          cursor += duration + ditDuration; // space between dits/dahs
        }

        cursor += ditDuration * 2; // space between letters
      }
    } catch (e) {}
  }

  /**
   * Synthesizes authentic Bell 202 AFSK (Audio Frequency Shift Keying) packet audio.
   * Standard for AX.25 packet radio and APRS at 1200 baud (Mark: 1200Hz, Space: 2200Hz).
   */
  public playBell202Afsk(text: string) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const bitDuration = 0.005; // 5ms per bit for clear audible acoustic transmission
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text.slice(0, 24));

      // HDLC Preamble (alternating sync pattern 01010101)
      const bits: number[] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
      for (const b of bytes) {
        for (let i = 0; i < 8; i++) {
          bits.push((b >> i) & 1);
        }
      }
      // HDLC Postamble flag (01111110)
      bits.push(0, 1, 1, 1, 1, 1, 1, 0);

      const totalDuration = bits.length * bitDuration;
      const now = this.ctx.currentTime + 0.05;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      // Program frequency per bit interval
      bits.forEach((bit, idx) => {
        const freq = bit === 1 ? 1200 : 2200;
        osc.frequency.setValueAtTime(freq, now + idx * bitDuration);
      });

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + totalDuration - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + totalDuration);
    } catch (e) {}
  }

  /**
   * Plays a CTCSS sub-audible tone test (e.g. 88.5 Hz tone)
   */
  public playCtcssTone(freqHz: number = 88.5) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqHz, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }
}

export const sound = new SoundEngine();
