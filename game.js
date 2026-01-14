// Game Configuration
const CONFIG = {
    baseTime: 5000,
    minTime: 400,
    difficultyFactor: 0.001,
    baseSize: 100,
    minSize: 150,
    sizeFactor: 0.05
};

// Skins Database
const SKINS = [
    { id: 'neon_cyan', name: 'Cyber Cyan', color: '#00f3ff', price: 0 },
    { id: 'neon_pink', name: 'Hot Pink', color: '#ff00ff', price: 100 },
    { id: 'lime_green', name: 'Toxic Lime', color: '#39ff14', price: 300 },
    { id: 'gold_rush', name: 'Gold Rush', color: '#ffd700', price: 1000 },
    { id: 'blood_red', name: 'Vampire', color: '#ff0000', price: 2000 },
    { id: 'matrix', name: 'The Matrix', color: '#00ff41', price: 3000 },
    { id: 'void_purple', name: 'Void', color: '#9d00ff', price: 5000 }
];

// Backgrounds Database
const BACKGROUNDS = [
    { id: 'bg_default', name: 'Deep Space', color: '#050510', price: 0 },
    { id: 'bg_red', name: 'Mars', color: '#1a0510', price: 500 },
    { id: 'bg_green', name: 'Toxic', color: '#051a10', price: 1000 },
    { id: 'bg_orange', name: 'Inferno', color: '#1a1005', price: 1500 },
    { id: 'bg_purple', name: 'Nebula', color: '#10051a', price: 2500 },
    { id: 'bg_pitch', name: 'Abyss', color: '#000000', price: 5000 }
];

// State
let state = {
    isPlaying: false,
    score: 0,
    score: 0,
    bestScore: parseInt(localStorage.getItem('tapOrDie_bestScore')) || 0,
    coins: parseInt(localStorage.getItem('tapOrDie_coins')) || 0,
    currentSkinId: localStorage.getItem('tapOrDie_skin') || 'neon_cyan',
    ownedSkins: JSON.parse(localStorage.getItem('tapOrDie_ownedSkins')) || ['neon_cyan'],
    currentBgId: localStorage.getItem('tapOrDie_bg') || 'bg_default',
    ownedBgs: JSON.parse(localStorage.getItem('tapOrDie_ownedBgs')) || ['bg_default'],
    currentTarget: null,
    currentWrapper: null,
    targetTimerInv: null,
    spawnTime: 0,
    timeLimit: 0,
    animationFrameId: null,
    adMobReady: false,

    // New State
    combo: 0,
    isPaused: false,
    pauseStartTime: 0,
    combo: 0,
    isPaused: false,
    pauseStartTime: 0,
    currentLevel: 1,
    isMuted: localStorage.getItem('tapOrDie_muted') === 'true', // Default false
    isFever: false,
    hasRevived: false
};



// AdMob Imports 
const AdMob = window.Capacitor ? window.Capacitor.Plugins.AdMob : null;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// DOM Elements
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
    // HUD & Pause
    pauseBtn: document.getElementById('pause-btn'),
    pauseMenu: document.getElementById('pause-menu'),
    resumeBtn: document.getElementById('resume-btn'),
    quitBtn: document.getElementById('quit-btn'),
    comboContainer: document.getElementById('combo-container'),
    comboValue: document.getElementById('combo-value'),
    levelValue: document.getElementById('level-value'),
    // Shop & Settings
    shopBtn: document.getElementById('shop-btn-trigger'),
    soundBtn: document.getElementById('sound-btn'), // Main Menu
    pauseSoundBtn: document.getElementById('pause-sound-btn'), // Pause Menu
    shopModal: document.getElementById('shop-modal'),
    closeShopBtn: document.getElementById('close-shop'),
    skinGrid: document.getElementById('skin-grid'),
    shopBest: document.getElementById('shop-best-score'),

    // Revive
    reviveBtn: document.getElementById('revive-btn'),
    coinsEarned: document.getElementById('coins-earned')
};

// Initialize
function init() {
    updateSkinVariables();
    updateBackground();
    el.best.innerText = state.bestScore;

    el.startBtn.addEventListener('click', startGame);
    el.shopBtn.addEventListener('click', openShop);
    el.closeShopBtn.addEventListener('click', closeShop);

    el.pauseBtn.addEventListener('click', togglePause);
    el.resumeBtn.addEventListener('click', togglePause);
    el.quitBtn.addEventListener('click', quitGame);
    el.soundBtn.addEventListener('click', toggleSound);
    el.pauseSoundBtn.addEventListener('click', toggleSound);

    updateSoundUI(); // Set initial icon

    document.addEventListener('click', () => {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });

    // Finger Trails
    el.container.addEventListener('pointermove', (e) => {
        if (!state.isPlaying) return;
        createTrailDot(e.clientX, e.clientY);
    });

    initAds();
}

