/**
 * Tap or Die - Official Production Script
 * Consolidated version for maximum compatibility (Mobile, CLI, local file access)
 */

// ==========================================
// 1. CONFIGURATION & DATABASES
// ==========================================

const CONFIG = {
    baseTime: 5000,
    minTime: 400,
    difficultyFactor: 0.001,
    baseSize: 100,
    minSize: 150,
    sizeFactor: 0.05
};

const SKINS = [
    { id: 'neon_cyan', name: 'Cyber Cyan', color: '#00f3ff', price: 0 },
    { id: 'neon_pink', name: 'Hot Pink', color: '#ff00ff', price: 100 },
    { id: 'lime_green', name: 'Toxic Lime', color: '#39ff14', price: 300 },
    { id: 'gold_rush', name: 'Gold Rush', color: '#ffd700', price: 1000 },
    { id: 'blood_red', name: 'Vampire', color: '#ff0000', price: 2000 },
    { id: 'matrix', name: 'The Matrix', color: '#00ff41', price: 3000 },
    { id: 'void_purple', name: 'Void', color: '#9d00ff', price: 5000 }
];

const BACKGROUNDS = [
    { id: 'bg_default', name: 'Deep Space', color: '#050510', price: 0 },
    { id: 'bg_red', name: 'Mars', color: '#1a0510', price: 500 },
    { id: 'bg_green', name: 'Toxic', color: '#051a10', price: 1000 },
    { id: 'bg_orange', name: 'Inferno', color: '#1a1005', price: 1500 },
    { id: 'bg_purple', name: 'Nebula', color: '#10051a', price: 2500 },
    { id: 'bg_pitch', name: 'Abyss', color: '#000000', price: 5000 }
];

const TRAILS = [
    { id: 'trail_default', name: 'Neon Trail', color: 'var(--skin-color)', price: 0 },
    { id: 'trail_flame', name: 'Flame Burn', color: '#ff4500', price: 1000 },
    { id: 'trail_electric', name: 'Volt Bolt', color: '#00f3ff', price: 2000 },
    { id: 'trail_rainbow', name: 'Prism Pass', color: 'rainbow', price: 5000 }
];

const MISSIONS = [
    { id: 1, name: 'First Steps', goal: 20, type: 'targets', time: 30000, reward: 100 },
    { id: 2, name: 'Boss Hunter', goal: 1, type: 'bosses', time: 45000, reward: 250 },
    { id: 3, name: 'Combo Master', goal: 10, type: 'combo', time: 30000, reward: 200 },
    { id: 4, name: 'Speed Demon', goal: 15, type: 'targets', time: 15000, reward: 300 },
    { id: 5, name: 'Gold Rush', goal: 3, type: 'gold', time: 60000, reward: 500 }
];

const CHALLENGES = [
    { id: 'daily_targets', name: 'Hit 50 total targets', goal: 50, type: 'targetsHit', reward: 50 },
    { id: 'daily_boss', name: 'Defeat 1 boss', goal: 1, type: 'bossesDefeated', reward: 100 },
    { id: 'daily_combo', name: 'Reach x15 Combo', goal: 15, type: 'maxCombo', reward: 75 }
];

const ACHIEVEMENTS = [
    { id: 'novice', name: 'Novice', goal: 100, type: 'totalTargets', skin: 'neon_cyan' },
    { id: 'slayer', name: 'Boss Slayer', goal: 5, type: 'totalBossesDefeated', skin: 'blood_red' },
    { id: 'rich', name: 'Coin Collector', goal: 1000, type: 'totalCoinsEarned', skin: 'gold_rush' }
];

// ==========================================
// 2. STATE & PERSISTENCE
// ==========================================

