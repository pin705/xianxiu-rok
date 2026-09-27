// Tranh Đoạt Linh Châu (Ark of Osiris giản lược — doc 6 mục 3.2): tiên minh đấu tiên minh trên chiến trường 11 ô theo hiệp.
// Ghi danh cả tuần (trưởng lão / minh chủ); 20h Chủ nhật server dựng trận (arkStep), mỗi ARK_ROUND giải một hiệp tất định: đội đi
// theo lệnh đứng, ô có hai bên thì đánh, chiếm / giữ ra điểm, Linh Châu hộ tống về Tiểu Trận mình giữ. Hết hiệp cuối: quà + điểm minh chiến.
import { no } from '../core/action.ts'
import { weekOf } from '../core/calendar.ts'
import { int, oneOf } from '../core/parse.ts'
import { power } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { DAY } from '../core/util.ts'
import {
  ARK_ADJ,
  ARK_CENTER,
  ARK_DAY,
  ARK_HOME,
  ARK_HOUR,
  ARK_LOSE,
  ARK_MAX,
  ARK_MIN,
  ARK_ROUND,
  ARK_ROUNDS,
  ARK_SKILLS,
  type ArkSkill,
  ARK_WIN,
  DAY_OFFSET,
  LEAGUE_LOSE,
  LEAGUE_PLAYOFF,
  LEAGUE_WIN,
  PVP_HALL,
  PVP_START,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  allyOf,
  elo,
  type Alliance,
  type Ark,
  type ArkFight,
  type Players,
  type World,
  type WorldActions,
} from './base.ts'
import { arkRound } from './fight.ts'

// Lúc dựng trận tuần wk (20h Chủ nhật giờ VN); hiệp r (1..ARK_ROUNDS) giải lúc start + r × ARK_ROUND
export const arkAt = (wk: number) => (wk * 7 + 4 + ARK_DAY) * DAY - DAY_OFFSET + ARK_HOUR * 3_600_000
export const arkOf = (w: World): Ark => w.ark ?? { on: -1, done: -1, signed: [], live: [], last: [] }
const home = (side: 0 | 1) => ARK_HOME[side]
// Chiến binh: người tầng ≥ PVP_HALL, lực chiến cao trước, tối đa ARK_MAX
const warriors = (al: Alliance, ps: Players) =>
  Object.keys(al.members)
    .map(Number)
    .filter(p => (ps.get(p)?.levels.chuDien ?? 0) >= PVP_HALL)
    .sort((x, y) => power(ps.get(y)!) - power(ps.get(x)!) || x - y)
    .slice(0, ARK_MAX)
export type ArkAction =
  | { type: 'arkSign' }
  | { type: 'arkUnsign' }
  | { type: 'arkOrder'; to: number; all?: boolean }
  | { type: 'arkSkill'; k: ArkSkill }
