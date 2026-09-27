// Cảnh bản đồ giới trên WebGL: địa hình nướng trong worker (một ảnh tổng quan cả giới + mảnh nét quanh camera khi phóng to,
// LRU 9 mảnh — tổng GPU ≲ 50 MB), huy hiệu tông môn / điểm / cổng (mỗi loại một texture → ít draw call), đường và cờ hành quân
// nội suy theo giờ server. Camera do WorldView điều khiển; cảnh chỉ vẽ theo camera được đưa vào.
import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { marchAt } from './path'
import {
  MAP_W,
  atlas,
  regionOf,
  sitesOf,
  snapClaims,
  ruinWindow,
  territoryGrid,
  tide,
  type Atlas,
  type MapMarch,
  type MapSnap,
  type Point,
  type Pos,
} from '@rok/rules/world'
import {
  BEAST_EMBLEMS,
  SECT_EMBLEMS,
  WORLD_TILE,
  marchToken,
  medal,
  vortexTex,
  type Emblem,
  type MedalTone,
} from '@rok/art'
import { Bakery } from './bakery'
import { DPR, painted, texOf } from './stage'
import { flagTex, paintTerritory, terrColor } from './territory'
import { FogLayer, nextLand } from './fog'
import { cellOf, clear, type Fog } from '@rok/rules'

const T = WORLD_TILE
export const WORLD_DU = MAP_W * T
export const FINE_Z = 0.42 // từ độ phóng này (px CSS mỗi DU) mới cần mảnh nét
const PIECE = 30 // ô mỗi cạnh một mảnh nét (5 × 5 mảnh)
const PIECE_PX = 1024
const OVERVIEW_PX = 1536
const KEEP = 9
const MARK = 36 // px CSS một huy hiệu — đủ to để chạm và nhìn ra hình trên điện thoại (28 cũ: bé, khó nhận)
export type Cam = { x: number; y: number; z: number } // tâm nhìn (DU) và px CSS mỗi DU
export type Layer = 'wild' | 'mine' | 'march' | 'terr' // lớp lọc tình hình người chơi tắt được (yêu thú, mỏ, hành quân, lãnh thổ)
export type Rel = 'me' | 'ally' | 'npc' | 'other'
// màu huy hiệu theo quan hệ với mình
const TONE: Record<Rel, MedalTone> = { me: 'gold', ally: 'jade', npc: 'ink', other: 'red' }
// Minh khoáng: hình chạm theo loại tài nguyên
const ORE = { linhThach: 'water', linhThao: 'wood', linhKhoang: 'metal' } as const satisfies Record<string, Emblem>
// phù văn: loại (RUNE_KINDS: công, thủ, sinh lực, khai mỏ, hành quân, tuyển) → hình; phẩm → đĩa
const RUNE_EMBLEM: Emblem[] = ['sword', 'earth', 'lotus', 'wood', 'wind', 'fist']
const RUNE_TONE: MedalTone[] = ['ink', 'jade', 'phap', 'realm', 'gold']
const GOODS_TONE: MedalTone[] = ['ink', 'jade', 'gold'] // hàng thương đội: thường / tốt / quý
export type Pick =
  | { kind: 'seat'; pid: number }
  | { kind: 'point'; i: number }
  | { kind: 'site'; i: number } // thôn trang / động phủ (sitesOf)
  | { kind: 'march'; pid: number; id: number }
  | { kind: 'tile'; x: number; y: number }

// Texture huy hiệu (nướng một lần theo cỡ hiện trên màn)
const markTex = (emblem: Emblem, tone: MedalTone) =>
  painted(`wmark:${emblem}:${tone}`, () => medal(emblem, tone), (MARK / 48) * DPR * 1.5)
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

