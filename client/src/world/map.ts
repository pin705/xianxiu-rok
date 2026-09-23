// Bản đồ vùng trên WebGL: giấy + địa hình vẽ tay (một texture), sương trôi ở rìa xa,
// đường tới các nơi đã mở (nét đứt mực), đường hành quân (nét son chạy), cờ quân nội suy theo giờ.
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { PIGMENT as C, building, mapTerrain, mistTex, paper, type Pt } from '@rok/art'
import { HOME, place, type March, type State, type Target } from '@rok/rules'
import { painted, texOf } from './stage'
import type { Scene } from './View.svelte'

export const MAP = { w: 400, h: 1000, top: 110, bottom: 170 }
export const MAP_H = MAP.h + MAP.top + MAP.bottom

const PEAKS = [
  [30, 690, 120, 90], [370, 650, 130, 110], [150, 600, 90, 70], [250, 470, 140, 100], [20, 360, 110, 120], [380, 330, 120, 90],
  [160, 260, 150, 120], [340, 160, 120, 110], [60, 170, 130, 100], [230, 110, 170, 90], [110, 900, 120, 60], [300, 960, 150, 70],
]
const PINES = [[40, 880], [352, 862], [130, 640], [270, 700], [20, 520], [205, 440], [370, 540], [100, 360], [300, 350], [150, 180]]
const RIVER: Pt[] = [[262, 0], [248, 90], [290, 170], [280, 250], [200, 340], [200, 460], [300, 560], [300, 660], [220, 760], [240, 860], [320, 950], [320, 1000]]

// Đường cong từ tông môn tới mục tiêu (dùng chung cho nét đường và vị trí cờ quân)
const ctrl = (x: number, y: number) => [(HOME.x + x) / 2 + (x < HOME.x ? 30 : -30), (HOME.y + y) / 2] as const
export function along(x: number, y: number, k: number): [number, number] {
  const [cx, cy] = ctrl(x, y)
  const u = 1 - k
  return [u * u * HOME.x + 2 * u * k * cx + k * k * x, u * u * HOME.y + 2 * u * k * cy + k * k * y]
}
// Tiến độ 0..1 của đội trên đường (đi rồi về)
export const marchK = (m: March, now: number) =>
  Math.max(0, Math.min(1, now < m.arriveAt ? (now - m.startAt) / (m.arriveAt - m.startAt) : 1 - (now - m.arriveAt) / (m.returnAt - m.arriveAt)))

function dashed(g: Graphics, x: number, y: number, dash: number, gap: number, offset = 0) {
  const n = 60
  let acc = -offset, prev = along(x, y, 0), on = true, run = dash
  g.moveTo(prev[0], prev[1])
  for (let i = 1; i <= n; i++) {
    const p = along(x, y, i / n)
    const d = Math.hypot(p[0] - prev[0], p[1] - prev[1])
    acc += d
    while (acc > run) {
      acc -= run
      on = !on
      run = on ? dash : gap
    }
    on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
    prev = p
  }
}

export class MapScene implements Scene {
  readonly root = new Container()
  private body = new Container()
  private routes = new Graphics()
  private lines = new Graphics()
  private troops = new Container()
  private marches: March[] = []
  private now = 0
  private t = 0

  constructor(seal: string) {
    const pap = new TilingSprite({ texture: texOf('paper', () => paper(256)), width: 3000, height: MAP_H + 600 })
    pap.position.set(-1300, -300)
    pap.tileScale.set(0.5)
    pap.tint = 0xf3ead6
    this.root.addChild(pap, this.body)
    this.body.y = MAP.top
    const t = painted('map', () => mapTerrain(MAP.w, MAP.h, PEAKS, PINES, RIVER))
    const terrain = new Sprite(t.tex)
    terrain.scale.set(1 / t.scale)
    this.body.addChild(terrain, this.routes, this.lines)
    // sương che vùng xa phía trên
    const fog = new TilingSprite({ texture: texOf('mist:0', () => mistTex(512, 96, 1)), width: 1400, height: 160 })
    fog.position.set(-500, -110)
    fog.tileScale.set(1.2, 1.6)
    fog.alpha = 0.95
    this.body.addChild(fog)
    this.tickers.push(dt => (fog.tilePosition.x += dt * 5))
    // tông môn nhà
    const home = painted(`map:home:${seal}`, () => building('chuDien', 1, seal).art)
    const hs = new Sprite(home.tex)
    hs.anchor.set(home.anchor[0], home.anchor[1])
    hs.scale.set(0.5 / home.scale)
    hs.position.set(HOME.x, HOME.y)
    this.body.addChild(hs, this.troops)
  }
  private tickers: ((dt: number) => void)[] = []

  // open: các mục tiêu đã mở (vẽ đường nét đứt tới)
  set(game: State, open: Target[], now: number) {
    this.now = now
    this.marches = game.marches
    this.routes.clear()
    for (const tg of open) {
      const p = place(tg)
      dashed(this.routes, p.x, p.y, 3, 5)
    }
    this.routes.stroke({ width: 1.3, color: C.ink2, alpha: 0.35 })
    while (this.troops.children.length > this.marches.length) this.troops.removeChildAt(0).destroy({ children: true })
    while (this.troops.children.length < this.marches.length) {
      const c = new Container()
      c.addChild(new Graphics().circle(0, 0, 8).fill({ color: hex(C.lacquer) }).stroke({ width: 1.3, color: hex(C.gold) }))
      c.addChild(new Graphics().moveTo(-2.5, 5).lineTo(-2.5, -6).stroke({ width: 1.2, color: hex(C.goldL) }).poly([-2, -6, 5, -4, -2, -1]).fill({ color: hex(C.cinnabar) }))
      this.troops.addChild(c)
    }
  }

  tick(dt: number) {
    this.t += dt
    this.now += dt * 1000
    for (const f of this.tickers) f(dt)
    // nét son hành quân chạy về phía mục tiêu
    this.lines.clear()
    this.marches.forEach((m, i) => {
      const p = place(m.target)
      dashed(this.lines, p.x, p.y, 5, 5, (this.t * 12) % 10)
      const [x, y] = along(p.x, p.y, marchK(m, this.now))
      this.troops.children[i]?.position.set(x, y)
    })
    if (this.marches.length) this.lines.stroke({ width: 2, color: hex(C.cinnabar), alpha: 0.75 })
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}

const hex = (c: string) => parseInt(c.slice(1), 16)
