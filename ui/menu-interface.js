// ============================================================
// MOBROYALE — MULTI-STAGE MENU SYSTEM
// Welcome → Main (Play / Classes / Settings) → Pick Class → GO
// ============================================================

const menuStyle = document.createElement('style');
menuStyle.innerHTML = `
    :root {
        --df-bg: #040806;
        --df-copper: #8b6914;
        --df-copper-light: #d4af37;
        --df-ember: #ff6b2c;
        --df-jungle: #2ecc71;
        --df-text: #f0ece4;
        --df-text-dim: #7a8f82;
        --panel-bg: rgba(6, 14, 10, 0.82);
        --panel-border: rgba(212, 175, 55, 0.28);
        --panel-glow: rgba(212, 175, 55, 0.12);
        --menu-ease: cubic-bezier(0.22, 1, 0.36, 1);
        --menu-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        --font-display: 'Cinzel Decorative', 'Orbitron', Georgia, serif;
        --font-ui: 'Orbitron', 'Rajdhani', sans-serif;
        --font-body: 'Rajdhani', 'Segoe UI', sans-serif;
        --clip-panel: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
        --clip-btn: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
    }

    #class-select-overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
            radial-gradient(ellipse 120% 80% at 50% -10%, rgba(46, 204, 113, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse 80% 60% at 80% 90%, rgba(255, 107, 44, 0.06) 0%, transparent 50%),
            linear-gradient(180deg, #07120c 0%, #030504 45%, #010302 100%);
        pointer-events: auto;
        opacity: 1;
        visibility: visible;
        transition: opacity 0.45s var(--menu-ease), visibility 0.45s var(--menu-ease);
        overflow: hidden;
        font-family: var(--font-body);
        color: var(--df-text);
    }

    #class-select-overlay.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }

    .menu-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(212, 175, 55, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.04) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
        pointer-events: none;
    }

    .menu-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.82) 100%);
        pointer-events: none;
    }

    .menu-ember-layer {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 70% 40% at 50% 0%, rgba(212, 175, 55, 0.1), transparent),
            radial-gradient(3px 3px at 12% 68%, rgba(255, 107, 44, 0.55), transparent),
            radial-gradient(2px 2px at 88% 32%, rgba(46, 204, 113, 0.45), transparent),
            radial-gradient(2px 2px at 52% 48%, rgba(212, 175, 55, 0.3), transparent);
        animation: emberDrift 16s ease-in-out infinite alternate;
        pointer-events: none;
    }

    .menu-shimmer {
        position: absolute;
        inset: -50%;
        background: conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(212, 175, 55, 0.04) 50deg, transparent 100deg);
        animation: shimmerRotate 24s linear infinite;
        pointer-events: none;
    }

    .menu-scanline {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
        );
        pointer-events: none;
        opacity: 0.5;
    }

    @keyframes emberDrift {
        0% { transform: translateY(0); opacity: 0.5; }
        100% { transform: translateY(-18px); opacity: 0.8; }
    }

    @keyframes shimmerRotate {
        to { transform: rotate(360deg); }
    }

    .menu-frame {
        position: absolute;
        inset: clamp(12px, 2vw, 28px);
        pointer-events: none;
        z-index: 1;
    }

    .frame-corner {
        position: absolute;
        width: 32px;
        height: 32px;
        border-color: rgba(212, 175, 55, 0.45);
        border-style: solid;
        animation: cornerPulse 3s ease-in-out infinite;
    }

    .frame-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
    .frame-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
    .frame-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
    .frame-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

    @keyframes cornerPulse {
        0%, 100% { opacity: 0.45; }
        50% { opacity: 1; }
    }

    .menu-shell {
        position: relative;
        z-index: 2;
        width: min(1200px, 94vw);
        height: min(92vh, 900px);
        display: flex;
        flex-direction: column;
        padding: clamp(16px, 2.5vw, 32px);
        box-sizing: border-box;
    }

    .menu-top-bar {
        display: grid;
        grid-template-columns: 48px 1fr auto;
        align-items: center;
        gap: 16px;
        flex-shrink: 0;
        margin-bottom: clamp(12px, 1.5vw, 20px);
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.12);
    }

    .menu-brand-mark {
        font-family: var(--font-ui);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: var(--df-copper-light);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        clip-path: var(--clip-btn);
        background: rgba(212, 175, 55, 0.08);
        border: 1px solid var(--panel-border);
        box-shadow: 0 0 20px var(--panel-glow);
    }

    .menu-version {
        font-family: var(--font-ui);
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--df-text-dim);
        white-space: nowrap;
    }

    /* ── Stage viewport — single visible stage, no overlap ── */
    .menu-stage-viewport {
        position: relative;
        flex: 1;
        min-height: 0;
        width: 100%;
        overflow: hidden;
    }

    .menu-stage {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(18px) scale(0.98);
        transition: opacity 0.35s var(--menu-ease), transform 0.35s var(--menu-ease), visibility 0.35s;
        overflow: hidden;
    }

    .menu-stage.active {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateY(0) scale(1);
        animation: stageIn 0.55s var(--menu-ease) forwards;
    }

    @keyframes stageIn {
        from { opacity: 0; transform: translateY(28px) scale(0.96); filter: blur(6px); }
        to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }

    /* ── Breadcrumb ── */
    .menu-breadcrumb {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: var(--font-ui);
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }

    .menu-breadcrumb.hidden { display: none; }

    .crumb {
        color: var(--df-text-dim);
        padding: 5px 12px;
        border: 1px solid transparent;
        transition: color 0.25s, border-color 0.25s, background 0.25s, box-shadow 0.25s;
    }

    .crumb.done { color: var(--df-copper-light); }

    .crumb.active {
        color: var(--df-text);
        background: var(--panel-bg);
        border-color: var(--panel-border);
        box-shadow: 0 0 24px var(--panel-glow);
        clip-path: var(--clip-btn);
    }

    .crumb-sep {
        width: 20px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent);
    }

    /* ── Game buttons ── */
    .game-btn {
        position: relative;
        min-width: min(300px, 82vw);
        min-height: 54px;
        padding: 0 32px;
        font-family: var(--font-ui);
        font-size: clamp(12px, 1.8vw, 14px);
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--df-text);
        cursor: pointer;
        border: none;
        background: var(--panel-bg);
        clip-path: var(--clip-btn);
        box-shadow:
            0 0 0 1px var(--panel-border),
            0 12px 40px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        transition: transform 0.22s var(--menu-spring), box-shadow 0.22s, color 0.22s;
        overflow: hidden;
    }

    .game-btn .btn-label {
        position: relative;
        z-index: 2;
    }

    .game-btn .btn-glow {
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.08) 50%, transparent 65%);
        transform: translateX(-120%);
        transition: transform 0.55s var(--menu-ease);
        pointer-events: none;
    }

    .game-btn:hover .btn-glow {
        transform: translateX(120%);
    }

    .game-btn:hover {
        transform: translateY(-2px);
        box-shadow:
            0 0 0 1px rgba(212, 175, 55, 0.55),
            0 0 32px var(--panel-glow),
            0 16px 48px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .game-btn:active {
        transform: translateY(1px) scale(0.99);
    }

    .game-btn:focus-visible {
        outline: 2px solid var(--df-copper-light);
        outline-offset: 4px;
    }

    .game-btn-primary {
        background: linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(139, 105, 20, 0.12) 100%);
        color: #fff8e8;
    }

    .game-btn-primary:hover {
        box-shadow:
            0 0 0 1px rgba(212, 175, 55, 0.7),
            0 0 48px rgba(212, 175, 55, 0.25),
            0 16px 48px rgba(0, 0, 0, 0.5);
    }

    .game-btn-deploy {
        min-width: 220px;
        background: linear-gradient(135deg, rgba(255, 107, 44, 0.28) 0%, rgba(212, 175, 55, 0.14) 100%);
        opacity: 0.3;
        pointer-events: none;
    }

    .game-btn-deploy.ready {
        opacity: 1;
        pointer-events: auto;
        animation: deployPulse 2.2s ease-in-out infinite;
    }

    .game-btn-deploy.ready:hover {
        box-shadow:
            0 0 0 1px rgba(255, 107, 44, 0.7),
            0 0 56px rgba(255, 107, 44, 0.35),
            0 16px 48px rgba(0, 0, 0, 0.5);
    }

    @keyframes deployPulse {
        0%, 100% { box-shadow: 0 0 0 1px rgba(255, 107, 44, 0.4), 0 0 20px rgba(255, 107, 44, 0.15); }
        50% { box-shadow: 0 0 0 1px rgba(255, 107, 44, 0.8), 0 0 44px rgba(255, 107, 44, 0.4); }
    }

    .game-btn-back {
        min-width: 140px;
        font-size: 11px;
        letter-spacing: 0.16em;
        color: var(--df-text-dim);
        background: rgba(0, 0, 0, 0.35);
    }

    .main-menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        width: 100%;
    }

    /* ── Welcome ── */
    .welcome-stage {
        justify-content: center;
    }

    .welcome-center {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px;
    }

    .welcome-pre {
        display: block;
        font-family: var(--font-ui);
        font-size: clamp(11px, 1.8vw, 13px);
        font-weight: 600;
        letter-spacing: 0.5em;
        text-transform: uppercase;
        color: var(--df-text-dim);
        margin-bottom: 24px;
        opacity: 0;
        animation: welcomeFadeUp 0.8s var(--menu-ease) 0.15s forwards;
    }

    .welcome-brand {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 3px;
        font-family: var(--font-display);
        font-size: clamp(40px, 9vw, 84px);
        font-weight: 900;
        line-height: 0.95;
        margin-bottom: 16px;
        perspective: 600px;
    }

    .brand-letter {
        display: inline-block;
        opacity: 0;
        transform: translateY(50px) rotateX(-80deg);
        color: var(--df-text);
        text-shadow:
            0 0 30px rgba(212, 175, 55, 0.6),
            0 2px 0 rgba(0, 0, 0, 0.8);
        animation: letterReveal 0.75s var(--menu-spring) forwards;
    }

    .brand-letter:nth-child(1) { animation-delay: 0.45s; color: var(--df-ember); }
    .brand-letter:nth-child(2) { animation-delay: 0.53s; }
    .brand-letter:nth-child(3) { animation-delay: 0.61s; }
    .brand-letter:nth-child(4) { animation-delay: 0.69s; color: var(--df-jungle); }
    .brand-letter:nth-child(5) { animation-delay: 0.77s; }
    .brand-letter:nth-child(6) { animation-delay: 0.85s; }
    .brand-letter:nth-child(7) { animation-delay: 0.93s; color: var(--df-copper-light); }
    .brand-letter:nth-child(8) { animation-delay: 1.01s; }
    .brand-letter:nth-child(9) { animation-delay: 1.09s; }

    .welcome-tagline {
        font-family: var(--font-ui);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.38em;
        text-transform: uppercase;
        color: rgba(212, 175, 55, 0.65);
        opacity: 0;
        animation: welcomeFadeUp 0.8s var(--menu-ease) 1.3s forwards;
    }

    .welcome-continue {
        margin-top: 52px;
        opacity: 0;
        animation: welcomeFadeUp 0.6s var(--menu-ease) 1.9s forwards, welcomePulse 2.5s ease-in-out 2.5s infinite;
    }

    @keyframes letterReveal {
        to { opacity: 1; transform: translateY(0) rotateX(0); }
    }

    @keyframes welcomeFadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes welcomePulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.15); }
    }

    .welcome-glow-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: min(420px, 75vw);
        height: min(420px, 75vw);
        margin: calc(min(420px, 75vw) / -2) 0 0 calc(min(420px, 75vw) / -2);
        border-radius: 50%;
        border: 1px solid rgba(212, 175, 55, 0.15);
        box-shadow: 0 0 100px rgba(212, 175, 55, 0.1), inset 0 0 80px rgba(212, 175, 55, 0.05);
        animation: ringExpand 2.2s var(--menu-ease) 0.2s forwards;
        opacity: 0;
        pointer-events: none;
    }

    .welcome-glow-ring-2 {
        width: min(520px, 90vw);
        height: min(520px, 90vw);
        margin: calc(min(520px, 90vw) / -2) 0 0 calc(min(520px, 90vw) / -2);
        border-color: rgba(46, 204, 113, 0.08);
        animation-delay: 0.5s;
    }

    @keyframes ringExpand {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
    }

    /* ── Main menu ── */
    .main-stage {
        justify-content: center;
    }

    .main-stage-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 420px;
        animation: mainFloat 6s ease-in-out infinite;
    }

    @keyframes mainFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
    }

    .main-logo-wrap {
        text-align: center;
        margin-bottom: 12px;
    }

    .main-logo {
        font-family: var(--font-display);
        font-size: clamp(32px, 6vw, 56px);
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin: 0;
        background: linear-gradient(180deg, #fff8e0 0%, #d4af37 45%, #8b6914 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.35));
    }

    .main-logo-underline {
        height: 2px;
        margin: 10px auto 0;
        width: 60%;
        background: linear-gradient(90deg, transparent, var(--df-copper-light), transparent);
        animation: underlineGlow 2.5s ease-in-out infinite;
    }

    @keyframes underlineGlow {
        0%, 100% { opacity: 0.5; width: 50%; }
        50% { opacity: 1; width: 70%; }
    }

    .main-subtitle {
        font-family: var(--font-ui);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: var(--df-text-dim);
        margin: 0 0 48px;
        text-align: center;
    }

    /* ── Class select ── */
    .class-stage {
        align-items: stretch;
        justify-content: flex-start;
        padding: 0;
    }

    .class-stage-header {
        flex-shrink: 0;
        text-align: center;
        margin-bottom: clamp(12px, 1.5vw, 18px);
    }

    .class-stage-header h2 {
        font-family: var(--font-display);
        font-size: clamp(22px, 3.2vw, 36px);
        font-weight: 700;
        letter-spacing: 0.1em;
        margin: 0 0 6px;
        color: var(--df-text);
        text-shadow: 0 0 24px rgba(212, 175, 55, 0.2);
    }

    .class-stage-header p {
        margin: 0;
        font-family: var(--font-ui);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--df-text-dim);
    }

    .menu-body {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr min(340px, 32vw);
        gap: clamp(14px, 2vw, 22px);
        width: 100%;
        overflow: hidden;
    }

    @media (max-width: 900px) {
        .menu-body {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
        }
        .hero-details-pane { max-height: 240px; }
    }

    .hero-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
        gap: 12px;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 4px 8px 4px 2px;
        scrollbar-width: thin;
        scrollbar-color: rgba(212, 175, 55, 0.35) transparent;
    }

    .hero-card-grid::-webkit-scrollbar { width: 5px; }
    .hero-card-grid::-webkit-scrollbar-thumb {
        background: rgba(212, 175, 55, 0.35);
        border-radius: 3px;
    }

    .hero-card {
        position: relative;
        border: none;
        background: var(--panel-bg);
        clip-path: var(--clip-panel);
        padding: 16px 14px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: inherit;
        box-shadow: 0 0 0 1px var(--panel-border);
        transition: box-shadow 0.25s, transform 0.22s var(--menu-spring);
        overflow: hidden;
    }

    .hero-card::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
    }

    .hero-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, currentColor, transparent);
        opacity: 0;
        transition: opacity 0.3s;
    }

    .hero-card:hover { transform: translateY(-3px); }
    .hero-card.selected {
        transform: translateY(-2px);
        animation: cardPulse 2.5s ease-in-out infinite;
    }

    .hero-card-glow-warrior { color: var(--df-ember); }
    .hero-card-glow-ranger { color: var(--df-jungle); }
    .hero-card-glow-tank { color: #4a9fd4; }
    .hero-card-glow-hybrid { color: #9b59b6; }
    .hero-card-glow-mage { color: #e74c3c; }

    .hero-card-glow-warrior::before { background: radial-gradient(circle at 50% 100%, rgba(255, 107, 44, 0.35), transparent 70%); }
    .hero-card-glow-ranger::before { background: radial-gradient(circle at 50% 100%, rgba(46, 204, 113, 0.35), transparent 70%); }
    .hero-card-glow-tank::before { background: radial-gradient(circle at 50% 100%, rgba(74, 159, 212, 0.35), transparent 70%); }
    .hero-card-glow-hybrid::before {
        background:
            radial-gradient(circle at 30% 100%, rgba(155, 89, 182, 0.3), transparent 60%),
            radial-gradient(circle at 70% 100%, rgba(106, 90, 205, 0.3), transparent 60%);
    }
    .hero-card-glow-mage::before { background: radial-gradient(circle at 50% 100%, rgba(231, 76, 60, 0.4), transparent 70%); }

    .hero-card:hover, .hero-card.selected {
        box-shadow: 0 0 0 1px currentColor, 0 0 28px color-mix(in srgb, currentColor 35%, transparent);
    }

    .hero-card:hover::before, .hero-card.selected::before,
    .hero-card:hover::after, .hero-card.selected::after { opacity: 1; }

    @keyframes cardPulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.12); }
    }

    @keyframes cardEnter {
        from { opacity: 0; transform: translateY(16px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .hero-card-role {
        font-family: var(--font-ui);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.24em;
        color: var(--df-text-dim);
        margin-bottom: 6px;
    }

    .hero-card-title {
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 700;
        color: var(--df-text);
        margin-bottom: 3px;
        line-height: 1.2;
    }

    .hero-card-subtitle {
        font-family: var(--font-body);
        font-size: 11px;
        font-weight: 600;
        color: var(--df-copper-light);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .hero-card-icon {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 28px;
        height: 28px;
        opacity: 0.55;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hero-card-icon svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 1.5; }

    .hero-details-pane {
        position: relative;
        border: none;
        background: var(--panel-bg);
        clip-path: var(--clip-panel);
        padding: 22px 20px;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow-y: auto;
        box-shadow:
            0 0 0 1px var(--panel-border),
            0 0 40px var(--panel-glow),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .details-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-family: var(--font-ui);
        color: var(--df-text-dim);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        line-height: 1.8;
    }

    .details-hero-name {
        font-family: var(--font-display);
        font-size: clamp(20px, 2.5vw, 28px);
        font-weight: 700;
        letter-spacing: 0.04em;
        margin: 0 0 4px;
        color: var(--df-text);
    }

    .details-hero-class {
        font-family: var(--font-ui);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--df-copper-light);
        margin-bottom: 12px;
    }

    .details-difficulty {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        font-family: var(--font-ui);
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--df-text-dim);
    }

    .difficulty-stars { display: flex; gap: 4px; }

    .difficulty-star {
        width: 11px;
        height: 11px;
        background: rgba(40, 50, 45, 0.8);
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        transition: background 0.3s, box-shadow 0.3s;
    }

    .difficulty-star.filled {
        background: var(--df-copper-light);
        box-shadow: 0 0 8px rgba(212, 175, 55, 0.7);
    }

    .details-lore {
        font-size: 13px;
        font-weight: 500;
        line-height: 1.65;
        color: var(--df-text-dim);
        margin-bottom: 16px;
    }

    .details-stats {
        display: flex;
        flex-direction: column;
        gap: 11px;
        margin-bottom: 14px;
    }

    .stat-row {
        display: grid;
        grid-template-columns: 68px 1fr 36px;
        align-items: center;
        gap: 8px;
        font-family: var(--font-ui);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--df-text-dim);
    }

    .stat-bar-track {
        height: 8px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(212, 175, 55, 0.15);
        overflow: hidden;
        clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
    }

    .stat-bar-fill {
        height: 100%;
        width: 0%;
        transition: width 0.7s var(--menu-ease);
    }

    .stat-bar-fill.stat-hp { background: linear-gradient(90deg, #6a2020, #e74c3c); box-shadow: 0 0 8px rgba(231, 76, 60, 0.5); }
    .stat-bar-fill.stat-spd { background: linear-gradient(90deg, #1a4a2a, var(--df-jungle)); box-shadow: 0 0 8px rgba(46, 204, 113, 0.5); }
    .stat-bar-fill.stat-atk { background: linear-gradient(90deg, #6a4a10, var(--df-ember)); box-shadow: 0 0 8px rgba(255, 107, 44, 0.5); }

    .stat-value {
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--df-text);
        font-weight: 700;
        font-size: 12px;
    }

    .details-skills {
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid rgba(212, 175, 55, 0.12);
    }

    .details-skills-title {
        font-family: var(--font-ui);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--df-copper);
        margin-bottom: 8px;
    }

    .details-skill {
        font-size: 12px;
        font-weight: 500;
        color: var(--df-text-dim);
        line-height: 1.7;
    }

    .details-skill strong {
        font-family: var(--font-ui);
        color: var(--df-copper-light);
        font-weight: 700;
    }

    .class-stage-footer {
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: clamp(14px, 2vw, 20px);
        padding-top: 14px;
        border-top: 1px solid rgba(212, 175, 55, 0.1);
    }

    /* ── Settings ── */
    .settings-stage {
        justify-content: center;
    }

    .settings-panel {
        position: relative;
        width: min(440px, 92vw);
        padding: 32px 28px 24px;
        background: var(--panel-bg);
        clip-path: var(--clip-panel);
        box-shadow:
            0 0 0 1px var(--panel-border),
            0 0 48px var(--panel-glow),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }

    .settings-panel h2 {
        font-family: var(--font-display);
        font-size: clamp(20px, 3vw, 26px);
        font-weight: 700;
        letter-spacing: 0.12em;
        margin: 0 0 28px;
        text-align: center;
        color: var(--df-text);
    }

    .settings-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 600;
        color: var(--df-text-dim);
    }

    .settings-row:last-of-type { border-bottom: none; margin-bottom: 8px; }

    .settings-toggle {
        width: 52px;
        height: 28px;
        border-radius: 2px;
        border: 1px solid var(--panel-border);
        background: rgba(0, 0, 0, 0.45);
        cursor: pointer;
        position: relative;
        transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
        clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
    }

    .settings-toggle.on {
        background: rgba(46, 204, 113, 0.25);
        border-color: rgba(46, 204, 113, 0.55);
        box-shadow: 0 0 16px rgba(46, 204, 113, 0.2);
    }

    .settings-toggle::after {
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        width: 18px;
        height: 18px;
        background: var(--df-text-dim);
        transition: transform 0.25s var(--menu-spring), background 0.25s;
        clip-path: polygon(2px 0, 100% 0, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0 100%, 0 2px);
    }

    .settings-toggle.on::after {
        transform: translateX(24px);
        background: var(--df-jungle);
    }

    .settings-back {
        width: 100%;
        margin-top: 12px;
    }

    @media (max-width: 600px) {
        .menu-top-bar {
            grid-template-columns: 40px 1fr;
        }
        .menu-version { display: none; }
        .menu-shell { height: 96vh; padding: 12px; }
        .class-stage-footer { flex-direction: column-reverse; gap: 12px; }
        .game-btn, .game-btn-deploy { min-width: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
        #class-select-overlay, .menu-stage, .brand-letter, .welcome-pre, .welcome-tagline, .welcome-continue,
        .hero-card, .hero-card[style*="animation"], .stat-bar-fill, .game-btn-deploy.ready, .menu-ember-layer, .menu-shimmer,
        .welcome-glow-ring, .main-stage-inner, .frame-corner, .main-logo-underline {
            animation: none !important;
            transition-duration: 0.01ms !important;
            opacity: 1 !important;
            transform: none !important;
        }
    }
`;
document.head.appendChild(menuStyle);