let state = {
    isPlaying: false,
    currentMode: 'infinite',
    currentMissionId: null,
    score: 0,
    bestScore: parseInt(localStorage.getItem('tapOrDie_bestScore')) || 0,
    coins: parseInt(localStorage.getItem('tapOrDie_coins')) || 0,
    currentSkinId: localStorage.getItem('tapOrDie_skin') || 'neon_cyan',
    ownedSkins: JSON.parse(localStorage.getItem('tapOrDie_ownedSkins')) || ['neon_cyan'],
    currentBgId: localStorage.getItem('tapOrDie_bg') || 'bg_default',
    ownedBgs: JSON.parse(localStorage.getItem('tapOrDie_ownedBgs')) || ['bg_default'],
    currentTrailId: localStorage.getItem('tapOrDie_trail') || 'trail_default',
    ownedTrails: JSON.parse(localStorage.getItem('tapOrDie_ownedTrails')) || ['trail_default'],
    completedMissions: JSON.parse(localStorage.getItem('tapOrDie_missions')) || [],
    currentTarget: null,
    currentWrapper: null,
    spawnTime: 0,
    timeLimit: 0,
    animationFrameId: null,
    lastFrameTime: 0,
    combo: 0,
    isPaused: false,
    pauseStartTime: 0,
    currentLevel: 1,
    isMuted: localStorage.getItem('tapOrDie_muted') === 'true',
    isFever: false,
    hasRevived: false,
    targetsHit: 0,
    activeDecoys: [],
    activePowerUps: { time_freeze: 0, double_coins: 0, magnet: 0 },
    stats: JSON.parse(localStorage.getItem('tapOrDie_stats')) || { totalBossesDefeated: 0, totalCoinsEarned: 0, maxCombo: 0, gamesPlayed: 0, totalTargets: 0, targetsHit: 0, bossesDefeated: 0, goldHit: 0 },
    dailyProgress: { targetsHit: 0, bossesDefeated: 0, goldHit: 0, maxCombo: 0 },
    sessionStats: { targetsHit: 0, bossesDefeated: 0, goldHit: 0, maxCombo: 0 }
};

function saveState() {
    localStorage.setItem('tapOrDie_bestScore', state.bestScore);
    localStorage.setItem('tapOrDie_coins', state.coins);
    localStorage.setItem('tapOrDie_skin', state.currentSkinId);
    localStorage.setItem('tapOrDie_ownedSkins', JSON.stringify(state.ownedSkins));
    localStorage.setItem('tapOrDie_bg', state.currentBgId);
    localStorage.setItem('tapOrDie_ownedBgs', JSON.stringify(state.ownedBgs));
    localStorage.setItem('tapOrDie_trail', state.currentTrailId);
    localStorage.setItem('tapOrDie_ownedTrails', JSON.stringify(state.ownedTrails));
    localStorage.setItem('tapOrDie_missions', JSON.stringify(state.completedMissions));
    localStorage.setItem('tapOrDie_stats', JSON.stringify(state.stats));
    localStorage.setItem('tapOrDie_muted', state.isMuted);
}

// ==========================================
// 3. AUDIO ENGINE
// ==========================================

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.tempo = 120;
        this.isPlayingMusic = false;
        this.notes = { 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25 };
    }

    init() {
        if (this.context) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = state.isMuted ? 0 : 0.8;
            console.log("Audio Engine Initialized");
        } catch (e) {
            console.error("Audio Init Failed:", e);
        }
    }

    playSFX(type) {
        if (!this.context || state.isMuted) return;
        if (this.context.state === 'suspended') this.context.resume();
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        if (type === 'hit') {
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(); osc.stop(now + 0.15);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(); osc.stop(now + 0.1);
        } else if (type === 'fail') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.5);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(); osc.stop(now + 0.5);
        } else if (type === 'gold' || type === 'powerup') {
            const freqs = [1200, 1500, 2000];
            freqs.forEach((f, i) => {
                const o = this.context.createOscillator();
                const g = this.context.createGain();
                o.connect(g); g.connect(this.masterGain);
                o.frequency.setValueAtTime(f, now + i * 0.05);
                g.gain.setValueAtTime(0.1, now + i * 0.05);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.2);
                o.start(now + i * 0.05); o.stop(now + i * 0.05 + 0.3);
            });
        } else if (type === 'boss_victory') {
            const freqs = [400, 600, 800, 1200];
            freqs.forEach((f, i) => {
                const o = this.context.createOscillator();
                const g = this.context.createGain();
                o.connect(g); g.connect(this.masterGain);
                o.frequency.setValueAtTime(f, now + i * 0.1);
                g.gain.setValueAtTime(0.2, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
                o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6);
            });
        }
    }

    toggleMute() {
        state.isMuted = !state.isMuted;
        if (this.masterGain) this.masterGain.gain.setValueAtTime(state.isMuted ? 0 : 0.8, this.context?.currentTime || 0);
        saveState();
        return state.isMuted;
    }

    startMusic() { if (this.isPlayingMusic) return; this.isPlayingMusic = true; this.playSequence(); }
    playSequence() {
        if (!this.isPlayingMusic || state.isMuted || !this.context) return;
        const melody = ['C4', 'G4', 'E4', 'B4', 'A4', 'E4', 'C4', 'G4'];
        let step = 60 / this.tempo;
        const note = melody[Math.floor(Math.random() * melody.length)];
        const o = this.context.createOscillator();
        const g = this.context.createGain();
        o.connect(g); g.connect(this.masterGain);
        o.frequency.value = this.notes[note];
        g.gain.setValueAtTime(0.05, this.context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + step / 2);
        o.start(); o.stop(this.context.currentTime + step / 2);
        setTimeout(() => this.playSequence(), step * 1000);
    }
}

