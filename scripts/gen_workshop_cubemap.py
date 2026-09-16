"""
Generate a SEAMLESS workshop cubemap (6 x 512x512 RGBA PNG faces) for the test-bench
fluid to reflect/refract (REDESIGN-SPEC §F.4). Fork of gen_sunset_cubemap.py: colour
is a pure function of the 3D view direction, so adjacent face edges map to identical
directions -> no seams. The scene: a steel bench under fluorescent tubes at 10 a.m.

WP-3b — the first version of this file painted a nearly UNIFORM grey box (walls
#8d8d88 everywhere, ceiling #b9b9b4, two hairline tubes). A fluid that refracts and
reflects a flat environment has nothing to show: the body read as a flat mustard blob.
This version gives the room a real VALUE RANGE — the thing the rejected Golden Hour
version got for free from a sunset:

  floor    -Y  #3c3c3a  dark, so downward-facing surfaces go dark
  walls        vertical ramp #55554f (at the floor) -> #90908a (at the ceiling),
               with the faint panel seam at eye level kept
  ceiling  +Y  #b4b4ae, carrying TWO elongated tube fixtures: a near-white core
               (#f4f6fa, 5% of the face) inside a WIDE soft halo (#d2d4d8, 26%),
               so a reflection of a tube is a soft elongated streak, not a hairline
  bank     +Z  one brighter wall panel (#e8eaee) behind the camera, offset to screen
               LEFT and slightly up -> the front faces of the letter catch a strong
               ASYMMETRIC wet highlight (the key glint in fluid.wgsl comes from the
               opposite side, +X, so the two do not stack into one flat sheen)

Strictly neutral: every colour above is grey (R=G=B within a point or two). The warmth
of the image comes from the OIL, never from a coloured light.

Faces written: posx,negx,posy,negy,posz,negz  (matches the WaterBallHero loader order).
Also writes a contact sheet (all six faces in a cross) so the environment can be LOOKED
AT before it is used: <OUT>/../../.shots/wp3b/cubemap-contact.png, or argv[2].

    python scripts/gen_workshop_cubemap.py public/cubemap
"""
import sys, os
import numpy as np
from PIL import Image

N = 512
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "public", "cubemap")
SHEET = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(__file__), "..", ".shots", "wp3b", "cubemap-contact.png"
)
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.dirname(SHEET), exist_ok=True)

# ---- palette (sRGB 0..1) -----------------------------------------------------------
def rgb(h): return np.array([int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)])
WALL_LOW  = rgb("55554f")   # wall where it meets the floor
WALL_HIGH = rgb("90908a")   # wall where it meets the ceiling
SEAM      = rgb("46463f")   # the faint horizontal joint in the wall panels
CEILING   = rgb("b4b4ae")   # lit ceiling
TUBE      = rgb("f4f6fa")   # fluorescent tube core (cool white)
TUBE_HALO = rgb("d2d4d8")   # the diffuser glow around each fixture
FLOOR     = rgb("3c3c3a")   # dark floor
BANK      = rgb("e8eaee")   # the light bank on the +Z wall (behind the camera)

# tube geometry, in +Y face units ([-1,1] across the face)
TUBE_CORE_HALF  = 0.05   # bright core half-width
TUBE_CORE_SOFT  = 0.02   # core falloff
TUBE_HALO_HALF  = 0.26   # diffuser halo half-width
TUBE_HALO_SOFT  = 0.20   # halo falloff (very soft -> the streak reads as a sheen)
TUBE_HALO_AMT   = 0.62   # how far the halo pushes toward TUBE_HALO
TUBE_POSITIONS  = (-0.44, 0.40)  # two parallel strips, running along the face's u axis

