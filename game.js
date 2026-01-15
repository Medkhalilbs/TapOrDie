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

// Progression Data
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

// Trails Database
const TRAILS = [
    { id: 'trail_default', name: 'Neon Trail', color: 'var(--skin-color)', price: 0 },
    { id: 'trail_flame', name: 'Flame Burn', color: '#ff4500', price: 1000 },
    { id: 'trail_electric', name: 'Volt Bolt', color: '#00f3ff', price: 2000 },
    { id: 'trail_rainbow', name: 'Prism Pass', color: 'rainbow', price: 5000 }
];

// Missions Database (Sample of 5)
const MISSIONS = [
    { id: 1, name: 'First Steps', goal: 20, type: 'targets', time: 30000, reward: 100 },
    { id: 2, name: 'Boss Hunter', goal: 1, type: 'bosses', time: 45000, reward: 250 },
    { id: 3, name: 'Combo Master', goal: 10, type: 'combo', time: 30000, reward: 200 },
    { id: 4, name: 'Speed Demon', goal: 15, type: 'targets', time: 15000, reward: 300 },
    { id: 5, name: 'Gold Rush', goal: 3, type: 'gold', time: 60000, reward: 500 }
];

// State
let state = {
    isPlaying: false,
    currentMode: 'infinite', // 'infinite' or 'mission'
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
    targetTimerInv: null,
    spawnTime: 0,
    timeLimit: 0,
    animationFrameId: null,
    adMobReady: false,
    lastFrameTime: 0,

    // New State
    combo: 0,
    isPaused: false,
    pauseStartTime: 0,
    currentLevel: 1,
    isMuted: localStorage.getItem('tapOrDie_muted') === 'true', // Default false
    isFever: false,
    hasRevived: false,
    targetsHit: 0,
    activeDecoys: [],
    // Power-Up State
    activePowerUps: {
        time_freeze: 0, // End timestamp
        double_coins: 0,
        magnet: 0
    },
    // Progression Stats
    stats: JSON.parse(localStorage.getItem('tapOrDie_stats')) || {
        totalBossesDefeated: 0,
        totalCoinsEarned: 0,
        maxCombo: 0,
        gamesPlayed: 0
    },
    sessionStats: {
        targetsHit: 0,
        bossesDefeated: 0,
        goldHit: 0,
        maxCombo: 0
    }
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
    shopCoins: document.getElementById('shop-coins-value'),
    tabSkins: document.getElementById('tab-skins'),
    tabTrails: document.getElementById('tab-trails'),
    tabBgs: document.getElementById('tab-bgs'),

    // Progression UI
    progressionBtn: document.getElementById('progression-btn-trigger'),
    progressionModal: document.getElementById('progression-modal'),
    closeProgressionBtn: document.getElementById('close-progression'),
    challengesList: document.getElementById('challenges-list'),
    achievementsList: document.getElementById('achievements-list'),

    // Mission UI
    missionBtn: document.getElementById('mission-btn-trigger'),
    missionModal: document.getElementById('mission-modal'),
    missionGrid: document.getElementById('mission-grid'),
    closeMissionsBtn: document.getElementById('close-missions'),

    // Revive
    reviveBtn: document.getElementById('revive-btn'),
    coinsEarned: document.getElementById('coins-earned')
};

