# Sprite sheet format (MOBA Battle Royale)

The engine reads `assets/manifest.json` and expects **baked action sheets**, not raw animation exports.

## Why current PNGs look broken

Your files (e.g. `heroes/warrior.png` at 768×512) pass the old “minimum size” check but are actually **~32px directional animation dumps** on a black background. The renderer slices them as **128×128** cells (6×4 grid), so each “frame” shows several tiny characters at once.

Until sheets match this spec, the game automatically falls back to **procedural** `drawHero*` / `drawCreepModel` art (see browser console: `[SpriteSheetManager] … rejected`).

## Hero sheets

| Property | Value |
|----------|--------|
| Path | `assets/heroes/{warrior,mage,ranger,viking,hybrid}.png` |
| Frame size | **128×128 px** |
| Columns | **6** (one walk/attack cycle) |
| Rows | **4** — row 0 idle, 1 walk, 2 attack, 3 transition |
| Hybrid | **8 rows** — rows 0–3 MELEE, 4–7 RANGED (same action order) |
| Canvas size | 768×512 (768×1024 for Hybrid) |
| Background | **Transparent PNG** (not black JPEG export) |
| Content | **One character per cell**, feet near bottom-centre of cell |

## Creep sheets

| Property | Value |
|----------|--------|
| Path | `assets/creeps/{scout,warrior,ancient}.png` |
| Frame size | **96×96 px** |
| Columns | **4** |
| Rows | **4** (idle / walk / attack / transition) |
| Canvas size | **384×384** exactly |

## Baking checklist

1. Export one character per frame at the target cell size.
2. Arrange rows by **action**, not by compass direction (engine picks frame index from time, not facing row).
3. Use alpha transparency; avoid `#000000` fills (black is chroma-keyed on load but proper alpha is better).
4. Reload the game — console should show no `rejected` warnings and procedural art will turn off.

## JPG files in `assets/heroes/`

UUID/watermarked JPGs are **not referenced** by `manifest.json` and are ignored. Only the PNG paths in the manifest are loaded.
