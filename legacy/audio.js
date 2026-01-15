// Audio Manager for Procedural Sound & Music
// Audio Manager for Procedural Sound & Music
window.AudioManager = class AudioManager {
    constructor() {
        this.ctx = window.AudioContext || window.webkitAudioContext;
        this.context = null;
        this.masterGain = null;
        this.isMuted = localStorage.getItem('tapOrDie_muted') === 'true';
        this.isPlayingMusic = false;

        // Music State
        this.nextNoteTime = 0;
        this.beatCount = 0;
        this.tempo = 120; // BPM
        this.schedulerTimer = null;
    }

    init() {
        if (!this.context) {
            this.context = new this.ctx();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.updateMute();
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('tapOrDie_muted', this.isMuted);
        this.updateMute();
        return this.isMuted;
    }

    updateMute() {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.context.currentTime);
        }
    }

    // --- SFX METHODS ---

    playSFX(type) {
        if (!this.context) this.init();
        const t = this.context.currentTime;

        if (type === 'success') {
            // Sharp High Ping
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(1400, t + 0.1);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.start(t);
            osc.stop(t + 0.1);
        }
        else if (type === 'hit') {
            // Boss Hit (Dull Thud)
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

            osc.start(t);
            osc.stop(t + 0.15);
        }
        else if (type === 'fail') {
            // Game Over (Descending / Noise)
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.5);

            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.start(t);
            osc.stop(t + 0.5);
        }
        else if (type === 'gold') {
            // Magical Chime (Arpeggio)
            const notes = [1200, 1500, 2000];
            notes.forEach((freq, i) => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t + (i * 0.05));

                gain.gain.setValueAtTime(0.1, t + (i * 0.05));
                gain.gain.exponentialRampToValueAtTime(0.01, t + (i * 0.05) + 0.2);

                osc.start(t + (i * 0.05));
                osc.stop(t + (i * 0.05) + 0.3);
            });
        }
        else if (type === 'boss_victory') {
            // Massive Explosion (White Noise + Low Osc)
            this.createExplosionSound(t);
        }
    }

    createExplosionSound(t) {
        // Low Rumble
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);

        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

        osc.start(t);
        osc.stop(t + 1.5);

        // Noise Burst (Pseudo-Noise via buffer)
        const bufferSize = this.context.sampleRate * 0.5; // 0.5 sec
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.5);

        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        noise.start(t);
    }

    // --- MUSIC SEQUENCER ---

    startMusic() {
        if (this.isPlayingMusic) return;
        if (!this.context) this.init();

        this.isPlayingMusic = true;
        this.nextNoteTime = this.context.currentTime + 0.1;
        this.scheduler();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        clearTimeout(this.schedulerTimer);
    }

    scheduler() {
        if (!this.isPlayingMusic) return;

        // Schedule ahead
        while (this.nextNoteTime < this.context.currentTime + 0.1) {
            this.playBeat(this.nextNoteTime);
            this.nextBeat();
        }

        this.schedulerTimer = setTimeout(() => this.scheduler(), 25);
    }

    nextBeat() {
        const secondsPerBeat = 60.0 / this.tempo;
        // Sixteenth notes
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.beatCount++;
        if (this.beatCount === 16) this.beatCount = 0; // 1 bar of 16th notes
    }

    playBeat(time) {
        // Simple 4-to-the-floor Kick
        if (this.beatCount % 4 === 0) {
            this.playKick(time);
        }

        // Hi-hats every 16th
        if (this.beatCount % 2 === 0) {
            this.playHiHat(time, this.beatCount % 4 === 2); // Accent off-beat
        }

        // Bassline (Evolving with Level via global state if needed, or update tempo)
        // Simple Driving Bass on off-beats
        if (this.beatCount % 4 === 2) {
            this.playBass(time);
        }
    }

    playKick(time) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playHiHat(time, accent) {
        const gain = this.context.createGain();
        gain.connect(this.masterGain);

        // Use high freq noise buffer or high oscillator
        // Simplified: Short high square wave
        const osc = this.context.createOscillator();

        osc.type = 'square'; // Metalic
        osc.frequency.value = 8000;
        osc.connect(gain);

        // Very short envelope
        gain.gain.setValueAtTime(accent ? 0.1 : 0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    playBass(time) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        // Simple F# / G progression possibility, just stick to F# (Cyberpunk)
        osc.frequency.setValueAtTime(46, time); // F#1

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, time);
        filter.frequency.exponentialRampToValueAtTime(800, time + 0.1);

        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.start(time);
        osc.stop(time + 0.3);
    }
}