function createTrailDot(x, y) {
    if (Math.random() > 0.5) return; // Optimization: only spawn 50% of frames
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    // Use skin color? CSS var handles it via class, but we need position.
    // CSS class .trail-dot uses var(--skin-color) so it updates auto.
    document.body.appendChild(dot);

    // Cleanup handled by CSS animation, but we should remove from DOM
    setTimeout(() => dot.remove(), 500);
}

// Skin Logic
function updateSkinVariables() {
    const skin = SKINS.find(s => s.id === state.currentSkinId) || SKINS[0];
    document.documentElement.style.setProperty('--skin-color', skin.color);
    document.documentElement.style.setProperty('--skin-glow', `0 0 20px ${skin.color}`);
}

function openShop() {
    el.shopModal.classList.remove('hidden');
    renderShop();
}

function closeShop() {
    el.shopModal.classList.add('hidden');
}

function renderShop() {
    el.shopBest.innerText = state.coins + ' 🪙'; // Reusing that element for Coins now
    el.skinGrid.innerHTML = '';

    // Helper to render items
    const renderItem = (item, type) => {
        const isOwned = (type === 'skin' ? state.ownedSkins : state.ownedBgs).includes(item.id);
        const isActive = (type === 'skin' ? state.currentSkinId : state.currentBgId) === item.id;
        const canAfford = state.coins >= item.price;

        const div = document.createElement('div');
        div.className = `skin-item ${isActive ? 'active' : ''} ${!isOwned && !canAfford ? 'locked' : ''}`;

        let statusText = '';
        if (isActive) statusText = 'EQUIPPED';
        else if (isOwned) statusText = 'OWNED';
        else statusText = `${item.price} 🪙`;

        div.innerHTML = `
            <div class="skin-preview" style="background:${item.color}; box-shadow: 0 0 10px ${item.color}"></div>
            <div class="skin-req">${item.name}</div>
            <div class="skin-req" style="color: ${isOwned ? '#fff' : '#ff0055'}">${statusText}</div>
        `;

        div.onclick = () => {
            if (isOwned) {
                // Equip
                if (type === 'skin') {
                    state.currentSkinId = item.id;
                    localStorage.setItem('tapOrDie_skin', item.id);
                    updateSkinVariables();
                } else {
                    state.currentBgId = item.id;
                    localStorage.setItem('tapOrDie_bg', item.id);
                    updateBackground();
                }
                renderShop();
                playSound('success'); // Feedback
            } else if (canAfford) {
                // Buy
                state.coins -= item.price;
                localStorage.setItem('tapOrDie_coins', state.coins);

                if (type === 'skin') {
                    state.ownedSkins.push(item.id);
                    localStorage.setItem('tapOrDie_ownedSkins', JSON.stringify(state.ownedSkins));
                    // Auto equip
                    state.currentSkinId = item.id;
                    localStorage.setItem('tapOrDie_skin', item.id);
                    updateSkinVariables();
                } else {
                    state.ownedBgs.push(item.id);
                    localStorage.setItem('tapOrDie_ownedBgs', JSON.stringify(state.ownedBgs));
                    // Auto equip
                    state.currentBgId = item.id;
                    localStorage.setItem('tapOrDie_bg', item.id);
                    updateBackground();
                }
                renderShop();
                playSound('success'); // Cha-ching!
            } else {
                triggerHaptic('fail'); // Can't afford
            }
        };
        el.skinGrid.appendChild(div);
    };

    SKINS.forEach(s => renderItem(s, 'skin'));

    // Separator
    const sep = document.createElement('h3');
    sep.style.color = '#fff';
    sep.style.width = '100%';
    sep.style.textAlign = 'center';
    sep.style.gridColumn = '1 / -1';
    sep.innerText = 'BACKGROUNDS';
    el.skinGrid.appendChild(sep);

    BACKGROUNDS.forEach(b => renderItem(b, 'bg'));
}
function updateBackground() {
    const bg = BACKGROUNDS.find(b => b.id === state.currentBgId) || BACKGROUNDS[0];
    document.documentElement.style.setProperty('--bg-color', bg.color);
}

