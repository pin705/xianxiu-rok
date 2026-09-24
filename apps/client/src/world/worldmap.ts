// Cảnh bản đồ giới trên WebGL: địa hình nướng trong worker (một ảnh tổng quan cả giới + mảnh nét quanh camera khi phóng to,
// LRU 9 mảnh — tổng GPU ≲ 50 MB), huy hiệu tông môn / điểm / cổng (mỗi loại một texture → ít draw call), đường và cờ hành quân
// nội suy theo giờ server. Camera do WorldView điều khiển; cảnh chỉ vẽ theo camera được đưa vào.
import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { MAP_W, atlas, regionOf, tide, type Atlas, type MapMarch, type MapSnap, type Pos } from '@rok/rules/world'
import { SECT_EMBLEMS, WORLD_TILE, bake, marchToken, medal, worldPiece, type Emblem, type MedalTone } from '@rok/art'
import type { BakeJob } from './bake.worker'
import { DPR, painted, texOf } from './stage'

const T = WORLD_TILE
export const WORLD_DU = MAP_W * T
export const FINE_Z = 0.42 // từ độ phóng này (px CSS mỗi DU) mới cần mảnh nét
const PIECE = 30 // ô mỗi cạnh một mảnh nét (5 × 5 mảnh)
const PIECE_PX = 1024
const OVERVIEW_PX = 1536
const KEEP = 9
const MARK = 28 // px CSS một huy hiệu
export type Cam = { x: number; y: number; z: number } // tâm nhìn (DU) và px CSS mỗi DU
export type Rel = 'me' | 'ally' | 'npc' | 'other'
export type Pick =
  | { kind: 'seat'; pid: number }
  | { kind: 'point'; i: number }
  | { kind: 'march'; pid: number; id: number }
  | { kind: 'tile'; x: number; y: number }

// Nướng mảnh: worker nếu có (OffscreenCanvas), không thì trên luồng chính (Safari cũ) — chậm hơn nhưng vẫn ra hình
class Bakery {
  private worker: Worker | null = null
  private n = 0
  private wait = new Map<number, { job: Omit<BakeJob, 'id'>; ok: (b: ImageBitmap | HTMLCanvasElement | null) => void }>()
  constructor() {
    try {
      if (typeof OffscreenCanvas !== 'undefined') {
        this.worker = new Worker(new URL('./bake.worker.ts', import.meta.url), { type: 'module' })
        this.worker.onmessage = (e: MessageEvent<{ id: number; bmp: ImageBitmap }>) => {
          this.wait.get(e.data.id)?.ok(e.data.bmp)
          this.wait.delete(e.data.id)
        }
        // worker hỏng (trình duyệt không cho canvas trong worker…): nướng các việc đang chờ trên luồng chính
        this.worker.onerror = e => {
          console.warn('bake worker failed, baking on main thread', e.message)
          this.worker?.terminate()
          this.worker = null
          for (const [id, w] of this.wait) this.wait.delete(id), w.ok(this.here(w.job))
        }
      }
    } catch {
      this.worker = null
    }
  }
  private here(j: Omit<BakeJob, 'id'>) {
    const a = atlas(j.seed)
    const piece = worldPiece({ seed: j.seed, tiles: a.tiles, rings: a.regions.map(r => r.ring), w: MAP_W }, j.x0, j.y0, j.n, j.fine)
    return bake(piece, j.px / (j.n * T)).canvas as HTMLCanvasElement
  }
  bake(j: Omit<BakeJob, 'id'>): Promise<ImageBitmap | HTMLCanvasElement | null> {
    if (!this.worker) return Promise.resolve(this.here(j))
    const id = ++this.n
    return new Promise(ok => {
      this.wait.set(id, { job: j, ok })
      this.worker!.postMessage({ ...j, id })
    })
  }
  destroy() {
    this.worker?.terminate()
    for (const w of this.wait.values()) w.ok(null)
  }
}

// Texture huy hiệu (nướng một lần theo cỡ hiện trên màn)
const markTex = (emblem: Emblem, tone: MedalTone) => painted(`wmark:${emblem}:${tone}`, () => medal(emblem, tone), (MARK / 48) * DPR * 1.5)
const ringTex = (color: string) =>
  texOf(`wring:${color}`, () => {
    const c = document.createElement('canvas')
    c.width = c.height = 96
    const g = c.getContext('2d')!
    g.strokeStyle = color
    g.lineWidth = 7
    g.beginPath()
    g.arc(48, 48, 40, 0, Math.PI * 2)
    g.stroke()
    return c
  })

// Điểm trên đường theo quãng k (0..1), chia theo độ dài
function along(path: Pos[], k: number): Pos {
  const seg = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y))
  let left = Math.max(0, Math.min(1, k)) * seg.reduce((a, b) => a + b, 0)
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const u = seg[i] ? Math.min(1, left / seg[i]) : 0
      return { x: path[i].x + (path[i + 1].x - path[i].x) * u, y: path[i].y + (path[i + 1].y - path[i].y) * u }
    }
    left -= seg[i]
  }
  return path[0]
}
// Vị trí đội lúc now: đi (startAt → arriveAt), về theo đường ngược (arriveAt → returnAt); chưa hẹn giờ về thì ở đích
export function marchAt(m: MapMarch, now: number): Pos {
  if (now < m.arriveAt) return along(m.path, (now - m.startAt) / Math.max(1, m.arriveAt - m.startAt))
  if (!m.returnAt) return m.path[m.path.length - 1]
  return along(m.path, 1 - (now - m.arriveAt) / Math.max(1, m.returnAt - m.arriveAt))
}

