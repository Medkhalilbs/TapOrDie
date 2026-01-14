// Game Configuration
const CONFIG = {
    baseTime: 2000,
    minTime: 400,
    difficultyFactor: 0.05,
    baseSize: 100,
    minSize: 40,
    sizeFactor: 0.02
};

// Skins Database
const SKINS = [
    { id: 'neon_cyan', name: 'Cyber Cyan', color: '#00f3ff', req: 0 },
    { id: 'neon_pink', name: 'Hot Pink', color: '#ff00ff', req: 10 },
    { id: 'lime_green', name: 'Toxic Lime', color: '#39ff14', req: 25 },
    { id: 'gold_rush', name: 'Gold Rush', color: '#ffd700', req: 50 },
    { id: 'blood_red', name: 'Vampire', color: '#ff0000', req: 75 },
    { id: 'matrix', name: 'The Matrix', color: '#00ff41', req: 100 },
    { id: 'void_purple', name: 'Void', color: '#9d00ff', req: 150 }
];

// State
let state = {
    isPlaying: false,
    score: 0,
    bestScore: parseInt(localStorage.getItem('tapOrDie_bestScore')) || 0,
    currentSkinId: localStorage.getItem('tapOrDie_skin') || 'neon_cyan',
    currentTarget: null,
    targetTimerInv: null,
    spawnTime: 0,
    timeLimit: 0,
    animationFrameId: null,
    adMobReady: false
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
    // Shop
    shopBtn: document.getElementById('shop-btn-trigger'),
    shopModal: document.getElementById('shop-modal'),
    closeShopBtn: document.getElementById('close-shop'),
    skinGrid: document.getElementById('skin-grid'),
    shopBest: document.getElementById('shop-best-score')
};

// Initialize
function init() {
    updateSkinVariables();
    el.best.innerText = state.bestScore;

    el.startBtn.addEventListener('click', startGame);
    el.shopBtn.addEventListener('click', openShop);
    el.closeShopBtn.addEventListener('click', closeShop);

    document.addEventListener('click', () => {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });

    initAds();
}

// Skin Logic
function updateSkinVariables() {
    const skin = SKINS.find(s => s.id === state.currentSkinId) || SKINS[0];
    document.documentElement.style.setProperty('--skin-color', skin.color);
    document.documentElement.style.setProperty('--skin-glow', `0 0 20px ${skin.color}`);
}

function openShop() {
    el.shopModal.classList.remove('hidden');
    el.shopBest.innerText = state.bestScore;
    renderShop();
}

function closeShop() {
    el.shopModal.classList.add('hidden');
}

function renderShop() {
    el.skinGrid.innerHTML = '';
    SKINS.forEach(skin => {
        const isLocked = state.bestScore < skin.req;
        const div = document.createElement('div');
        div.className = `skin-item ${state.currentSkinId === skin.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`;

        div.innerHTML = `
            <div class="skin-preview" style="background:${skin.color}; box-shadow: 0 0 10px ${skin.color}"></div>
            <div class="skin-req">${isLocked ? `Best: ${skin.req}` : skin.name}</div>
        `;

        if (!isLocked) {
            div.onclick = () => {
                state.currentSkinId = skin.id;
                localStorage.setItem('tapOrDie_skin', skin.id);
                updateSkinVariables();
                renderShop();
            };
        }

        el.skinGrid.appendChild(div);
    });
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

// Sound
function playSound(type) {
    if (!audioCtx) return;
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

    spawnTarget();
}

function gameOver() {
    state.isPlaying = false;
    cancelAnimationFrame(state.animationFrameId);

    if (state.currentTarget) {
        state.currentTarget.remove();
        state.currentTarget = null;
    }

    if (state.score > state.bestScore) {
        state.bestScore = state.score;
        localStorage.setItem('tapOrDie_bestScore', state.bestScore);
    }

    playSound('fail');

    // Screen Shake Effect
    el.container.classList.add('shake');
    setTimeout(() => el.container.classList.remove('shake'), 500);

    el.finalScore.innerText = state.score;
    el.best.innerText = state.bestScore;
    el.resultBox.classList.remove('hidden');
    el.titleText.classList.add('hidden');
    el.overlay.classList.add('active');
    el.startBtn.innerText = "RETRY";

    showAd();
}

function updateUI() {
    el.score.innerText = state.score;
}

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

    if (state.currentTarget) state.currentTarget.remove();

    const target = document.createElement('div');
    target.className = 'target';
    target.style.width = `${diff.size}px`;
    target.style.height = `${diff.size}px`;

    const containerW = el.playArea.clientWidth;
    const containerH = el.playArea.clientHeight;
    const pad = diff.size / 2 + 10;

    const x = Math.random() * (containerW - pad * 2) + pad;
    const y = Math.random() * (containerH - pad * 2) + pad;

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

    target.addEventListener('pointerdown', onTargetHit);
    el.playArea.appendChild(target);
    state.currentTarget = target;

    requestAnimationFrame(gameUpdate);
}

function onTargetHit(e) {
    if (!state.isPlaying) return;
    e.preventDefault();
    playSound('success');
    createExplosion(e.clientX, e.clientY);
    state.score++;
    updateUI();
    state.currentTarget.remove();
    state.currentTarget = null;
    spawnTarget();
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

function createExplosion(x, y) {
    const skin = SKINS.find(s => s.id === state.currentSkinId) || SKINS[0];
    const color = skin.color;

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

init();