let currentShopTab = 'skin';


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
        if (el.tabSkins) el.tabSkins.addEventListener('click', () => { currentShopTab = 'skin'; renderShop(); });
        if (el.tabTrails) el.tabTrails.addEventListener('click', () => { currentShopTab = 'trail'; renderShop(); });
        if (el.tabBgs) el.tabBgs.addEventListener('click', () => { currentShopTab = 'bg'; renderShop(); });

        if (el.progressionBtn) el.progressionBtn.addEventListener('click', openProgression);
        if (el.closeProgressionBtn) el.closeProgressionBtn.addEventListener('click', closeProgression);

        if (el.missionBtn) el.missionBtn.addEventListener('click', openMissions);
        if (el.closeMissionsBtn) el.closeMissionsBtn.addEventListener('click', closeMissions);

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

        checkDailyChallenges();
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
    el.skinGrid.innerHTML = '';
    el.shopCoins.innerText = state.coins;

    // Highlight active tab
    el.tabSkins.style.background = currentShopTab === 'skin' ? 'var(--skin-color)' : 'rgba(255,255,255,0.1)';
    el.tabSkins.style.color = currentShopTab === 'skin' ? '#000' : '#fff';
    el.tabTrails.style.background = currentShopTab === 'trail' ? 'var(--skin-color)' : 'rgba(255,255,255,0.1)';
    el.tabTrails.style.color = currentShopTab === 'trail' ? '#000' : '#fff';
    el.tabBgs.style.background = currentShopTab === 'bg' ? 'var(--skin-color)' : 'rgba(255,255,255,0.1)';
    el.tabBgs.style.color = currentShopTab === 'bg' ? '#000' : '#fff';

    let items = [];
    let owned = [];
    let currentId = '';
    let itemType = 'skin';

    if (currentShopTab === 'skin') {
        items = SKINS;
        owned = state.ownedSkins;
        currentId = state.currentSkinId;
        itemType = 'skin';
    } else if (currentShopTab === 'trail') {
        items = TRAILS;
        owned = state.ownedTrails;
        currentId = state.currentTrailId;
        itemType = 'trail';
    } else {
        items = BACKGROUNDS;
        owned = state.ownedBgs;
        currentId = state.currentBgId;
        itemType = 'bg';
    }

    items.forEach(item => {
        const isOwned = owned.includes(item.id);
        const isActive = currentId === item.id;
        const canAfford = state.coins >= item.price;

        const div = document.createElement('div');
        div.className = `skin-item ${isActive ? 'active' : ''} ${!isOwned && !canAfford ? 'locked' : ''}`;

        let previewStyle = `background:${item.color.startsWith('var') ? 'var(--skin-color)' : (item.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : item.color)}`;

        div.innerHTML = `
            <div class="skin-preview" style="${previewStyle}; box-shadow: 0 0 10px ${item.color.startsWith('var') ? 'var(--skin-color)' : (item.color === 'rainbow' ? '#fff' : item.color)}"></div>
            <div class="skin-req">${item.name}</div>
            <div class="skin-req" style="color: ${isOwned ? '#fff' : '#ff0055'}">${isActive ? 'EQUIPPED' : (isOwned ? 'OWNED' : `${item.price} 🪙`)}</div>
        `;

        div.onclick = () => {
            if (isOwned) {
                if (itemType === 'skin') {
                    state.currentSkinId = item.id;
                    localStorage.setItem('tapOrDie_skin', item.id);
                    updateSkinVariables();
                } else if (itemType === 'trail') {
                    state.currentTrailId = item.id;
                    localStorage.setItem('tapOrDie_trail', item.id);
                } else {
                    state.currentBgId = item.id;
                    localStorage.setItem('tapOrDie_bg', item.id);
                    updateBackground();
                }
                renderShop();
                audio.playSFX('success');
            } else if (canAfford) {
                state.coins -= item.price;
                localStorage.setItem('tapOrDie_coins', state.coins);
                owned.push(item.id);
                localStorage.setItem(`tapOrDie_owned${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s`, JSON.stringify(owned));
                renderShop();
                audio.playSFX('success');
            } else {
                triggerHaptic('fail');
            }
        };
        el.skinGrid.appendChild(div);
    });
}

function openMissions() {
    el.missionModal.classList.remove('hidden');
    renderMissions();
}

function closeMissions() {
    el.missionModal.classList.add('hidden');
}

function renderMissions() {
    el.missionGrid.innerHTML = '';
    MISSIONS.forEach(m => {
        const isDone = state.completedMissions.includes(m.id);
        const btn = document.createElement('div');
        btn.className = `skin-item ${isDone ? 'active' : ''}`;
        btn.style.height = '60px';
        btn.innerHTML = `
            <div style="font-size:14px; font-weight:bold;">${m.id}</div>
            <div style="font-size:8px;">${isDone ? '★' : ''}</div>
        `;
        btn.addEventListener('click', () => {
            closeMissions();
            startMission(m.id);
        });
        el.missionGrid.appendChild(btn);
    });
}

function startMission(missionId) {
    const m = MISSIONS.find(ms => ms.id === missionId);
    if (!m) return;

    state.currentMode = 'mission';
    state.currentMissionId = missionId;
    state.isPlaying = true;
    state.score = 0;
    state.combo = 0;
    state.targetsHit = 0;
    state.currentLevel = 1;
    state.hasRevived = false;
    state.sessionStats = { targetsHit: 0, bossesDefeated: 0, goldHit: 0, maxCombo: 0 };
    state.timeLimit = m.time;
    state.spawnTime = performance.now();
    state.lastFrameTime = state.spawnTime;

    // UI
    el.overlay.classList.remove('active');
    el.score.innerText = '0';
    el.levelValue.innerText = m.name;

    // Clear Area
    el.playArea.innerHTML = '';
    state.activeDecoys = [];

    // Special Init
    audio.startMusic();
    spawnTarget();

    showLevelUpText(`GOAL: ${m.name}`);
}