export class WorldScene {
  readonly root = new Container()
  readonly atlas: Atlas
  private land = new Container()
  private pieces = new Map<string, { s: Sprite; used: number; tex: Texture }>()
  private asked = new Set<string>()
  private bakery = new Bakery()
  private roads = new Graphics()
  private glow = new Graphics()
  private marks = new Container() // huy hiệu: điểm, cổng, tông môn
  // sprite, cỡ gốc (DU ở z = 1, chia z mỗi khung để giữ cỡ trên màn), độ phóng tối thiểu để hiện (mức chi tiết)
  private sized: [Container, number, number][] = []
  private tokens = new Container()
  private marches: MapMarch[] = []
  private roadZ = 0
  private overviewTex: Texture | null = null
  private dead = false
  readonly ready: Promise<void> // ảnh tổng quan đã lên

  constructor(seed: number) {
    this.atlas = atlas(seed)
    this.root.addChild(this.land, this.glow, this.roads, this.marks, this.tokens)
    this.ready = this.bakery.bake({ seed, x0: 0, y0: 0, n: MAP_W, px: OVERVIEW_PX, fine: false }).then(b => {
      if (!b || this.dead) return
      this.overviewTex = Texture.from(b)
      const s = new Sprite(this.overviewTex)
      s.width = s.height = WORLD_DU
      this.land.addChildAt(s, 0)
    })
  }

  // Dữ liệu đổi (ảnh chụp mới, pha mùa, quan hệ): dựng lại huy hiệu. rel: quan hệ của từng tông môn với mình.
  setData(snap: MapSnap, rel: (pid: number) => Rel, phase: number, now: number) {
    this.marks.removeChildren().forEach(c => c.destroy())
    this.sized = []
    const add = (p: Pos, emblem: Emblem, tone: MedalTone, size = 1, alpha = 1, minZ = 0) => {
      const t = markTex(emblem, tone)
      const s = new Sprite(t.tex)
      s.anchor.set(0.5)
      s.position.set((p.x + 0.5) * T, (p.y + 0.5) * T)
      s.alpha = alpha
      this.sized.push([s, (size * MARK) / (t.tex.width / (DPR * 1.5)), minZ])
      this.marks.addChild(s)
      return s
    }
    const spots = new Map(snap.spots.map(s => [s.i, s]))
    for (const p of this.atlas.points) {
      const sp = spots.get(p.i)
      if (p.kind === 'gate') add(p, 'tower', p.lv <= phase ? 'jade' : 'ink', 0.7, p.lv <= phase ? 1 : 0.6, 0.3)
      else if (p.kind === 'vein') add(p, 'lotus', sp?.own ? 'jade' : 'realm', 0.8, 1, 0.22)
      else if (p.kind === 'mine') add(p, 'earth', 'gold', 0.7, sp?.until && sp.until > now ? 0.4 : 1, 0.34)
      else if (p.kind === 'boss') add(p, 'dragon', 'beast', p.lv === 3 ? 1.3 : 1.05, sp?.until && sp.until > now ? 0.4 : 1)
      else add(p, 'rebirth', 'gold', 1.5)
    }
    for (const s of snap.seats) {
      const r = rel(s.pid)
      const faction = SECT_EMBLEMS[regionOf(this.atlas, s) % SECT_EMBLEMS.length]
      // khác nhau cả hình chạm lẫn màu (không chỉ màu): mình huy hiệu lớn, NPC hình tông môn phái, người khác huy hiệu son
      const m = add(s, r === 'npc' ? faction : 'crest', r === 'me' ? 'gold' : r === 'ally' ? 'jade' : r === 'npc' ? 'ink' : 'red', r === 'me' ? 1.3 : 1)
      if (s.shield) {
        const ring = new Sprite(ringTex('#8cc09d'))
        ring.anchor.set(0.5)
        ring.position.copyFrom(m.position)
        this.sized.push([ring, ((r === 'me' ? 1.3 : 1) * MARK * 1.25) / 96, 0])
        this.marks.addChild(ring)
      }
    }
    this.marches = snap.marches
    this.roadZ = 0 // vẽ lại đường theo độ phóng mới
  }

