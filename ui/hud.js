// ============================================================
// ui/hud.js
// HUD-uppdatering. Extraherat ur index.html.
// Läser från PlayerInstance och CooldownState via argument.
// ============================================================

const hudCache = {
    level: -1, gold: -1, xp: -1, hp: -1, maxHp: -1,
    aliveCreeps: -1, activeCamps: -1, qCd: -1, wCd: -1, eCd: -1,
};

export function markHudDirty() {
    Object.keys(hudCache).forEach(k => hudCache[k] = -1);
}

/**
 * @param {object} player       — PlayerInstance
 * @param {object} gameState    — { gold, xp }
 * @param {object} cooldowns    — CooldownState { q, w, e }
 * @param {number} aliveCreeps
 * @param {number} activeCamps
 * @param {number} xpPerLevel
 * @param {boolean} force
 */
export function updateHud(player, gameState, cooldowns, aliveCreeps, activeCamps, xpPerLevel, force = false) {
    const qR = Math.ceil(cooldowns.q * 10);
    const wR = Math.ceil(cooldowns.w * 10);
    const eR = Math.ceil(cooldowns.e * 10);

    if (!force &&
        hudCache.level === player.level &&
        hudCache.gold  === gameState.gold &&
        hudCache.xp    === gameState.xp &&
        hudCache.hp    === player.hp &&
        hudCache.maxHp === player.maxHp &&
        hudCache.aliveCreeps === aliveCreeps &&
        hudCache.activeCamps === activeCamps &&
        hudCache.qCd === qR && hudCache.wCd === wR && hudCache.eCd === eR) {
        return;
    }

    const qStatus = cooldowns.q > 0 ? `${cooldowns.q.toFixed(1)}s` : 'Ready';
    const wStatus = cooldowns.w > 0 ? `${cooldowns.w.toFixed(1)}s` : 'Ready';
    const eStatus = cooldowns.e > 0 ? `${cooldowns.e.toFixed(1)}s` : 'Ready';

    _set('hud-cooldowns', `[1] ${qStatus} · [2] ${wStatus} · [3] ${eStatus}`);
    _set('player-level', player.level);
    _set('player-gold',  gameState.gold);
    _set('xp-text',     `${gameState.xp}/${xpPerLevel}`);
    _style('xp-bar',    'width', `${(gameState.xp / xpPerLevel) * 100}%`);
    _style('health-bar','width', `${(player.hp / player.maxHp) * 100}%`);
    _set('creeps-count', activeCamps);
    _set('alive-counter', aliveCreeps);

    Object.assign(hudCache, {
        level: player.level, gold: gameState.gold, xp: gameState.xp,
        hp: player.hp, maxHp: player.maxHp,
        aliveCreeps, activeCamps, qCd: qR, wCd: wR, eCd: eR,
    });
}

export function showLevelUpFlash() {
    const el = document.getElementById('level-up-flash');
    if (!el) return;
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 2000);
}

function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function _style(id, prop, val) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = val;
}