// Ads
async function initAds() {
    if (!AdMob) return;
    try {
        await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: true });
        await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712', isTesting: true });
        state.adMobReady = true;
    } catch (e) {
        console.error('AdMob Init Failed', e);
    }
}

async function showAd() {
    if (!AdMob || !state.adMobReady) return;
    try {
        await AdMob.showInterstitial();
        await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712', isTesting: true });
    } catch (e) { }
}

// Sound & Haptics
function triggerHaptic(type) {
    if (navigator.vibrate) {
        if (type === 'success') navigator.vibrate(10); // Light tap
        if (type === 'fail') navigator.vibrate([50, 50, 50]); // Heavy shake
    }
}

function playSound(type) {
    if (state.isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
        const baseFreq = 600 + (Math.min(state.score, 50) * 10);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

// Game Loop
function startGame() {
    state.isPlaying = true;
    state.score = 0;
    updateUI();

    el.overlay.classList.remove('active');
    el.resultBox.classList.add('hidden');
    el.titleText.classList.remove('hidden');

    el.pauseBtn.classList.remove('hidden');
    state.combo = 0;
    state.currentLevel = 1;
    state.hasRevived = false; // Reset for new run
    updateLevelUI();
    updateComboUI();

    requestFullscreen();
    spawnTarget();
}

function requestFullscreen() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) docEl.requestFullscreen().catch(err => { });
}

function gameOver() {
    state.isPlaying = false;
    cancelAnimationFrame(state.animationFrameId);

    if (state.currentWrapper) {
        state.currentWrapper.remove();
        state.currentWrapper = null;
        state.currentTarget = null;
    }

    if (state.score > state.bestScore) {
        state.bestScore = state.score;
        localStorage.setItem('tapOrDie_bestScore', state.bestScore);
    }

    // Convert Score to Coins
    const earnings = Math.floor(state.score / 10);
    state.coins += earnings;
    localStorage.setItem('tapOrDie_coins', state.coins);

    playSound('fail');
    triggerHaptic('fail');
    el.pauseBtn.classList.add('hidden');

    // Screen Shake Effect
    el.container.classList.add('shake');
    setTimeout(() => el.container.classList.remove('shake'), 500);

    el.finalScore.innerText = state.score;
    el.coinsEarned.innerText = earnings; // Show earnings
    el.best.innerText = state.bestScore;

    // Revive Availability
    if (!state.hasRevived && state.coins >= 100) {
        el.reviveBtn.classList.remove('hidden');
        el.reviveBtn.innerText = "REVIVE (100 🪙)";
        el.reviveBtn.onclick = () => attemptRevive();
    } else {
        el.reviveBtn.classList.add('hidden');
    }

    el.resultBox.classList.remove('hidden');
    el.titleText.classList.add('hidden');
    el.overlay.classList.add('active');
    el.startBtn.innerText = "RETRY";

    showAd();
}

function attemptRevive() {
    if (state.coins < 100) return;

    state.coins -= 100;
    localStorage.setItem('tapOrDie_coins', state.coins);
    state.hasRevived = true;

    // Resume Game logic
    state.isPlaying = true;
    el.overlay.classList.remove('active');
    el.resultBox.classList.add('hidden');
    el.pauseBtn.classList.remove('hidden');

    // Reset timer to something helpful
    state.timeLimit = 1000; // Give them a sec? Actually spawnTarget resets it based on difficulty. 
    // We just need to spawn.

    spawnTarget();
}

function updateUI() {
    el.score.innerText = state.score;
}

function getDifficulty() {
    // Difficulty scales with Score AND Level
    let time = CONFIG.baseTime * Math.exp(-CONFIG.difficultyFactor * state.score);
    // Cap minimum time based on Level to prevent it from being impossible too fast, 
    // or make it harder. Let's stick to score-based time but add movement.
    time = Math.max(time, CONFIG.minTime);

    let size = CONFIG.baseSize * Math.exp(-CONFIG.sizeFactor * state.score);
    size = Math.max(size, CONFIG.minSize);

    return { time, size };
}

function updateLevelUI() {
    el.levelValue.innerText = state.currentLevel;
}