function openProgression() {
    el.progressionModal.classList.remove('hidden');
    renderProgression();
}

function closeProgression() {
    el.progressionModal.classList.add('hidden');
}

function renderProgression() {
    // Render Challenges
    el.challengesList.innerHTML = '';
    CHALLENGES.forEach(ch => {
        const isComp = localStorage.getItem(`tapOrDie_ch_${ch.id}_completed`) === new Date().toDateString();
        const div = document.createElement('div');
        div.style.padding = '8px';
        div.style.background = '#222';
        div.style.borderRadius = '5px';
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; flex-direction:column;">
                    <span style="color:#fff; font-size:11px;">${ch.name}</span>
                    <span style="color:#ffd700; font-size:9px;">+${ch.reward} 🪙</span>
                </div>
                <span style="color:${isComp ? '#39ff14' : '#ff0055'}; font-weight:bold;">${isComp ? 'DONE' : `${state.dailyProgress[ch.type]}/${ch.goal}`}</span>
            </div>
        `;
        el.challengesList.appendChild(div);
    });

    // Render Achievements
    el.achievementsList.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
        const isOwned = state.ownedSkins.includes(ach.skin);
        const div = document.createElement('div');
        div.style.padding = '8px';
        div.style.background = '#222';
        div.style.borderRadius = '5px';
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; flex-direction:column;">
                    <span style="color:#fff; font-size:11px;">${ach.name}</span>
                    <span style="color:#888; font-size:9px;">Skin: ${ach.skin.replace('_', ' ')}</span>
                </div>
                <span style="color:${isOwned ? '#ffd700' : '#888'}; font-weight:bold;">${isOwned ? 'UNLOCKED' : `${state.stats[ach.type] || 0}/${ach.goal}`}</span>
            </div>
        `;
        el.achievementsList.appendChild(div);
    });
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
    state.currentMode = 'infinite';
    state.currentMissionId = null;
    state.score = 0;
    state.sessionStats = { targetsHit: 0, bossesDefeated: 0, goldHit: 0, maxCombo: 0 };
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
    state.bossType = null; // Reset boss type

    // Cleanup any lingering decoys
    state.activeDecoys.forEach(d => d.remove());
    state.activeDecoys = [];

    updateLevelUI();
    updateComboUI();

    requestFullscreen();
    spawnTarget();

    // START NEW GAME LOOP (Single source of truth)
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = requestAnimationFrame(gameUpdate);
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

    state.sessionStats.maxCombo = Math.max(state.sessionStats.maxCombo, state.combo);
    updateStats('gamesPlayed', 1);
    updateStats('maxCombo', state.combo, false);
    updateDailyProgress('maxCombo', state.combo, false);

    if (state.currentMode === 'mission') {
        const m = MISSIONS.find(ms => ms.id === state.currentMissionId);
        let success = false;
        if (m.type === 'targets') success = state.sessionStats.targetsHit >= m.goal;
        else if (m.type === 'bosses') success = state.sessionStats.bossesDefeated >= m.goal;
        else if (m.type === 'combo') success = state.sessionStats.maxCombo >= m.goal;
        else if (m.type === 'gold') success = state.sessionStats.goldHit >= m.goal;

        if (success) {
            if (!state.completedMissions.includes(m.id)) {
                state.completedMissions.push(m.id);
                localStorage.setItem('tapOrDie_missions', JSON.stringify(state.completedMissions));
                state.coins += m.reward;
                localStorage.setItem('tapOrDie_coins', state.coins);
                showLevelUpText(`MISSION COMPLETE! +${m.reward}🪙`);
            } else {
                showLevelUpText(`MISSION COMPLETE!`);
            }
        } else {
            showLevelUpText(`MISSION FAILED`);
        }
    }
    state.currentMode = 'infinite';
    state.currentMissionId = null;

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
    state.lastFrameTime = state.spawnTime;

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
    const bossTypes = ['normal', 'fast', 'splitter'];
    if (isBossLevel && !state.bossType) {
        state.bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    }

    if (isBossLevel) {
        state.bossHealth = state.bossType === 'splitter' ? 3 : 5;
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
    target.className = isBossLevel ? `target boss boss-${state.bossType}` : 'target';
    target.style.width = `${mainSize}px`;
    target.style.height = `${mainSize}px`;
    target.dataset.type = isBossLevel ? 'boss' : 'normal';
    target.dataset.bossType = state.bossType;
    target.addEventListener('pointerdown', onTargetHit);

    let speedMult = 1;
    if (state.bossType === 'fast') {
        moveRange *= 1.5;
        speedMult = 0.5; // Faster duration
    }
    if (moveRange > 0) animateWrapper(wrapper, moveRange, speedMult);

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

    // 4. SPAWN POWER-UP (Optional)
    // ----------------------------
    // 10% chance if Level 5+
    if (state.currentLevel >= 5 && Math.random() > 0.9) {
        const types = ['time_freeze', 'double_coins', 'magnet'];
        const type = types[Math.floor(Math.random() * types.length)];
        spawnExtraTarget(type, diff.size * 0.8, obstacles);
    }
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
    state.activeDecoys.push(extra);
}

function activatePowerUp(type) {
    const duration = 5000; // 5 seconds
    state.activePowerUps[type] = performance.now() + duration;

    // Visual Feedback
    el.container.classList.add(`pu-${type}`);
    audio.playSFX('gold'); // Use gold chime for PU activation

    // UI Indicator (Generic for now)
    showLevelUpText(type.replace('_', ' ').toUpperCase());

    setTimeout(() => {
        if (performance.now() >= state.activePowerUps[type]) {
            el.container.classList.remove(`pu-${type}`);
        }
    }, duration);
}

function isPowerUpActive(type) {
    return state.activePowerUps[type] > performance.now();
}

function spawnBossClone(relX, relY) {
    const size = 100;
    const padding = 20;
    const containerW = el.playArea.clientWidth;
    const containerH = el.playArea.clientHeight;

    // Relative to playArea
    let x = relX + (Math.random() - 0.5) * 150;
    let y = relY + (Math.random() - 0.5) * 150;

    // Clamp inside container
    x = Math.max(padding, Math.min(x, containerW - size - padding));
    y = Math.max(padding, Math.min(y, containerH - size - padding));

    const extra = document.createElement('div');
    extra.className = 'target boss boss-splitter';
    extra.style.width = `${size}px`;
    extra.style.height = `${size}px`;
    extra.style.left = `${x}px`;
    extra.style.top = `${y}px`;
    extra.dataset.type = 'boss';
    extra.dataset.bossType = 'splitter';
    extra.dataset.isClone = 'true';
    extra.addEventListener('pointerdown', onTargetHit);

    el.playArea.appendChild(extra);
    state.activeDecoys.push(extra);
}

// Progression logic
function updateStats(key, value, isCumulative = true) {
    if (isCumulative) {
        state.stats[key] = (state.stats[key] || 0) + value;
        if (state.sessionStats[key] !== undefined) state.sessionStats[key] += value;
    } else {
        state.stats[key] = Math.max(state.stats[key] || 0, value);
        if (state.sessionStats[key] !== undefined) state.sessionStats[key] = Math.max(state.sessionStats[key], value);
    }
    localStorage.setItem('tapOrDie_stats', JSON.stringify(state.stats));
    checkAchievements();
}

function checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
        if (!state.ownedSkins.includes(ach.skin) && state.stats[ach.type] >= ach.goal) {
            state.ownedSkins.push(ach.skin);
            localStorage.setItem('tapOrDie_ownedSkins', JSON.stringify(state.ownedSkins));
            showLevelUpText(`ACHIEVEMENT: ${ach.name}!`);
        }
    });
}