const audio = new AudioManager();

// ==========================================
// 4. UI DATA & ELEMENT REFERENCES
// ==========================================

const el = {
    container: document.getElementById('game-container'),
    score: document.getElementById('score-value'),
    best: document.getElementById('best-value'),
    finalScore: document.getElementById('final-score-value'),
    overlay: document.getElementById('ui-overlay'),
    playArea: document.getElementById('play-area'),
    startBtn: document.getElementById('start-btn'),
    resultBox: document.getElementById('result-box'),
    titleText: document.getElementById('title-text'),
    pauseBtn: document.getElementById('pause-btn'),
    pauseMenu: document.getElementById('pause-menu'),
    resumeBtn: document.getElementById('resume-btn'),
    quitBtn: document.getElementById('quit-btn'),
    comboContainer: document.getElementById('combo-container'),
    comboValue: document.getElementById('combo-value'),
    levelValue: document.getElementById('level-value'),
    shopBtn: document.getElementById('shop-btn-trigger'),
    soundBtn: document.getElementById('sound-btn'),
    pauseSoundBtn: document.getElementById('pause-sound-btn'),
    shopModal: document.getElementById('shop-modal'),
    closeShopBtn: document.getElementById('close-shop'),
    skinGrid: document.getElementById('skin-grid'),
    shopCoins: document.getElementById('shop-coins-value'),
    tabSkins: document.getElementById('tab-skins'),
    tabTrails: document.getElementById('tab-trails'),
    tabBgs: document.getElementById('tab-bgs'),
    progressionBtn: document.getElementById('progression-btn-trigger'),
    progressionModal: document.getElementById('progression-modal'),
    closeProgressionBtn: document.getElementById('close-progression'),
    challengesList: document.getElementById('challenges-list'),
    achievementsList: document.getElementById('achievements-list'),
    missionBtn: document.getElementById('mission-btn-trigger'),
    missionModal: document.getElementById('mission-modal'),
    missionGrid: document.getElementById('mission-grid'),
    closeMissionsBtn: document.getElementById('close-missions'),
    reviveBtn: document.getElementById('revive-btn'),
    coinsEarned: document.getElementById('coins-earned')
};

let currentShopTab = 'skin';

// ==========================================
// 5. UTILS & HELPERS
// ==========================================

function getSafePosition(size, moveRange, obstacles) {
    const containerW = el.playArea.clientWidth;
    const containerH = el.playArea.clientHeight;
    const topSafeZone = 120;
    const pad = size / 2 + 10 + (moveRange / 2);

    let bestX = containerW / 2;
    let bestY = containerH / 2;
    let safe = false;
    let attempts = 0;

    while (!safe && attempts < 15) {
        attempts++;
        const x = Math.random() * (containerW - pad * 2) + pad;
        const minY = pad + topSafeZone;
        const maxY = containerH - pad;
        const y = minY < maxY ? Math.random() * (maxY - minY) + minY : (minY + maxY) / 2;

        let collision = false;
        for (const obs of obstacles) {
            const dist = Math.sqrt(Math.pow(x - obs.x, 2) + Math.pow(y - obs.y, 2));
            if (dist < (size + obs.size) / 2 + 20) { collision = true; break; }
        }
        if (!collision) { bestX = x; bestY = y; safe = true; }
    }
    return { x: bestX, y: bestY };
}

