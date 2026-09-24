// Cảnh núi tông môn trên WebGL. Hình tĩnh vẽ tay nướng thành texture một lần; mọi chuyển động
// (sương trôi, thác chảy, hạc bay, khói, lửa, linh khí, đèn đêm) do GPU diễn mỗi khung hình.
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { BUILDINGS, IDS, storage, type BuildingId, type State } from '@rok/rules'
import { SLOT } from './layout'
import type { Pt } from '@rok/art'
import { fxTex } from './stage'
import { burst, make, poke } from './home/bursts'
import { type Anim, type Play, type Slot } from './home/kit'
import { buildMountains, buildForeground } from './home/land'
import { life } from './home/life'
import { MOOD, buildSky, skyTex } from './home/sky'
import { buildSlots, place } from './home/slots'
import { buildStorm, buildWeather, strike } from './home/storm'

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export type HomeView = {
  game: State
  selected: BuildingId | null
  storm: number // độ kiếp: số đợt sét sẽ đánh (0 = trời yên)
  phase: Phase
}

// Trộn hai màu 0xRRGGBB
const lerpC = (a: number, b: number, k: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

const MAKERS = IDS.filter(id => BUILDINGS[id].makes)

export class Home {
  // Các lớp và trạng thái của cảnh: công khai cho các file trong home/ (cảnh dựng theo phần: trời, núi, sinh khí,
  // công trình, thời tiết, hiệu ứng). Ngoài world/ chỉ dùng set, burst, tick, topOf, destroy.
  readonly root = new Container()
  world = new Container() // giấy nền (nhuộm theo giờ)
  land = new Container() // núi, công trình… (nhuộm theo giờ, nằm trên lớp trời)
  glow = new Container() // đèn + linh khí (cộng sáng, không nhuộm màu theo giờ)
  far: Container[] = []
  sky = new Sprite()
  stormSky = new Sprite()
  sun = new Container()
  moon = new Container()
  stars = new Container()
  slots = new Map<BuildingId, Slot>()
  bLayer = new Container()
  aura = new Container() // sau công trình: tia vàng lúc lên tầng (背光)
  ring = new Sprite(fxTex.ring())
  scene = new Container() // mọi thứ rung khi sét đánh
  vortex = new Container() // xoáy kiếp vân: sau núi, không nhuộm theo giờ
  stormFx = new Container() // sét: trước công trình
  rain: TilingSprite[] = []
  flash = new Graphics()
  private flashA = 0
  shakeA = 0
  private plays: Play[] = []
  lamps: Sprite[] = []
  fair: Container[] = [] // mây lành, hạc: tan khi trời kiếp
  day: Container[] = [] // tia nắng, bướm: chỉ ban ngày, trời yên
  night: Container[] = [] // đom đóm: chỉ khi tối
  dust = new Container() // bụi dưới chân công trình (nhuộm theo giờ)
  over = new Container() // vật phẩm bay lên (không nhuộm)
  private picked: BuildingId | null = null
  private makeAt = 3
  private maker = 0
  anims: Anim[] = []
  private t = 0 // đồng hồ cảnh (đứng yên khi giảm chuyển động)
  rt = 0 // đồng hồ thật, cho hiệu ứng thoáng qua
  private mood = MOOD.day
  private stormK = 0 // 0 trời yên … 1 kiếp vân phủ kín
  private cloud = false
  storm = { n: 0, at: 0, struck: 0, eye: [0, 0] as Pt, flare: 0 }
  lightsLevel = 0
  private view?: HomeView
  still: boolean
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(opts: { still?: boolean } = {}) {
    this.still = !!opts.still
    const glowT = fxTex.glow()
    const sparkT = fxTex.spark()
    // thứ tự dựng = thứ tự lớp (sau → trước)
    buildSky(this, glowT, sparkT)
    buildMountains(this, glowT)
    life(this, sparkT)
    buildSlots(this, glowT)
    buildForeground(this)
    buildWeather(this, sparkT)
    // nướng sẵn kiếp vân lúc rảnh để khi độ kiếp không bị khựng
    if (!this.still)
      (globalThis.requestIdleCallback ?? setTimeout)(
        () => this.root.destroyed || this.vortex.children.length || buildStorm(this),
      )
  }

  // Cập nhật theo state game: hình công trình theo tầng, đang xây, chưa mở, đang chọn, trời theo giờ
  set(v: HomeView) {
    this.view = v
    this.mood = MOOD[v.phase]
    this.sky.texture = skyTex(v.phase)
    // kiếp vân công khai đang tụ (server giải lúc giáng): trời tối sẵn, chưa có sét
    this.cloud = v.game.marches.some(m => m.target.kind === 'trib')
    if ((v.storm || this.cloud) && !this.vortex.children.length) buildStorm(this)
    if (v.storm && !this.storm.n) Object.assign(this.storm, { at: this.rt, struck: 0 })
    this.storm.n = v.storm
    const g = v.game
    for (const id of IDS) place(this, id, g)
    if (v.selected && v.selected !== this.picked && !this.still) poke(this, v.selected)
    this.picked = v.selected
    const sel = v.selected && this.slots.get(v.selected)
    this.ring.visible = !!sel && !this.still
    if (sel && v.selected) {
      const [x, y, w] = SLOT[v.selected]
      this.ring.position.set(x, y + 1)
      this.ring.width = w + 12
      this.ring.height = 18
    }
  }

  play(c: Container, dur: number, step: (e: number) => void, layer: Container = this.glow) {
    layer.addChild(c)
    this.plays.push({ t0: this.rt, dur, c, step })
    step(0)
  }
  flashAt(a: number, color: number) {
    if (this.reduced) a *= 0.4
    this.flash.tint = color
    this.flashA = Math.max(this.flashA, a)
  }

  // Mỗi khung hình. cam: DU đang cuộn tới (để thị sai núi xa)
  tick(dt: number, cam: number) {
    this.rt += dt
    if (!this.reduced) this.t += dt
    const t = this.t
    for (const a of this.anims) a(t, this.reduced ? 0 : dt)
    for (const s of this.slots.values()) for (const a of s.anims) a(t, dt)
    this.far.forEach((f, i) => (f.y = cam * (0.5 - i * 0.2)))
    // trời chuyển dần sang kiếp vân và trở lại
    const st = this.storm
    this.stormK += ((st.n || this.cloud ? 1 : 0) - this.stormK) * Math.min(1, dt * 2.2)
    const k = this.stormK,
      m = this.mood,
      sm = MOOD.storm
    this.world.tint = this.land.tint = lerpC(m.tint, sm.tint, k)
    this.stormSky.alpha = k
    this.sun.alpha = m.sun * (1 - k)
    this.moon.alpha = m.moon * (1 - k)
    this.stars.alpha = m.stars * (1 - k)
    for (const f of this.fair) f.alpha = 1 - k
    this.stormFx.visible = this.vortex.visible = k > 0.01
    this.stormFx.alpha = this.vortex.alpha = k
    this.rain.forEach((r, i) => {
      r.visible = k > 0.01
      r.alpha = k * (i ? 0.35 : 0.6)
      r.tilePosition.x -= dt * (i ? 50 : 110)
      r.tilePosition.y += dt * (i ? 240 : 420)
    })
    if (st.n) while (st.struck < st.n && this.rt - st.at >= 0.7 + st.struck * 1.2) strike(this, ++st.struck === st.n)
    st.flare *= Math.exp(-dt * 4)
    if (this.view && !this.still && !st.n && !this.reduced && this.rt > this.makeAt) {
      this.makeAt = this.rt + 1.7
      const g = this.view.game,
        cap = storage(g)
      const ids = MAKERS.filter(id => g.levels[id] > 0 && g.res[BUILDINGS[id].makes!] < cap)
      if (ids.length) make(this, ids[this.maker++ % ids.length])
    }
    // đèn theo giờ, chập chờn nhẹ
    this.lightsLevel += (m.lights + (sm.lights - m.lights) * k - this.lightsLevel) * Math.min(1, dt * 2)
    let i = 0
    for (const s of this.slots.values())
      for (const l of s.lights) l.alpha = this.lightsLevel * (0.75 + 0.2 * Math.sin(t * 3 + i++))
    for (const l of this.lamps) l.alpha = this.lightsLevel * (0.7 + 0.25 * Math.sin(t * 4.3 + l.x))
    const dark = Math.min(1, this.lightsLevel * 1.4)
    for (const d of this.day) {
      d.alpha = (1 - dark) * (1 - k)
      d.visible = d.alpha > 0.02
    }
    for (const n of this.night) n.alpha = dark * (1 - k) * Math.max(0, Math.sin(t * 1.9 + n.x))
    // hiệu ứng thoáng qua, loé sáng, rung
    this.plays = this.plays.filter(p => {
      const e = this.rt - p.t0
      if (e >= p.dur) {
        p.step(p.dur)
        p.c.destroy({ children: true })
        return false
      }
      p.step(e)
      return true
    })
    this.flash.alpha = this.flashA
    this.flashA *= Math.exp(-dt * 5)
    const sh = this.reduced ? 0 : this.shakeA
    this.scene.position.set((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh)
    this.shakeA *= Math.exp(-dt * 7)
    if (this.ring.visible) this.ring.alpha = 0.65 + 0.35 * Math.sin(t * 4.5)
  }

  // Lên tầng: cột sáng vàng, sóng vòng, tia vàng rơi (home/bursts.ts)
  burst(id: BuildingId) {
    burst(this, id)
  }

  topOf(id: BuildingId) {
    return this.slots.get(id)?.top ?? 60
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}