function checkDailyChallenges() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('tapOrDie_lastReset');

    if (lastReset !== today) {
        state.dailyProgress = { targetsHit: 0, bossesDefeated: 0, maxCombo: 0 };
        localStorage.setItem('tapOrDie_lastReset', today);
    } else {
        state.dailyProgress = JSON.parse(localStorage.getItem('tapOrDie_dailyProgress')) || { targetsHit: 0, bossesDefeated: 0, maxCombo: 0 };
    }
}

function updateDailyProgress(key, value, isCumulative = true) {
    if (isCumulative) {
        state.dailyProgress[key] += value;
    } else {
        state.dailyProgress[key] = Math.max(state.dailyProgress[key], value);
    }
    localStorage.setItem('tapOrDie_dailyProgress', JSON.stringify(state.dailyProgress));

    CHALLENGES.forEach(ch => {
        const completedKey = `tapOrDie_ch_${ch.id}_completed`;
        if (localStorage.getItem(completedKey) !== new Date().toDateString() && state.dailyProgress[ch.type] >= ch.goal) {
            state.coins += ch.reward;
            localStorage.setItem('tapOrDie_coins', state.coins);
            localStorage.setItem(completedKey, new Date().toDateString());
            showLevelUpText(`CHALLENGE DONE: +${ch.reward}🪙`);
        }
    });
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
        state.sessionStats.goldHit++;
        updateUI();
        e.target.remove();
        return;
    }

    // --- POWER-UP HIT ---
    if (['time_freeze', 'double_coins', 'magnet'].includes(targetType)) {
        activatePowerUp(targetType);
        createExplosion(e.clientX, e.clientY, '#00d4ff'); // Color matched to PU
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
            if (e.target.dataset.bossType === 'splitter' && !e.target.dataset.isClone) {
                // Split logic: reset timer for the clones!
                state.spawnTime = performance.now();
                state.timeLimit = Math.max(state.timeLimit * 0.7, 2000); // Give some time for clones
                state.bossHealth = 2; // Need to hit both clones

                // Get playArea offset to convert clientX to relative X
                const rect = el.playArea.getBoundingClientRect();

                // Spawn 2 clones
                for (let i = 0; i < 2; i++) {
                    spawnBossClone(e.clientX - rect.left, e.clientY - rect.top);
                }
                e.target.remove();
                state.currentTarget = null;
                return;
            }

            // BOSS DEFEATED
            createExplosion(e.clientX, e.clientY, '#ff00ff'); // Purple explosion
            audio.playSFX('boss_victory'); // Big sound
            state.score += 500; // HUGE Reward

            let coinBonus = 50;
            if (isPowerUpActive('double_coins')) coinBonus *= 2;
            state.coins += coinBonus;
            state.stats.totalCoinsEarned += coinBonus;
            state.stats.totalBossesDefeated++;
            state.sessionStats.bossesDefeated++;
            updateDailyProgress('bossesDefeated', 1);
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
            state.bossType = null; // Reset for next target
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
        state.sessionStats.targetsHit++;
        updateDailyProgress('targetsHit', 1);
        updateStats('totalTargets', 1);

        // Coin Reward on Normal Hit (e.g., 1 coin every 5 hits)
        if (state.targetsHit % 5 === 0) {
            let coinGain = 1;
            if (isPowerUpActive('double_coins')) coinGain *= 2;
            state.coins += coinGain;
            state.stats.totalCoinsEarned += coinGain;
        }

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
    if (!state.isPlaying || state.isPaused) return;

    const now = performance.now();
    if (!state.lastFrameTime) state.lastFrameTime = now;
    let delta = now - state.lastFrameTime;
    state.lastFrameTime = now;

    // TIME FREEZE: Slow down progression by 50%
    if (isPowerUpActive('time_freeze')) {
        state.spawnTime += delta * 0.5;
    }

    const elapsed = now - state.spawnTime;
    const remaining = state.timeLimit - elapsed;

    if (remaining <= 0) {
        state.lastFrameTime = null; // Reset for next target
        gameOver();
        return;
    }

    const pct = remaining / state.timeLimit;

    if (state.currentTarget) {
        state.currentTarget.style.transform = `translate(-50%, -50%) scale(${pct})`;

        if (pct < 0.3) {
            state.currentTarget.style.boxShadow = `0 0 30px #ff0055`;
            state.currentTarget.style.backgroundColor = `#ff0055`;
        }
    }

    state.animationFrameId = requestAnimationFrame(gameUpdate);
}

// Magnet logic: Increase hit radius
document.addEventListener('pointerdown', (e) => {
    if (isPowerUpActive('magnet') && state.isPlaying && state.currentTarget) {
        const rect = state.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));

        // If within 150px of target center, trigger hit
        if (dist < 150 && e.target !== state.currentTarget) {
            onTargetHit({
                preventDefault: () => { },
                stopPropagation: () => { },
                target: state.currentTarget,
                clientX: e.clientX,
                clientY: e.clientY
            });
        }
    }
}, true);

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
        if (state.combo > state.sessionStats.maxCombo) state.sessionStats.maxCombo = state.combo;

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

function animateWrapper(wrapper, range, speedMult = 1) {
    const speed = (1500 + Math.random() * 1000) * speedMult;
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
