// Luận Kiếm Đặt Cược (League Bets của RoK — doc 5 F12): vòng playoff Cửu Thiên Luận Đạo Hội, trước mỗi vòng ai trong giới cũng cược
// Phi Thăng Tệ vào một bên của từng trận — bán kết khi bốn hạt giống đã chốt (hết trận Linh Châu tuần trước bán kết), chung kết và
// tranh hạng ba khi bán kết xong. Đoán đúng nhận lại tệ × BET_ODDS của vòng; đoán sai được hoàn sau chung kết (như RoK). Server trả
// cược sau mỗi nhịp Linh Châu (betSettle); hết mùa còn cược chưa giải thì hoàn cả (world/season.ts).
import { no } from '../core/action.ts'
import { int, isId } from '../core/parse.ts'
import { BET_MAX, BET_ODDS } from '../data.ts'
import { coins } from '../sect/honor.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'

type Bet = NonNullable<World['bets']>[number]
type Stage = Bet['k']
// Các trận đang nhận cược: [vòng, bên a, bên b]; trận playoff đang đánh thì đóng
export function betOpen(w: World): [Stage, number, number][] {
  const c = w.ark?.cup
  if (!c || c.seeds.length < 4 || w.ark?.live.some(f => f.cup)) return []
  if (!c.win.length && !c.lose.length)
    return [
      ['semi', c.seeds[0], c.seeds[3]],
      ['semi', c.seeds[1], c.seeds[2]],
    ]
  if (c.win.length === 2 && !c.final)
    return [
      ['final', c.win[0], c.win[1]],
      ['third', c.lose[0], c.lose[1]],
    ]
  return []
}
// Trận của một cược đã có kết quả chưa: true đoán trúng, false trượt, undefined chưa đánh
function result(w: World, b: Bet) {
  const c = w.ark?.cup
  if (!c) return undefined
  if (b.k === 'semi') return c.win.includes(b.on) ? true : c.lose.includes(b.on) ? false : undefined
  const r = c[b.k]
  return r && r[0] === b.on
}

export type BetAction = { type: 'leagueBet'; on: number; n: number }
export const betActions: WorldActions<BetAction> = {
  leagueBet: {
    pick: a =>
      isId(a.on) && int(1, BET_MAX)(a.n) ? { type: 'leagueBet', on: a.on as number, n: a.n as number } : null,
    run: ({ w, s, pid }, a) => {
      const m = betOpen(w).find(x => x[1] === a.on || x[2] === a.on)
      if (!m) return no('gone')
      const same = (b: Bet) => b.pid === pid && b.k === m[0] && (b.on === m[1] || b.on === m[2])
      const had = (w.bets ?? []).find(same)
      if (had && had.on !== a.on) return no('taken') // mỗi trận chỉ cược một bên
      const n = (had?.n ?? 0) + a.n
      if (n > BET_MAX) return no('limit')
      if (coins(s) < a.n) return no('not_enough')
      return {
        ok: true,
        changed: new Map([[pid, { ...s, coinSpent: (s.coinSpent ?? 0) + a.n }]]),
        world: { ...w, bets: [...(w.bets ?? []).filter(b => !same(b)), { pid, k: m[0], on: a.on, n }] },
      }
    },
  },
}

// Trả cược (all: hết mùa — hoàn mọi cược còn lại): trận vừa có kết quả thì đoán trúng nhận tệ × hệ số, đoán trượt đánh dấu chờ;
// playoff xong (có chung kết và hạng ba) thì hoàn phần trượt. Mỗi lần trả một thư
export function betSettle(ps: Players, w: World, now: number, all = false) {
  const changed: Players = new Map()
  const c = w.ark?.cup
  const over = all || (!!c?.final && !!c.third)
  const pay = (b: Bet, win: 0 | 1, n: number) => {
    const s = changed.get(b.pid) ?? ps.get(b.pid)
    const a: [0 | 1, string, Stage, number] = [win, w.allies[b.on]?.tag ?? '?', b.k, n]
    if (s) changed.set(b.pid, mail({ ...s, coinSpent: (s.coinSpent ?? 0) - n }, { at: now, k: 'bet', a }))
  }
  const bets: Bet[] = []
  for (const b of w.bets ?? []) {
    const r = b.lost ? false : result(w, b)
    if (r === true) pay(b, 1, Math.floor(b.n * BET_ODDS[b.k]))
    else if (over) pay(b, 0, b.n)
    else bets.push(r === false ? { ...b, lost: true } : b)
  }
  const same = bets.length === (w.bets?.length ?? 0) && bets.every((b, k) => b === w.bets![k])
  return { changed, world: same ? w : { ...w, bets } } // chưa trận nào có kết quả: giữ nguyên để server khỏi báo lại
}

// Cho client (tab Mùa): trận đang nhận cược (hiệu minh hai bên), cược của người hỏi
export type BetView = ReturnType<typeof betView>
export const betView = (w: World, pid: number) => ({
  open: betOpen(w).map(([k, a, b]) => ({ k, a, b, ta: w.allies[a]?.tag ?? '?', tb: w.allies[b]?.tag ?? '?' })),
  mine: (w.bets ?? []).filter(b => b.pid === pid).map(b => ({ ...b, tag: w.allies[b.on]?.tag ?? '?' })),
})