const HERO_GLOW_CLASS = {
    warrior: 'hero-card-glow-warrior',
    ranger: 'hero-card-glow-ranger',
    tank: 'hero-card-glow-tank',
    hybrid: 'hero-card-glow-hybrid',
    mage: 'hero-card-glow-mage',
};

const HERO_SVG = {
    warrior: '<svg viewBox="0 0 24 24"><path d="M4 4l7 16 2-7 7-2z"/><path d="M14 6l4 4"/></svg>',
    ranger: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4"/></svg>',
    tank: '<svg viewBox="0 0 24 24"><path d="M6 8h12v10H6z"/><path d="M4 10h16M8 8V5h8v3"/></svg>',
    hybrid: '<svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>',
    mage: '<svg viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>',
};

const HERO_LORE = {
    warrior: 'Forged in border wars, the Bladed Duelist closes distance with brutal precision.',
    ranger: 'Silent as mist through the canopy. Superior speed and sustained ranged pressure.',
    tank: 'An unbreakable wall of iron and frost-rune armor. Absorbs punishment for the team.',
    hybrid: 'Neither blade nor spell alone defines them. High skill ceiling, devastating when mastered.',
    mage: 'Wielder of ember and ash. Explosive area devastation and rapid spell cadence.',
};

const HERO_DIFFICULTY = { warrior: 2, ranger: 3, tank: 1, hybrid: 4, mage: 3 };
const STAT_MAX = { maxHp: 180, speed: 4.2, projectileDamage: 26 };

