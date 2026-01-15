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
    currentLevel: 1,
    isMuted: localStorage.getItem('tapOrDie_muted') === 'true', // Default false
    isFever: false,
    hasRevived: false,
    targetsHit: 0,
    activeDecoys: []
};



// AdMob Imports 
const AdMob = window.Capacitor ? window.Capacitor.Plugins.AdMob : null;

// Audio Manager Instance (Global)
let audio = {
    init: () => { },
    playSFX: () => { },
    startMusic: () => { },
    stopMusic: () => { },
    toggleMute: () => false,
    tempo: 120,
    isMuted: false
};

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
    // 1. Safe Audio Initialization
    try {
        if (typeof window.AudioManager !== 'undefined') {
            audio = new window.AudioManager();
            console.log("Audio System Loaded");
        } else {
            console.warn("AudioManager class missing. Running silent.");
        }
    } catch (e) {
        console.error("Audio instantiation failed:", e);
        // audio stays as dummy object
    }

    // 2. UI Initialization (Protected)
    try {
        updateSkinVariables();
        updateBackground();
        el.best.innerText = state.bestScore;

        // BIND START BUTTON TO RESUME AUDIO
        if (el.startBtn) {
            el.startBtn.addEventListener('click', () => {
                startGame();
                // Ensure Audio Context is Active
                if (audio && audio.context && audio.context.state === 'suspended') {
                    audio.context.resume();
                } else if (audio && audio.init) {
                    // Try init if not yet done
                    try { audio.init(); } catch (e) { }
                }
            });
        }

        if (el.shopBtn) el.shopBtn.addEventListener('click', openShop);
        if (el.closeShopBtn) el.closeShopBtn.addEventListener('click', closeShop);

        if (el.pauseBtn) el.pauseBtn.addEventListener('click', togglePause);
        if (el.resumeBtn) el.resumeBtn.addEventListener('click', togglePause);
        if (el.quitBtn) el.quitBtn.addEventListener('click', quitGame);
        if (el.soundBtn) el.soundBtn.addEventListener('click', toggleSound);
        if (el.pauseSoundBtn) el.pauseSoundBtn.addEventListener('click', toggleSound);

        updateSoundUI();

        // Init Audio Context on any earlier interaction too (backup)
        document.addEventListener('click', () => {
            try {
                if (audio && audio.init) audio.init();
            } catch (e) { }
        }, { once: true });

        // Finger Trails
        if (el.container) {
            el.container.addEventListener('pointermove', (e) => {
                if (!state.isPlaying) return;
                createTrailDot(e.clientX, e.clientY);
            });
        }

        initAds();
    } catch (e2) {
        console.error("Critical UI Init Error:", e2);
        alert("Game Init Error: " + e2.message);
    }
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
                audio.playSFX('success'); // Feedback
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
                audio.playSFX('success'); // Cha-ching!
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

// playSound removed, use audio.playSFX() directly

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
    state.combo = 0;
    state.currentLevel = 1;
    state.hasRevived = false; // Reset for new run
    state.targetsHit = 0;

    // Start Music
    audio.startMusic();
    audio.tempo = 110; // Reset tempo

    // Cleanup any lingering decoys
    state.activeDecoys.forEach(d => d.remove());
    state.activeDecoys = [];

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

    audio.playSFX('fail');
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

    // Cleanup all existing targets
    if (state.currentWrapper) state.currentWrapper.remove();
    state.activeDecoys.forEach(d => d.remove());
    state.activeDecoys = [];

    const containerW = el.playArea.clientWidth;
    const containerH = el.playArea.clientHeight;

    // Movement Range for Main Target
    let moveRange = 0;
    if (state.currentLevel >= 2) {
        moveRange = 50 * Math.min(state.currentLevel, 5);
        const maxAllowed = Math.min(containerW, containerH) * 0.3;
        moveRange = Math.min(moveRange, maxAllowed);
    }

    // 1. DETERMINE IF BOSS LEVEL
    // ----------------------------
    const isBossLevel = (state.currentLevel % 5 === 0);
    // Note: Doing every 5 levels for testing, normally 10.

    if (isBossLevel) {
        state.bossHealth = 5; // Takes 5 hits
        // More time for boss?
        state.timeLimit = Math.max(diff.time * 2, 2000);
    }

    // 2. SPAWN MAIN TARGET (Normal or Boss)
    // ------------------------------------
    const mainSize = isBossLevel ? 200 : diff.size; // Huge boss
    const pos = getSafePosition(mainSize, moveRange, []); // No obstacles yet
    const x = pos.x;
    const y = pos.y;

    // Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = `${x}px`;
    wrapper.style.top = `${y}px`;
    wrapper.style.width = '0px';
    wrapper.style.height = '0px';

    const target = document.createElement('div');
    target.className = isBossLevel ? 'target boss' : 'target'; // Add boss class
    target.style.width = `${mainSize}px`;
    target.style.height = `${mainSize}px`;
    target.dataset.type = isBossLevel ? 'boss' : 'normal';
    target.addEventListener('pointerdown', onTargetHit);

    if (moveRange > 0) animateWrapper(wrapper, moveRange);

    wrapper.appendChild(target);
    el.playArea.appendChild(wrapper);

    state.currentTarget = target;
    state.currentWrapper = wrapper;

    // Keep track of obstacles for subsequent spawns
    // We treat the main target's area as an obstacle
    const obstacles = [{ x, y, size: mainSize + moveRange }]; // Include moveRange in safety buffer?

    // 2. SPAWN GOLD TARGET (Separate, Optional)
    // -----------------------------------------
    // 5% chance. Small and hard to hit! (0.7x size)
    // ALLOW Gold during Boss? Sure, bonus reward.
    if (Math.random() > 0.95) {
        spawnExtraTarget('gold', diff.size * 0.7, obstacles);
    }

    // 3. SPAWN DECOY TARGET (Separate, Optional)
    // ------------------------------------------
    // Level 3+, 30% chance. Normal size (0.9x)
    // DISABLE Decoys during Boss Levels? Yes.
    if (!isBossLevel && state.currentLevel >= 3 && Math.random() < 0.3) {
        spawnExtraTarget('decoy', diff.size * 0.9, obstacles);
    }

    requestAnimationFrame(gameUpdate);
}