  // Chọn vật dưới điểm (DU): cờ hành quân → tông môn → điểm → ô trống
  pick(x: number, y: number, z: number, seats: MapSnap['seats'], now: number): Pick {
    const r = (MARK * 0.6) / z
    const near = (p: Pos, k = 1) => Math.hypot((p.x + 0.5) * T - x, (p.y + 0.5) * T - y) < r * k
    for (const m of this.marches) if (near(marchAt(m, now), 0.8)) return { kind: 'march', pid: m.pid, id: m.id }
    const s = seats.find(s => near(s))
    if (s) return { kind: 'seat', pid: s.pid }
    const p = this.atlas.points.find(p => near(p, p.kind === 'heaven' ? 1.5 : 1))
    if (p) return { kind: 'point', i: p.i }
    return { kind: 'tile', x: Math.max(0, Math.min(MAP_W - 1, Math.floor(x / T))), y: Math.max(0, Math.min(MAP_W - 1, Math.floor(y / T))) }
  }

  // Mỗi khung: camera → biến đổi gốc; huy hiệu giữ cỡ trên màn; cờ hành quân theo giờ; xin mảnh nét khi phóng to
  tick(cam: Cam, sx: number, sy: number, now: number) {
    this.root.scale.set(cam.z)
    this.root.position.set(sx - cam.x * cam.z, sy - cam.y * cam.z)
    // thu nhỏ thì huy hiệu nhỏ theo (tới 30 %), điểm phụ (mỏ, cổng) ẩn bớt — cả giới vẫn đọc được
    const lod = Math.min(1, Math.max(0.3, cam.z / 0.6))
    for (const [c, k, minZ] of this.sized) {
      c.visible = cam.z >= minZ
      c.scale.set((k * lod) / cam.z)
    }
    if (Math.abs(this.roadZ - cam.z) / cam.z > 0.15) this.drawRoads(cam.z)
    this.drawTokens(cam.z, now, lod)
    this.drawTide(now)
    if (cam.z >= FINE_Z) this.fine(cam, sx, sy)
  }

  private drawRoads(z: number) {
    this.roadZ = z
    const g = this.roads.clear()
    for (const m of this.marches) {
      const pts = m.path.map(p => [(p.x + 0.5) * T, (p.y + 0.5) * T] as const)
      g.moveTo(pts[0][0], pts[0][1])
      for (const [x, y] of pts.slice(1)) g.lineTo(x, y)
    }
    g.stroke({ width: 2.2 / z, color: 0xb8382a, alpha: 0.7 })
  }
  private drawTokens(z: number, now: number, lod: number) {
    const tok = painted('wtoken', marchToken, DPR * 1.5)
    while (this.tokens.children.length < this.marches.length) {
      const s = new Sprite(tok.tex)
      s.anchor.set(0.5)
      this.tokens.addChild(s)
    }
    this.tokens.children.forEach((c, i) => {
      const m = this.marches[i]
      c.visible = !!m
      if (!m) return
      const p = marchAt(m, now)
      c.position.set((p.x + 0.5) * T, (p.y + 0.5) * T)
      c.scale.set((22 * Math.max(0.55, lod)) / (tok.tex.width / (DPR * 1.5)) / z)
    })
  }
  // Linh triều: quầng sáng trên vùng đang có triều
  private tideAt = -1
  private drawTide(now: number) {
    const t = tide(this.atlas, now)
    const key = t.active ? t.cycle : -1
    if (key === this.tideAt) return
    this.tideAt = key
    const g = this.glow.clear()
    if (!t.active) return
    const r = this.atlas.regions[t.region]
    g.circle((r.cx + 0.5) * T, (r.cy + 0.5) * T, 14 * T).fill({ color: 0x7fd6dc, alpha: 0.13 })
  }

  // Mảnh nét trong khung nhìn (có đệm): nướng khi cần, bỏ mảnh lâu không dùng nhất khi quá KEEP
  private fine(cam: Cam, sx: number, sy: number) {
    const x0 = cam.x - sx / cam.z, y0 = cam.y - sy / cam.z, x1 = cam.x + sx / cam.z, y1 = cam.y + sy / cam.z
    const span = PIECE * T
    for (let cy = Math.max(0, Math.floor(y0 / span)); cy <= Math.min(4, Math.floor(y1 / span)); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / span)); cx <= Math.min(4, Math.floor(x1 / span)); cx++) {
        const key = `${cx},${cy}`
        const hit = this.pieces.get(key)
        if (hit) {
          hit.used = performance.now()
          continue
        }
        if (this.asked.has(key)) continue
        this.asked.add(key)
        void this.bakery.bake({ seed: this.atlas.seed, x0: cx * PIECE, y0: cy * PIECE, n: PIECE, px: PIECE_PX, fine: true }).then(b => {
          this.asked.delete(key)
          if (!b || this.dead) return
          const tex = Texture.from(b)
          const s = new Sprite(tex)
          s.position.set(cx * span, cy * span)
          s.width = s.height = span
          this.land.addChild(s)
          this.pieces.set(key, { s, used: performance.now(), tex })
          while (this.pieces.size > KEEP) {
            const [old] = [...this.pieces].sort((a, b) => a[1].used - b[1].used)
            old[1].s.destroy()
            old[1].tex.destroy(true)
            this.pieces.delete(old[0])
          }
        })
      }
  }

  destroy() {
    this.dead = true
    this.bakery.destroy()
    for (const p of this.pieces.values()) p.tex.destroy(true)
    this.overviewTex?.destroy(true)
    this.root.destroy({ children: true })
  }
}