let selectedHeroKey = null;
let onEnterCallback = null;
let currentStage = 'welcome';
let welcomePlayed = false;

const STAGES = ['welcome', 'main', 'class-select', 'settings'];

function getOverlay() {
    return document.getElementById('class-select-overlay');
}

function setStage(stage) {
    currentStage = stage;
    STAGES.forEach(s => {
        const el = document.getElementById(`menu-stage-${s}`);
        if (el) el.classList.toggle('active', s === stage);
    });

    const breadcrumb = document.getElementById('menu-breadcrumb');
    if (breadcrumb) {
        const showCrumb = stage === 'class-select';
        breadcrumb.classList.toggle('hidden', !showCrumb);
        if (showCrumb) updateBreadcrumb();
    }
}

function updateBreadcrumb() {
    const play = document.querySelector('.menu-breadcrumb [data-step="play"]');
    const pick = document.querySelector('.menu-breadcrumb [data-step="class"]');
    const go = document.querySelector('.menu-breadcrumb [data-step="go"]');
    [play, pick, go].forEach(c => c?.classList.remove('active', 'done'));
    play?.classList.add('done');
    if (selectedHeroKey) {
        pick?.classList.add('done');
        go?.classList.add('active');
    } else {
        pick?.classList.add('active');
    }
}

