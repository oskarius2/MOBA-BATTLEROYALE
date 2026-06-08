#!/usr/bin/env python3
"""Bake JPG source spritesheets into spec-sized PNGs for assets/manifest.json.

Does not delete sources. Overwrites heroes/*.png and creeps/*.png targets only.
"""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit('Install Pillow: pip install pillow')

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'

HERO_TARGETS = {
    'warrior.png': ('heroes/watermarked_img_13228795930869720989.jpg', 768, 512),
    'ranger.png': ('heroes/959fbeca-37fe-481f-b89f-3d8a5662749a.jpg', 768, 512),
    'viking.png': ('heroes/5744e91c-bf99-4d99-bf00-1374156920c8.jpg', 768, 512),
    'mage.png': ('heroes/watermarked_img_13178481383848877501.jpg', 768, 512),
    'hybrid.png': ('heroes/3da63731-b5e5-4da6-a026-8d52dcc116ca.jpg', 768, 1024),
}

CREEP_TARGETS = {
    'scout.png': ('creeps/1aec59f2-f290-41b6-8fbd-b1f9932e3d6d.jpg', 384, 384),
    'warrior.png': ('creeps/924a6566-ef9b-4b45-a540-82270136c90b.jpg', 384, 384),
    'ancient.png': ('creeps/9baddc46-c58e-400e-8658-fc6d383c5fb3.jpg', 384, 384),
}


def key_checkerboard(im: Image.Image) -> Image.Image:
    """Turn neutral gray checkerboard pixels transparent (JPG has no alpha)."""
    rgba = im.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            spread = max(abs(r - g), abs(g - b), abs(r - b))
            avg = (r + g + b) / 3
            if spread <= 18 and 85 <= avg <= 215:
                px[x, y] = (r, g, b, 0)
    return rgba


def bake(src_rel: str, out_path: Path, width: int, height: int) -> None:
    src = ASSETS / src_rel
    if not src.exists():
        raise FileNotFoundError(src)
    im = Image.open(src)
    im = key_checkerboard(im)
    im = im.resize((width, height), Image.Resampling.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, 'PNG', optimize=True)
    print(f'OK  {out_path.relative_to(ROOT)}  <=  {src_rel}  ({width}x{height})')


def main() -> None:
    for name, (src, w, h) in HERO_TARGETS.items():
        bake(src, ASSETS / 'heroes' / name, w, h)
    for name, (src, w, h) in CREEP_TARGETS.items():
        bake(src, ASSETS / 'creeps' / name, w, h)
    print('Done — reload game with useSprites:true in manifest.json')


if __name__ == '__main__':
    main()