function animateWrapper(wrapper, range, speedMult = 1) {
    const speed = (1500 + Math.random() * 1000) * speedMult;
    const x = (Math.random() - 0.5) * range;
    const y = (Math.random() - 0.5) * range;
    return wrapper.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${x}px, ${y}px)` }], { duration: speed, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
}

function triggerHaptic(type) {
    if (navigator.vibrate) {
        if (type === 'success') navigator.vibrate(10);
        if (type === 'fail') navigator.vibrate([50, 50, 50]);
    }
}

function createExplosion(x, y, colorOverride = null) {
    const skin = SKINS.find(s => s.id === state.currentSkinId) || SKINS[0];
    const color = colorOverride || skin.color;
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'explosion-particle';
        Object.assign(p.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: '6px', height: '6px', background: color, borderRadius: '50%', pointerEvents: 'none', boxShadow: `0 0 10px ${color}`, zIndex: '500' });
        document.body.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 80 + 20;
        p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 }], { duration: 500 }).onfinish = () => p.remove();
    }
}

function createTrailDot(x, y) {
    if (Math.random() > 0.5) return;
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    if (state.currentTrailId === 'trail_flame') dot.classList.add('trail-flame');
    else if (state.currentTrailId === 'trail_electric') dot.classList.add('trail-electric');
    else if (state.currentTrailId === 'trail_rainbow') dot.classList.add('trail-rainbow');

    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    el.container.appendChild(dot);
    setTimeout(() => dot.remove(), 500);
}

// ==========================================
// 6. PROGRESSION & STATS
// ==========================================

function updateStats(key, value, isCumulative = true) {
    if (isCumulative) state.stats[key] = (state.stats[key] || 0) + value;
    else state.stats[key] = Math.max(state.stats[key] || 0, value);
    saveState();
    checkAchievements();
}

function updateDailyProgress(key, value, isCumulative = true) {
    if (isCumulative) state.stats[key] = (state.stats[key] || 0) + value; // In this version, keep it simple in stats
    else state.stats[key] = Math.max(state.stats[key] || 0, value);
    saveState();
}

function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
        if (!state.ownedSkins.includes(a.skin) && state.stats[a.type] >= a.goal) {
            state.ownedSkins.push(a.skin);
            saveState();
        }
    });
}

// ==========================================
// 7. ENGINE LOGIC
// ==========================================

function getDifficulty() {
    let time = CONFIG.baseTime * Math.exp(-CONFIG.difficultyFactor * state.score);
    time = Math.max(time, CONFIG.minTime);
    let size = CONFIG.baseSize * Math.exp(-CONFIG.sizeFactor * state.score);
    size = Math.max(size, CONFIG.minSize);
    return { time, size };
}

function spawnTarget() {
    if (!state.isPlaying) return;
    const diff = getDifficulty();
    state.timeLimit = diff.time;
    state.spawnTime = performance.now();
    state.lastFrameTime = state.spawnTime;

    if (state.currentWrapper) state.currentWrapper.remove();
    state.activeDecoys.forEach(d => d.remove());
    state.activeDecoys = [];

    const isBoss = (state.currentLevel % 5 === 0);
    if (isBoss && !state.bossType) state.bossType = ['normal', 'fast', 'splitter'][Math.floor(Math.random() * 3)];
    if (isBoss) { state.bossHealth = state.bossType === 'splitter' ? 3 : 5; state.timeLimit = Math.max(diff.time * 2, 2000); }

    const mainSize = isBoss ? 200 : diff.size;
    const pos = getSafePosition(mainSize, 0, []);
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { position: 'absolute', left: `${pos.x}px`, top: `${pos.y}px`, width: '0px', height: '0px' });
    const target = document.createElement('div');
    target.className = isBoss ? `target boss boss-${state.bossType}` : 'target';
    Object.assign(target.style, { width: `${mainSize}px`, height: `${mainSize}px` });
    target.dataset.type = isBoss ? 'boss' : 'normal';
    target.dataset.bossType = state.bossType;
    target.addEventListener('pointerdown', (e) => onTargetHit(e));
    wrapper.appendChild(target);
    el.playArea.appendChild(wrapper);
    state.currentTarget = target;
    state.currentWrapper = wrapper;

    const obs = [{ x: pos.x, y: pos.y, size: mainSize }];
    if (Math.random() > 0.95) spawnExtraTarget('gold', diff.size * 0.7, obs);
    if (!isBoss && state.currentLevel >= 3 && Math.random() < 0.3) spawnExtraTarget('decoy', diff.size * 0.9, obs);
    if (state.currentLevel >= 5 && Math.random() > 0.9) spawnExtraTarget(['time_freeze', 'double_coins', 'magnet'][Math.floor(Math.random() * 3)], diff.size * 0.8, obs);
}

function spawnExtraTarget(type, size, obs) {
    const pos = getSafePosition(size, 0, obs);
    const extra = document.createElement('div');
    extra.className = `target ${type}`;
    Object.assign(extra.style, { left: `${pos.x}px`, top: `${pos.y}px`, width: `${size}px`, height: `${size}px` });
    extra.dataset.type = type;
    extra.addEventListener('pointerdown', onTargetHit);
    el.playArea.appendChild(extra);
    state.activeDecoys.push(extra);
    obs.push({ x: pos.x, y: pos.y, size: size });
}

function spawnBossClone(relX, relY) {
    const size = 100;
    const rect = el.playArea.getBoundingClientRect();
    let x = Math.max(50, Math.min(rect.width - 50, relX + (Math.random() - 0.5) * 200));
    let y = Math.max(150, Math.min(rect.height - 50, relY + (Math.random() - 0.5) * 200));
    const clo = document.createElement('div');
    clo.className = 'target boss boss-splitter';
    Object.assign(clo.style, { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });
    clo.dataset.type = 'boss';
    clo.dataset.bossType = 'splitter';
    clo.dataset.isClone = 'true';
    clo.addEventListener('pointerdown', onTargetHit);
    el.playArea.appendChild(clo);
    state.activeDecoys.push(clo);
}

function onTargetHit(e) {
    if (!state.isPlaying || state.isPaused) return;
    e.preventDefault(); e.stopPropagation();
    const type = e.target.dataset.type;

    if (type === 'decoy') { triggerHaptic('fail'); createExplosion(e.clientX, e.clientY, '#ff0000'); gameOver(); return; }
    if (type === 'gold') { audio.playSFX('gold'); triggerHaptic('success'); createExplosion(e.clientX, e.clientY, '#ffd700'); state.score += 50; state.sessionStats.goldHit++; updateUI(); e.target.remove(); return; }
    if (['time_freeze', 'double_coins', 'magnet'].includes(type)) { activatePowerUp(type); createExplosion(e.clientX, e.clientY, '#00d4ff'); e.target.remove(); return; }

    if (type === 'boss') {
        state.bossHealth--; audio.playSFX('hit'); triggerHaptic('success');
        e.target.animate([{ transform: 'translate(-50%, -50%) scale(0.9)' }, { transform: 'translate(-50%, -50%) scale(1)' }], { duration: 100 });
        if (state.bossHealth <= 0) {
            if (e.target.dataset.bossType === 'splitter' && !e.target.dataset.isClone) {
                state.spawnTime = performance.now(); state.timeLimit = Math.max(state.timeLimit * 0.7, 2000); state.bossHealth = 2;
                const r = el.playArea.getBoundingClientRect();
                for (let i = 0; i < 2; i++) spawnBossClone(e.clientX - r.left, e.clientY - r.top);
                e.target.remove(); state.currentTarget = null; return;
            }
            createExplosion(e.clientX, e.clientY, '#ff00ff'); audio.playSFX('boss_victory');
            state.score += 500; let bonus = isPowerUpActive('double_coins') ? 100 : 50; state.coins += bonus;
            updateStats('totalCoinsEarned', bonus); updateStats('totalBossesDefeated', 1); state.sessionStats.bossesDefeated++;
            state.currentLevel++; updateLevelUI(); showLevelUpText(state.currentLevel); updateUI();
            if (state.currentWrapper) state.currentWrapper.remove();
            state.currentTarget = null; state.bossType = null; spawnTarget();
        }
        return;
    }

    if (type === 'normal') {
        audio.playSFX('success'); triggerHaptic('success'); createExplosion(e.clientX, e.clientY);
        state.combo++; let mult = (1 + Math.floor(state.combo / 10)) * (state.isFever ? 2 : 1);
        state.score += mult; state.targetsHit++; state.sessionStats.targetsHit++;
        updateDailyProgress('targetsHit', 1); updateStats('totalTargets', 1);
        if (state.targetsHit % 5 === 0) { let coin = isPowerUpActive('double_coins') ? 2 : 1; state.coins += coin; updateStats('totalCoinsEarned', coin); saveState(); }
        if (state.targetsHit % 10 === 0) { state.currentLevel++; updateLevelUI(); showLevelUpText(state.currentLevel); audio.tempo += 5; }
        updateUI(); updateComboUI(); spawnTarget();
    }
}

function gameUpdate() {
    if (!state.isPlaying || state.isPaused) return;
    const now = performance.now();
    if (!state.lastFrameTime) state.lastFrameTime = now;
    let delta = now - state.lastFrameTime;
    state.lastFrameTime = now;
    if (isPowerUpActive('time_freeze')) state.spawnTime += delta * 0.5;
    const elapsed = now - state.spawnTime;
    const remaining = state.timeLimit - elapsed;
    if (remaining <= 0) { gameOver(); return; }
    const pct = remaining / state.timeLimit;
    if (state.currentTarget) { state.currentTarget.style.transform = `translate(-50%, -50%) scale(${pct})`; if (pct < 0.3) { state.currentTarget.style.boxShadow = `0 0 30px #ff0055`; state.currentTarget.style.backgroundColor = `#ff0055`; } }
    state.animationFrameId = requestAnimationFrame(gameUpdate);
}