# light bank on the +Z wall, in +Z face units (u = dx/dz right, v = dy/dz up)
BANK_U, BANK_V  = -0.34, 0.18   # offset to screen LEFT and slightly up -> asymmetric
BANK_HU, BANK_HV = 0.50, 0.40   # half extents
BANK_SOFT       = 0.26          # edge falloff
BANK_AMT        = 1.0

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def mix_arr(col, b, t):
    t = t[..., None]
    return col * (1.0 - t) + b * t

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

    # ---- walls: a vertical ramp, dark at the skirting, bright under the ceiling ----
    # height on the wall: dy over the dominant horizontal component, in [-1,1] inside
    # the wall band (it runs past ±1 in the corners, where ceiling/floor take over).
    h = np.clip(y / np.maximum(m, 1e-6), -1.0, 1.0)
    col = mix_arr(np.broadcast_to(WALL_LOW, y.shape + (3,)).copy(), WALL_HIGH, smooth(-0.85, 0.95, h))

    # faint horizontal seam at eye level (a panel joint), a couple of px wide
    seam = 1.0 - smooth(0.004, 0.012, np.abs(y))
    col = mix_arr(col, SEAM, seam * 0.45)

    # ---- the light bank: one brighter panel on the +Z wall (behind the camera) ----
    zz = np.maximum(dz, 1e-6)
    bank_t = smooth(0.92, 1.08, dz / np.maximum(np.maximum(np.abs(dx), np.abs(dy)), 1e-6))
    bu = dx / zz
    bv = dy / zz
    panel = (1.0 - smooth(BANK_HU - BANK_SOFT, BANK_HU + BANK_SOFT, np.abs(bu - BANK_U))) * \
            (1.0 - smooth(BANK_HV - BANK_SOFT, BANK_HV + BANK_SOFT, np.abs(bv - BANK_V)))
    panel = panel * bank_t * (dz > 0).astype(np.float64)
    col = mix_arr(col, BANK, panel * BANK_AMT)

    col = mix_arr(col, CEILING, ceiling_t)
    col = mix_arr(col, FLOOR, floor_t)

    # ---- two fluorescent fixtures on the ceiling face -----------------------------
    # strips at v = TUBE_POSITIONS across the +Y face (u = x/y, v = z/y). Each is a
    # bright hard core inside a WIDE soft halo: a mirror reflection of the fixture is
    # then an elongated streak with a soft shoulder, which is what wet oil looks like.
    yy = np.maximum(y, 1e-6)
    u = dx / yy
    v = dz / yy
    inside = ((np.abs(u) <= 1.0) & (np.abs(v) <= 1.0) & (y > 0)).astype(np.float64)
    core = np.zeros_like(y)
    halo = np.zeros_like(y)
    for v0 in TUBE_POSITIONS:
        d = np.abs(v - v0)
        core = np.maximum(core, 1.0 - smooth(TUBE_CORE_HALF - TUBE_CORE_SOFT, TUBE_CORE_HALF + TUBE_CORE_SOFT, d))
        halo = np.maximum(halo, 1.0 - smooth(TUBE_HALO_HALF - TUBE_HALO_SOFT, TUBE_HALO_HALF + TUBE_HALO_SOFT, d))
    col = mix_arr(col, TUBE_HALO, halo * inside * ceiling_t * TUBE_HALO_AMT)
    col = mix_arr(col, TUBE, core * inside * ceiling_t)

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

rendered = {}
for name, (dx, dy, dz) in FACES.items():
    col = workshop(dx, dy, dz)
    img = (col * 255.0 + 0.5).astype(np.uint8)
    rendered[name] = img
    rgba = np.dstack([img, np.full((N, N, 1), 255, np.uint8)])
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"{name}.png"), optimize=True)
    lum = col @ np.array([0.2126, 0.7152, 0.0722])
    print(f"wrote {name:5s}  luma min {lum.min():.3f}  mean {lum.mean():.3f}  max {lum.max():.3f}")

# ---- contact sheet: the six faces as a cross, so the room can be LOOKED AT ---------
C = 192
cell = {k: np.array(Image.fromarray(v).resize((C, C), Image.BILINEAR)) for k, v in rendered.items()}
sheet = np.full((C * 3, C * 4, 3), 18, np.uint8)
# row 0:      +Y
# row 1: -X  +Z  +X  -Z
# row 2:      -Y
sheet[0:C, C:2*C] = cell["posy"]
sheet[C:2*C, 0:C] = cell["negx"]
sheet[C:2*C, C:2*C] = cell["posz"]
sheet[C:2*C, 2*C:3*C] = cell["posx"]
sheet[C:2*C, 3*C:4*C] = cell["negz"]
sheet[2*C:3*C, C:2*C] = cell["negy"]
Image.fromarray(sheet, "RGB").save(SHEET)
print("contact sheet ->", SHEET)

print("done ->", OUT)
