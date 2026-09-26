// Thiên Mệnh Chọn Luật (thay ghép cặp / bỏ phiếu KvK của RoK): VOTE_DAYS ngày cuối mùa, ai trong giới cũng chọn một luật (RULES) cho mùa
// sau, đổi phiếu được tới hết mùa; hết mùa luật nhiều phiếu nhất thành luật của mùa mới (world/season.ts), tăng ích cả giới (worldBuffs).
import { SEASON_DAYS } from '../atlas.ts'
import { no } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { RULES, VOTE_DAYS } from '../data.ts'
import type { World, WorldActions } from './base.ts'

// Còn mở bỏ phiếu vào ngày day của mùa
export const voteOpen = (day: number | undefined) => day !== undefined && day >= SEASON_DAYS - VOTE_DAYS
// Số phiếu từng luật; luật thắng (nhiều phiếu nhất, bằng thì luật đứng trước; chưa ai bỏ: không có)
export const voteTally = (w: World) => RULES.map((_, k) => Object.values(w.votes ?? {}).filter(v => v === k).length)
export function voteWinner(w: World) {
  const t = voteTally(w)
  const best = Math.max(...t)
  return best > 0 ? t.indexOf(best) : undefined
}

export type VoteAction = { type: 'vote'; k: number }
export const voteActions: WorldActions<VoteAction> = {
  vote: {
    pick: a => (int(0, RULES.length - 1)(a.k) ? { type: 'vote', k: a.k as number } : null),
    run: ({ w, pid, map }, a) => {
      if (!voteOpen(map?.day)) return no('locked')
      return { ok: true, changed: new Map(), world: { ...w, votes: { ...w.votes, [pid]: a.k } } }
    },
  },
}
