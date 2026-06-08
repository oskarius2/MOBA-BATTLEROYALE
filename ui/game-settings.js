// ============================================================
// ui/game-settings.js
// Runtime settings toggled from the menu settings panel.
// ============================================================

export const gameSettings = {
    masterVolume:  true,
    screenShake:   true,
    damageNumbers: true,
};

export function isDamageNumbersEnabled() {
    return gameSettings.damageNumbers;
}

export function isScreenShakeEnabled() {
    return gameSettings.screenShake;
}

export function isMasterVolumeEnabled() {
    return gameSettings.masterVolume;
}

/**
 * @param {'masterVolume'|'screenShake'|'damageNumbers'} key
 * @param {boolean} enabled
 */
export function setGameSetting(key, enabled) {
    if (key in gameSettings) gameSettings[key] = enabled;
}
