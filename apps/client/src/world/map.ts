// Bản đồ vùng trên WebGL: giấy + địa hình vẽ tay (một texture), sương trôi ở rìa xa, ánh nước trôi theo sông,
// bóng mây lướt qua, hạc bay ngang; đường tới các nơi đã mở (nét đứt mực), đường hành quân (nét son chạy),
// cờ quân nội suy theo giờ, nhún bước và tung bụi.
import { Container, Sprite, TilingSprite } from 'pixi.js'
import { PIGMENT as C, building, crane, dashTex, mapTerrain, marchToken, mistTex, type Pt } from '@rok/art'
import { HOME, place, type March, type State, type Target } from '@rok/rules'
import { hex, painted, texOf, fxTex } from './stage'
import type { Scene } from './View.svelte'

export const MAP = { w: 400, h: 1000, top: 110, bottom: 170 }
export const MAP_H = MAP.h + MAP.top + MAP.bottom

const PEAKS = [
  [30, 690, 120, 90],
  [370, 650, 130, 110],
  [150, 600, 90, 70],
  [250, 470, 140, 100],
  [20, 360, 110, 120],
  [380, 330, 120, 90],
  [160, 260, 150, 120],
  [340, 160, 120, 110],
  [60, 170, 130, 100],
  [230, 110, 170, 90],
  [110, 900, 120, 60],
  [300, 960, 150, 70],
]
const PINES = [
  [40, 880],
  [352, 862],
  [130, 640],
  [270, 700],
  [20, 520],
  [205, 440],
  [370, 540],
  [100, 360],
  [300, 350],
  [150, 180],
]
const RIVER: Pt[] = [
  [262, 0],
  [248, 90],
  [290, 170],
  [280, 250],
  [200, 340],
  [200, 460],
  [300, 560],
  [300, 660],
  [220, 760],
  [240, 860],
  [320, 950],
  [320, 1000],
]

// Điểm trên dòng sông ở quãng k (0 đầu nguồn … 1 cuối), nội suy thẳng giữa các điểm
const riverAt = (k: number): Pt => {
  const f = Math.max(0, Math.min(0.9999, k)) * (RIVER.length - 1),
    i = Math.floor(f),
    u = f - i
  return [RIVER[i][0] + (RIVER[i + 1][0] - RIVER[i][0]) * u, RIVER[i][1] + (RIVER[i + 1][1] - RIVER[i][1]) * u]
}

// Đường cong từ tông môn tới mục tiêu (dùng chung cho nét đường và vị trí cờ quân)
const ctrl = (x: number, y: number) => [(HOME.x + x) / 2 + (x < HOME.x ? 30 : -30), (HOME.y + y) / 2] as const
export function along(x: number, y: number, k: number): [number, number] {
  const [cx, cy] = ctrl(x, y)
  const u = 1 - k
  return [u * u * HOME.x + 2 * u * k * cx + k * k * x, u * u * HOME.y + 2 * u * k * cy + k * k * y]
}
// Tiến độ 0..1 của đội trên đường (đi rồi về). Đi cướp chưa giải trận (returnAt 0): đứng ở đích chờ server
export const marchK = (m: March, now: number) =>
  !m.returnAt && now >= m.arriveAt
    ? 1
    : Math.max(
        0,
        Math.min(
          1,
          now < m.arriveAt
            ? (now - m.startAt) / (m.arriveAt - m.startAt)
            : 1 - (now - m.arriveAt) / (m.returnAt - m.arriveAt),
        ),
      )

