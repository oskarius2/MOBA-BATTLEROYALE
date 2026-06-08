// ============================================================
// ui/victory-screen.js — Premium Victory/Defeat Screen
// Animated result screens with CSS particle effects
// ============================================================

const VICTORY_STYLES = `
    #victory-screen {
        position: fixed;
        inset: 0;
        z-index: 500;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.5s ease, visibility 0.5s;
        font-family: 'Montserrat', 'Segoe UI', sans-serif;
    }

    #victory-screen.active {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    #victory-screen.victory {
        background: radial-gradient(
            ellipse at center,
            rgba(20, 35, 15, 0.95) 0%,
            rgba(10, 20, 8, 0.98) 50%,
            rgba(3, 8, 3, 0.99) 100%
        );
    }

    #victory-screen.defeat {
        background: radial-gradient(
            ellipse at center,
            rgba(35, 15, 15, 0.95) 0%,
            rgba(20, 8, 8, 0.98) 50%,
            rgba(8, 3, 3, 0.99) 100%
        );
    }

    .victory-particles {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .victory-particle {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        opacity: 0;
    }

    #victory-screen.victory .victory-particle {
        background: #c9a227;
        box-shadow: 0 0 10px #c9a227, 0 0 20px rgba(201, 162, 39, 0.5);
    }

    #victory-screen.defeat .victory-particle {
        background: #c0392b;
        box-shadow: 0 0 10px #c0392b, 0 0 20px rgba(192, 57, 43, 0.5);
    }

    .victory-content {
        position: relative;
        z-index: 2;
    }

    .victory-badge {
        width: 120px;
        height: 120px;
        margin: 0 auto 24px;
        position: relative;
        opacity: 0;
        transform: scale(0.5) rotate(-180deg);
    }

    #victory-screen.active .victory-badge {
        animation: badgeReveal 0.8s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s forwards;
    }

    @keyframes badgeReveal {
        to {
            opacity: 1;
            transform: scale(1) rotate(0);
        }
    }

    .victory-badge-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #victory-screen.victory .victory-badge-inner {
        background: linear-gradient(180deg, rgba(201, 162, 39, 0.2), rgba(139, 105, 20, 0.3));
        border: 3px solid #c9a227;
        box-shadow: 
            0 0 40px rgba(201, 162, 39, 0.4),
            0 0 80px rgba(201, 162, 39, 0.2),
            inset 0 0 30px rgba(201, 162, 39, 0.1);
    }

    #victory-screen.defeat .victory-badge-inner {
        background: linear-gradient(180deg, rgba(192, 57, 43, 0.2), rgba(120, 30, 30, 0.3));
        border: 3px solid #c0392b;
        box-shadow: 
            0 0 40px rgba(192, 57, 43, 0.4),
            0 0 80px rgba(192, 57, 43, 0.2),
            inset 0 0 30px rgba(192, 57, 43, 0.1);
    }

    .victory-badge-icon {
        width: 60px;
        height: 60px;
    }

    #victory-screen.victory .victory-badge-icon {
        color: #c9a227;
        filter: drop-shadow(0 0 20px rgba(201, 162, 39, 0.6));
    }

    #victory-screen.defeat .victory-badge-icon {
        color: #c0392b;
        filter: drop-shadow(0 0 20px rgba(192, 57, 43, 0.6));
    }

    .victory-badge-ring {
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        border: 2px solid currentColor;
        opacity: 0;
    }

    #victory-screen.active .victory-badge-ring {
        animation: ringPulse 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .victory-badge-ring:nth-child(2) { animation-delay: 0.5s; }
    .victory-badge-ring:nth-child(3) { animation-delay: 0.7s; }

    @keyframes ringPulse {
        0% {
            transform: scale(0.8);
            opacity: 1;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }

    #victory-screen.victory .victory-badge-ring { color: #c9a227; }
    #victory-screen.defeat .victory-badge-ring { color: #c0392b; }

    .victory-title {
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(48px, 10vw, 84px);
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin: 0 0 8px;
        opacity: 0;
        transform: translateY(30px);
    }

    #victory-screen.active .victory-title {
        animation: titleReveal 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) 0.5s forwards;
    }

    @keyframes titleReveal {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    #victory-screen.victory .victory-title {
        color: #c9a227;
        text-shadow: 
            0 0 40px rgba(201, 162, 39, 0.7),
            0 0 80px rgba(201, 162, 39, 0.4),
            0 4px 20px rgba(0, 0, 0, 0.5);
    }

    #victory-screen.defeat .victory-title {
        color: #c0392b;
        text-shadow: 
            0 0 40px rgba(192, 57, 43, 0.6),
            0 0 80px rgba(192, 57, 43, 0.3),
            0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .victory-subtitle {
        font-size: clamp(12px, 2vw, 16px);
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #8a9a82;
        margin: 0 0 40px;
        opacity: 0;
    }

    #victory-screen.active .victory-subtitle {
        animation: fadeIn 0.5s ease 0.8s forwards;
    }

    .victory-stats {
        display: flex;
        gap: clamp(24px, 5vw, 60px);
        margin-bottom: 48px;
        opacity: 0;
    }

    #victory-screen.active .victory-stats {
        animation: fadeIn 0.5s ease 1s forwards;
    }

    @keyframes fadeIn {
        to { opacity: 1; }
    }

    .victory-stat {
        text-align: center;
    }

    .victory-stat-value {
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(28px, 5vw, 44px);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        margin-bottom: 6px;
    }

    #victory-screen.victory .victory-stat-value { color: #c9a227; }
    #victory-screen.defeat .victory-stat-value { color: #e8a090; }

    .victory-stat-label {
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #6a7a62;
    }

    .victory-actions {
        display: flex;
        gap: 16px;
        opacity: 0;
    }

    #victory-screen.active .victory-actions {
        animation: fadeIn 0.5s ease 1.2s forwards;
    }

    .victory-btn {
        padding: 16px 40px;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        border: 2px solid;
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: 
            transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1),
            box-shadow 0.3s ease,
            background 0.25s ease;
    }

    .victory-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 60%
        );
        transform: translateX(-100%);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .victory-btn:hover::before {
        transform: translateX(100%);
    }

    .victory-btn-primary {
        background: linear-gradient(180deg, #8b6914, #6b5010);
        border-color: #c9a227;
        color: #f0e6c8;
    }

    .victory-btn-primary:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 
            0 0 30px rgba(201, 162, 39, 0.4),
            0 12px 40px rgba(0, 0, 0, 0.4);
    }

    .victory-btn-secondary {
        background: rgba(0, 0, 0, 0.3);
        border-color: rgba(138, 154, 130, 0.5);
        color: #8a9a82;
    }

    .victory-btn-secondary:hover {
        background: rgba(0, 0, 0, 0.5);
        border-color: rgba(138, 154, 130, 0.8);
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .victory-btn:active {
        transform: translateY(0) scale(0.98);
    }

    @media (max-width: 600px) {
        .victory-stats {
            flex-direction: column;
            gap: 16px;
        }
        
        .victory-actions {
            flex-direction: column;
            width: 100%;
            padding: 0 20px;
        }
        
        .victory-btn {
            width: 100%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .victory-particle,
        .victory-badge,
        .victory-badge-ring,
        .victory-title,
        .victory-subtitle,
        .victory-stats,
        .victory-actions {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
        }
    }
`;

