// Thời gian trôi: sản lượng, việc hẹn giờ xong, hành quân tới nơi / về nhà — đúng thứ tự thời gian.
import { addGain, admit, battle, coolKey } from './battle.ts'
import { rollDay } from './calendar.ts'
import { festDrop, rollFest } from './fest.ts'
import { autoHeal, rate, storage, unitOf, wildRate } from './stats.ts'
import { type Job, type JobKind, type State, type TrainJob } from './types.ts'
import { addItems, compact, count, HOUR, minus, plus, noGain } from './util.ts'
import { LIGHT, RESOURCES, TRAIN_PTS, UNITS, hallGift, type Bag } from '../data.ts'
import { mail } from './mail.ts'

function accrue(s: State, t: number): State {
  const dt = t - s.time
  if (dt <= 0) return s // đồng hồ lùi: đứng yên chờ, không trừ
  const cap = storage(s)
  const res = { ...s.res }
  const carry = { ...s.carry }
  const yard: Bag = { ...(s.yard ?? { linhThach: 0, linhThao: 0, linhKhoang: 0 }) }
  for (const r of RESOURCES) {
    // Linh khí tự nhiên vào thẳng kho, sản lượng công trình nằm ở công trình chờ chạm thu (yard, đơn vị × ms như carry). Kho cộng
    // phần chờ thu chạm sức chứa thì cả hai ngừng (đầy kho thì ngừng sản xuất) — tính theo số ms nguyên còn chạy được tới lúc đầy,
    // nên kết quả không phụ thuộc số lần gọi advance
    const wild = wildRate(s, r),
      made = rate(s, r) - wild
    const room = cap * HOUR - res[r] * HOUR - carry[r] - yard[r]
    const run = Math.max(0, Math.min(dt, Math.floor(room / (wild + made))))
    const total = wild * run + carry[r]
    res[r] += Math.floor(total / HOUR)
    carry[r] = total % HOUR
    yard[r] += made * run
  }
  return { ...s, time: t, res, carry, ...((s.yard || RESOURCES.some(r => yard[r] > 0)) && { yard }) }
}

// Điểm tuyển của một lượt: theo bậc; nâng bậc chỉ tính phần chênh với bậc cũ
const trainPts = (t: TrainJob) => {
  const k = unitOf(t.unit).tier - 1
  return t.n * (TRAIN_PTS[k] - (t.up ? (TRAIN_PTS[k - 1] ?? 0) : 0))
}

// Tam Hệ Luyện Binh: đệ tử bậc 2 trở lên tuyển / nâng bậc xong, đếm theo hệ
function t2(s: State, t: TrainJob) {
  const u = unitOf(t.unit)
  if (u.tier < 2) return {}
  const k = `t2${u.type}` as 't2kiem' | 't2phap' | 't2the'
  return { [k]: (s.stats[k] ?? 0) + t.n }
}

function arrive(s: State, id: number): State {
  const m = s.marches.find(x => x.id === id)!
  const others = s.marches.filter(x => x.id !== id)
  // Mục tiêu đã bị hạ trước khi tới: quay về tay không
  if ((s.cool[coolKey(m.target)] ?? 0) > m.arriveAt)
    return { ...s, marches: [...others, { ...m, back: m.army, hurt: {}, gain: noGain() }] }
  const r = battle({ ...s, marches: others }, m.target, m.elder, m.army, m.seed, m.arriveAt, m.deputy)
  const done = { ...m, back: r.back, hurt: r.hurt, gain: r.gain, report: r.report }
  return { ...r.state, marches: [...r.state.marches, done].sort((a, b) => a.id - b.id) }
}

function comeHome(s: State, id: number): State {
  const m = s.marches.find(x => x.id === id)!
  if (!m.back) return s // trận chưa giải (mầm ẩn ở client): chờ server báo kết quả
  // thương nhẹ tự lành về đội luôn, thương nặng vào Đan phòng (quá chỗ thì tử trận)
  const light = compact(Object.fromEntries(UNITS.map(u => [u, Math.floor((m.hurt?.[u] ?? 0) * LIGHT)])))
  const heavy = compact(Object.fromEntries(UNITS.map(u => [u, (m.hurt?.[u] ?? 0) - (light[u] ?? 0)])))
  const { state, dead } = admit({ ...s, marches: s.marches.filter(x => x.id !== id) }, heavy)
  let st = addGain({ ...state, troops: plus(plus(state.troops, m.back ?? m.army), light) }, m.elder, m.gain ?? noGain())
  // khai mỏ: đếm tài nguyên mang về (sự kiện khai thác)
  if (m.task === 'gather' && m.gain) {
    const got = Object.values(m.gain.res).reduce((a, b) => a + (b ?? 0), 0)
    st = { ...st, stats: { ...st.stats, gathered: (st.stats.gathered ?? 0) + got } }
    if (got > 0) st = festDrop(st, 'gather', m.seed, m.returnAt) // Tích Cốc Phòng Cơ: có thể nhặt Linh Nang
  }
  // Báo cho chiến báo của chuyến này biết bao nhiêu người tự lành, bao nhiêu người không qua khỏi
  if (count(dead) || count(light))
    st = {
      ...st,
      reports: st.reports.map(r => (r.id === m.report ? { ...r, dead, ...(count(light) && { light }) } : r)),
    }
  return st
}