// Nét đứt dọc đường cong, chia theo độ dài (không theo tham số): tâm + hướng của từng vệt
function dashes(x: number, y: number, dash: number, gap: number, offset = 0) {
  const n = 80
  const pts = Array.from({ length: n + 1 }, (_, i) => along(x, y, i / n))
  const acc = [0]
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const out: [number, number, number][] = []
  let i = 0
  for (let s = offset % (dash + gap); s + dash <= acc[n]; s += dash + gap) {
    const m = s + dash / 2
    while (acc[i + 1] < m) i++
    const u = (m - acc[i]) / (acc[i + 1] - acc[i] || 1),
      a = pts[i],
      b = pts[i + 1]
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])])
  }
  return out
}
// Vệt mực của nét đứt: ba dáng xen nhau cho khỏi đều tăm tắp
const dashT = (i: number) => texOf(`dash:${i % 3}`, () => dashTex(32, 10, 3 + (i % 3)))
function lay(
  layer: Container,
  marks: [number, number, number][],
  len: number,
  thick: number,
  color: string,
  alpha: number,
  from = 0,
) {
  marks.forEach(([x, y, a], i) => {
    const s = (layer.children[from + i] as Sprite | undefined) ?? layer.addChild(new Sprite(dashT(from + i)))
    s.anchor.set(0.5)
    s.visible = true
    s.position.set(x, y)
    s.rotation = a
    s.width = len
    s.height = thick
    s.tint = hex(color)
    s.alpha = alpha
  })
  return from + marks.length
}

export class MapScene implements Scene {
  readonly root = new Container()
  private body = new Container()
  private routes = new Container()
  private lines = new Container()
  private troops = new Container()
  private marches: March[] = []
  private dust = new Container()
  private dustAt = 0
  private now = 0
  private t = 0

  constructor() {
    const pap = new TilingSprite({ texture: fxTex.paper(), width: 3000, height: MAP_H + 600 })
    pap.position.set(-1300, -300)
    pap.tileScale.set(0.5)
    pap.tint = 0xf3ead6
    this.root.addChild(pap, this.body)
    this.body.y = MAP.top
    const t = painted('map', () => mapTerrain(MAP.w, MAP.h, PEAKS, PINES, RIVER))
    const terrain = new Sprite(t.tex)
    terrain.scale.set(1 / t.scale)
    this.body.addChild(terrain, this.routes, this.lines)
    // ánh nước: đốm sáng trôi xuôi dòng, lấp lánh
    const sparkT = fxTex.spark()
    for (let i = 0; i < 22; i++) {
      const g = new Sprite(sparkT)
      g.anchor.set(0.5)
      g.blendMode = 'add'
      g.tint = i % 3 ? 0xe8f4ff : hex(C.azuriteL)
      g.width = g.height = 4 + (i % 3) * 2
      const off = i / 22,
        side = ((i * 7) % 5) - 2
      this.body.addChild(g)
      this.tickers.push(() => {
        const k = (off + this.t * 0.012) % 1
        const [x, y] = riverAt(k)
        g.position.set(x + side * 1.6 + Math.sin(this.t * 1.3 + i) * 1.2, y)
        g.alpha = Math.max(0, Math.sin(this.t * 2.2 + i * 1.7)) * 0.8
      })
    }
    // sương che vùng xa phía trên
    const fog = new TilingSprite({ texture: texOf('mist:0', () => mistTex(512, 96, 1)), width: 1400, height: 160 })
    fog.position.set(-500, -110)
    fog.tileScale.set(1.2, 1.6)
    fog.alpha = 0.95
    this.body.addChild(fog)
    this.tickers.push(dt => (fog.tilePosition.x += dt * 5))
    // tông môn nhà
    const home = painted('map:home', () => building('chuDien', 1).art)
    const hs = new Sprite(home.tex)
    hs.anchor.set(home.anchor[0], home.anchor[1])
    hs.scale.set(0.5 / home.scale)
    hs.position.set(HOME.x, HOME.y)
    this.body.addChild(hs, this.dust, this.troops)
    // bóng mây lướt chậm qua bản đồ (nhìn từ trên cao xuống)
    const glowT = fxTex.glow()
    for (const [x0, y0, w, sp] of [
      [60, 250, 260, 5],
      [300, 620, 300, -4],
      [120, 860, 240, 3],
    ] as const) {
      const sh = new Sprite(glowT)
      sh.anchor.set(0.5)
      sh.tint = hex(C.ink)
      sh.width = w
      sh.height = w * 0.55
      sh.alpha = 0.07
      this.body.addChild(sh)
      this.tickers.push(() =>
        sh.position.set(((x0 + this.t * sp + 700) % 700) - 150, y0 + Math.sin(this.t / 9 + x0) * 20),
      )
    }
    // hạc bay ngang, thưa
    const wings = [painted('crane:up', () => crane(true)), painted('crane:down', () => crane(false))]
    const flock = new Container()
    const birds = [
      [0, 0, 0.8],
      [26, 10, 0.62],
    ].map(([dx, dy, sc]) => {
      const b = new Sprite(wings[0].tex)
      b.anchor.set(wings[0].anchor[0], wings[0].anchor[1])
      b.scale.set(sc / wings[0].scale)
      b.position.set(dx, dy)
      flock.addChild(b)
      return b
    })
    this.body.addChild(flock)
    this.tickers.push(() => {
      const k = ((this.t + 6) % 50) / 30
      flock.visible = k < 1
      flock.position.set(460 - k * 560, 520 - k * 140 + Math.sin(this.t * 0.8) * 5)
      birds.forEach((b, i) => (b.texture = wings[Math.floor(this.t * 2.2 + i * 0.5) % 2].tex))
    })
  }
  private tickers: ((dt: number) => void)[] = []