const VICTORY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;

const DEFEAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 6.5L6.5 17.5M6.5 6.5l11 11"/><circle cx="12" cy="12" r="10"/></svg>`;

let victoryContainer = null;
let particleInterval = null;
let _mounted = false;

function ensureMounted() {
    if (_mounted) return;
    _mounted = true;

    const style = document.createElement('style');
    style.textContent = VICTORY_STYLES;
    document.head.appendChild(style);

    victoryContainer = document.createElement('div');
    victoryContainer.id = 'victory-screen';
    document.body.appendChild(victoryContainer);
}

function createParticles(container, isVictory) {
    const particlesEl = container.querySelector('.victory-particles');
    if (!particlesEl) return;

    const count = 30;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'victory-particle';
        
        const startX = Math.random() * 100;
        const startY = 100 + Math.random() * 20;
        const endX = startX + (Math.random() - 0.5) * 40;
        const duration = 2 + Math.random() * 3;
        const delay = Math.random() * 2;
        const size = 4 + Math.random() * 6;
        
        particle.style.cssText = `
            left: ${startX}%;
            top: ${startY}%;
            width: ${size}px;
            height: ${size}px;
            animation: particleRise ${duration}s ease-out ${delay}s infinite;
        `;
        
        particlesEl.appendChild(particle);
    }
}

function clearParticles(container) {
    const particlesEl = container?.querySelector('.victory-particles');
    if (particlesEl) particlesEl.innerHTML = '';
    if (particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    }
}

/**
 * Show victory screen
 * @param {object} stats - { kills, gold, level, time }
 * @param {function} onContinue - Callback when player clicks continue
 */
