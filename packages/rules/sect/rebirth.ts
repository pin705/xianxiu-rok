// Luân hồi: về căn cơ, giữ trưởng lão / công pháp / pháp bảo / đan; hết mùa cả giới luân hồi (seasonEnd).
import { no, ok, type Actions } from '../core/action.ts'
import { newGame } from '../core/save.ts'
import { advance } from '../core/time.ts'
import { type State } from '../core/types.ts'
import { IDS } from '../core/util.ts'
import { BUILDINGS, REBIRTH_HALL, REBIRTH_HEAD, REBIRTH_HEAD_MAX, type BuildingId } from '../data.ts'

// Luân hồi n kiếp: công trình về căn cơ, tài nguyên / đệ tử / hàng đợi / tiến độ bản đồ / nhiệm vụ chính / độ kiếp làm lại.
// Giữ: trưởng lão, thiên phú, công pháp, pháp bảo, đan (và việc đang luyện), tháp, danh hiệu, thư, nhiệm vụ ngày / tuần / sự kiện,
// Phi Thăng Tệ, tiến độ Tông vụ, tàn quyển / yêu cốt
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
    // Phi Thăng Tệ mang sang mùa sau; Tông vụ giữ tiến độ (không nhận lại quà các tầng đã qua); tàn quyển, yêu cốt là vật liệu
    ...(s.honorAll !== undefined && { honorAll: s.honorAll }),
    ...(s.crowns && { crowns: s.crowns }),
    ...(s.coinSpent !== undefined && { coinSpent: s.coinSpent }),
    ...(s.side && { side: s.side }),
    ...(s.frag !== undefined && { frag: s.frag }),
    ...(s.bones !== undefined && { bones: s.bones }),
    // không mang tính mùa (xoá là nhận lại được quà, hay mất thứ đã bỏ công / tiền mua): thành tựu, sự kiện (cả tân thủ — theo `born`),
    // Hương Hỏa, Chiêu Hiền Đài, sao / tín vật / tầng công pháp trưởng lão, bạn bè, cống hiến, Minh vụ, Luận Kiếm Đài, thương nhân, đội hình lưu, cặp phó,
    // tạp dịch thuê, lễ nhập minh, đạo thống, việc trong ngày (Vấn Đạo, Luận Võ, tháp), Vân Du Khách, phù tăng ích đã dùng
    ...(s.ach && { ach: s.ach }),
    fest: s.fest,
    vip: s.vip,
    tavern: s.tavern,
    tokens: s.tokens,
    ...(s.stars && { stars: s.stars }),
    ...(s.skl && { skl: s.skl }),
    ...(s.friends && { friends: s.friends }),
    ...(s.contrib && { contrib: s.contrib }),
    ...(s.mob && { mob: s.mob }),
    ...(s.arena && { arena: s.arena }),
    ...(s.merchant && { merchant: s.merchant }),
    ...(s.presets && { presets: s.presets }),
    ...(s.pairs && { pairs: s.pairs }),
    ...(s.builder2 !== undefined && { builder2: s.builder2 }),
    ...(s.joined !== undefined && { joined: s.joined }),
    ...(s.dao && { dao: s.dao }),
    ...(s.quiz && { quiz: s.quiz }),
    ...(s.drill && { drill: s.drill }),
    ...(s.towerDay !== undefined && { towerDay: s.towerDay }),
    ...(s.guestAt !== undefined && { guestAt: s.guestAt }),
    ...(s.guests !== undefined && { guests: s.guests }),
    ...(s.born !== undefined && { born: s.born }),
    buffs: s.buffs.filter(b => b.src.startsWith('phu.')),
  }
}

// Hết mùa (server, cho mọi người trong giới): luân hồi n kiếp (phi thăng: n = ASCEND, ghi danh hiệu mùa `season`); hành quân huỷ,
// chỗ trên bản đồ bỏ trống (server xếp lại trên bản đồ mùa mới), khiên tân thủ mới, Tu Tiên Lệnh mới
export function seasonEnd(s: State, t: number, n: number, season?: number): State {
  const st = { ...reborn(advance(s, t), t, n), pass: undefined } // Tu Tiên Lệnh làm lại từ đầu mùa
  return season === undefined ? st : { ...st, ascended: [...st.ascended, season] }
}

// Căn cơ của kiếp thứ n + 1 (n = số lần đã luân hồi): Chủ điện và mọi công trình đã mở ở tầng đó
export const rebirthLevels = (n: number) => levelsAt(Math.min(REBIRTH_HEAD_MAX, 1 + REBIRTH_HEAD * n))
// Chủ điện và mọi công trình đã mở ở tầng hall (căn cơ luân hồi, phân đà NPC)
export const levelsAt = (hall: number) =>
  Object.fromEntries(IDS.map(id => [id, BUILDINGS[id].unlock <= hall ? hall : 0])) as Record<BuildingId, number>

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
