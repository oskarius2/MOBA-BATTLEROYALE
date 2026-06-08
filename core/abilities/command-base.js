/**
 * @file command-base.js
 * Abstract base class for all ability commands.
 */

import { normalizePointer, clampMapCoord, clampPlayerPosition } from './utils.js';

export class AbilityCommand {
    execute(player, pointerWorld, context, config) {
        throw new Error('execute() must be implemented by subclass');
    }

    _getAimAngle(player, ptr) {
        const p = normalizePointer(ptr);
        const dx = p.worldX - player.x;
        const dy = p.worldY - player.y;
        if (Math.hypot(dx, dy) < 1) return player.facingAngle ?? 0;
        return Math.atan2(dy, dx);
    }

    _movePlayerByVector(player, distance, angle) {
        const next = clampPlayerPosition(
            player,
            player.x + Math.cos(angle) * distance,
            player.y + Math.sin(angle) * distance
        );
        player.x = next.x;
        player.y = next.y;
        return next;
    }

    _teleportPlayer(player, x, y) {
        const next = clampPlayerPosition(player, x, y);
        player.x = next.x;
        player.y = next.y;
        return next;
    }

    _syncEffectToPlayer(effect, player) {
        effect.x = player.x;
        effect.y = player.y;
    }

    _clampMapCoord(value) {
        return clampMapCoord(value);
    }

    _normalizePointer(pointerWorld) {
        return normalizePointer(pointerWorld);
    }
}