function startGame() {
    state.isPlaying = true; state.currentMode = 'infinite'; state.currentMissionId = null; state.score = 0; state.combo = 0; state.currentLevel = 1; state.hasRevived = false; state.targetsHit = 0; state.bossType = null;
    state.sessionStats = { targetsHit: 0, bossesDefeated: 0, goldHit: 0, maxCombo: 0 };
    audio.init(); audio.startMusic(); audio.tempo = 110;
    el.overlay.classList.remove('active'); el.resultBox.classList.add('hidden'); el.titleText.classList.remove('hidden'); el.pauseBtn.classList.remove('hidden');
    state.activeDecoys.forEach(d => d.remove()); state.activeDecoys = [];
    updateUI(); updateLevelUI(); updateComboUI(); spawnTarget();
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = requestAnimationFrame(gameUpdate);
}

function gameOver() {
    state.isPlaying = false; cancelAnimationFrame(state.animationFrameId);
    if (state.currentWrapper) state.currentWrapper.remove();
    state.bestScore = Math.max(state.bestScore, state.score);
    const earn = Math.floor(state.score / 10); state.coins += earn; saveState();
    audio.playSFX('fail'); triggerHaptic('fail'); el.pauseBtn.classList.add('hidden');
    el.container.classList.add('shake'); setTimeout(() => el.container.classList.remove('shake'), 500);
    state.sessionStats.maxCombo = Math.max(state.sessionStats.maxCombo, state.combo);
    updateStats('gamesPlayed', 1); updateStats('maxCombo', state.combo, false);

    if (state.currentMode === 'mission') {
        const m = MISSIONS.find(ms => ms.id === state.currentMissionId);
        let win = (m.type === 'targets' && state.sessionStats.targetsHit >= m.goal) || (m.type === 'bosses' && state.sessionStats.bossesDefeated >= m.goal) || (m.type === 'combo' && state.sessionStats.maxCombo >= m.goal) || (m.type === 'gold' && state.sessionStats.goldHit >= m.goal);
        if (win) {
            if (!state.completedMissions.includes(m.id)) { state.completedMissions.push(m.id); state.coins += m.reward; saveState(); showLevelUpText(`MISSION COMPLETE! +${m.reward}🪙`); }
            else showLevelUpText(`MISSION COMPLETE!`);
        } else showLevelUpText(`MISSION FAILED`);
    }
    state.currentMode = 'infinite'; state.currentMissionId = null;
    el.finalScore.innerText = state.score; el.coinsEarned.innerText = earn; el.best.innerText = state.bestScore;
    if (!state.hasRevived && state.coins >= 100) { el.reviveBtn.classList.remove('hidden'); el.reviveBtn.onclick = () => attemptRevive(); }
    else el.reviveBtn.classList.add('hidden');
    el.resultBox.classList.remove('hidden'); el.titleText.classList.add('hidden'); el.overlay.classList.add('active'); el.startBtn.innerText = "RETRY";
}

