# Sprite Asset Specification — MOBA Battle Royale

Engineering-owned reference for artists. Do not invent new paths, formats, or code files.

---

## What to deliver

**8 PNG spritesheet files only.** Place them at the exact paths below.

Do **not** deliver:
- New HTML, JavaScript, or CSS files
- Admin UI, debug panels, or standalone demos
- New folders (e.g. `assets/sprites/`)
- Single-row placeholder sheets (colored circles)
- WebP or other formats

---

## Renderer & pipeline

| Item | Value |
|------|-------|
| Technology | **HTML5 Canvas 2D** only |
| Draw API | `ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` |
| Rotation | Sprites are rotated at runtime to face movement/aim |
| Not used | WebGL, Phaser, Babylon.js, texture atlases |

Load chain:

```
assets/manifest.json → SpriteSheetManager → getFrame() → drawImage()
```

---

## The 8 files

### Category A — Playable heroes (5 files)

| File | Character | Sheet size | Cell size | Grid |
|------|-----------|------------|-----------|------|
| `assets/heroes/warrior.png` | Warrior | 768 × 512 | 128 × 128 | 6 cols × 4 rows |
| `assets/heroes/mage.png` | Mage | 768 × 512 | 128 × 128 | 6 cols × 4 rows |
| `assets/heroes/ranger.png` | Ranger | 768 × 512 | 128 × 128 | 6 cols × 4 rows |
| `assets/heroes/viking.png` | Tank-Viking | 768 × 512 | 128 × 128 | 6 cols × 4 rows |
| `assets/heroes/hybrid.png` | Hybrid | **768 × 1024** | 128 × 128 | 6 cols × 8 rows |

**Row layout (standard heroes, rows 0–3):**

| Row | Action | Frames (columns 0 → N) |
|-----|--------|------------------------|
| 0 | idle | 6 |
| 1 | walk | 6 |
| 2 | attack | 6 |
| 3 | transition | 6 |

**Hybrid only (8 rows):**

| Row | Stance | Action |
|-----|--------|--------|
| 0–3 | MELEE | idle / walk / attack / transition |
| 4–7 | RANGED | idle / walk / attack / transition |

Note: engine may use row 0 for ranged idle today — keep row 0 and row 4 as usable idle poses.

### Category B — Jungle creeps (3 files)

| File | Type | Sheet size | Cell size | Grid |
|------|------|------------|-----------|------|
| `assets/creeps/scout.png` | Scout | 384 × 384 | 96 × 96 | 4 × 4 |
| `assets/creeps/warrior.png` | Warrior creep | 384 × 384 | 96 × 96 | 4 × 4 |
| `assets/creeps/ancient.png` | Ancient | 384 × 384 | 96 × 96 | 4 × 4 |

**Row layout (all creeps):**

| Row | Action | Frames (columns 0 → 3) |
|-----|--------|------------------------|
| 0 | idle | 4 |
| 1 | walk | 4 |
| 2 | attack | 4 |
| 3 | transition | 4 |

---

## What these sheets are NOT

Character/monster **body sprites only**. Not:

- UI icons or HUD elements
- Skill/ability VFX
- Projectiles
- Map/background tiles

Those are drawn separately in code.

---

## Grid & indexing rules

- **Fixed uniform grid** — every frame same size within a sheet
- **No variable frame sizes**, no packed/irregular layouts
- **Minimum dimensions enforced** — undersized sheets are rejected; game uses procedural fallback art

Frame lookup:

```
column = frameIndex % framesPerAction
row    = action row (idle=0, walk=1, attack=2, transition=3)
         Hybrid RANGED: +4 rows for walk/attack/transition

sx = column × frameSize
sy = row × frameSize
sw = sh = frameSize
```

---

## Metadata (`assets/manifest.json`)

Manifest lists per entry:
- `sheet` — file path
- `frameSize` — cell size in pixels
- `framesPerAction` — columns per row
- `stances` — Hybrid only (`["MELEE", "RANGED"]`)
- `useSprites` — global on/off (set `true` when real art ships, then reload page)

**Hardcoded in JS (not per-sheet in manifest):**

| Parameter | Value | File |
|-----------|-------|------|
| Animation FPS | 10 | `core/rendering/render-config.js` |
| Stance transition | 300 ms | same |
| Hero draw scale | 0.55 (~70 px on screen) | `character-sprite-model.js` |
| Creep draw scale | 0.45 (~43 px on screen) | `creep-sprite-model.js` |

No per-frame timing JSON. No collision maps in sprites. Collision uses `radius` from game data, not sprite pixels.

---

## File format & alpha

| Requirement | Detail |
|-------------|--------|
| Format | **PNG only** |
| Alpha | Transparent background per frame (PNG-24 + alpha) |
| WebP | Not supported |
| Compression | No enforced limit; keep files reasonable for local load |

---

## Activation

1. Drop PNG files at paths above
2. Set `"useSprites": true` in `assets/manifest.json`
3. Reload the browser (no hot-swap)

Until sheets pass dimension validation, keep `useSprites: false`.

---

## Current placeholders (wrong — replace, do not copy)

| Category | Current size | Required size |
|----------|--------------|---------------|
| Heroes | 768 × 128 (1 row, circles) | 768 × 512 |
| Creeps | 384 × 96 (1 row, circles) | 384 × 384 |
| Hybrid | 768 × 128 | 768 × 1024 |

---

## Handoff checklist

- [ ] Exactly 8 PNG files, correct paths
- [ ] Hero sheets 768×512 (Hybrid 768×1024)
- [ ] Creep sheets 384×384
- [ ] Fixed grid, row order idle → walk → attack → transition
- [ ] PNG with alpha, transparent cell backgrounds
- [ ] No new code or HTML files
