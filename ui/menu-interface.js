// ============================================================
// MOBROYALE — MULTI-STAGE MENU SYSTEM
// Welcome → Main (Play / Classes / Settings) → Pick Class → GO
// ============================================================

import { gameSettings, setGameSetting } from './game-settings.js';
import { clearDamageNumbers } from './damage-numbers.js';

const MENU_STYLES = `
    :root {
        --df-bg: #050f08;
        --df-copper: #8b6914;
        --df-copper-light: #c9a227;
        --df-ember: #e8721a;
        --df-text: #e8e4dc;
        --df-text-dim: #8a9a82;
        --df-border: rgba(139, 105, 20, 0.4);
        --glass-bg: rgba(10, 20, 12, 0.38);
        --glass-border: rgba(201, 162, 39, 0.32);
        --glass-highlight: rgba(255, 255, 255, 0.1);
        --menu-ease: cubic-bezier(0.4, 0, 0.2, 1);
        --menu-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
    }

    #class-select-overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(165deg, rgba(5, 15, 8, 0.42) 0%, rgba(3, 7, 4, 0.55) 55%, rgba(1, 3, 2, 0.68) 100%);
        backdrop-filter: blur(26px) saturate(1.45);
        -webkit-backdrop-filter: blur(26px) saturate(1.45);
        pointer-events: auto;
        opacity: 1;
        visibility: visible;
        transition: opacity 0.5s var(--menu-ease), visibility 0.5s var(--menu-ease);
        overflow: hidden;
        font-family: 'Montserrat', 'Segoe UI', sans-serif;
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
            linear-gradient(rgba(201, 162, 39, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 162, 39, 0.05) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
        pointer-events: none;
        opacity: 0.65;
    }

    .menu-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.55) 100%);
        pointer-events: none;
    }

    .welcome-center {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .menu-ember-layer {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201, 162, 39, 0.08), transparent),
            radial-gradient(2px 2px at 18% 72%, rgba(232, 114, 26, 0.4), transparent),
            radial-gradient(2px 2px at 82% 28%, rgba(61, 186, 106, 0.3), transparent),
            radial-gradient(1px 1px at 45% 55%, rgba(201, 162, 39, 0.2), transparent);
        animation: emberDrift 14s ease-in-out infinite alternate;
        pointer-events: none;
    }

    .menu-shimmer {
        position: absolute;
        inset: -50%;
        background: conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(201, 162, 39, 0.03) 60deg, transparent 120deg);
        animation: shimmerRotate 20s linear infinite;
        pointer-events: none;
    }

    @keyframes emberDrift {
        0% { transform: translateY(0); opacity: 0.55; }
        100% { transform: translateY(-12px); opacity: 0.75; }
    }

    @keyframes shimmerRotate {
        to { transform: rotate(360deg); }
    }

    .menu-shell {
        position: relative;
        z-index: 2;
        width: min(1180px, 96vw);
        max-height: 94vh;
        display: flex;
        flex-direction: column;
        padding: clamp(12px, 2.5vw, 28px);
        box-sizing: border-box;
    }

    /* ── Stage system ── */
    .menu-stage {
        display: none;
        flex-direction: column;
        align-items: center;
        animation: stageOut 0.01s forwards;
    }

    .menu-stage.active {
        display: flex;
        animation: stageIn 0.45s var(--menu-ease) forwards;
    }

    @keyframes stageIn {
        from { opacity: 0; transform: translateY(24px) scale(0.97); filter: blur(4px); }
        to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }

    @keyframes stageOut {
        to { opacity: 0; }
    }

    /* ── Breadcrumb trail ── */
    .menu-breadcrumb {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: clamp(16px, 2vw, 24px);
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
    }

    .menu-breadcrumb.hidden { display: none; }

    .crumb {
        color: var(--df-text-dim);
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid transparent;
        transition: color 0.3s, border-color 0.3s, background 0.3s, box-shadow 0.3s;
    }

    .crumb.done {
        color: var(--df-copper-light);
    }

    .crumb.active {
        color: var(--df-text);
        background: var(--glass-bg);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-color: var(--glass-border);
        box-shadow: 0 0 20px rgba(201, 162, 39, 0.15);
    }

    .crumb-sep {
        color: rgba(139, 105, 20, 0.5);
        font-size: 12px;
    }

    /* ── Glass buttons ── */
    .glass-btn {
        position: relative;
        min-width: min(280px, 80vw);
        min-height: 52px;
        padding: 16px 36px;
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(13px, 2vw, 16px);
        font-weight: 600;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--df-text);
        cursor: pointer;
        border: 1px solid var(--glass-border);
        background: var(--glass-bg);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 var(--glass-highlight),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2);
        transition: transform 0.25s var(--menu-spring), box-shadow 0.25s, border-color 0.25s, background 0.25s;
        overflow: hidden;
    }

    .glass-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.06) 50%, transparent 60%);
        transform: translateX(-100%);
        transition: transform 0.5s var(--menu-ease);
    }

    .glass-btn:hover::before {
        transform: translateX(100%);
    }

    .glass-btn:hover {
        transform: translateY(-3px) scale(1.02);
        border-color: rgba(201, 162, 39, 0.55);
        box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.45),
            0 0 30px rgba(201, 162, 39, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .glass-btn:active {
        transform: translateY(0) scale(0.98);
    }

    .glass-btn:focus-visible {
        outline: 2px solid var(--df-copper-light);
        outline-offset: 3px;
    }

    .glass-btn-primary {
        background: linear-gradient(135deg, rgba(201, 162, 39, 0.25), rgba(139, 105, 20, 0.15));
        border-color: rgba(201, 162, 39, 0.5);
        color: #f5ecd8;
    }

    .glass-btn-primary:hover {
        background: linear-gradient(135deg, rgba(201, 162, 39, 0.38), rgba(139, 105, 20, 0.22));
        box-shadow: 0 0 40px rgba(201, 162, 39, 0.25), 0 12px 40px rgba(0, 0, 0, 0.45);
    }

    .glass-btn-go {
        min-width: 220px;
        background: linear-gradient(135deg, rgba(232, 114, 26, 0.35), rgba(201, 162, 39, 0.2));
        border-color: rgba(232, 114, 26, 0.55);
        opacity: 0.4;
    }

    .glass-btn-go:disabled {
        pointer-events: none;
        cursor: not-allowed;
        filter: grayscale(0.35);
    }

    .glass-btn-go.ready {
        opacity: 1;
        filter: none;
        animation: goPulse 2s ease-in-out infinite;
    }

    .glass-btn-go.ready:hover {
        box-shadow: 0 0 48px rgba(232, 114, 26, 0.35), 0 12px 40px rgba(0, 0, 0, 0.45);
    }

    @keyframes goPulse {
        0%, 100% { box-shadow: 0 0 16px rgba(232, 114, 26, 0.2), 0 8px 32px rgba(0, 0, 0, 0.35); }
        50% { box-shadow: 0 0 36px rgba(232, 114, 26, 0.45), 0 8px 32px rgba(0, 0, 0, 0.35); }
    }

    .glass-btn-back {
        min-width: auto;
        padding: 10px 20px;
        font-size: 11px;
        margin-top: 20px;
        color: var(--df-text-dim);
    }

    .main-menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: center;
        width: 100%;
    }

    /* ── Welcome screen ── */
    .welcome-stage {
        justify-content: center;
        min-height: min(70vh, 600px);
        text-align: center;
    }

    .welcome-pre {
        display: block;
        font-size: clamp(12px, 2vw, 14px);
        letter-spacing: 0.45em;
        text-transform: uppercase;
        color: var(--df-text-dim);
        margin-bottom: 20px;
        opacity: 0;
        animation: welcomeFadeUp 0.8s var(--menu-ease) 0.2s forwards;
    }

    .welcome-brand {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 2px;
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(36px, 8vw, 72px);
        font-weight: 700;
        line-height: 1;
        margin-bottom: 12px;
    }

    .brand-letter {
        display: inline-block;
        opacity: 0;
        transform: translateY(40px) rotateX(-90deg);
        color: var(--df-text);
        text-shadow: 0 0 40px rgba(201, 162, 39, 0.5);
        animation: letterReveal 0.7s var(--menu-spring) forwards;
    }

    .brand-letter:nth-child(1) { animation-delay: 0.5s; color: #e8721a; }
    .brand-letter:nth-child(2) { animation-delay: 0.58s; }
    .brand-letter:nth-child(3) { animation-delay: 0.66s; }
    .brand-letter:nth-child(4) { animation-delay: 0.74s; color: #3dba6a; }
    .brand-letter:nth-child(5) { animation-delay: 0.82s; }
    .brand-letter:nth-child(6) { animation-delay: 0.90s; }
    .brand-letter:nth-child(7) { animation-delay: 0.98s; color: #c9a227; }
    .brand-letter:nth-child(8) { animation-delay: 1.06s; }
    .brand-letter:nth-child(9) { animation-delay: 1.14s; }

    .welcome-tagline {
        font-size: 11px;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: rgba(201, 162, 39, 0.6);
        opacity: 0;
        animation: welcomeFadeUp 0.8s var(--menu-ease) 1.4s forwards;
    }

    .welcome-continue {
        margin-top: 48px;
        opacity: 0;
        animation: welcomeFadeUp 0.6s var(--menu-ease) 2s forwards, welcomePulse 2s ease-in-out 2.6s infinite;
    }

    @keyframes letterReveal {
        to { opacity: 1; transform: translateY(0) rotateX(0); }
    }

    @keyframes welcomeFadeUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes welcomePulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }

    .welcome-glow-ring {
        position: absolute;
        width: min(400px, 70vw);
        height: min(400px, 70vw);
        border-radius: 50%;
        border: 1px solid rgba(201, 162, 39, 0.12);
        box-shadow: 0 0 80px rgba(201, 162, 39, 0.08), inset 0 0 60px rgba(201, 162, 39, 0.04);
        animation: ringExpand 2s var(--menu-ease) 0.3s forwards;
        opacity: 0;
        pointer-events: none;
    }

    @keyframes ringExpand {
        from { opacity: 0; transform: scale(0.6); }
        to { opacity: 1; transform: scale(1); }
    }

    /* ── Main menu title ── */
    .main-logo {
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(28px, 5vw, 42px);
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        margin: 0 0 8px;
        background: linear-gradient(180deg, #f0e6c8 0%, #c9a227 50%, #8b6914 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 0 20px rgba(201, 162, 39, 0.3));
    }

    .main-subtitle {
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--df-text-dim);
        margin-bottom: 40px;
    }

    /* ── Class select stage ── */
    .class-stage-header {
        text-align: center;
        margin-bottom: 20px;
    }

    .class-stage-header h2 {
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(20px, 3vw, 32px);
        letter-spacing: 0.12em;
        margin: 0 0 6px;
        color: var(--df-text);
    }

    .class-stage-header p {
        margin: 0;
        font-size: 11px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: var(--df-text-dim);
    }

    #menu-stage-class-select.active {
        width: 100%;
        align-items: stretch;
    }

    .menu-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) min(340px, 34vw);
        gap: clamp(16px, 2.5vw, 28px);
        width: 100%;
        min-height: 0;
        align-items: stretch;
    }

    @media (max-width: 900px) {
        .menu-body { grid-template-columns: 1fr; }
    }

    .hero-card-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-content: flex-start;
        gap: 14px;
        padding: 4px 2px;
    }

    .hero-card-grid .hero-card {
        flex: 0 1 calc(20% - 12px);
        min-width: 148px;
        max-width: 188px;
    }

    @media (max-width: 960px) {
        .hero-card-grid .hero-card {
            flex: 0 1 calc(33.333% - 12px);
            max-width: none;
        }
    }

    @media (max-width: 560px) {
        .hero-card-grid .hero-card {
            flex: 0 1 calc(50% - 10px);
            min-width: 130px;
        }
    }

    .hero-card {
        position: relative;
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        background: var(--glass-bg);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 16px 14px;
        min-height: 108px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: inherit;
        transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s var(--menu-spring);
        overflow: hidden;
        box-shadow: inset 0 1px 0 var(--glass-highlight);
    }

    .hero-card::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
    }

    .hero-card:hover { transform: translateY(-4px); }
    .hero-card.selected { transform: translateY(-2px); animation: borderPulse 2s ease-in-out infinite; }

    .hero-card-glow-warrior::before { background: radial-gradient(circle at 50% 100%, rgba(232, 114, 26, 0.3), transparent 70%); }
    .hero-card-glow-ranger::before { background: radial-gradient(circle at 50% 100%, rgba(61, 186, 106, 0.3), transparent 70%); }
    .hero-card-glow-tank::before { background: radial-gradient(circle at 50% 100%, rgba(74, 159, 212, 0.3), transparent 70%); }
    .hero-card-glow-hybrid::before {
        background:
            radial-gradient(circle at 30% 100%, rgba(155, 89, 182, 0.25), transparent 60%),
            radial-gradient(circle at 70% 100%, rgba(106, 90, 205, 0.25), transparent 60%);
    }
    .hero-card-glow-mage::before { background: radial-gradient(circle at 50% 100%, rgba(192, 57, 43, 0.35), transparent 70%); }

    .hero-card-glow-warrior:hover, .hero-card-glow-warrior.selected { border-color: #e8721a; box-shadow: 0 0 24px rgba(232, 114, 26, 0.4); }
    .hero-card-glow-ranger:hover, .hero-card-glow-ranger.selected { border-color: #3dba6a; box-shadow: 0 0 24px rgba(61, 186, 106, 0.4); }
    .hero-card-glow-tank:hover, .hero-card-glow-tank.selected { border-color: #4a9fd4; box-shadow: 0 0 24px rgba(74, 159, 212, 0.4); }
    .hero-card-glow-hybrid:hover, .hero-card-glow-hybrid.selected { border-color: #9b59b6; box-shadow: 0 0 24px rgba(155, 89, 182, 0.4); }
    .hero-card-glow-mage:hover, .hero-card-glow-mage.selected { border-color: #c0392b; box-shadow: 0 0 24px rgba(192, 57, 43, 0.45); }

    .hero-card:hover::before, .hero-card.selected::before { opacity: 1; }

    @keyframes borderPulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.15); }
    }

    .hero-card-role { font-size: 9px; letter-spacing: 0.22em; color: var(--df-text-dim); margin-bottom: 4px; }
    .hero-card-title { font-family: 'Cinzel', Georgia, serif; font-size: 15px; font-weight: 600; color: var(--df-text); margin-bottom: 2px; }
    .hero-card-subtitle { font-size: 10px; color: var(--df-copper-light); letter-spacing: 0.06em; }

    .hero-card-icon {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 26px;
        height: 26px;
        opacity: 0.5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hero-card-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.5; }

    .hero-details-pane {
        border: 1px solid var(--glass-border);
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 20px 18px;
        display: flex;
        flex-direction: column;
        min-height: 280px;
        max-height: min(56vh, 500px);
        overflow-y: auto;
        box-shadow: inset 0 1px 0 var(--glass-highlight), 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .details-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: var(--df-text-dim);
        font-size: 12px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        line-height: 1.7;
    }

    .details-hero-name { font-family: 'Cinzel', Georgia, serif; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; margin: 0 0 4px; color: var(--df-text); }
    .details-hero-class { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--df-copper-light); margin-bottom: 10px; }

    .details-difficulty { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--df-text-dim); }
    .difficulty-stars { display: flex; gap: 3px; }
    .difficulty-star {
        width: 10px; height: 10px;
        background: rgba(60, 60, 60, 0.6);
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        transition: background 0.3s;
    }
    .difficulty-star.filled { background: var(--df-copper-light); box-shadow: 0 0 6px rgba(201, 162, 39, 0.6); }

    .details-lore { font-size: 12px; line-height: 1.65; color: var(--df-text-dim); margin-bottom: 16px; }

    .details-stats { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
    .stat-row { display: grid; grid-template-columns: 64px 1fr 32px; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--df-text-dim); }
    .stat-bar-track { height: 7px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(139, 105, 20, 0.2); overflow: hidden; }
    .stat-bar-fill { height: 100%; width: 0%; transition: width 0.6s var(--menu-ease); }
    .stat-bar-fill.stat-hp { background: linear-gradient(90deg, #6a2020, #c0392b); box-shadow: 0 0 6px rgba(192, 57, 43, 0.4); }
    .stat-bar-fill.stat-spd { background: linear-gradient(90deg, #1a4a2a, #3dba6a); box-shadow: 0 0 6px rgba(61, 186, 106, 0.4); }
    .stat-bar-fill.stat-atk { background: linear-gradient(90deg, #6a4a10, #e8721a); box-shadow: 0 0 6px rgba(232, 114, 26, 0.4); }
    .stat-value { text-align: right; font-variant-numeric: tabular-nums; color: var(--df-text); font-weight: 600; font-size: 11px; }

    .details-skills { margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(139, 105, 20, 0.15); }
    .details-skills-title { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--df-copper); margin-bottom: 6px; }
    .details-skill { font-size: 11px; color: var(--df-text-dim); line-height: 1.65; }
    .details-skill strong { color: var(--df-copper-light); font-weight: 600; }

    .class-stage-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(139, 105, 20, 0.18);
        width: 100%;
        flex-wrap: wrap;
    }

    .class-deploy-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 200px;
    }

    .class-deploy-hint {
        margin: 0;
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--df-text-dim);
        text-align: center;
    }

    .class-deploy-hint.ready {
        color: var(--df-copper-light);
    }

    /* ── Settings ── */
    .settings-panel {
        width: min(420px, 90vw);
        padding: 28px 24px;
        border: 1px solid var(--glass-border);
        background: var(--glass-bg);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 var(--glass-highlight);
    }

    .settings-panel h2 {
        font-family: 'Cinzel', Georgia, serif;
        font-size: 22px;
        letter-spacing: 0.1em;
        margin: 0 0 24px;
        text-align: center;
        color: var(--df-text);
    }

    .settings-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid rgba(139, 105, 20, 0.12);
        font-size: 13px;
        color: var(--df-text-dim);
    }

    .settings-row:last-of-type { border-bottom: none; }

    .settings-toggle {
        width: 48px;
        height: 26px;
        border-radius: 13px;
        border: 1px solid var(--glass-border);
        background: rgba(0, 0, 0, 0.35);
        cursor: pointer;
        position: relative;
        transition: background 0.25s, border-color 0.25s;
    }

    .settings-toggle.on {
        background: rgba(61, 186, 106, 0.3);
        border-color: rgba(61, 186, 106, 0.5);
    }

    .settings-toggle::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--df-text-dim);
        transition: transform 0.25s var(--menu-spring), background 0.25s;
    }

    .settings-toggle.on::after {
        transform: translateX(22px);
        background: #3dba6a;
    }

    @media (prefers-reduced-motion: reduce) {
        #class-select-overlay, .menu-stage, .brand-letter, .welcome-pre, .welcome-tagline, .welcome-continue,
        .hero-card, .stat-bar-fill, .glass-btn-go.ready, .menu-ember-layer, .menu-shimmer, .welcome-glow-ring {
            animation: none !important;
            transition-duration: 0.01ms !important;
            opacity: 1 !important;
            transform: none !important;
        }
    }
`;