function attemptRevive() {
    if (state.coins < 100) return; state.coins -= 100; state.hasRevived = true; saveState();
    state.isPlaying = true; el.overlay.classList.remove('active'); el.resultBox.classList.add('hidden'); el.pauseBtn.classList.remove('hidden'); spawnTarget();
}

function startMission(id) {
    const m = MISSIONS.find(ms => ms.id === id); if (!m) return;
    state.currentMode = 'mission'; state.currentMissionId = id; state.isPlaying = true; state.score = 0; state.combo = 0; state.targetsHit = 0; state.currentLevel = 1; state.hasRevived = false;
    state.sessionStats = { targetsHit: 0, bossesDefeated: 0, goldHit: 0, maxCombo: 0 };
    state.timeLimit = m.time; state.spawnTime = performance.now(); audio.init(); audio.startMusic();
    el.overlay.classList.remove('active'); el.score.innerText = '0'; el.levelValue.innerText = m.name;
    el.playArea.innerHTML = ''; state.activeDecoys = []; spawnTarget();
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = requestAnimationFrame(gameUpdate);
}

function activatePowerUp(type) {
    state.activePowerUps[type] = performance.now() + 5000;
    el.container.classList.add(`pu-${type}`); audio.playSFX('gold');
    setTimeout(() => { if (performance.now() >= state.activePowerUps[type]) el.container.classList.remove(`pu-${type}`); }, 5000);
}

