// Cảnh trận trên WebGL, diễn lại một chiến báo đã tính sẵn (luật tất định): mỗi lượt hai bên xông lên,
// kiếm khí / hoả cầu / sóng chấn / vuốt bay tới, trúng đòn thì mực văng, tia lửa, bật lùi, rung màn;
// quân ngã theo số thương vong và tan thành mực.
// Công pháp có hiệu ứng riêng: mưa kiếm (burst), khiên vàng (shield), hồi sinh (heal), độc vụ (weaken). Độ kiếp: sét.
// Từng phần một file trong battle/: field (sân, đội hình) · strikes (đòn đánh) · skills (công pháp) · losses (thương vong)
import { Container } from 'pixi.js'
import { PIGMENT as C, type Theme } from '@rok/art'
import type { Report, Skill } from '@rok/rules'
import { warm } from './stage'
import { REALM, REALM_TINT, THEME, paint, squad } from './battle/field'
import { boltT, burstT, clawT, orbT, ringT, slashT, streakT, type Kind, type Squad, type Tween } from './battle/kit'
import { tally } from './battle/losses'
import { cast } from './battle/skills'
import { attack, strikeAll } from './battle/strikes'

export class Battle {
  // Các lớp và trạng thái của cảnh: công khai cho các file trong battle/ (cảnh dựng theo phần, xem đầu file).
  // Ngoài world/ chỉ dùng wave, round, slam, jump, tick, destroy.
  readonly root = new Container()
  private cam = new Container() // camera: rung, giật zoom khi đòn nặng
  readonly field = new Container()
  readonly decal = new Container() // vết nứt trên mặt đất (dưới chân quân)
  readonly units = new Container({ sortableChildren: true })
  readonly fx = new Container()
  zoom = 0
  squads: Squad[][] = [[], []]
  private tweens: Tween[] = []
  t = 0
  shake = 0
  hold = 0 // khựng khung khi đòn nặng trúng (hit-stop): hiệu ứng đứng lại, màn vẫn rung
  readonly theme: Theme
  readonly enemy: Kind
  readonly tint: string
  readonly down = new Set<Container>() // hình đã ngã
  readonly tick_: ((dt: number) => void)[] = []

  constructor(
    readonly report: Report,
    readonly skills: [Skill | undefined, Skill | undefined],
    readonly w: number,
    readonly h: number,
  ) {
    this.theme = report.kind === 'realm' ? (REALM[report.i] ?? 'forest') : THEME[report.kind]
    this.enemy = report.kind === 'trib' ? 'spirit' : report.kind === 'sect' ? 'man' : 'beast'
    // yêu vương canh tầng tháp: lông chàm sẫm, khác yêu thú ngoài đồng
    this.tint =
      report.kind === 'realm' ? (REALM_TINT[report.i] ?? C.ochre) : report.kind === 'tower' ? C.indigo : C.ochre
    this.cam.pivot.set(w / 2, h / 2)
    this.cam.position.set(w / 2, h / 2)
    this.cam.addChild(this.field, this.decal, this.units, this.fx)
    this.root.addChild(this.cam)
    paint(this)
    this.wave(0)
    const shapes: Parameters<typeof warm>[0] = [
      ['slash', slashT],
      ['hit:0', burstT(0)],
      ['orb', orbT],
      ['ring', ringT],
      ['claw', clawT],
      ['hit:1', burstT(1)],
      ['hit:2', burstT(2)],
      ['streak', streakT],
    ]
    warm(shapes)
    if (report.kind === 'trib')
      warm(
        [1, 2, 3].map(n => [`bolt:${n}`, boltT(n)]),
        1,
      ) // sét chỉ một khung
  }

  // ---------- Diễn ----------

  // Dựng hai đội cho đợt `fi` (độ kiếp có 3 đợt; đệ tử sống sót đi tiếp)
  wave(fi: number) {
    const f = this.report.fights[fi]
    if (!f) return
    // hiệu ứng đang chờ của đợt cũ còn trỏ vào hình sắp huỷ (ghi .y vào hình đã huỷ là văng lỗi): bỏ hết cùng lúc
    this.tweens = []
    this.fx.removeChildren().forEach(c => c.destroy({ children: true }))
    this.decal.removeChildren().forEach(c => c.destroy({ children: true }))
    this.units.removeChildren().forEach(c => c.destroy({ children: true }))
    this.down.clear()
    this.squads = [f.a.troops, f.b.troops].map((troops, side) => {
      // quân ta chừa ~160 DU dưới chân cho tên trưởng lão + nút (màn thấp như 375×667 thì số quân khỏi đè chữ)
      const y = side ? this.h * 0.43 : Math.min(this.h * 0.8, this.h - 160)
      const n = troops.length
      const x0 = (this.w - 400) / 2 // đội hình nằm trong cột 400 DU ở giữa
      return troops.map((t, k) => squad(this, side, t.type, t.n, x0 + (400 / (n + 1)) * (k + 1), y, t.tier))
    })
    if (fi > 0) strikeAll(this)
  }

  // Một tween: fn(k) với k 0 → 1 trong dur giây, sau delay giây; end lúc xong
  add(dur: number, fn: (k: number) => void, end?: () => void, delay = 0) {
    this.tweens.push({ t0: this.t + delay, dur, fn, end })
  }

  // Lượt r (1..) của đợt fi: số quân sau lượt nằm trong report
  round(fi: number, r: number, dur: number) {
    const f = this.report.fights[fi]
    const rd = f?.rounds[r - 1]
    if (!rd) return
    for (const side of [0, 1]) if (rd.cast[side]) cast(this, side, dur)
    const lunge = dur * 0.22
    for (const side of [0, 1]) {
      const foes = this.squads[1 - side].filter(q => q.n > 0)
      for (const q of this.squads[side]) {
        if (!q.n || !foes.length) continue
        const dir = side ? 1 : -1
        const y0 = q.y
        this.add(lunge * 2, k => (q.c.y = y0 + Math.sin(k * Math.PI) * 10 * dir))
        const target = foes[Math.floor(Math.random() * foes.length)]
        attack(this, side, q, target, dur)
      }
    }
    // thương vong hiện ra khi đòn tới
    this.add(
      0.01,
      () => {},
      () => tally(this, rd.n, dur),
      dur * 0.5,
    )
  }

  // Dấu ấn thắng/bại đóng xuống: giật zoom, rung màn
  slam() {
    this.zoom = 0.05
    this.shake = 9
  }

  // Nhảy tới cuối (bỏ qua): số quân cuối của đợt cuối
  jump() {
    const fi = this.report.fights.length - 1
    this.wave(fi)
    const last = this.report.fights[fi].rounds.at(-1)
    if (last) tally(this, last.n, 0)
  }

  tick(dt: number) {
    const real = dt
    if (this.hold > 0) {
      this.hold -= dt
      dt = 0
    }
    this.t += dt
    for (const f of this.tick_) f(dt)
    this.tweens = this.tweens.filter(tw => {
      if (this.t < tw.t0) return true
      const k = Math.min(1, (this.t - tw.t0) / tw.dur)
      tw.fn(k)
      if (k >= 1) {
        tw.end?.()
        return false
      }
      return true
    })
    // rung màn giảm dần
    this.shake *= Math.exp(-real * 9)
    this.zoom *= Math.exp(-real * 7)
    this.cam.scale.set(1 + this.zoom)
    this.cam.position.set(
      this.w / 2 + (Math.random() - 0.5) * this.shake,
      this.h / 2 + (Math.random() - 0.5) * this.shake,
    )
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}
