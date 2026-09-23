// Ngẫu nhiên có hạt giống: cùng seed thì cùng nét vẽ, giữa các lần tải và giữa các máy.

export type Rng = () => number

// mulberry32
export function rng(seed: number): Rng {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(x: number, y: number, s: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s + 1, 1013904223)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const ease = (t: number) => t * t * (3 - 2 * t)

// Value noise 0..1. px/py > 0: lặp lại theo chu kỳ (texture ghép liền)
export function noise2(x: number, y: number, seed = 0, px = 0, py = 0) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const u = ease(x - xi), v = ease(y - yi)
  const w = (n: number, p: number) => (p ? ((n % p) + p) % p : n)
  const x0 = w(xi, px), x1 = w(xi + 1, px), y0 = w(yi, py), y1 = w(yi + 1, py)
  const a = hash(x0, y0, seed), b = hash(x1, y0, seed), c = hash(x0, y1, seed), d = hash(x1, y1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export const noise1 = (x: number, seed = 0) => noise2(x, 0.5, seed)

// Nhiều quãng tám cộng lại, 0..1
export function fbm(x: number, y: number, seed = 0, oct = 4, px = 0, py = 0) {
  let sum = 0, amp = 0.5, norm = 0, f = 1
  for (let i = 0; i < oct; i++) {
    sum += amp * noise2(x * f, y * f, seed + i * 17, px * f, py * f)
    norm += amp
    amp *= 0.5
    f *= 2
  }
  return sum / norm
}