type Due = [at: number, run: (s: State) => State]
export function due(s: State, now: number): Due[] {
  const ev: Due[] = []
  for (const j of s.queue)
    if (j.finishAt <= now)
      ev.push([
        j.finishAt,
        st => {
          const done = {
            ...st,
            levels: { ...st.levels, [j.building]: j.level },
            queue: st.queue.filter(q => q.building !== j.building),
          }
          // Chủ điện lên tầng: quà mừng qua thư
          return j.building === 'chuDien'
            ? mail(done, { at: j.finishAt, k: 'hallUp', a: [j.level], gift: hallGift(j.level) })
            : done
        },
      ])
  for (const k of ['train', 'train2'] as const) {
    const t = s[k]
    if (t && t.finishAt <= now)
      ev.push([
        t.finishAt,
        st => ({
          ...st,
          [k]: null,
          troops: plus(st.troops, { [t.unit]: t.n }),
          stats: {
            ...st.stats,
            trained: st.stats.trained + t.n,
            trainPts: (st.stats.trainPts ?? 0) + trainPts(t),
            ...t2(st, t),
          },
        }),
      ])
  }
  const h = s.heal
  if (h && h.finishAt <= now)
    ev.push([
      h.finishAt,
      st =>
        autoHeal({
          ...st,
          heal: null,
          troops: plus(st.troops, h.troops),
          wounded: minus(st.wounded, h.troops),
          stats: { ...st.stats, healed: st.stats.healed + count(h.troops) },
        }), // tự chữa: đợt kế cho thương binh về trong lúc chữa
    ])
  const r = s.study
  if (r && r.finishAt <= now)
    ev.push([r.finishAt, st => ({ ...st, study: null, tech: { ...st.tech, [r.tech]: r.level } })])
  const b = s.brew
  if (b && b.finishAt <= now)
    ev.push([
      b.finishAt,
      st => ({
        ...st,
        brew: null,
        items: addItems(st.items, { [b.pill]: b.n }),
        stats: { ...st.stats, brewed: st.stats.brewed + b.n },
      }),
    ])
  const f = s.forge
  if (f && f.finishAt <= now)
    ev.push([
      f.finishAt,
      st => ({ ...st, forge: null, gear: { ...st.gear, [f.gear]: { ...st.gear[f.gear], lv: f.level } } }),
    ])
  for (const x of s.buffs)
    if (x.until && x.until <= now)
      ev.push([x.until, st => ({ ...st, buffs: st.buffs.filter(y => y.src !== x.src || y.until !== x.until) })])
  for (const m of s.marches) {
    // đi cướp: trận cần state của người kia — server giải (world.ts), ở đây chỉ chờ
    if (!m.back && m.seed && m.arriveAt <= now && (m.target.kind === 'beast' || m.target.kind === 'sect'))
      ev.push([m.arriveAt, st => arrive(st, m.id)])
    if (m.returnAt && m.returnAt <= now) ev.push([m.returnAt, st => comeHome(st, m.id)])
  }
  return ev.sort((p, q) => p[0] - q[0])
}

// Đưa state tới thời điểm now. Mọi việc hẹn giờ xong theo đúng thứ tự thời gian:
// sản lượng trước lúc xong tính theo chỉ số cũ, sau đó theo chỉ số mới.
export function advance(s: State, now: number): State {
  let st = s
  for (const [at, run] of due(s, now)) st = run(roll(accrue(st, at), at))
  return roll(accrue(st, now), now)
}
// Sang ngày / tuần / lượt sự kiện mới trước khi xử lý việc ở lúc t
const roll = (s: State, t: number) => rollFest(rollDay(s, t), t)

export const jobOf = (s: State, k: JobKind) => (k === 'build' ? (s.queue[0] ?? null) : s[k])

// Đồng môn giúp: bớt ms cho việc `job` của s (đúng việc đã nhờ — startAt khớp), tại lúc at. Việc đã đổi/xong thì không làm gì.
export function hasten(s: State, job: JobKind, startAt: number, ms: number, at: number): State {
  const st = advance(s, at)
  const j = jobOf(st, job)
  if (!j || j.startAt !== startAt || job === 'brew') return st
  return advance(shorten(st, job, ms), at)
}

// Rút ngắn việc k đang chờ ms (không sớm hơn lúc này) — tăng tốc bằng đan, đồng môn giúp
export function shorten(s: State, k: JobKind, ms: number): State {
  const j = jobOf(s, k)
  if (!j) return s
  const sped = { ...j, finishAt: Math.max(s.time, j.finishAt - ms) }
  return k === 'build' ? { ...s, queue: s.queue.map(x => (x === j ? (sped as Job) : x)) } : { ...s, [k]: sped }
}
