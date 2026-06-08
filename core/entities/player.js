// ============================================================
// core/entities/player.js
// Extraherat ur index.html.
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../data/world-config.js';
import { getLevelUpGrowth }            from '../../data/hero-roster.js';
import { resolveFacingAngle,
         drawHeroWarrior, drawHeroMage,
         drawHeroRanger,  drawHeroViking,
         drawHeroHybrid } from '../canvas-renderer.js';
import { CharacterSpriteModel } from '../rendering/character-sprite-model.js';
import { SpriteSheetManager } from '../rendering/sprite-sheet-manager.js';
import { USE_SPRITE_RENDERING } from '../rendering/render-config.js';
import { emitDamageNumber } from '../damage-events.js';
import { triggerScreenShake } from '../camera.js';

const HERO_RENDERERS = {
    'Warrior':    drawHeroWarrior,
    'Mage':       drawHeroMage,
    'Ranger':     drawHeroRanger,
    'Tank-Viking':drawHeroViking,
    'Hybrid':     drawHeroHybrid,
};

export class Player {
    constructor(x, y) {
        this.x                = x;
        this.y                = y;
        this.radius           = 25;
        this.hp               = 100;
        this.maxHp            = 100;
        this.speed            = 4;
        this.level            = 1;
        this.projectileDamage = 20;
        this.skills           = { skill1: '', skill2: '', ult: '' };
        this.heroTitle        = '';
        this.heroRole         = '';
        this.heroKey          = 'mage';
        this.heroClass        = 'Mage';
        this.stance           = 'MELEE';
        this.isShielded       = false;
        this.baseSpeed        = 4;
        this.speedModifier    = 1.0;
        this.attackTimer      = 0;
        this.valhallaActive   = false;
        this.valhallaRefCount = 0;
        this.vx               = 0;
        this.vy               = 0;
        this.facingAngle      = 0;
        // Callbacks injiceras av game-init
        this.onLevelUp   = null;   // () => void
        this.onDeath     = null;   // () => void
        this.getPointer  = null;   // () => {x, y}
        // Sprite system
        this._spriteModel = null;
        this.id = 'player';
    }

    get isAlive() {
        return this.hp > 0;
    }

    update(keys, deltaTime = 16) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup'])    dy -= 1;
        if (keys['s'] || keys['arrowdown'])  dy += 1;
        if (keys['a'] || keys['arrowleft'])  dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        const mag       = Math.sqrt(dx * dx + dy * dy);
        const moveSpeed = this.speed * (this.speedModifier ?? 1);
        if (mag > 0) {
            this.vx = (dx / mag) * moveSpeed;
            this.vy = (dy / mag) * moveSpeed;
            this.x += this.vx;
            this.y += this.vy;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH  - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.y));

        const ptr = this.getPointer?.() ?? { x: this.x, y: this.y };
        const aimAngle = Math.atan2(ptr.y - this.y, ptr.x - this.x);
        this.facingAngle = resolveFacingAngle(this.vx, this.vy, aimAngle);

        this.updateVisuals(deltaTime);
    }

    updateVisuals(deltaTime = 16) {
        if (USE_SPRITE_RENDERING && this._spriteModel?.isReady()) {
            this._spriteModel.update(deltaTime, performance.now());
        }
    }

    initializeSprites() {
        if (!USE_SPRITE_RENDERING) {
            this._spriteModel = null;
            return;
        }
        const sheetMgr = SpriteSheetManager.getInstance();
        if (sheetMgr.isReady('hero', this.heroClass)) {
            this._spriteModel = new CharacterSpriteModel(this, sheetMgr);
        } else {
            this._spriteModel = null;
        }
    }

    takeDamage(amount, damageType = 'physical') {
        if (this.hp <= 0) return;
        const finalDamage = this.isShielded ? amount * 0.3 : amount;
        if (finalDamage > 0) {
            emitDamageNumber(this.x, this.y - this.radius, finalDamage, damageType);
            triggerScreenShake(Math.min(12, 3 + finalDamage * 0.15));
        }
        this.hp = Math.max(0, this.hp - finalDamage);
        if (this.hp <= 0 && this.onDeath) this.onDeath();
    }

    levelUp() {
        this.level += 1;
        const growth = getLevelUpGrowth(this.heroClass);
        this.maxHp            += growth.hp;
        this.projectileDamage  = (this.projectileDamage ?? 20) + growth.damage;
        this.hp                = this.maxHp;
        this.baseSpeed         = (this.baseSpeed ?? this.speed) + growth.speed;
        this.speed             = this.valhallaActive
            ? this.baseSpeed * 1.4
            : this.baseSpeed;
        if (this.onLevelUp) this.onLevelUp();
    }

    draw(ctx, camera, time = 0) {
        const screenX  = this.x - camera.x;
        const screenY  = this.y - camera.y;

        if (USE_SPRITE_RENDERING && this._spriteModel?.isReady()) {
            this._spriteModel.draw(ctx, screenX, screenY, time);
            return;
        }
        const speed = Math.hypot(this.vx, this.vy);
        const rendererFn = HERO_RENDERERS[this.heroClass] ?? drawHeroMage;
        rendererFn(ctx, screenX, screenY, this.facingAngle, speed, time);
    }
}
