// Luân hồi: về căn cơ, giữ trưởng lão / công pháp / pháp bảo / đan; hết mùa cả giới luân hồi (seasonEnd).
import { no, ok, type Actions } from '../core/action.ts'
import { newGame } from '../core/save.ts'
import { advance } from '../core/time.ts'
import { type State } from '../core/types.ts'
import { IDS } from '../core/util.ts'
import { BUILDINGS, REBIRTH_HALL, REBIRTH_HEAD, REBIRTH_HEAD_MAX, type BuildingId } from '../data.ts'

// Luân hồi n kiếp: công trình về căn cơ, tài nguyên / đệ tử / hàng đợi / tiến độ bản đồ / nhiệm vụ chính / độ kiếp làm lại.
// Giữ: trưởng lão, thiên phú, công pháp, pháp bảo, đan (và việc đang luyện), tháp, danh hiệu, thư, nhiệm vụ ngày / tuần / sự kiện
function reborn(s: State, t: number, n: number): State {
  const fresh = newGame(t, s.name)
  return {
    ...fresh,
    levels: rebirthLevels(s.rebirths + n),
    tech: s.tech,
    study: s.study,
    items: s.items,
    brew: s.brew,
    elders: s.elders,
    talents: s.talents,
    gear: s.gear,
    forge: s.forge,
    guard: s.guard,
    rebirths: s.rebirths + n,
    stats: s.stats,
    seed: s.seed,
    nextId: s.nextId,
    seen: s.nextId - 1,
    daily: s.daily, // cùng ngày: không nhận lại thưởng ngày
    weekly: s.weekly,
    ev: s.ev,
    mail: s.mail,
    blocks: s.blocks,
    ascended: s.ascended,
    tower: s.tower, // kỷ lục tháp giữ qua luân hồi (thưởng chỉ lần đầu nên không cày lại được)
  }
}

// Hết mùa (server, cho mọi người trong giới): luân hồi n kiếp (phi thăng: n = ASCEND, ghi danh hiệu mùa `season`); hành quân huỷ,
// chỗ trên bản đồ bỏ trống (server xếp lại trên bản đồ mùa mới), khiên tân thủ mới
export function seasonEnd(s: State, t: number, n: number, season?: number): State {
  const st = reborn(advance(s, t), t, n)
  return season === undefined ? st : { ...st, ascended: [...st.ascended, season] }
}

// Căn cơ của kiếp thứ n + 1 (n = số lần đã luân hồi): Chủ điện và mọi công trình đã mở ở tầng đó
export function rebirthLevels(n: number) {
  const hall = Math.min(REBIRTH_HEAD_MAX, 1 + REBIRTH_HEAD * n)
  return Object.fromEntries(IDS.map(id => [id, BUILDINGS[id].unlock <= hall ? hall : 0])) as Record<BuildingId, number>
}

export type RebirthAction = { type: 'rebirth' }

export const rebirthActions: Actions<RebirthAction> = {
  rebirth: {
    pick: () => ({ type: 'rebirth' }),
    run: s => {
      if (s.levels.chuDien < REBIRTH_HALL) return no('locked')
      if (s.seat) return no('locked') // trong giới: luân hồi khi hết mùa (seasonEnd)
      if (s.marches.length) return no('busy')
      return ok(reborn(s, s.time, 1))
    },
  },
}