function isPowerUpActive(type) { return state.activePowerUps[type] > performance.now(); }

function togglePause() {
    if (!state.isPlaying) return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) { cancelAnimationFrame(state.animationFrameId); state.pauseStartTime = performance.now(); el.pauseMenu.classList.remove('hidden'); el.pauseBtn.classList.add('hidden'); }
    else { state.spawnTime += (performance.now() - state.pauseStartTime); el.pauseMenu.classList.add('hidden'); el.pauseBtn.classList.remove('hidden'); state.animationFrameId = requestAnimationFrame(gameUpdate); }
}

function quitGame() { state.isPaused = false; state.isPlaying = false; cancelAnimationFrame(state.animationFrameId); el.pauseMenu.classList.add('hidden'); gameOver(); }

// ==========================================
// 8. UI UPDATES & BINDING
// ==========================================

function updateUI() { el.score.innerText = state.score; el.best.innerText = state.bestScore; }
function updateLevelUI() { el.levelValue.innerText = state.currentLevel; }
function updateComboUI() {
    if (state.combo > 1) { el.comboContainer.classList.remove('hidden'); el.comboValue.innerText = `x${state.combo}`; }
    else el.comboContainer.classList.add('hidden');
}

function updateSkinVariables() {
    const skin = SKINS.find(s => s.id === state.currentSkinId) || SKINS[0];
    document.documentElement.style.setProperty('--skin-color', skin.color);
    document.documentElement.style.setProperty('--skin-glow', `0 0 20px ${skin.color}`);
}

function updateBackground() { document.documentElement.style.setProperty('--bg-color', (BACKGROUNDS.find(b => b.id === state.currentBgId) || BACKGROUNDS[0]).color); }

function updateSoundUI() { const icon = state.isMuted ? '🔇' : '🔊'; el.soundBtn.innerText = icon; el.pauseSoundBtn.innerText = icon; }

function showLevelUpText(txt) {
    const d = document.createElement('div'); d.innerText = typeof txt === 'number' ? `LEVEL ${txt}` : txt;
    Object.assign(d.style, { position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '48px', fontWeight: '900', color: 'var(--skin-color)', textShadow: '0 0 20px var(--skin-color)', zIndex: '1000', pointerEvents: 'none' });
    el.container.appendChild(d);
    d.animate([{ transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 }, { transform: 'translate(-50%, -70%) scale(1)', opacity: 0 }], { duration: 1500 }).onfinish = () => d.remove();
}

function renderShop() {
    el.skinGrid.innerHTML = ''; el.shopCoins.innerText = state.coins;
    el.tabSkins.className = currentShopTab === 'skin' ? 'secondary-btn active' : 'secondary-btn';
    el.tabTrails.className = currentShopTab === 'trail' ? 'secondary-btn active' : 'secondary-btn';
    el.tabBgs.className = currentShopTab === 'bg' ? 'secondary-btn active' : 'secondary-btn';

    let list = currentShopTab === 'skin' ? SKINS : (currentShopTab === 'trail' ? TRAILS : BACKGROUNDS);
    let owned = currentShopTab === 'skin' ? state.ownedSkins : (currentShopTab === 'trail' ? state.ownedTrails : state.ownedBgs);
    let active = currentShopTab === 'skin' ? state.currentSkinId : (currentShopTab === 'trail' ? state.currentTrailId : state.currentBgId);

    list.forEach(item => {
        const isO = owned.includes(item.id); const isA = active === item.id;
        const div = document.createElement('div'); div.className = `skin-item ${isA ? 'active' : ''}`;
        let col = item.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : (item.color.startsWith('var') ? 'var(--skin-color)' : item.color);
        div.innerHTML = `<div class="skin-preview" style="background:${col}"></div><div class="skin-req">${item.name}</div><div class="skin-req">${isA ? 'EQUIPPED' : (isO ? 'OWNED' : `${item.price} 🪙`)}</div>`;
        div.onclick = () => {
            if (isO) {
                if (currentShopTab === 'skin') { state.currentSkinId = item.id; updateSkinVariables(); }
                else if (currentShopTab === 'trail') state.currentTrailId = item.id;
                else { state.currentBgId = item.id; updateBackground(); }
                saveState(); renderShop(); audio.playSFX('success');
            } else if (state.coins >= item.price) {
                state.coins -= item.price; owned.push(item.id); saveState(); renderShop(); audio.playSFX('success');
            } else triggerHaptic('fail');
        };
        el.skinGrid.appendChild(div);
    });
}

