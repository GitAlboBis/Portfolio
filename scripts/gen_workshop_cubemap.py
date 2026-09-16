"""
Generate a SEAMLESS workshop cubemap (6 x 512x512 RGBA PNG faces) for the test-bench
fluid to reflect/refract (REDESIGN-SPEC §F.4). Fork of gen_sunset_cubemap.py: colour
is a pure function of the 3D view direction, so adjacent face edges map to identical
directions -> no seams. The scene: a steel bench under fluorescent tubes at 10 a.m.

  walls    neutral grey #8d8d88 with one faint horizontal seam at eye level
  ceiling  +Y  #b9b9b4 with two tube strips #f2f4f8 (6% of the face, 8px falloff)
  floor    -Y  #4f4f4c
  no sun disc, no sky gradient

Faces written: posx,negx,posy,negy,posz,negz  (matches the WaterBallHero loader order).
Output dir is argv[1] (default public/cubemap next to this repo root).

    python scripts/gen_workshop_cubemap.py public/cubemap
"""
import sys, os
import numpy as np
from PIL import Image

N = 512
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "public", "cubemap")
os.makedirs(OUT, exist_ok=True)

# ---- palette (sRGB 0..1) -----------------------------------------------------------
def rgb(h): return np.array([int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)])
WALL     = rgb("8d8d88")   # neutral grey walls
SEAM     = rgb("7c7c77")   # the faint horizontal joint in the wall panels
CEILING  = rgb("b9b9b4")   # lit ceiling
TUBE     = rgb("f2f4f8")   # fluorescent tube strips (cool white)
FLOOR    = rgb("4f4f4c")   # dark floor

# tube geometry, in +Y face units ([-1,1] across the face)
TUBE_HALF_WIDTH = 0.06          # 6% of the face = 0.12 wide -> half 0.06
TUBE_FALLOFF    = 8.0 / N * 2.0 # 8px of a 512px face, in face units
TUBE_POSITIONS  = (-0.42, 0.42) # two parallel strips, running along the face's u axis

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def mix(a, b, t):
    # a,b shape (3,), t shape (H,W) -> (H,W,3)
    t = t[..., None]
    return a * (1.0 - t) + b * t

def workshop(dx, dy, dz):
    L = np.sqrt(dx*dx + dy*dy + dz*dz)
    dx, dy, dz = dx/L, dy/L, dz/L
    y = dy

    # A cube room seen from its centre: a direction lands on the ceiling when +Y
    # dominates both X and Z, on the floor when -Y dominates. Blending over a narrow
    # band keeps the corner soft (no aliased edge on the reflection).
    m = np.maximum(np.abs(dx), np.abs(dz))
    ceiling_t = smooth(0.92, 1.08, y / np.maximum(m, 1e-6))
    floor_t   = smooth(0.92, 1.08, -y / np.maximum(m, 1e-6))

    col = np.broadcast_to(WALL, y.shape + (3,)).copy()

    # faint horizontal seam at eye level (a panel joint), a couple of px wide
    seam = 1.0 - smooth(0.004, 0.012, np.abs(y))
    col = mix_arr(col, SEAM, seam * 0.6)

    col = mix_arr(col, CEILING, ceiling_t)
    col = mix_arr(col, FLOOR, floor_t)

    # two fluorescent tubes on the ceiling face: strips at v = ±0.42 across the
    # +Y face (u = x/y, v = z/y), soft 8px falloff; they end at the wall edge.
    yy = np.maximum(y, 1e-6)
    u = dx / yy
    v = dz / yy
    inside = ((np.abs(u) <= 1.0) & (np.abs(v) <= 1.0) & (y > 0)).astype(np.float64)
    tube = np.zeros_like(y)
    for v0 in TUBE_POSITIONS:
        d = np.abs(v - v0)
        strip = 1.0 - smooth(TUBE_HALF_WIDTH - TUBE_FALLOFF, TUBE_HALF_WIDTH + TUBE_FALLOFF, d)
        tube = np.maximum(tube, strip)
    tube = tube * inside * ceiling_t
    col = mix_arr(col, TUBE, tube)

    return np.clip(col, 0.0, 1.0)

def mix_arr(col, b, t):
    t = t[..., None]
    return col * (1.0 - t) + b * t

# pixel grid -> [-1,1], v points UP (flip image row)
i = (np.arange(N) + 0.5) / N * 2.0 - 1.0
uc, vrow = np.meshgrid(i, i)
vc = -vrow  # top row -> +1

# standard seamless cube face direction basis (right=u, up=v)
FACES = {
    "posx": ( np.ones_like(uc),  vc,            -uc),
    "negx": (-np.ones_like(uc),  vc,             uc),
    "posy": ( uc,                np.ones_like(uc), vc),
    "negy": ( uc,               -np.ones_like(uc), -vc),
    "posz": ( uc,                vc,             np.ones_like(uc)),
    "negz": (-uc,                vc,            -np.ones_like(uc)),
}

for name, (dx, dy, dz) in FACES.items():
    col = workshop(dx, dy, dz)
    img = (col * 255.0 + 0.5).astype(np.uint8)
    rgba = np.dstack([img, np.full((N, N, 1), 255, np.uint8)])
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"{name}.png"), optimize=True)
    print("wrote", name)

print("done ->", OUT)