export class WorldScene {
  readonly root = new Container()
  readonly atlas: Atlas
  private land = new Container()
  private pieces = new Map<string, { s: Sprite; used: number; tex: Texture }>()
  private asked = new Set<string>()
  private bakery = new Bakery()
  private roads = new Graphics()
  private glow = new Graphics()
  private terr = new Graphics() // lãnh thổ tiên minh: nền màu nhạt + viền
  private terrData: { snap: MapSnap; mine?: number; next: number } | null = null // vẽ lại khi trận kỳ dựng xong
  private flagMarks: [Sprite, number][] = [] // trận kỳ, lúc dựng xong (đang dựng: mờ)
  private tileMarks: Pos[] = [] // phù văn, điểm đào đang vẽ
  private ruinMarks: [Sprite, Point][] = [] // di tích: đang mở thì nhịp sáng, đóng thì mờ
  private fogL = new FogLayer() // mê vụ: trên cùng (che huy hiệu, đường và cờ hành quân bên dưới)
  private explore: { fog: Fog; next: number } | null = null
  private marks = new Container() // huy hiệu: điểm, cổng, tông môn
  // sprite, cỡ gốc (DU ở z = 1, chia z mỗi khung để giữ cỡ trên màn), độ phóng tối thiểu để hiện (mức chi tiết)
  private sized: [Container, number, number][] = []
  private tokens = new Container()
  private marches: MapMarch[] = []
  private clouds: [Sprite, number][] = [] // kiếp vân trên tông môn đang độ kiếp: xoáy, lúc giáng
  private roadZ = 0
  private overviewTex: Texture | null = null
  private dead = false
  private hide: ReadonlySet<Layer> = new Set()
  readonly ready: Promise<void> // ảnh tổng quan đã lên

  constructor(seed: number) {
    this.atlas = atlas(seed)
    this.root.addChild(this.land, this.terr, this.glow, this.roads, this.marks, this.tokens, this.fogL.sprite)
    this.ready = this.bakery.bake({ seed, x0: 0, y0: 0, n: MAP_W, px: OVERVIEW_PX, fine: false }).then(b => {
      if (!b || this.dead) return
      this.overviewTex = Texture.from(b)
      const s = new Sprite(this.overviewTex)
      s.width = s.height = WORLD_DU
      this.land.addChildAt(s, 0)
    })
  }

  // Lớp tắt: hành quân và lãnh thổ ẩn ngay; yêu thú / mỏ bỏ qua từ lần dựng huy hiệu kế tiếp (setData)
  setHide(h: ReadonlySet<Layer>) {
    this.hide = h
    this.tokens.visible = this.roads.visible = !h.has('march')
    this.terr.visible = !h.has('terr')
  }
  private hidden = (p: Point) => (p.kind === 'wild' || p.kind === 'mine') && this.hide.has(p.kind)

