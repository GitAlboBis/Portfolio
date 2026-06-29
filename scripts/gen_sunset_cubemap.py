"""
Generate a SEAMLESS sunset cubemap (6 x 512x512 RGBA PNG faces) for the water hero
to reflect/refract. Color is a pure function of the 3D view direction, so adjacent
face edges map to identical directions -> no seams. Palette = Golden Hour tokens.

Faces written: posx,negx,posy,negy,posz,negz  (matches WaterBallHero loader order).
Output dir is argv[1] (default /tmp/cubegen).
"""
import sys, os
import numpy as np
from PIL import Image

N = 512
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/cubegen"
os.makedirs(OUT, exist_ok=True)

# ---- palette (linear-ish sRGB 0..1) -------------------------------------------------
def rgb(h): return np.array([int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)])
ZENITH      = rgb("4a4470")   # deep twilight violet-blue (cool top)
UPPER       = rgb("8d5a86")   # mauve mid sky
ROSE        = rgb("e1768a")   # sunset rose
HORIZON     = rgb("ff9e63")   # warm coral horizon
HORIZON_HOT = rgb("ffd9a0")   # bright band right at the horizon
SUN_CORE    = rgb("fff3d8")   # near-white warm sun
SUN_GLOW    = rgb("ff7a3c")   # ember halo
SEA_NEAR    = rgb("b85f4e")   # warm reflected horizon on the water/ground
SEA_DEEP    = rgb("241526")   # deep warm night below

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def mix(a, b, t):
    # a,b shape (3,), t shape (H,W) -> (H,W,3)
    t = t[..., None]
    return a * (1.0 - t) + b * t

# sun: low on the horizon, azimuth toward -Z (slightly +X)
SUN = np.array([0.32, 0.11, -0.94]); SUN /= np.linalg.norm(SUN)

def sky(dx, dy, dz):
    L = np.sqrt(dx*dx + dy*dy + dz*dz)
    dx, dy, dz = dx/L, dy/L, dz/L
    y = dy
    H, W = y.shape

    # --- above horizon: horizon warm -> rose -> mauve -> violet zenith ---
    col = mix(HORIZON, ROSE, smooth(0.0, 0.22, y))
    col = mix(col, UPPER, smooth(0.12, 0.5, y))
    col = mix(col, ZENITH, smooth(0.4, 1.0, y))

    # --- below horizon: warm sea near -> deep night down ---
    below = mix(SEA_NEAR, SEA_DEEP, smooth(0.0, -0.55, y))
    col = np.where((y < 0)[..., None], below, col)

    # --- bright atmospheric band hugging the horizon (both sides) ---
    hb = np.power(1.0 - np.minimum(np.abs(y), 1.0), 10.0) * 0.55
    col = mix(col, HORIZON_HOT, hb)

    # --- sun halo + disk ---
    d = np.clip(dx*SUN[0] + dy*SUN[1] + dz*SUN[2], 0.0, 1.0)
    halo = np.power(d, 5.0) * 0.85
    col = mix(col, SUN_GLOW, halo)
    halo2 = np.power(d, 60.0)
    col = mix(col, SUN_CORE, halo2)
    disk = smooth(0.9975, 0.9990, d)
    col = mix(col, SUN_CORE, disk)

    return np.clip(col, 0.0, 1.0)

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
    col = sky(dx, dy, dz)
    img = (col * 255.0 + 0.5).astype(np.uint8)
    rgba = np.dstack([img, np.full((N, N, 1), 255, np.uint8)])
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"{name}.png"))
    print("wrote", name)

print("done ->", OUT)