const officer = (w: World, pid: number) => {
  const al = allyOf(w, pid)
  return al && al.members[pid] >= 1 ? al : undefined
}
export const arkActions: WorldActions<ArkAction> = {
  arkSign: {
    pick: () => ({ type: 'arkSign' }),
    run: ({ ps, w, pid }) => {
      const al = officer(w, pid)
      if (!al) return no('locked')
      const ark = arkOf(w)
      if (ark.signed.includes(al.id)) return no('claimed')
      if (warriors(al, ps).length < ARK_MIN) return no('weak')
      return { ok: true, changed: new Map(), world: { ...w, ark: { ...ark, signed: [...ark.signed, al.id] } } }
    },
  },
  arkUnsign: {
    pick: () => ({ type: 'arkUnsign' }),
    run: ({ w, pid }) => {
      const al = officer(w, pid)
      const ark = arkOf(w)
      if (!al || !ark.signed.includes(al.id)) return no('locked')
      return {
        ok: true,
        changed: new Map(),
        world: { ...w, ark: { ...ark, signed: ark.signed.filter(x => x !== al.id) } },
      }
    },
  },
  // chiến pháp (người điều phối — trưởng lão / minh chủ của chính minh đang đánh): mỗi trận mỗi chiến pháp một lần, hiệu lực hiệp kế
  arkSkill: {
    pick: a => (oneOf(Object.keys(ARK_SKILLS))(a.k) ? { type: 'arkSkill', k: a.k as ArkSkill } : null),
    run: ({ w, pid }, a) => {
      const ark = arkOf(w)
      const k = ark.live.findIndex(f => f.units.some(u => u.pid === pid))
      if (k < 0) return no('locked')
      const f = ark.live[k]
      const me = f.units.find(u => u.pid === pid)!
      if (officer(w, pid)?.id !== (me.side ? f.b : f.a)) return no('locked')
      if (f.round >= ARK_ROUNDS) return no('gone')
      const used = f.used ?? [[], []]
      if (used[me.side].includes(a.k)) return no('claimed')
      const nu: [ArkSkill[], ArkSkill[]] = me.side ? [used[0], [...used[1], a.k]] : [[...used[0], a.k], used[1]]
      const buffs = [...(f.buffs ?? []), { side: me.side, k: a.k, r: f.round + 1 }]
      const live = ark.live.map((x, j) => (j === k ? { ...f, used: nu, buffs } : x))
      return { ok: true, changed: new Map(), world: { ...w, ark: { ...ark, live } } }
    },
  },
  // lệnh đứng: đội mình (hay cả minh — trưởng lão / minh chủ) tới ô `to` (mọi ô trừ Linh Đài bên kia)
  arkOrder: {
    pick: a =>
      int(0, ARK_ADJ.length - 1)(a.to)
        ? { type: 'arkOrder', to: a.to as number, ...(a.all === true && { all: true }) }
        : null,
    run: ({ w, pid }, a) => {
      const ark = arkOf(w)
      const k = ark.live.findIndex(f => f.units.some(u => u.pid === pid))
      if (k < 0) return no('locked')
      const f = ark.live[k]
      const me = f.units.find(u => u.pid === pid)!
      if (a.to === home(me.side ? 0 : 1)) return no('bad') // Linh Đài bên kia: không vào được
      if (a.all && officer(w, pid)?.id !== (me.side ? f.b : f.a)) return no('locked') // trưởng lão của chính minh đang đánh
      const units = f.units.map(u => ((a.all ? u.side === me.side : u.pid === pid) ? { ...u, to: a.to } : u))
      const live = ark.live.map((x, j) => (j === k ? { ...f, units } : x))
      return { ok: true, changed: new Map(), world: { ...w, ark: { ...ark, live } } }
    },
  },
}

// Dựng một trận: đội ở Linh Đài mình, lệnh mặc định tới Trung Điện
function setup(ps: Players, A: Alliance, B: Alliance): ArkFight {
  const units = ([A, B] as const).flatMap((al, side) =>
    warriors(al, ps).map(pid => ({
      pid,
      side: side as 0 | 1,
      at: home(side as 0 | 1),
      to: ARK_CENTER,
      n: [],
      nm: ps.get(pid)?.name,
    })),
  )
  return {
    a: A.id,
    b: B.id,
    an: A.tag,
    bn: B.tag,
    round: 0,
    units,
    own: ARK_ADJ.map((_, i) => (i === ARK_HOME[0] ? 0 : i === ARK_HOME[1] ? 1 : null)),
    pts: [0, 0],
    taken: [[], []],
    charged: [[], []],
    orb: null,
    log: [],
  }
}

type Cup = NonNullable<Ark['cup']>
type CupStage = NonNullable<ArkFight['cup']>
// Vòng playoff (LEAGUE_PLAYOFF): tuần của trận Linh Châu cuối cùng xong trước khi mùa hết (end)
const lastWeek = (end: number) => {
  let wk = weekOf(end)
  while (arkAt(wk) + ARK_ROUNDS * ARK_ROUND > end) wk--
  return wk
}
// ghi kết quả một trận playoff: bán kết vào danh sách thắng / thua, chung kết / tranh hạng ba thành [thắng, thua]
const cupDone = (c: Cup, k: CupStage, win: number, lose: number): Cup =>
  k === 'semi' ? { ...c, win: [...c.win, win], lose: [...c.lose, lose] } : { ...c, [k]: [win, lose] }
