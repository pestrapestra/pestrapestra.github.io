"""Döşenebilir (kenarları birleşen) sarımsı kâğıt dokusu üretir. Kullanım: py -3 kagit_uret.py <çıktı.webp>"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 1600
rng = np.random.default_rng(22)


def periyodik_gurultu(olcek, us=2.0):
    """FFT ile periyodik (döşenebilir) gürültü; olcek büyüdükçe leke iri."""
    f = np.fft.fftfreq(S)
    fx, fy = np.meshgrid(f, f)
    r = np.sqrt(fx ** 2 + fy ** 2)
    r[0, 0] = 1
    filtre = 1 / (r * olcek + 1e-3) ** us
    filtre[0, 0] = 0
    faz = rng.normal(size=(S, S)) + 1j * rng.normal(size=(S, S))
    n = np.real(np.fft.ifft2(faz * filtre))
    n = (n - n.mean()) / n.std()
    return n


taban = np.array([244, 233, 211], dtype=np.float64)  # #F4E9D3
img = np.ones((S, S, 3)) * taban

leke = periyodik_gurultu(60, 2.2)           # iri sararma lekeleri
orta = periyodik_gurultu(6, 1.6)            # bulutsu doku
ince = rng.normal(size=(S, S))              # tane

sararma = np.array([-6, -11, -22])          # sarı-kahveye kayma
img += leke[..., None] * sararma * 0.55
img += orta[..., None] * np.array([-3.2, -3.6, -4.2])
img += ince[..., None] * 2.6

# kenarlarda hafif koyulaşma yok (döşenecek); bunun yerine birkaç belirgin leke
for _ in range(9):
    cx, cy = rng.integers(0, S, 2)
    rad = rng.integers(60, 220)
    yy, xx = np.ogrid[:S, :S]
    dx = np.minimum(abs(xx - cx), S - abs(xx - cx))
    dy = np.minimum(abs(yy - cy), S - abs(yy - cy))
    d = np.sqrt(dx ** 2 + dy ** 2) / rad
    a = np.clip(1 - d, 0, 1) ** 2 * rng.uniform(0.15, 0.4)
    img += a[..., None] * np.array([-8, -14, -26])

img = np.clip(img, 0, 255).astype(np.uint8)
im = Image.fromarray(img, 'RGB')

# lifler ve ince çizikler (kenardan taşanlar karşı kenara sarılır)
katman = Image.new('L', (S, S), 0)
dr = ImageDraw.Draw(katman)
for _ in range(2600):
    x, y = rng.uniform(0, S, 2)
    ang = rng.normal(0.35, 0.9)
    L = rng.uniform(6, 40)
    pts = []
    for t in np.linspace(0, 1, 6):
        ang += rng.normal(0, 0.15)
        pts.append((x + np.cos(ang) * L * t, y + np.sin(ang) * L * t))
    w = rng.choice([1, 1, 1, 2])
    a = int(rng.uniform(12, 40))
    for ox in (-S, 0, S):
        for oy in (-S, 0, S):
            dr.line([(px + ox, py + oy) for px, py in pts], fill=a, width=w)
# uzun çizikler (referanstaki gibi)
for _ in range(70):
    x, y = rng.uniform(0, S, 2)
    ang = rng.uniform(-0.6, 0.6) + rng.choice([0, np.pi / 2])
    L = rng.uniform(60, 260)
    x2, y2 = x + np.cos(ang) * L, y + np.sin(ang) * L
    for ox in (-S, 0, S):
        for oy in (-S, 0, S):
            dr.line([(x + ox, y + oy), (x2 + ox, y2 + oy)], fill=int(rng.uniform(18, 45)), width=1)
katman = katman.filter(ImageFilter.GaussianBlur(0.7))
lif = np.array(katman, dtype=np.float64)[..., None] / 255.0
renk = np.array([150, 120, 80], dtype=np.float64)
base = np.array(im, dtype=np.float64)
base = base * (1 - lif) + renk * lif

# koyu benekler
for _ in range(500):
    x, y = rng.integers(0, S, 2)
    base[y, x] = base[y, x] * 0.82

out = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
out.save(sys.argv[1], 'WEBP', quality=84, method=6)
print(out.size, np.array(out).reshape(-1, 3).mean(0).round())