function spawnTarget() {
    if (!state.isPlaying) return;

    const diff = getDifficulty();
    state.timeLimit = diff.time;
    state.spawnTime = performance.now();

    if (state.currentWrapper) state.currentWrapper.remove();

    const containerW = el.playArea.clientWidth;
    const containerH = el.playArea.clientHeight;

    // logic for movement range
    let moveRange = 0;
    if (state.currentLevel >= 2) {
        moveRange = 50 * Math.min(state.currentLevel, 5);
        // Constrain movement on small screens (max 30% of dimension)
        const maxAllowed = Math.min(containerW, containerH) * 0.3;
        moveRange = Math.min(moveRange, maxAllowed);
    }

    const maxHalfMove = moveRange / 2;
    const topSafeZone = 120; // safe from HUD
    const radius = diff.size / 2;
    const basePad = radius + 10;

    // Total padding: Base + Movement to ensure it stays on screen
    const pad = basePad + maxHalfMove;

    const minX = pad;
    const maxX = containerW - pad;
    // Handle small screens where padding > container
    const x = minX < maxX ? Math.random() * (maxX - minX) + minX : containerW / 2;

    const minY = pad + topSafeZone;
    const maxY = containerH - pad;
    const y = minY < maxY ? Math.random() * (maxY - minY) + minY : (minY + maxY) / 2;

    // Create Wrapper for positioning/movement
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = `${x}px`;
    wrapper.style.top = `${y}px`;
    wrapper.style.width = '0px';
    wrapper.style.height = '0px'; // Wrapper acts as anchor

    // Create Target for scaling
    const target = document.createElement('div');
    target.className = 'target';
    target.style.width = `${diff.size}px`;
    target.style.height = `${diff.size}px`;
    // target has transform: translate(-50%, -50%) in CSS so it centers on wrapper

    // Moving Targets Logic (Level 2+)
    if (moveRange > 0) {
        animateWrapper(wrapper, moveRange);
    }

    // Determine Type: Normal, Decoy (10% chance if Level > 2), Gold (5% chance)
    let type = 'normal';
    const rand = Math.random();

    // Decoys only start spawning after level 3 to ease player in
    if (state.currentLevel >= 3 && rand < 0.1) {
        type = 'decoy';
    } else if (rand > 0.95) {
        type = 'gold';
    }

    if (type === 'decoy') {
        target.classList.add('decoy');
    } else if (type === 'gold') {
        target.classList.add('gold');
    }

    target.dataset.type = type;
    target.addEventListener('pointerdown', onTargetHit);

    wrapper.appendChild(target);
    el.playArea.appendChild(wrapper);

    state.currentTarget = target;
    state.currentWrapper = wrapper;

    requestAnimationFrame(gameUpdate);
}

function onTargetHit(e) {
    if (!state.isPlaying) return;
    e.preventDefault();

    const targetType = e.target.dataset.type;

    if (targetType === 'decoy') {
        // Hitting a decoy is instant death
        triggerHaptic('fail');
        createExplosion(e.clientX, e.clientY, '#ff0000'); // Red explosion
        gameOver();
        return;
    }

    // Success hit (Normal or Gold)
    playSound('success');
    triggerHaptic('success');
    createExplosion(e.clientX, e.clientY);

    // Combo Logic
    state.combo++;
    let multiplier = 1 + Math.floor(state.combo / 10);

    if (targetType === 'gold') {
        playSound('success'); // Maybe a double sound or special chime?
        multiplier += 50; // Big bonus
        createExplosion(e.clientX, e.clientY, '#ffd700'); // Gold explosion
    }

    if (state.isFever) {
        multiplier *= 2; // Double points in fever
    }

    state.score += multiplier;

    // Level Up Logic
    // Every 10 points = 1 Level increase (example)
    const newLevel = Math.floor(state.score / 10) + 1;
    if (newLevel > state.currentLevel) {
        state.currentLevel = newLevel;
        updateLevelUI();
        playSound('success'); // Extra chime?
        // Optional: Show Level Up text
        showLevelUpText(newLevel);
    }

    updateComboUI();
    updateUI();

    if (state.currentWrapper) state.currentWrapper.remove();
    state.currentTarget = null;
    state.currentWrapper = null;

    spawnTarget();
}

