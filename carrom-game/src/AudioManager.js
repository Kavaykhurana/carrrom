export class AudioManager {
    constructor() {
        // Web Audio API Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Master Volume
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4;
        this.masterGain.connect(this.ctx.destination);

        // BG Music Gain
        this.bgGain = this.ctx.createGain();
        this.bgGain.gain.value = 0; // Start muted, fade in on interaction
        this.bgGain.connect(this.masterGain);
        
        this.bgPlaying = false;
    }

    startAmbient() {
        if (this.bgPlaying) return;
        this.bgPlaying = true;
        
        // Synthesize a very subtle ambient hum/pad
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(40, this.ctx.currentTime);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(40.5, this.ctx.currentTime); // Slight detune for phasing
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.bgGain);
        
        osc1.start();
        osc2.start();
        
        // Professional fade-in
        this.bgGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.bgGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 4);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // A simple synthesized pop for collisions
    playCollision(intensity) {
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Adjust tone based on intensity
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + (intensity * 400), this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        
        // Volume based on intensity (0.0 to 1.0)
        let vol = Math.min(intensity * 0.5 + 0.1, 1.0);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playPocketed(type) {
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        if (type === 'queen') {
            // Chime for queen
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime); 
            osc.frequency.setValueAtTime(1108, this.ctx.currentTime + 0.1); // C#
            osc.frequency.setValueAtTime(1318, this.ctx.currentTime + 0.2); // E
            
            gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
            
        } else if (type === 'striker') {
            // Error buzzer
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } else {
            // Default piece "plop"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        }
    }
}