// Dựng trận playoff của tuần: bán kết (bốn minh đầu bảng giải) hay chung kết + tranh hạng ba (sau bán kết). Minh không ra được trận
// (thiếu chiến binh) xử thua ngay; cả hai cùng thiếu thì hạt giống cao hơn đi tiếp
function cupSetup(ps: Players, w: World, ark: Ark, stage: 'semi' | 'final') {
  const seeds =
    ark.cup?.seeds ??
    leagueBoard(w)
      .slice(0, LEAGUE_PLAYOFF)
      .map(x => x.id)
  if (stage === 'semi' && seeds.length < LEAGUE_PLAYOFF) return null
  if (stage === 'final' && (!ark.cup || ark.cup.win.length < 2 || ark.cup.final)) return null
  let cup: Cup = stage === 'semi' ? { seeds, win: [], lose: [] } : ark.cup!
  const pairs: [number, number, CupStage][] =
    stage === 'semi'
      ? [
          [seeds[0], seeds[3], 'semi'],
          [seeds[1], seeds[2], 'semi'],
        ]
      : [
          [cup.win[0], cup.win[1], 'final'],
          [cup.lose[0], cup.lose[1], 'third'],
        ]
  const ok = (id: number) => !!w.allies[id] && warriors(w.allies[id], ps).length >= ARK_MIN
  const live: ArkFight[] = []
  for (const [a, b, k] of pairs)
    if (ok(a) && ok(b)) live.push({ ...setup(ps, w.allies[a], w.allies[b]), cup: k })
    else cup = ok(b) && !ok(a) ? cupDone(cup, k, b, a) : cupDone(cup, k, a, b)
  return { ids: pairs.flatMap(([a, b]) => [a, b]), live, cup }
}

// Mỗi lần server gọi (theo giờ): tới 20h Chủ nhật thì dựng trận cho các minh đã ghi danh (ghép theo điểm minh chiến; hai tuần cuối
// mùa — end: lúc mùa hết — thêm trận playoff), rồi giải từng hiệp tới hạn; hết hiệp cuối thì quà qua thư, đổi điểm minh chiến (dùng
// chung với Luận Kiếm Minh Chiến), lưu kết quả
export function arkStep(ps: Players, w: World, now: number, seed: number, end?: number) {
  const changed: Players = new Map()
  const ark = arkOf(w)
  // trận của tuần trước chưa kết thúc (server tắt qua thứ Hai): kết thúc nó trước, quà và điểm như thường
  const wk = ark.live.length && ark.on > ark.done ? ark.on : weekOf(now)
  const start = arkAt(wk)
  if (now < start || ark.done >= wk) return { changed, world: w }
  let next: Ark = ark
  if (ark.on < wk) {
    const pts = (id: number) => w.war?.pts[id] ?? PVP_START
    const last = end === undefined ? null : lastWeek(end)
    const stage = wk === last ? 'final' : last !== null && wk === last - 1 ? 'semi' : null
    const cup = stage && cupSetup(ps, w, ark, stage)
    const teams = ark.signed
      .filter(id => !cup?.ids.includes(id)) // minh vào playoff đánh trận playoff
      .map(id => w.allies[id])
      .filter((al): al is Alliance => !!al && warriors(al, ps).length >= ARK_MIN)
      .sort((x, y) => pts(y.id) - pts(x.id) || x.id - y.id)
    const live: ArkFight[] = [...(cup?.live ?? [])]
    for (let k = 0; k + 1 < teams.length; k += 2) live.push(setup(ps, teams[k], teams[k + 1]))
    next = { ...ark, on: wk, live, signed: [], ...(cup && { cup: cup.cup }) } // ghi danh đã dùng; ghi danh trong giờ trận là cho tuần sau
  }
  const due = Math.min(ARK_ROUNDS, Math.floor((now - start) / ARK_ROUND))
  if (next.live.some(f => f.round < due))
    next = {
      ...next,
      live: next.live.map((f, k) => {
        let x = f
        while (x.round < due) x = arkRound(ps, x, (seed + k * 31) >>> 0)
        return x
      }),
    }
  // chưa hết trận: chỉ đổi phần chung khi vừa dựng trận hay vừa giải hiệp (không thì server khỏi báo lại mỗi nhịp)
  if (due < ARK_ROUNDS && next.live.length) return { changed, world: next === ark ? w : { ...w, ark: next } }
  // hết trận: minh nhiều điểm thắng (bằng điểm: minh ít điểm minh chiến hơn thắng); đổi điểm minh chiến, quà cho mọi người
  const war = { ...(w.war ?? { done: -1, signed: [], pts: {}, last: [] }), pts: { ...w.war?.pts } }
  const league = { ...ark.league }
  let cup = next.cup
  const score = (id: number, won: boolean) => {
    const [wn, l, p] = league[id] ?? [0, 0, 0]
    league[id] = won ? [wn + 1, l, p + LEAGUE_WIN] : [wn, l + 1, p + LEAGUE_LOSE]
  }
  const last = next.live.map(f => {
    const pa = war.pts[f.a] ?? PVP_START,
      pb = war.pts[f.b] ?? PVP_START
    const aWins = f.pts[0] > f.pts[1] || (f.pts[0] === f.pts[1] && pa < pb)
    const d = elo(pa, pb, aWins)
    war.pts[f.a] = pa + d
    war.pts[f.b] = pb - d
    // Cửu Thiên Luận Đạo Hội: trận thường cộng điểm giải, trận playoff ghi vào nhánh đấu
    if (f.cup && cup) cup = aWins ? cupDone(cup, f.cup, f.a, f.b) : cupDone(cup, f.cup, f.b, f.a)
    else {
      score(f.a, aWins)
      score(f.b, !aWins)
    }
    // quà cho người đã ra trận (đội trên chiến trường), dù sau đó rời minh
    for (const u of f.units) {
      const s: State | undefined = changed.get(u.pid) ?? ps.get(u.pid)
      const win = u.side === 0 ? aWins : !aWins
      const rank = 1 + f.units.filter(v => v.side === u.side && (v.sc ?? 0) > (u.sc ?? 0)).length // hạng công huân trong bên mình
      const a = [win ? 1 : 0, u.side ? f.an : f.bn, f.pts[u.side], f.pts[u.side ? 0 : 1], u.sc ?? 0, rank] as [
        0 | 1,
        string,
        number,
        number,
        number,
        number,
      ]
      if (s) changed.set(u.pid, mail(s, { at: now, k: 'ark', a, gift: win ? ARK_WIN : ARK_LOSE }))
    }
    return { a: f.a, b: f.b, an: f.an, bn: f.bn, wa: f.pts[0], wb: f.pts[1] }
  })
  // hết trận tuần trước bán kết: chốt luôn bốn hạt giống (Luận Kiếm Đặt Cược cần biết trước cặp đấu — world/bets.ts)
  const seeds = leagueBoard(w, league)
    .slice(0, LEAGUE_PLAYOFF)
    .map(x => x.id)
  if (!cup && end !== undefined && wk === lastWeek(end) - 2 && seeds.length === LEAGUE_PLAYOFF)
    cup = { seeds, win: [], lose: [] }
  return {
    changed,
    world: {
      ...w,
      war,
      ark: {
        on: wk,
        done: wk,
        signed: next.signed,
        live: [],
        last: last.length ? last : ark.last,
        league,
        ...(cup && { cup }),
      },
    },
  }
}