function showLevelUpText(level) {
    const div = document.createElement('div');
    div.innerText = `LEVEL ${level}`;
    div.style.position = 'absolute';
    div.style.top = '40%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.fontSize = '40px';
    div.style.fontWeight = 'bold';
    div.style.color = '#fff';
    div.style.textShadow = '0 0 20px #fff';
    div.style.zIndex = '100';
    div.style.pointerEvents = 'none';

    document.body.appendChild(div);

    div.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)' },
        { opacity: 0, transform: 'translate(-50%, -150%) scale(1)' }
    ], {
        duration: 1500,
        easing: 'ease-out'
    }).onfinish = () => div.remove();
}

function gameUpdate(timestamp) {
    if (!state.isPlaying || !state.currentTarget) return;

    const elapsed = timestamp - state.spawnTime;
    const remaining = state.timeLimit - elapsed;

    if (remaining <= 0) {
        gameOver();
        return;
    }

    const pct = remaining / state.timeLimit;
    state.currentTarget.style.transform = `translate(-50%, -50%) scale(${pct})`;

    if (pct < 0.3) {
        state.currentTarget.style.boxShadow = `0 0 30px #ff0055`;
        state.currentTarget.style.backgroundColor = `#ff0055`;
    }

    state.animationFrameId = requestAnimationFrame(gameUpdate);
}

function createExplosion(x, y, overrideColor = null) {
    const skin = SKINS.find(s => s.id === state.currentSkinId) || SKINS[0];
    const color = overrideColor || skin.color;

    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.style.position = 'fixed';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.width = '6px';
        p.style.height = '6px';
        p.style.background = color;
        p.style.borderRadius = '50%';
        p.style.pointerEvents = 'none';
        p.style.boxShadow = `0 0 10px ${color}`;
        document.body.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 80 + 20;

        const tx = Math.cos(angle) * speed;
        const ty = Math.sin(angle) * speed;

        p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => p.remove();
    }
}

function updateComboUI() {
    if (state.combo > 1) {
        el.comboContainer.classList.remove('hidden');
        el.comboValue.innerText = `x${state.combo}`;

        // Fever Check
        if (state.combo >= 25 && !state.isFever) { // Lowered to 25 for easier testing
            activateFever();
        } else if (state.combo < 25 && state.isFever) {
            deactivateFever();
        }

        // Reset animation
        el.comboValue.style.animation = 'none';
        el.comboValue.offsetHeight; /* trigger reflow */
        el.comboValue.style.animation = 'pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    } else {
        el.comboContainer.classList.add('hidden');
        if (state.isFever) deactivateFever();
    }
}

function activateFever() {
    state.isFever = true;
    el.container.classList.add('fever');
    el.comboValue.style.color = '#ffd700';
    el.comboValue.innerText = 'FEVER!';
}

function deactivateFever() {
    state.isFever = false;
    el.container.classList.remove('fever');
    el.comboValue.style.color = 'var(--skin-color)';
}

function togglePause() {
    if (!state.isPlaying) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        // Pausing
        cancelAnimationFrame(state.animationFrameId);
        state.pauseStartTime = performance.now();
        el.pauseMenu.classList.remove('hidden');
        el.pauseBtn.classList.add('hidden');
    } else {
        // Resuming
        const pauseDuration = performance.now() - state.pauseStartTime;
        state.spawnTime += pauseDuration;
        el.pauseMenu.classList.add('hidden');
        el.pauseBtn.classList.remove('hidden');
        state.animationFrameId = requestAnimationFrame(gameUpdate);
    }
}

function quitGame() {
    togglePause(); // Resume logic to clear flags
    state.isPlaying = false; // Force stop
    cancelAnimationFrame(state.animationFrameId);
    el.pauseMenu.classList.add('hidden');
    gameOver(); // Trigger game over screen
}

function animateWrapper(wrapper, range) {
    const speed = 1500 + Math.random() * 1000;
    const x = (Math.random() - 0.5) * range;
    const y = (Math.random() - 0.5) * range;

    wrapper.animate([
        { transform: 'translate(0px, 0px)' },
        { transform: `translate(${x}px, ${y}px)` }
    ], {
        duration: speed,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out'
    });
}

function toggleSound() {
    state.isMuted = !state.isMuted;
    localStorage.setItem('tapOrDie_muted', state.isMuted);
    updateSoundUI();
}

function updateSoundUI() {
    // If we want different icons for menu vs HUD, we can adjust here.
    // Since it's just "Sound", we use Speaker symbols.
    const icon = state.isMuted ? '🔇' : '🔊';
    if (el.soundBtn) el.soundBtn.innerText = icon;
    if (el.pauseSoundBtn) el.pauseSoundBtn.innerText = icon;
}

init();
