// ============================================================
// ui/hud.js
// Professional MOBA HUD — bottom action bar, buffs, blight.
// ============================================================

import { ABILITY_CONFIG } from '../core/balance-config.js';
import { isOutsideBlight } from '../core/world/blight.js';

const PORTRAIT_LETTERS = {
    Warrior:      'W',
    Ranger:       'R',
    'Tank-Viking':'V',
    Hybrid:       'H',
    Mage:         'M',
};

const BUFF_SVGS = {
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6l-8-4z"/></svg>',
    valhalla: '<svg viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>',
    stance: '<svg viewBox="0 0 24 24"><path d="M4 20L12 4l8 16H4z"/></svg>',
    blight: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>',
};

const hudCache = {
    level: -1, gold: -1, xp: -1, hp: -1, maxHp: -1,
    aliveCreeps: -1, activeCamps: -1,
    qCd: -1, wCd: -1, eCd: -1, aaCd: -1,
    heroClass: '', heroTitle: '',
    buffKey: '',
    blightKey: '',
    lowHp: false,
};

const dom = {};
const abilitySlots = {};

function $(id) {
    return dom[id] ??= document.getElementById(id);
}

function slotEl(slotId) {
    return abilitySlots[slotId] ??= document.querySelector(`.ability-slot[data-slot="${slotId}"]`);
}

export function markHudDirty() {
    Object.assign(hudCache, {
        level: -1, gold: -1, xp: -1, hp: -1, maxHp: -1,
        aliveCreeps: -1, activeCamps: -1,
        qCd: -1, wCd: -1, eCd: -1, aaCd: -1,
        heroClass: '', heroTitle: '',
        buffKey: '', blightKey: '', lowHp: false,
    });
}

/**
 * @param {object} player
 * @param {object} gameState
 * @param {object} cooldowns — { q, w, e }
 * @param {number} aliveCreeps
 * @param {number} activeCamps
 * @param {number} xpPerLevel
 * @param {boolean} force
 * @param {object} [extras] — { blight }
 */