// Phần client cần (bảng ally): minh mình đã ghi danh chưa, trận đang đánh của minh mình, kết quả tuần trước
export type ArkRow = ReturnType<typeof arkRow>
export function arkRow(w: World, aid: number) {
  const ark = arkOf(w)
  return {
    signed: ark.signed.includes(aid),
    live: ark.live.find(f => f.a === aid || f.b === aid) ?? null,
    last: ark.last.filter(x => x.a === aid || x.b === aid),
    league: leagueBoard(w).slice(0, 8), // Cửu Thiên Luận Đạo Hội: 8 minh đầu
    cup: ark.cup && { ...ark.cup, tags: Object.fromEntries(ark.cup.seeds.map(id => [id, w.allies[id]?.tag ?? '?'])) },
  }
}
// Hạng giải cuối mùa: có playoff thì theo chung kết rồi tranh hạng ba, sau đó theo bảng giải (bỏ minh đã giải tán)
export function leagueRank(w: World) {
  const c = arkOf(w).cup
  const top = [...(c?.final ?? []), ...(c?.third ?? [])]
  return [...top, ...leagueBoard(w).map(x => x.id)].filter((id, k, all) => w.allies[id] && all.indexOf(id) === k)
}
// Bảng Cửu Thiên Luận Đạo Hội của mùa: điểm giải cao trước, bằng thì nhiều trận thắng hơn, rồi mã minh
export const leagueBoard = (w: World, league = arkOf(w).league ?? {}) =>
  Object.entries(league)
    .filter(([id]) => w.allies[Number(id)])
    .map(([id, [wn, l, pts]]) => ({ id: Number(id), tag: w.allies[Number(id)].tag, w: wn, l, pts }))
    .sort((a, b) => b.pts - a.pts || b.w - a.w || a.id - b.id)