  // Dữ liệu đổi (ảnh chụp mới, pha mùa, quan hệ): dựng lại huy hiệu. rel: quan hệ của từng tông môn với mình.
  // ex: mê vụ + thôn trang / động phủ đã ghé của mình (chưa vào giới: không có — cả giới hiện rõ)
  setData(
    snap: MapSnap,
    rel: (pid: number) => Rel,
    phase: number,
    now: number,
    ex?: { fog: Fog; visited: readonly number[]; fires: readonly number[] },
  ) {
    this.marks.removeChildren().forEach(c => c.destroy())
    this.sized = []
    this.clouds = []
    const add = (p: Pos, emblem: Emblem, tone: MedalTone, size = 1, alpha = 1, minZ = 0) => {
      const t = markTex(emblem, tone)
      const s = new Sprite(t.tex)
      s.anchor.set(0.5)
      s.position.set((p.x + 0.5) * T, (p.y + 0.5) * T)
      s.alpha = alpha
      this.sized.push([s, (size * MARK) / ((t.tex.width / t.scale) * (MARK / 48)), minZ]) // theo hộp asset: đúng cả khi thay tranh vẽ tay
      this.marks.addChild(s)
      return s
    }
    const spots = new Map(snap.spots.map(s => [s.i, s]))
    for (const p of this.atlas.points) {
      const sp = spots.get(p.i)
      if (this.hidden(p)) continue
      if (p.kind === 'gate') add(p, 'tower', p.lv <= phase ? 'jade' : 'ink', 0.7, p.lv <= phase ? 1 : 0.6, 0.3)
      else if (p.kind === 'vein') add(p, 'lotus', sp?.own ? 'jade' : 'realm', 0.8, 1, 0.22)
      else if (p.kind === 'mine') add(p, 'earth', 'gold', 0.7, sp?.until && sp.until > now ? 0.4 : 1, 0.34)
      else if (p.kind === 'boss' && sp?.loharUntil)
        add(p, 'dragon', 'red', 1.5) // Yêu Vương Tuần Sơn (người chơi triệu hồi): huy hiệu son, to hơn
      else if (p.kind === 'boss')
        add(p, 'dragon', 'beast', p.lv === 3 ? 1.3 : 1.05, sp?.until && sp.until > now ? 0.4 : 1)
      else if (p.kind === 'wild')
        // yêu thú giới: hình theo cấp (như yêu thú bản đồ vùng), nhỏ, chỉ hiện khi phóng đủ; vừa bị hạ thì mờ
        add(p, BEAST_EMBLEMS[p.lv - 1] ?? 'wolf', 'beast', 0.55, sp?.until && sp.until > now ? 0.25 : 1, 0.45)
      else if (p.kind === 'ruin' || p.kind === 'altar')
        this.ruinMarks.push([add(p, p.kind === 'ruin' ? 'ghost' : 'blood', p.kind === 'ruin' ? 'realm' : 'red', 1), p])
      else add(p, 'rebirth', 'gold', 1.5)
    }
    for (const s of snap.seats) {
      const r = rel(s.pid)
      const faction = SECT_EMBLEMS[regionOf(this.atlas, s) % SECT_EMBLEMS.length]
      // khác nhau cả hình chạm lẫn màu (không chỉ màu): mình huy hiệu lớn, NPC hình tông môn phái, người khác huy hiệu son
      const m = add(s, r === 'npc' ? faction : 'crest', TONE[r], r === 'me' ? 1.3 : 1)
      if (s.shield) {
        const ring = new Sprite(ringTex('#8cc09d'))
        ring.anchor.set(0.5)
        ring.position.copyFrom(m.position)
        this.sized.push([ring, ((r === 'me' ? 1.3 : 1) * MARK * 1.25) / 96, 0])
        this.marks.addChild(ring)
      }
      if (s.fire && s.fire > now) add({ x: s.x + 0.7, y: s.y - 0.7 }, 'fire', 'red', 0.55) // linh hỏa thiêu núi
      if (s.cloud && s.cloud > now) {
        const c = new Sprite(texOf('wvortex', () => vortexTex(128, 7, 3, 1.6)))
        c.anchor.set(0.5)
        c.position.copyFrom(m.position)
        c.alpha = 0.85
        this.sized.push([c, (MARK * 2.4) / 128, 0])
        this.marks.addChildAt(c, this.marks.getChildIndex(m)) // dưới huy hiệu: vẫn đọc được là ai
        this.clouds.push([c, s.cloud])
      }
    }
    this.marches = snap.marches
    this.roadZ = 0 // vẽ lại đường theo độ phóng mới
    // thôn trang / động phủ đã lộ (ghé rồi thì mờ); thôn đang bị tà tu đốt (Thôn Trang Gặp Nạn): ấn lửa đỏ, luôn rõ
    for (const st of ex ? sitesOf(this.atlas) : []) {
      const c = cellOf(st)
      if (!clear(ex!.fog, c.cx, c.cy, now)) continue
      if (ex!.fires.includes(st.i)) add(st, 'fire', 'red', 0.75, 1, 0.2)
      else if (st.kind === 'village') add(st, 'wood', 'gold', 0.6, ex!.visited.includes(st.i) ? 0.35 : 1, 0.3)
      else add(st, 'chaos', 'realm', 0.6, ex!.visited.includes(st.i) ? 0.35 : 1, 0.3)
    }
    this.explore = ex ? { fog: ex.fog, next: nextLand(ex.fog, now) } : null
    this.fogL.paint(ex?.fog ?? null, now)
    const mine = snap.seats.find(s => rel(s.pid) === 'me')?.aid
    this.flagMarks = []
    this.ruinMarks = []
    for (const f of snap.flags ?? []) {
      const s = new Sprite(flagTex(terrColor(f.aid, mine)))
      s.anchor.set(0.35, 0.9)
      s.position.set((f.x + 0.5) * T, (f.y + 0.5) * T)
      if (f.fort) add(f, 'tower', 'gold', 1.2) // Tổng đà: đài vàng dưới lá cờ lớn, thấy ở mọi độ phóng
      if (f.mine) add(f, ORE[f.mine.res], 'jade', 1, 1, 0.2) // Minh khoáng: huy hiệu loại tài nguyên dưới lá cờ
      this.sized.push([s, (MARK * (f.fort ? 2 : 1.2)) / 64, f.fort ? 0 : 0.2])
      this.flagMarks.push([s, f.done])
      this.marks.addChild(s)
    }
    for (const d of snap.digs ?? []) add(d, 'orb', 'gold', 0.8, 1, 0.2) // Tàng Bảo Đồ: điểm đào (ai cũng thấy) — bảo châu vàng
    this.tileMarks = [...(snap.digs ?? []), ...(snap.runes ?? []), ...(snap.goods ?? [])] // chọn được trước điểm bên cạnh
    // phù văn quanh linh địa: hình theo loại, đĩa theo phẩm (Bạch mực → Cam vàng)
    for (const r of snap.runes ?? []) add(r, RUNE_EMBLEM[r.k], RUNE_TONE[r.t], 0.55, 1, 0.3)
    // Thương Đội Gặp Nạn: kiện hàng rơi quanh thôn trang — huy hiệu, đĩa theo phẩm
    for (const g of snap.goods ?? []) add(g, 'crest', GOODS_TONE[g.t], 0.6, 1, 0.3)
    this.terrData = {
      snap,
      mine,
      next: Math.min(Infinity, ...(snap.flags ?? []).map(f => f.done).filter(d => d > now)),
    }
    this.drawTerritory(snap, now, mine)
  }