// Helper to find safe position
function getSafePosition(size, moveRange, obstacles) {
    const containerW = el.playArea.clientWidth;
    const containerH = el.playArea.clientHeight;
    const topSafeZone = 120;
    const pad = size / 2 + 10 + (moveRange / 2); // Include movement in padding

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

        // Check collision with obstacles
        let collision = false;
        for (const obs of obstacles) {
            const dist = Math.sqrt(Math.pow(x - obs.x, 2) + Math.pow(y - obs.y, 2));
            const minSafeDist = (size + obs.size) / 2 + 20; // 20px margin
            if (dist < minSafeDist) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            bestX = x;
            bestY = y;
            safe = true;
        }
    }

    return { x: bestX, y: bestY };
}

function spawnExtraTarget(type, size, obstacles) {
    const pos = getSafePosition(size, 0, obstacles); // Extras don't move yet

    const extra = document.createElement('div');
    extra.className = `target ${type}`;
    extra.style.width = `${size}px`;
    extra.style.height = `${size}px`;
    extra.style.left = `${pos.x}px`;
    extra.style.top = `${pos.y}px`;
    extra.dataset.type = type; // 'gold' or 'decoy'

    // Add to obstacles for next one
    obstacles.push({ x: pos.x, y: pos.y, size: size });

    extra.addEventListener('pointerdown', onTargetHit);

    el.playArea.appendChild(extra);
    state.activeDecoys.push(extra); // Reuse this array for all extras to clean them up easily
}


function onTargetHit(e) {
    if (!state.isPlaying) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent clicking through

    const targetType = e.target.dataset.type;

    // --- DECOY HIT ---
    if (targetType === 'decoy') {
        triggerHaptic('fail');
        createExplosion(e.clientX, e.clientY, '#ff0000');
        gameOver();
        return;
    }

    // --- GOLD HIT ---
    if (targetType === 'gold') {
        audio.playSFX('gold'); // New sound
        triggerHaptic('success');
        createExplosion(e.clientX, e.clientY, '#ffd700');
        state.score += 50;
        updateUI();
        e.target.remove();
        return;
    }

    // --- BOSS HIT ---
    if (targetType === 'boss') {
        state.bossHealth--;
        audio.playSFX('hit'); // Need to handle this type in playSound
        triggerHaptic('success');

        // Visual Feedback (Bounce/Shake)
        e.target.animate([
            { transform: 'translate(-50%, -50%) scale(0.9)' },
            { transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 100 });

        if (state.bossHealth <= 0) {
            // BOSS DEFEATED
            createExplosion(e.clientX, e.clientY, '#ff00ff'); // Purple explosion
            audio.playSFX('boss_victory'); // Big sound
            state.score += 500; // HUGE Reward
            state.coins += 50;
            state.targetsHit += 5; // Skip ahead a bit?

            // Force Level Up
            const newLevel = state.currentLevel + 1;
            state.currentLevel = newLevel;
            updateLevelUI();
            showLevelUpText(newLevel);

            updateUI();

            if (state.currentWrapper) state.currentWrapper.remove();
            state.currentTarget = null;
            state.currentWrapper = null;
            spawnTarget();
        }
        return; // Don't run normal hit logic
    }

    // --- MAIN TARGET HIT ---
    if (targetType === 'normal') {
        audio.playSFX('success');
        triggerHaptic('success');
        createExplosion(e.clientX, e.clientY);

        state.combo++;
        let multiplier = 1 + Math.floor(state.combo / 10);
        if (state.isFever) multiplier *= 2;

        state.score += multiplier;
        state.targetsHit++;

        // Level Up Logic (Every 5 hits)
        const newLevel = Math.floor(state.targetsHit / 5) + 1;
        if (newLevel > state.currentLevel) {
            state.currentLevel = newLevel;
            updateLevelUI();
            audio.playSFX('success');
            showLevelUpText(newLevel);
        }

        updateComboUI();
        updateUI();

        // Respawn (Clears everything)
        spawnTarget();
    }
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
    state.isMuted = audio.toggleMute();
    updateSoundUI();
}

function updateSoundUI() {
    const icon = state.isMuted ? '🔇' : '🔊';
    if (el.soundBtn) el.soundBtn.innerText = icon;
    if (el.pauseSoundBtn) el.pauseSoundBtn.innerText = icon;
}

init();
