// Web Audio API 無障礙音效發聲器
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playBeep(freq = 880, type = 'sine', duration = 0.15) {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playAlarm() {
    this.playBeep(523.25, 'triangle', 0.2);
    setTimeout(() => this.playBeep(659.25, 'triangle', 0.2), 150);
    setTimeout(() => this.playBeep(783.99, 'triangle', 0.4), 300);
  }
}

export const soundEngine = new SoundEngine();