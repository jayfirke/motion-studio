#!/usr/bin/env python3
"""Lay a maker's dimensional drawing (red lines) over an orthographic render of your model, at the same scale.

python3 drawing_overlay.py --render front.png --render-ppmm 6 --drawing sheet1.png --drawing-ppmm 8.643 \
    --match DX,DY:RX,RY [--box X0,Y0,X1,Y1] [--zoom X0,Y0,X1,Y1 ...] [--ink 150] --out overlay.png

--render        an orthographic render at a known scale (px per mm), the view laid out like the drawing's
--drawing       one sheet of the drawing rasterized (e.g. `pdftoppm -r 300 -png drawing.pdf sheet`)
--drawing-ppmm  that sheet's scale: measure it from a dimensioned length (sheets of one PDF can differ)
--match         the same physical point (e.g. the top-left of the body's bounding box) in drawing px : render px
--box           the render region to check (default: the whole render)
--zoom          extra crops (render px, inside --box) saved 3x larger as <out>-zoomN.png: corners, cutout, lenses
Every drawing line should sit on the model's edge: within 1 px at 6 px/mm is 0.17 mm. Keep the drawing and the
overlays local; they are the maker's copyright. Needs Pillow and numpy.
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("--render", required=True)
ap.add_argument("--render-ppmm", type=float, required=True)
ap.add_argument("--drawing", required=True)
ap.add_argument("--drawing-ppmm", type=float, required=True)
ap.add_argument("--match", required=True, help="DX,DY:RX,RY")
ap.add_argument("--box", default=None, help="X0,Y0,X1,Y1 in render px")
ap.add_argument("--zoom", action="append", default=[], help="X0,Y0,X1,Y1 in render px (repeatable)")
ap.add_argument("--ink", type=int, default=150, help="drawing pixels darker than this are lines (default 150)")
ap.add_argument("--dim", type=float, default=0.55, help="darken the render under the lines (default 0.55)")
ap.add_argument("--out", required=True)
a = ap.parse_args()

ren = Image.open(a.render).convert("RGB")
drw = Image.open(a.drawing).convert("L")
(dx, dy), (rx, ry) = [tuple(map(float, p.split(","))) for p in a.match.split(":")]
x0, y0, x1, y1 = map(int, a.box.split(",")) if a.box else (0, 0, ren.width, ren.height)
k = a.render_ppmm / a.drawing_ppmm  # render px per drawing px

# drawing region that maps onto the render box (pad with white where it runs off the sheet)
sx0, sy0 = dx + (x0 - rx) / k, dy + (y0 - ry) / k
sx1, sy1 = dx + (x1 - rx) / k, dy + (y1 - ry) / k
ix0, iy0, ix1, iy1 = int(round(sx0)), int(round(sy0)), int(round(sx1)), int(round(sy1))
sheet = Image.new("L", (ix1 - ix0, iy1 - iy0), 255)
sheet.paste(drw.crop((max(ix0, 0), max(iy0, 0), min(ix1, drw.width), min(iy1, drw.height))), (max(-ix0, 0), max(-iy0, 0)))
lines = np.array(sheet.resize((x1 - x0, y1 - y0), Image.LANCZOS)) < a.ink

out = np.array(ren.crop((x0, y0, x1, y1))).astype(float) * a.dim
out[lines] = [255, 40, 40]
img = Image.fromarray(out.astype(np.uint8))
img.save(a.out)
print(f"{a.out}: {x1 - x0}x{y1 - y0} px, {int(lines.sum())} line pixels, scale {k:.4f} render px per drawing px")
stem = Path(a.out)
for i, z in enumerate(a.zoom, 1):
    zx0, zy0, zx1, zy1 = map(int, z.split(","))
    crop = img.crop((zx0 - x0, zy0 - y0, zx1 - x0, zy1 - y0))
    p = stem.with_name(f"{stem.stem}-zoom{i}{stem.suffix}")
    crop.resize((crop.width * 3, crop.height * 3), Image.LANCZOS).save(p)
    print(f"{p}: zoom of {z}")