function renderDifficultyStars(count) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="difficulty-star${i < count ? ' filled' : ''}" aria-hidden="true"></span>`
    ).join('');
}

function populateHeroDetailsPane(heroKey, hero) {
    const pane = document.getElementById('hero-details-pane');
    if (!pane || !hero) return;

    const diff = HERO_DIFFICULTY[heroKey] ?? 3;
    const hpPct = Math.round((hero.maxHp / STAT_MAX.maxHp) * 100);
    const spdPct = Math.round((hero.speed / STAT_MAX.speed) * 100);
    const atkPct = Math.round((hero.projectileDamage / STAT_MAX.projectileDamage) * 100);

    pane.innerHTML = `
        <h2 class="details-hero-name">${hero.title}</h2>
        <div class="details-hero-class">${hero.classKey}</div>
        <div class="details-difficulty">
            <span>Difficulty</span>
            <div class="difficulty-stars" aria-label="${diff} out of 5">${renderDifficultyStars(diff)}</div>
        </div>
        <p class="details-lore">${HERO_LORE[heroKey] ?? ''}</p>
        <div class="details-stats">
            <div class="stat-row"><span>Health</span><div class="stat-bar-track"><div class="stat-bar-fill stat-hp" style="width:0%" data-target="${hpPct}"></div></div><span class="stat-value">${hero.maxHp}</span></div>
            <div class="stat-row"><span>Speed</span><div class="stat-bar-track"><div class="stat-bar-fill stat-spd" style="width:0%" data-target="${spdPct}"></div></div><span class="stat-value">${hero.speed}</span></div>
            <div class="stat-row"><span>Attack</span><div class="stat-bar-track"><div class="stat-bar-fill stat-atk" style="width:0%" data-target="${atkPct}"></div></div><span class="stat-value">${hero.projectileDamage}</span></div>
        </div>
        <div class="details-skills">
            <div class="details-skills-title">Abilities</div>
            <div class="details-skill"><strong>1</strong> — ${hero.skills.skill1}</div>
            <div class="details-skill"><strong>2</strong> — ${hero.skills.skill2}</div>
            <div class="details-skill"><strong>3</strong> — ${hero.skills.ult}</div>
        </div>
    `;

    requestAnimationFrame(() => {
        pane.querySelectorAll('.stat-bar-fill').forEach(bar => {
            bar.style.width = `${bar.dataset.target}%`;
        });
    });
}

export function selectHero(heroKey, heroRoster) {
    const hero = heroRoster[heroKey];
    if (!hero) return;

    selectedHeroKey = heroKey;

    document.getElementById('hero-card-grid')?.querySelectorAll('.hero-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.heroKey === heroKey);
        card.setAttribute('aria-selected', card.dataset.heroKey === heroKey ? 'true' : 'false');
    });

    populateHeroDetailsPane(heroKey, hero);
    document.getElementById('enter-forest-btn')?.classList.add('ready');
    updateBreadcrumb();
}

export function hideClassSelectOverlay() {
    getOverlay()?.classList.add('hidden');
}

export function showMainMenu(skipWelcome = true) {
    selectedHeroKey = null;
    getOverlay()?.classList.remove('hidden');
    document.getElementById('enter-forest-btn')?.classList.remove('ready');
    document.getElementById('hero-card-grid')?.querySelectorAll('.hero-card').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-selected', 'false');
    });

    const pane = document.getElementById('hero-details-pane');
    if (pane) pane.innerHTML = '<div class="details-empty">Select a champion<br>to begin</div>';

    if (!skipWelcome && !welcomePlayed) {
        setStage('welcome');
    } else {
        setStage('main');
    }
}

export function showClassSelectMenu(options = {}) {
    showMainMenu(options.skipWelcome !== false);
}

function goToClassSelect() {
    setStage('class-select');
    updateBreadcrumb();
    requestAnimationFrame(() => {
        document.querySelectorAll('.hero-card').forEach((card, i) => {
            card.style.animation = `none`;
            card.offsetHeight;
            card.style.animation = `cardEnter 0.45s var(--menu-ease, ease) ${i * 0.06}s both`;
        });
    });
}

function bindWelcomeStage() {
    const continueBtn = document.getElementById('welcome-continue-btn');
    let welcomeTimer = null;

    const dismissWelcome = () => {
        if (welcomePlayed) return;
        welcomePlayed = true;
        if (welcomeTimer) clearTimeout(welcomeTimer);
        setStage('main');
    };

    continueBtn?.addEventListener('click', dismissWelcome);
    welcomeTimer = setTimeout(dismissWelcome, 4500);
}

function bindMainStage() {
    document.getElementById('btn-play')?.addEventListener('click', goToClassSelect);
    document.getElementById('btn-classes')?.addEventListener('click', goToClassSelect);
    document.getElementById('btn-settings')?.addEventListener('click', () => setStage('settings'));
}

function bindClassStage() {
    document.getElementById('btn-class-back')?.addEventListener('click', () => setStage('main'));
}

function bindSettingsStage() {
    document.getElementById('btn-settings-back')?.addEventListener('click', () => setStage('main'));
    document.querySelectorAll('.settings-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => toggle.classList.toggle('on'));
    });
}

export function getSelectedHeroKey() {
    return selectedHeroKey;
}

export function initHeroSelectMenu(heroRoster, onEnter) {
    onEnterCallback = onEnter;
    const grid = document.getElementById('hero-card-grid');
    const enterBtn = document.getElementById('enter-forest-btn');
    if (!grid || !enterBtn) return;

    grid.innerHTML = '';

    for (const [key, hero] of Object.entries(heroRoster)) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `hero-card ${HERO_GLOW_CLASS[key] ?? ''}`;
        card.dataset.heroKey = key;
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', 'false');
        card.setAttribute('aria-label', `${hero.title}, ${hero.classKey}`);
        card.innerHTML = `
            <span class="hero-card-icon" aria-hidden="true">${HERO_SVG[key] ?? ''}</span>
            <div class="hero-card-role">${hero.role.toUpperCase()}</div>
            <div class="hero-card-title">${hero.title}</div>
            <div class="hero-card-subtitle">${hero.classKey}</div>
        `;
        card.addEventListener('click', () => selectHero(key, heroRoster));
        grid.appendChild(card);
    }

    enterBtn.addEventListener('click', () => {
        if (!selectedHeroKey) return;
        hideClassSelectOverlay();
        onEnterCallback?.(selectedHeroKey);
    });

    bindWelcomeStage();
    bindMainStage();
    bindClassStage();
    bindSettingsStage();
}

export function buildWelcomeLetters() {
    const brand = document.getElementById('welcome-brand');
    if (!brand || brand.childElementCount > 0) return;
    'MOBROYALE'.split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'brand-letter';
        span.textContent = ch;
        brand.appendChild(span);
    });
}