export function updateHud(player, gameState, cooldowns, aliveCreeps, activeCamps, xpPerLevel, force = false, extras = {}) {
    const blight = extras.blight;
    const qR = Math.ceil(cooldowns.q * 10);
    const wR = Math.ceil(cooldowns.w * 10);
    const eR = Math.ceil(cooldowns.e * 10);
    const aaR = Math.ceil((player.attackTimer ?? 0) * 10);

    const distToEdge = blight
        ? blight.currentRadius - Math.hypot(player.x - blight.center.x, player.y - blight.center.y)
        : 9999;
    const inBlight = isOutsideBlight(player.x, player.y);
    const buffKey = `${player.isShielded}|${player.valhallaActive}|${player.stance}|${inBlight}`;
    const distFloor = Math.floor(distToEdge);
    const blightKey = `${inBlight}|${distFloor}|${distFloor < 300}`;

    if (!force &&
        hudCache.level === player.level &&
        hudCache.gold === gameState.gold &&
        hudCache.xp === gameState.xp &&
        hudCache.hp === player.hp &&
        hudCache.maxHp === player.maxHp &&
        hudCache.aliveCreeps === aliveCreeps &&
        hudCache.activeCamps === activeCamps &&
        hudCache.qCd === qR && hudCache.wCd === wR && hudCache.eCd === eR &&
        hudCache.aaCd === aaR &&
        hudCache.heroClass === player.heroClass &&
        hudCache.heroTitle === (player.heroTitle || '') &&
        hudCache.buffKey === buffKey &&
        hudCache.blightKey === blightKey) {
        return;
    }

    const cfg = ABILITY_CONFIG[player.heroClass] ?? ABILITY_CONFIG.Mage;
    const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
    const xpRatio = xpPerLevel > 0 ? gameState.xp / xpPerLevel : 0;
    const lowHp = hpRatio > 0 && hpRatio < 0.25;

    const statsDirty = force ||
        hudCache.level !== player.level ||
        hudCache.gold !== gameState.gold ||
        hudCache.xp !== gameState.xp ||
        hudCache.hp !== player.hp ||
        hudCache.maxHp !== player.maxHp ||
        hudCache.aliveCreeps !== aliveCreeps ||
        hudCache.activeCamps !== activeCamps ||
        hudCache.heroClass !== player.heroClass ||
        hudCache.heroTitle !== (player.heroTitle || '') ||
        hudCache.lowHp !== lowHp;

    if (statsDirty) {
        _setText('player-level', player.level);
        _setText('hud-level-badge', player.level);
        _setText('player-gold', gameState.gold);
        _setText('hud-gold-value', gameState.gold);
        _setText('xp-text', `${gameState.xp}/${xpPerLevel}`);
        _setStyle('health-bar', 'width', `${hpRatio * 100}%`);
        _setStyle('xp-bar', 'width', `${xpRatio * 100}%`);
        _setText('health-bar-text', `${Math.ceil(player.hp)} / ${player.maxHp}`);
        _setText('xp-bar-text', `${gameState.xp} / ${xpPerLevel}`);
        _setText('creeps-count', activeCamps);
        _setText('alive-counter', aliveCreeps);

        const portraitLetter = $('hud-portrait-letter');
        if (portraitLetter) portraitLetter.textContent = PORTRAIT_LETTERS[player.heroClass] ?? '?';

        const portraitEl = $('hud-portrait');
        if (portraitEl) portraitEl.setAttribute('aria-label', player.heroTitle || player.heroClass);

        _setText('hud-hero-name', player.heroTitle || player.heroRole || player.heroClass);

        const hpWrap = $('health-bar-container');
        if (hpWrap) hpWrap.classList.toggle('low-hp', lowHp);
    }

    const cdsDirty = force ||
        hudCache.qCd !== qR || hudCache.wCd !== wR ||
        hudCache.eCd !== eR || hudCache.aaCd !== aaR ||
        hudCache.heroClass !== player.heroClass;

    if (cdsDirty) {
        updateAbilitySlot('q', cooldowns.q, cfg.q_cd, player.skills?.skill1 ?? 'Q', '1');
        updateAbilitySlot('w', cooldowns.w, cfg.w_cd, player.skills?.skill2 ?? 'W', '2');
        updateAbilitySlot('e', cooldowns.e, cfg.e_cd, player.skills?.ult ?? 'E', '3', true);

        const aaMax = getAttackCooldownMax(player, cfg);
        updateAbilitySlot('aa', player.attackTimer ?? 0, aaMax, 'Attack', 'LMB', false, true);
    }

    if (force || hudCache.buffKey !== buffKey) {
        updateBuffs(player, inBlight);
    }

    if (force || hudCache.blightKey !== blightKey) {
        updateBlightPanel(blight, distToEdge, inBlight);
    }

    Object.assign(hudCache, {
        level: player.level, gold: gameState.gold, xp: gameState.xp,
        hp: player.hp, maxHp: player.maxHp,
        aliveCreeps, activeCamps, qCd: qR, wCd: wR, eCd: eR, aaCd: aaR,
        heroClass: player.heroClass, heroTitle: player.heroTitle || '',
        buffKey, blightKey, lowHp,
    });
}

function getAttackCooldownMax(player, cfg) {
    if (player.heroClass === 'Hybrid') {
        const ms = player.stance === 'RANGED' ? cfg.ATTACK_SPEED_RANGED : cfg.ATTACK_SPEED_MELEE;
        return (ms ?? 500) / 1000;
    }
    return (cfg.ATTACK_SPEED ?? 500) / 1000;
}

function skillIconLabel(name, isBasic) {
    if (isBasic) return '⚔';
    const word = name.split(' ')[0] ?? name;
    return word.length > 7 ? `${word.slice(0, 6)}…` : word;
}

function skillShortLabel(name, isBasic) {
    if (isBasic) return 'Attack';
    return name;
}

export function flashAbilitySlot(slotId) {
    const el = slotEl(slotId);
    if (!el) return;
    el.classList.remove('cast-flash');
    void el.offsetWidth;
    el.classList.add('cast-flash');
    setTimeout(() => el.classList.remove('cast-flash'), 400);
}