  // Lãnh thổ tiên minh (như RoK), cùng luật với server: tô trong territory.ts
  private drawTerritory(snap: MapSnap, now: number, mine?: number) {
    paintTerritory(this.terr.clear(), territoryGrid(snapClaims(snap, this.atlas, now)), mine)
  }

  // Chọn vật dưới điểm (DU): cờ hành quân → tông môn → điểm → ô trống
  pick(x: number, y: number, z: number, seats: MapSnap['seats'], now: number): Pick {
    const r = (MARK * 0.6) / z
    const d = (p: Pos) => Math.hypot((p.x + 0.5) * T - x, (p.y + 0.5) * T - y)
    // trong mỗi loại lấy cái GẦN NHẤT trong tầm chạm (các tông môn sát nhau vẫn chọn đúng)
    const nearest = <X>(list: readonly X[], at: (x: X) => Pos, k = 1) =>
      list.reduce<[X | null, number]>(
        (best, it) => {
          const dd = d(at(it))
          return dd < r * k && dd < best[1] ? [it, dd] : best
        },
        [null, Infinity],
      )[0]
    // dưới mê vụ không chọn được gì (chỉ ô trống: thả linh điểu)
    const seen = (p: Pos) => !this.explore || clear(this.explore.fog, cellOf(p).cx, cellOf(p).cy, now)
    // đội đứng yên (đóng giữ, đang khai) không che chỗ nó đứng: chạm mở bảng của điểm / trận kỳ, ở đó có đội mình + Gọi về
    const still = (x2: MapMarch) => now >= x2.arriveAt && (!x2.returnAt || (x2.dig ?? 0) > now)
    const m = nearest(this.hide.has('march') ? [] : this.marches.filter(x2 => !still(x2)), x2 => marchAt(x2, now), 0.8)
    if (m && seen(marchAt(m, now))) return { kind: 'march', pid: m.pid, id: m.id }
    const s = nearest(seats.filter(seen), x2 => x2)
    if (s) return { kind: 'seat', pid: s.pid }
    // phù văn, điểm đào: vật nhỏ trên ô trống sát linh địa — chạm trúng thì chọn ô đó trước điểm bên cạnh
    const tm = nearest(this.tileMarks.filter(seen), x2 => x2, 0.6)
    if (tm) return { kind: 'tile', x: tm.x, y: tm.y }
    const p = nearest(
      this.atlas.points.filter(x2 => seen(x2) && !this.hidden(x2)),
      x2 => x2,
      1.2,
    )
    if (p) return { kind: 'point', i: p.i }
    const st = this.explore ? nearest(sitesOf(this.atlas).filter(seen), x2 => x2) : null
    if (st) return { kind: 'site', i: st.i }
    return {
      kind: 'tile',
      x: Math.max(0, Math.min(MAP_W - 1, Math.floor(x / T))),
      y: Math.max(0, Math.min(MAP_W - 1, Math.floor(y / T))),
    }
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
    for (const [c, at] of this.clouds) {
      c.visible = at > now
      c.rotation = -now / 2500
    }
    if (Math.abs(this.roadZ - cam.z) / cam.z > 0.15) this.drawRoads(cam.z)
    this.drawTokens(cam.z, now, lod)
    // trận kỳ vừa dựng xong: lãnh thổ nới ra (không chờ ảnh chụp mới)
    for (const [s, done] of this.flagMarks) s.alpha = done > now ? 0.65 : 1
    for (const [s, p] of this.ruinMarks)
      s.alpha = ruinWindow(this.atlas, p, now).open ? 0.8 + 0.2 * Math.sin(now / 250) : 0.5
    // linh điểu vừa tới nơi: mê vụ tan (không chờ ảnh chụp mới)
    const ex = this.explore
    if (ex && now >= ex.next) {
      ex.next = nextLand(ex.fog, now)
      this.fogL.paint(ex.fog, now)
    }
    const td = this.terrData
    if (td && now >= td.next) {
      td.next = Math.min(Infinity, ...(td.snap.flags ?? []).map(f => f.done).filter(d => d > now))
      this.drawTerritory(td.snap, now, td.mine)
    }
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
      c.scale.set((22 * Math.max(0.55, lod)) / (tok.tex.width / tok.scale) / z)
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
    const x0 = cam.x - sx / cam.z,
      y0 = cam.y - sy / cam.z,
      x1 = cam.x + sx / cam.z,
      y1 = cam.y + sy / cam.z
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
        void this.bakery
          .bake({ seed: this.atlas.seed, x0: cx * PIECE, y0: cy * PIECE, n: PIECE, px: PIECE_PX, fine: true })
          .then(b => {
            this.asked.delete(key)
            if (!b || this.dead) return
            const tex = Texture.from(b)
            const s = new Sprite(tex)
            s.position.set(cx * span, cy * span)
            s.width = s.height = span
            this.land.addChild(s)
            this.pieces.set(key, { s, used: performance.now(), tex })
            while (this.pieces.size > KEEP) {
              const [old] = [...this.pieces].sort((p, q) => p[1].used - q[1].used)
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
    this.fogL.destroy()
    this.root.destroy({ children: true })
  }
}