  // open: các mục tiêu đã mở (vẽ đường nét đứt tới)
  set(game: State, open: Target[], now: number) {
    this.now = now
    this.marches = game.marches.filter(m => m.target.kind !== 'trib') // kiếp vân ở trên núi, không đi trên bản đồ vùng
    this.routes.removeChildren().forEach(c => c.destroy())
    for (const tg of open) {
      const p = place(tg)
      lay(this.routes, dashes(p.x, p.y, 3, 5), 4, 3, C.ink2, 0.45, this.routes.children.length)
    }
    while (this.troops.children.length > this.marches.length) this.troops.removeChildAt(0).destroy({ children: true })
    while (this.troops.children.length < this.marches.length) {
      const tk = painted('march', marchToken)
      const c = new Sprite(tk.tex)
      c.anchor.set(tk.anchor[0], tk.anchor[1])
      c.scale.set(1 / tk.scale)
      this.troops.addChild(c)
    }
  }

  tick(dt: number) {
    this.t += dt
    this.now += dt * 1000
    for (const f of this.tickers) f(dt)
    // nét son hành quân chạy về phía mục tiêu
    let used = 0
    this.marches.forEach((m, i) => {
      const p = place(m.target)
      used = lay(this.lines, dashes(p.x, p.y, 5, 5, (this.t * 12) % 10), 6.5, 4, C.cinnabar, 0.8, used)
      const [x, y] = along(p.x, p.y, marchK(m, this.now))
      this.troops.children[i]?.position.set(x, y - Math.abs(Math.sin(this.t * 6 + i)) * 1.5)
      if (this.t > this.dustAt) this.puff(x, y + 6)
    })
    if (this.t > this.dustAt) this.dustAt = this.t + 0.35
    for (let i = used; i < this.lines.children.length; i++) this.lines.children[i].visible = false
    // bụi sau bước quân: bung ra, mờ dần
    for (const d of [...this.dust.children] as Sprite[]) {
      const e = this.t - (d as Sprite & { t0: number }).t0
      if (e > 1.2) d.destroy()
      else ((d.width = d.height = 5 + e * 10), (d.alpha = 0.4 * (1 - e / 1.2)))
    }
  }

  private puff(x: number, y: number) {
    const d = Object.assign(new Sprite(fxTex.puff()), { t0: this.t })
    d.anchor.set(0.5)
    d.tint = hex(C.ochre)
    d.position.set(x + (Math.random() - 0.5) * 4, y)
    this.dust.addChild(d)
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}