export function showVictoryScreen(stats = {}, onContinue = null) {
    ensureMounted();
    
    const { kills = 0, gold = 0, level = 1, time = '0:00' } = stats;
    
    victoryContainer.className = 'active victory';
    victoryContainer.innerHTML = `
        <div class="victory-particles"></div>
        <div class="victory-content">
            <div class="victory-badge">
                <div class="victory-badge-ring"></div>
                <div class="victory-badge-ring"></div>
                <div class="victory-badge-ring"></div>
                <div class="victory-badge-inner">
                    <div class="victory-badge-icon">${VICTORY_ICON}</div>
                </div>
            </div>
            <h1 class="victory-title">Victory</h1>
            <p class="victory-subtitle">Champion of the Dark Jungle</p>
            <div class="victory-stats">
                <div class="victory-stat">
                    <div class="victory-stat-value">${kills}</div>
                    <div class="victory-stat-label">Kills</div>
                </div>
                <div class="victory-stat">
                    <div class="victory-stat-value">${gold}</div>
                    <div class="victory-stat-label">Gold</div>
                </div>
                <div class="victory-stat">
                    <div class="victory-stat-value">${level}</div>
                    <div class="victory-stat-label">Level</div>
                </div>
                <div class="victory-stat">
                    <div class="victory-stat-value">${time}</div>
                    <div class="victory-stat-label">Time</div>
                </div>
            </div>
            <div class="victory-actions">
                <button type="button" class="victory-btn victory-btn-primary" id="victory-continue-btn">
                    Play Again
                </button>
            </div>
        </div>
    `;
    
    createParticles(victoryContainer, true);
    
    const continueBtn = victoryContainer.querySelector('#victory-continue-btn');
    continueBtn?.addEventListener('click', () => {
        hideVictoryScreen();
        onContinue?.();
    });
    
    addParticleKeyframes();
}

/**
 * Show defeat screen
 * @param {object} stats - { kills, gold, level, time, placement }
 * @param {function} onContinue - Callback when player clicks continue
 */
export function showDefeatScreen(stats = {}, onContinue = null) {
    ensureMounted();
    
    const { kills = 0, gold = 0, level = 1, placement = '?' } = stats;
    
    victoryContainer.className = 'active defeat';
    victoryContainer.innerHTML = `
        <div class="victory-particles"></div>
        <div class="victory-content">
            <div class="victory-badge">
                <div class="victory-badge-ring"></div>
                <div class="victory-badge-ring"></div>
                <div class="victory-badge-inner">
                    <div class="victory-badge-icon">${DEFEAT_ICON}</div>
                </div>
            </div>
            <h1 class="victory-title">Fallen</h1>
            <p class="victory-subtitle">The dark jungle claims another soul</p>
            <div class="victory-stats">
                <div class="victory-stat">
                    <div class="victory-stat-value">#${placement}</div>
                    <div class="victory-stat-label">Placement</div>
                </div>
                <div class="victory-stat">
                    <div class="victory-stat-value">${kills}</div>
                    <div class="victory-stat-label">Kills</div>
                </div>
                <div class="victory-stat">
                    <div class="victory-stat-value">${gold}</div>
                    <div class="victory-stat-label">Gold</div>
                </div>
                <div class="victory-stat">
                    <div class="victory-stat-value">${level}</div>
                    <div class="victory-stat-label">Level</div>
                </div>
            </div>
            <div class="victory-actions">
                <button type="button" class="victory-btn victory-btn-primary" id="victory-continue-btn">
                    Try Again
                </button>
            </div>
        </div>
    `;
    
    createParticles(victoryContainer, false);
    
    const continueBtn = victoryContainer.querySelector('#victory-continue-btn');
    continueBtn?.addEventListener('click', () => {
        hideVictoryScreen();
        onContinue?.();
    });
    
    addParticleKeyframes();
}

/**
 * Hide victory/defeat screen
 */
export function hideVictoryScreen() {
    if (!victoryContainer) return;
    clearParticles(victoryContainer);
    victoryContainer.classList.remove('active');
}

function addParticleKeyframes() {
    if (document.getElementById('victory-particle-keyframes')) return;
    
    const style = document.createElement('style');
    style.id = 'victory-particle-keyframes';
    style.textContent = `
        @keyframes particleRise {
            0% {
                opacity: 0;
                transform: translateY(0) scale(1);
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 0.8;
            }
            100% {
                opacity: 0;
                transform: translateY(-100vh) scale(0.5);
            }
        }
    `;
    document.head.appendChild(style);
}