let _menuStylesInjected = false;

function ensureMenuStyles() {
    if (_menuStylesInjected) return;
    _menuStylesInjected = true;
    const menuStyle = document.createElement('style');
    menuStyle.textContent = MENU_STYLES;
    document.head.appendChild(menuStyle);
}

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
let _pausedForSettings = false;
let _gamePauseHandler = null;

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
    const pick = document.querySelector('.menu-breadcrumb [data-step="class"]');
    const go = document.querySelector('.menu-breadcrumb [data-step="go"]');
    [pick, go].forEach(c => c?.classList.remove('active', 'done'));
    if (selectedHeroKey) {
        pick?.classList.add('done');
        go?.classList.add('active');
    } else {
        pick?.classList.add('active');
    }
}

function setDeployReady(ready) {
    const btn = document.getElementById('enter-forest-btn');
    const hint = document.getElementById('class-deploy-hint');
    btn?.classList.toggle('ready', ready);
    if (btn) btn.disabled = !ready;
    hint?.classList.toggle('ready', ready);
    if (hint && ready) {
        hint.textContent = 'Ready — Deploy or double-click champion';
    } else if (hint) {
        hint.textContent = 'Choose your champion — double-click or press Deploy';
    }
}

function deploySelectedHero() {
    if (!selectedHeroKey) return;
    hideClassSelectOverlay();
    onEnterCallback?.(selectedHeroKey);
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

    if (selectedHeroKey === heroKey) {
        deploySelectedHero();
        return;
    }

    selectedHeroKey = heroKey;

    document.getElementById('hero-card-grid')?.querySelectorAll('.hero-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.heroKey === heroKey);
        card.setAttribute('aria-selected', card.dataset.heroKey === heroKey ? 'true' : 'false');
    });

    populateHeroDetailsPane(heroKey, hero);
    setDeployReady(true);
    updateBreadcrumb();
}

