// Nhiệm vụ chính (hướng dẫn), nhiệm vụ ngày / tuần, quà mốc sự kiện tuần.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { passXp } from '../core/fest.ts'
import { weeklyDone, weeklyReward } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import { cost, gearSum, storeNeed, techSum, totalTroops } from '../core/stats.ts'
import { type State } from '../core/types.ts'
import { addBag, addItems, bag, mark } from '../core/util.ts'
import {
  DAILY,
  DAILY_HALL,
  EVENT_GOALS,
  EVENT_REWARDS,
  MAX_LEVEL,
  PASS_WEEK,
  QUESTS,
  WEEKLY,
  WEEKLY_BONUS,
  type BuildingId,
  type Quest,
} from '../data.ts'

export const questOf = (s: State): Quest | undefined => QUESTS[s.quest]
export function questProgress(s: State, q: Quest): [number, number] {
  switch (q.k) {
    case 'build':
      return [s.levels[q.id as BuildingId], q.n]
    case 'train':
      return [totalTroops(s), q.n]
    case 'hunt':
      return [s.beast, q.n]
    case 'sect':
      return [s.sects[Number(q.id)] ? 1 : 0, 1]
    case 'realm':
      return [s.realms[Number(q.id)], q.n]
    case 'tech':
      return [techSum(s), q.n]
    case 'brew':
      return [s.stats.brewed + (s.brew?.n ?? 0), q.n] // tính cả mẻ đang luyện: không bắt người mới chờ 20 phút giữa hướng dẫn
    case 'tower':
      return [s.tower, q.n]
    case 'forge':
      return [gearSum(s) + (s.forge ? 1 : 0), q.n] // như luyện đan: tính cả món đang luyện
  }
}
export const questDone = (s: State) => {
  const q = QUESTS[s.quest]
  if (!q) return false
  const [cur, need] = questProgress(s, q)
  return cur >= need
}
// Công trình cần xây cho nhiệm vụ — trừ khi kho không đủ chỗ cho chi phí: khi đó phải nâng Tàng Bảo Các trước
export const questBuilding = (s: State, id: BuildingId): BuildingId =>
  storeNeed(s, cost(id, Math.min(s.levels[id] + 1, MAX_LEVEL))) ? 'tangBaoCac' : id

export type TaskAction =
  | { type: 'claim' } // nhiệm vụ chính
  | { type: 'daily'; i: number }
  | { type: 'dailyBonus' }
  | { type: 'weekly'; i: number }
  | { type: 'weeklyBonus' }
  | { type: 'event'; i: number } // quà mốc sự kiện tuần

export const taskActions: Actions<TaskAction> = {
  claim: {
    pick: () => ({ type: 'claim' }),
    run: s => {
      const q = QUESTS[s.quest]
      if (!q || !questDone(s)) return no('not_done')
      return ok({ ...s, quest: s.quest + 1, res: addBag(s.res, q.reward), items: addItems(s.items, q.items ?? {}) })
    },
  },
  // Nhiệm vụ ngày kiểu cũ (4 việc + rương) đã thay bằng Nhật Khóa (fest nhatKhoa: điểm hoạt lực + 5 rương). Giữ hai thao tác
  // để client cũ gửi lên không vỡ, nhưng không nhận được nữa — không có đường nhận thưởng hai lần.
  daily: {
    pick: a => (int(0, DAILY.length - 1)(a.i) ? { type: 'daily', i: a.i } : null),
    run: () => no('locked'),
  },
  dailyBonus: {
    pick: () => ({ type: 'dailyBonus' }),
    run: () => no('locked'),
  },
  weekly: {
    pick: a => (int(0, WEEKLY.length - 1)(a.i) ? { type: 'weekly', i: a.i } : null),
    run: (s, a) => {
      if (s.levels.chuDien < DAILY_HALL || !WEEKLY[a.i]) return no('locked')
      if (s.weekly.got[a.i]) return no('claimed')
      if (!weeklyDone(s, a.i)) return no('not_done')
      const n = weeklyReward(s)
      // mỗi việc tuần: điểm Tu Tiên Lệnh
      return ok(
        passXp({ ...s, res: bag(r => s.res[r] + n), weekly: { ...s.weekly, got: mark(s.weekly.got, a.i) } }, PASS_WEEK),
      )
    },
  },
  weeklyBonus: {
    pick: () => ({ type: 'weeklyBonus' }),
    run: s => {
      if (s.levels.chuDien < DAILY_HALL) return no('locked')
      if (s.weekly.bonus) return no('claimed')
      if (!s.weekly.got.every(Boolean)) return no('not_done')
      return ok({ ...s, items: addItems(s.items, WEEKLY_BONUS), weekly: { ...s.weekly, bonus: true } })
    },
  },
  event: {
    pick: a => (int(0, EVENT_GOALS.length - 1)(a.i) ? { type: 'event', i: a.i } : null),
    run: (s, a) => {
      if (s.levels.chuDien < DAILY_HALL || !EVENT_GOALS[a.i]) return no('locked')
      if (s.ev.got[a.i]) return no('claimed')
      if (s.ev.pts < EVENT_GOALS[a.i]) return no('not_done')
      return ok({ ...grant(s, EVENT_REWARDS[a.i]), ev: { ...s.ev, got: mark(s.ev.got, a.i) } })
    },
  },
}
