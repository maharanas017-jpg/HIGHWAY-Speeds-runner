/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private musicInterval: any = null;
  private isMusicPlaying = false;
  private currentSpeed = 0;
  
  public soundOn = true;
  public musicOn = true;
  public activeCarId = 'sports';

  constructor() {
    // Initialized lazily on first user interaction due to browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a simple coin sound
  public playCoin() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, t); // A5
    osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, t);
    osc2.frequency.setValueAtTime(659.25, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // Play a gem sound (higher pitch, starry)
  public playGem() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1567.98, t); // G6
    osc.frequency.exponentialRampToValueAtTime(2093.00, t + 0.15); // C7

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Play crash explosion
  public playCrash() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Create white noise buffer
    const bufferSize = this.ctx.sampleRate * 0.8; // 0.8 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Create lowpass filter for heavy rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.75);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(t);
    noiseNode.stop(t + 0.8);

    // Add low oscillator boom
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(150, t);
    boom.frequency.linearRampToValueAtTime(10, t + 0.4);
    
    boomGain.gain.setValueAtTime(0.5, t);
    boomGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    boom.connect(boomGain);
    boomGain.connect(this.ctx.destination);
    boom.start(t);
    boom.stop(t + 0.4);
  }

  // Play Nitro zoom
  public playBoost() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.6);

    // Apply high pass filter to simulate wind zoom
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(200, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Play Shield hit or activate
  public playShield() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.2);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.4);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Play Horn
  public playHorn() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, t);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(445, t); // Slightly detuned for chorusing

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.setValueAtTime(0.18, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // Start Police Siren (re-triggerable)
  public playSiren() {
    if (!this.soundOn || this.activeCarId !== 'police') return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.25);
    osc.frequency.linearRampToValueAtTime(600, t + 0.5);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Starts the interactive engine hum
  public startEngine() {
    if (!this.soundOn) return;
    this.initCtx();
    if (!this.ctx || this.engineOsc) return;

    try {
      const t = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      // SUV and Trucks sound deeper, sports and super cars higher
      let baseFreq = 55; // default Sports Car / Muscle Car
      let oscType: OscillatorType = 'sawtooth';

      if (this.activeCarId === 'suv') {
        baseFreq = 45;
        oscType = 'triangle';
      } else if (this.activeCarId === 'super' || this.activeCarId === 'formula') {
        baseFreq = 65;
        oscType = 'sawtooth';
      } else if (this.activeCarId === 'police') {
        baseFreq = 58;
        oscType = 'sawtooth';
      }

      this.engineOsc.type = oscType;
      this.engineOsc.frequency.setValueAtTime(baseFreq, t);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(200, t);

      // Low volume hum
      this.engineGain.gain.setValueAtTime(0.08, t);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start(t);
    } catch (err) {
      console.warn('Failed to start engine audio', err);
    }
  }

  // Updates engine pitch based on car velocity
  public updateEngine(speedRatio: number) {
    this.currentSpeed = speedRatio;
    if (!this.soundOn || !this.ctx || !this.engineOsc || !this.engineFilter) return;

    const t = this.ctx.currentTime;
    let baseFreq = 55;
    if (this.activeCarId === 'suv') baseFreq = 45;
    else if (this.activeCarId === 'super' || this.activeCarId === 'formula') baseFreq = 65;

    // Pitch bends higher as speed goes up
    const targetFreq = baseFreq + speedRatio * 180;
    const filterFreq = 150 + speedRatio * 500;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.15);
  }

  // Stops the engine hum
  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
    this.engineFilter = null;
    this.engineGain = null;
  }

  // Starts the synthwave background music loop
  public startMusic() {
    if (!this.musicOn) return;
    this.initCtx();
    if (!this.ctx || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    let beat = 0;
    
    // Simple synthwave bassline & melody notes
    // C, Eb, G, Bb progression
    const bassline = [
      65.41, 65.41, 65.41, 65.41, // C2
      77.78, 77.78, 77.78, 77.78, // Eb2
      98.00, 98.00, 98.00, 98.00, // G2
      116.54, 116.54, 116.54, 116.54 // Bb2
    ];

    const melody = [
      261.63, 0, 311.13, 392.00, // C4, Eb4, G4
      311.13, 0, 392.00, 466.16, // Eb4, G4, Bb4
      392.00, 0, 466.16, 523.25, // G4, Bb4, C5
      466.16, 392.00, 311.13, 261.63 // Bb4, G4, Eb4, C4
    ];

    const tempo = 130; // BPM
    const noteDuration = 60 / tempo / 2; // Eighth note duration (~0.115s)

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicOn) return;

      const t = this.ctx.currentTime;
      
      // 1. Play Bass note (every step)
      const bassFreq = bassline[beat % bassline.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);
      
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(180, t);

      bassGain.gain.setValueAtTime(0.04, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration - 0.01);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      
      bassOsc.start(t);
      bassOsc.stop(t + noteDuration);

      // 2. Play Melodic line on every second step with some gaps
      const melodyFreq = melody[beat % melody.length];
      if (melodyFreq > 0 && beat % 4 !== 1) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        const melDelay = this.ctx.createDelay ? this.ctx.createDelay() : null;

        melOsc.type = 'triangle';
        melOsc.frequency.setValueAtTime(melodyFreq, t);

        melGain.gain.setValueAtTime(0.03, t);
        melGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 1.5);

        melOsc.connect(melGain);
        
        if (melDelay) {
          // Simple delay/echo effect for spacey vibe
          melDelay.delayTime.setValueAtTime(noteDuration * 0.75, t);
          const feedback = this.ctx.createGain();
          feedback.gain.setValueAtTime(0.3, t);
          
          melGain.connect(melDelay);
          melDelay.connect(feedback);
          feedback.connect(melDelay);
          melDelay.connect(this.ctx.destination);
        }

        melGain.connect(this.ctx.destination);
        
        melOsc.start(t);
        melOsc.stop(t + noteDuration * 1.5);
      }

      // 3. Simple hi-hat metallic splash on beats
      if (beat % 4 === 2) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        const hatFilter = this.ctx.createBiquadFilter();

        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(10000, t); // Metallic frequency

        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, t);

        hatGain.gain.setValueAtTime(0.015, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        hatOsc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.ctx.destination);

        hatOsc.start(t);
        hatOsc.stop(t + 0.06);
      }

      beat++;
      // Schedule next step precisely
      this.musicInterval = setTimeout(playStep, noteDuration * 1000);
    };

    playStep();
  }

  // Stops background music loop
  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Update mute state
  public updateMuteStates(soundOn: boolean, musicOn: boolean) {
    this.soundOn = soundOn;
    this.musicOn = musicOn;

    if (!soundOn) {
      this.stopEngine();
    } else {
      // If we are playing, engine should be re-triggered. That is handled by GameCanvas.
    }

    if (!musicOn) {
      this.stopMusic();
    } else if (this.isMusicPlaying) {
      // Re-trigger if playing was set to on but it wasn't running
      this.stopMusic();
      this.startMusic();
    }
  }
}

export const sound = new SoundManager();