function renderMissions() {
    el.missionGrid.innerHTML = '';
    MISSIONS.forEach(m => {
        const isD = state.completedMissions.includes(m.id);
        const b = document.createElement('div'); b.className = `skin-item ${isD ? 'active' : ''}`;
        b.innerHTML = `<div style="font-size:18px; font-weight:bold;">${m.id}</div><div style="font-size:10px">${isD ? '★ COMPLETED' : 'INCOMPLETE'}</div>`;
        b.onclick = () => { el.missionModal.classList.add('hidden'); startMission(m.id); };
        el.missionGrid.appendChild(b);
    });
}

function renderProgression() {
    el.challengesList.innerHTML = '';
    CHALLENGES.forEach(c => {
        const cur = state.stats[c.type] || 0; const pct = Math.min(100, (cur / c.goal) * 100);
        const d = document.createElement('div'); d.style.marginBottom = '10px';
        d.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>${c.name}</span><span>${cur}/${c.goal}</span></div><div style="width:100%; height:8px; background:#111; border-radius:4px; margin-top:4px;"><div style="width:${pct}%; height:100%; background:var(--skin-color); border-radius:4px;"></div></div>`;
        el.challengesList.appendChild(d);
    });
    el.achievementsList.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
        const isD = state.stats[a.type] >= a.goal;
        const d = document.createElement('div'); d.style.marginBottom = '10px'; d.style.opacity = isD ? '1' : '0.4';
        d.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><div style="width:30px; height:30px; background:var(--skin-color); border-radius:50%; display:flex; justify-content:center; align-items:center; color:#000; font-weight:bold;">${isD ? '✓' : '?'}</div><div style="font-size:12px;">${a.name}</div></div>`;
        el.achievementsList.appendChild(d);
    });
}

function init() {
    updateSkinVariables(); updateBackground(); updateSoundUI();
    el.startBtn.addEventListener('click', startGame);
    el.shopBtn.addEventListener('click', () => { el.shopModal.classList.remove('hidden'); renderShop(); });
    el.closeShopBtn.addEventListener('click', () => el.shopModal.classList.add('hidden'));
    el.tabSkins.addEventListener('click', () => { currentShopTab = 'skin'; renderShop(); });
    el.tabTrails.addEventListener('click', () => { currentShopTab = 'trail'; renderShop(); });
    el.tabBgs.addEventListener('click', () => { currentShopTab = 'bg'; renderShop(); });
    el.missionBtn.addEventListener('click', () => { el.missionModal.classList.remove('hidden'); renderMissions(); });
    el.closeMissionsBtn.addEventListener('click', () => el.missionModal.classList.add('hidden'));
    el.progressionBtn.addEventListener('click', () => { el.progressionModal.classList.remove('hidden'); renderProgression(); });
    el.closeProgressionBtn.addEventListener('click', () => el.progressionModal.classList.add('hidden'));
    el.soundBtn.addEventListener('click', () => { audio.toggleMute(); updateSoundUI(); });
    el.pauseSoundBtn.addEventListener('click', () => { audio.toggleMute(); updateSoundUI(); });
    el.pauseBtn.addEventListener('click', togglePause);
    el.resumeBtn.addEventListener('click', togglePause);
    el.quitBtn.addEventListener('click', quitGame);
    el.container.addEventListener('pointermove', (e) => { if (state.isPlaying) createTrailDot(e.clientX, e.clientY); });
    document.addEventListener('click', () => { audio.init(); }, { once: true });
}

document.addEventListener('DOMContentLoaded', init);