function updateAbilitySlot(slotId, remaining, maxCd, name, key, isUlt = false, isBasic = false) {
    const el = slotEl(slotId);
    if (!el) return;

    const progress = maxCd > 0 ? Math.min(1, remaining / maxCd) : 0;
    const onCd = remaining > 0.05;

    el.classList.toggle('on-cooldown', onCd);
    el.classList.toggle('ready', !onCd);
    el.classList.toggle('ult', isUlt);
    el.classList.toggle('basic', isBasic);

    const ring = el.querySelector('.ability-cd-ring');
    if (ring) ring.style.setProperty('--cd-progress', String(progress));

    const timer = el.querySelector('.ability-timer');
    if (timer) timer.textContent = onCd ? remaining.toFixed(1) : '';

    const nameEl = el.querySelector('.ability-name');
    if (nameEl) nameEl.textContent = skillShortLabel(name, isBasic);

    const iconEl = el.querySelector('.ability-icon');
    if (iconEl) iconEl.textContent = skillIconLabel(name, isBasic);

    const keyEl = el.querySelector('.ability-key');
    if (keyEl) keyEl.textContent = key;

    const status = onCd ? `${name}, ${remaining.toFixed(1)}s cooldown` : `${name}, ready`;
    el.setAttribute('aria-label', status);
}

function updateBuffs(player, inBlight) {
    const container = $('hud-buffs');
    if (!container) return;

    const buffs = [];
    if (player.isShielded) buffs.push({ id: 'shield', label: 'Shield active', debuff: false });
    if (player.valhallaActive) buffs.push({ id: 'valhalla', label: 'Valhalla speed boost', debuff: false });
    if (player.heroClass === 'Hybrid' && player.stance === 'RANGED') {
        buffs.push({ id: 'stance', label: 'Ranged stance', debuff: false });
    }
    if (inBlight) buffs.push({ id: 'blight', label: 'Blight damage', debuff: true });

    container.replaceChildren(...buffs.map(b => {
        const node = document.createElement('div');
        node.className = `buff-icon${b.debuff ? ' debuff' : ''}`;
        node.setAttribute('role', 'img');
        node.setAttribute('aria-label', b.label);
        node.innerHTML = BUFF_SVGS[b.id] ?? '';
        return node;
    }));
}

function updateBlightPanel(blight, distToEdge, inBlight) {
    const el = $('hud-blight');
    if (!el || !blight) return;

    el.classList.remove('warning', 'danger');

    if (inBlight) {
        el.classList.add('danger');
        let status = el.querySelector('.blight-status');
        if (!status || el.querySelector('.blight-safe') || el.querySelector('.blight-distance')) {
            el.replaceChildren();
            status = document.createElement('div');
            status.className = 'blight-status';
            el.appendChild(status);
        }
        status.textContent = 'IN THE BLIGHT';
        return;
    }

    const dist = Math.max(0, Math.floor(distToEdge));
    const eta = blight.shrinkSpeed > 0 ? (dist / blight.shrinkSpeed).toFixed(0) : '—';
    if (dist < 300) el.classList.add('warning');

    let safe = el.querySelector('.blight-safe');
    let distance = el.querySelector('.blight-distance');
    if (!safe || !distance) {
        safe = document.createElement('div');
        safe.className = 'blight-safe';
        distance = document.createElement('div');
        distance.className = 'blight-distance';
        el.replaceChildren(safe, distance);
    }
    safe.textContent = 'Safe zone edge';
    distance.textContent = `${dist}m · ~${eta}s`;
}

export function showLevelUpFlash() {
    const el = $('level-up-flash');
    if (!el) return;
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 2000);
}

function _setText(id, val) {
    const el = $(id);
    if (el && el.textContent !== String(val)) el.textContent = val;
}

function _setStyle(id, prop, val) {
    const el = $(id);
    if (el && el.style[prop] !== val) el.style[prop] = val;
}