export function hideClassSelectOverlay() {
    _pausedForSettings = false;
    getOverlay()?.classList.add('hidden');
}

function resetClassSelectionUI() {
    selectedHeroKey = null;
    setDeployReady(false);
    document.getElementById('hero-card-grid')?.querySelectorAll('.hero-card').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-selected', 'false');
    });
    const pane = document.getElementById('hero-details-pane');
    if (pane) pane.innerHTML = '<div class="details-empty">Select a champion<br>to begin</div>';
}

export function showMainMenu(skipWelcome = true) {
    resetClassSelectionUI();
    getOverlay()?.classList.remove('hidden');

    if (!skipWelcome && !welcomePlayed) {
        setStage('welcome');
    } else {
        setStage('main');
    }
}

export function showClassSelectMenu(options = {}) {
    resetClassSelectionUI();
    getOverlay()?.classList.remove('hidden');

    if (!options.skipWelcome && !welcomePlayed) {
        setStage('welcome');
    } else {
        setStage('class-select');
        updateBreadcrumb();
    }
}

function goToClassSelect() {
    setStage('class-select');
    updateBreadcrumb();
}

function bindWelcomeStage() {
    const continueBtn = document.getElementById('welcome-continue-btn');
    let welcomeTimer = null;

    const dismissWelcome = () => {
        if (welcomePlayed) return;
        welcomePlayed = true;
        if (welcomeTimer) clearTimeout(welcomeTimer);
        setStage('class-select');
        updateBreadcrumb();
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

export function registerGamePauseHandler(handler) {
    _gamePauseHandler = handler;
}

export function openInGameSettings() {
    _pausedForSettings = true;
    getOverlay()?.classList.remove('hidden');
    setStage('settings');
    _gamePauseHandler?.(false);
}

export function isInGameSettingsOpen() {
    return _pausedForSettings;
}

export function closeInGameSettings() {
    if (!_pausedForSettings) return;
    _pausedForSettings = false;
    getOverlay()?.classList.add('hidden');
    _gamePauseHandler?.(true);
}

function bindSettingsStage() {
    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
        if (_pausedForSettings) closeInGameSettings();
        else setStage('main');
    });
    document.querySelectorAll('.settings-toggle[data-setting]').forEach(toggle => {
        const key = toggle.dataset.setting;
        if (key in gameSettings) {
            toggle.classList.toggle('on', gameSettings[key]);
        }
        toggle.addEventListener('click', () => {
            const enabled = toggle.classList.toggle('on');
            if (key in gameSettings) {
                setGameSetting(key, enabled);
                if (key === 'damageNumbers' && !enabled) clearDamageNumbers();
            }
        });
    });
}

export function getSelectedHeroKey() {
    return selectedHeroKey;
}

export function initHeroSelectMenu(heroRoster, onEnter) {
    ensureMenuStyles();
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

    enterBtn.addEventListener('click', () => deploySelectedHero());

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
