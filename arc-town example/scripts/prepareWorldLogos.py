"""Prepare Circle + Arc logos for world map decoration."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "assets" / "logos"
BUNDLE = ROOT / "assets" / "logos"
CURSOR_ASSETS = Path(
    r"C:\Users\Omen\.cursor\projects\c-Users-Omen-Desktop-eliza-town-main\assets"
)

CIRCLE_SRC = next(CURSOR_ASSETS.glob("*circle-logo-5c233b2f*.png"))


def ensure_dirs() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    BUNDLE.mkdir(parents=True, exist_ok=True)


def save_both(img: Image.Image, name: str) -> None:
    img.save(PUBLIC / name)
    img.save(BUNDLE / name)


def process_circle() -> None:
    im = Image.open(CIRCLE_SRC).convert("RGBA")
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    save_both(im, "circle.png")

    # Icon only (left mark) — better for small map plaques.
    h = im.height
    icon = im.crop((0, 0, min(h + 24, im.width), h))
    icon_bbox = icon.getbbox()
    if icon_bbox:
        icon = icon.crop(icon_bbox)
    save_both(icon, "circle-icon.png")
    print("circle", im.size, "icon", icon.size)


def create_arc_logo() -> None:
    """
    The uploaded Arc_Logo_Black file is solid black / unusable.
    Build a clean Arc wordmark + curve mark that reads on grass.
    """
    w, h = 320, 96
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Soft plaque so logos read on bright grass.
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=14, fill=(18, 16, 28, 210))

    cx, cy, r = 46, 50, 30
    pts = []
    for i in range(0, 200, 2):
        ang = math.radians(210 - i)
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang) * 0.95))
    d.line(pts, fill=(255, 255, 255, 255), width=7)
    # Inner accent
    pts2 = [(x * 0.92 + cx * 0.08, y * 0.92 + cy * 0.08) for x, y in pts[8:-8]]
    if len(pts2) > 1:
        d.line(pts2, fill=(140, 200, 255, 255), width=3)

    font = None
    for fp in (
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ):
        try:
            font = ImageFont.truetype(fp, 52)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    d.text((86, 18), "Arc", font=font, fill=(255, 255, 255, 255))
    save_both(img, "arc.png")

    # Compact mark-only version
    mark = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    md = ImageDraw.Draw(mark)
    md.ellipse((4, 4, 60, 60), fill=(18, 16, 28, 210))
    mpts = []
    for i in range(0, 200, 2):
        ang = math.radians(210 - i)
        mpts.append((32 + 20 * math.cos(ang), 34 + 19 * math.sin(ang) * 0.95))
    md.line(mpts, fill=(255, 255, 255, 255), width=5)
    save_both(mark, "arc-icon.png")
    print("arc", img.size, "mark", mark.size)


def main() -> None:
    ensure_dirs()
    process_circle()
    create_arc_logo()
    print("done", sorted(p.name for p in PUBLIC.iterdir()))


if __name__ == "__main__":
    main()
