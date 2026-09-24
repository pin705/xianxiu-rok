// Thời gian trôi: sản lượng, việc hẹn giờ xong, hành quân tới nơi / về nhà — đúng thứ tự thời gian.
import { addGain, admit, battle, coolKey } from './battle.ts'
import { rollDay } from './calendar.ts'
import { rate, storage } from './stats.ts'
import { type Job, type JobKind, type State } from './types.ts'
import { addItems, count, HOUR, minus, plus, noGain } from './util.ts'
import { RESOURCES } from '../data.ts'

function accrue(s: State, t: number): State {
  const dt = t - s.time
  if (dt <= 0) return s // đồng hồ lùi: đứng yên chờ, không trừ
  const cap = storage(s)
  const res = { ...s.res }
  const carry = { ...s.carry }
  for (const r of RESOURCES) {
    const total = rate(s, r) * dt + carry[r]
    const gained = Math.floor(total / HOUR)
    if (res[r] + gained >= cap) {
      res[r] = Math.max(res[r], cap) // đầy kho thì ngừng sản xuất, nhưng không cắt phần đang vượt
      carry[r] = 0
    } else {
      res[r] += gained
      carry[r] = total % HOUR
    }
  }
  return { ...s, time: t, res, carry }
}

function arrive(s: State, id: number): State {
  const m = s.marches.find(x => x.id === id)!
  const others = s.marches.filter(x => x.id !== id)
  // Mục tiêu đã bị hạ trước khi tới: quay về tay không
  if ((s.cool[coolKey(m.target)] ?? 0) > m.arriveAt)
    return { ...s, marches: [...others, { ...m, back: m.army, hurt: {}, gain: noGain() }] }
  const r = battle({ ...s, marches: others }, m.target, m.elder, m.army, m.seed, m.arriveAt)
  const done = { ...m, back: r.back, hurt: r.hurt, gain: r.gain, report: r.report }
  return { ...r.state, marches: [...r.state.marches, done].sort((a, b) => a.id - b.id) }
}

function comeHome(s: State, id: number): State {
  const m = s.marches.find(x => x.id === id)!
  if (!m.back) return s // trận chưa giải (mầm ẩn ở client): chờ server báo kết quả
  const { state, dead } = admit({ ...s, marches: s.marches.filter(x => x.id !== id) }, m.hurt ?? {})
  let st = addGain({ ...state, troops: plus(state.troops, m.back ?? m.army) }, m.elder, m.gain ?? noGain())
  // Báo cho chiến báo của chuyến này biết bao nhiêu người không qua khỏi
  if (count(dead)) st = { ...st, reports: st.reports.map(r => (r.id === m.report ? { ...r, dead } : r)) }
  return st
}

type Due = [at: number, run: (s: State) => State]
export function due(s: State, now: number): Due[] {
  const ev: Due[] = []
  for (const j of s.queue)
    if (j.finishAt <= now)
      ev.push([
        j.finishAt,
        st => ({
          ...st,
          levels: { ...st.levels, [j.building]: j.level },
          queue: st.queue.filter(q => q.building !== j.building),
        }),
      ])
  const t = s.train
  if (t && t.finishAt <= now)
    ev.push([
      t.finishAt,
      st => ({
        ...st,
        train: null,
        troops: plus(st.troops, { [t.unit]: t.n }),
        stats: { ...st.stats, trained: st.stats.trained + t.n },
      }),
    ])
  const h = s.heal
  if (h && h.finishAt <= now)
    ev.push([
      h.finishAt,
      st => ({
        ...st,
        heal: null,
        troops: plus(st.troops, h.troops),
        wounded: minus(st.wounded, h.troops),
        stats: { ...st.stats, healed: st.stats.healed + count(h.troops) },
      }),
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
  return ev.sort((a, b) => a[0] - b[0])
}

// Đưa state tới thời điểm now. Mọi việc hẹn giờ xong theo đúng thứ tự thời gian:
// sản lượng trước lúc xong tính theo chỉ số cũ, sau đó theo chỉ số mới.
export function advance(s: State, now: number): State {
  let st = s
  for (const [at, run] of due(s, now)) st = run(rollDay(accrue(st, at), at))
  return rollDay(accrue(st, now), now)
}

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
