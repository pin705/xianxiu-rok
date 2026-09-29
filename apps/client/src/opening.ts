// Trận mở màn (trận dẫn dắt đầu game của RoK): Huyết Sát Môn tập kích sơn môn vừa lập, Mộc Thanh Phong dẫn đệ tử còn lại nghênh
// chiến. Trận thật của luật (fight, mầm cố định — ai xem cũng như nhau) nhưng quân ảo: chỉ để xem, không ghi vào state.
import {
  ELDERS,
  MAIN_SHARE,
  elderLevel,
  fight,
  might,
  mob,
  noGain,
  sideOf,
  snap,
  type Army,
  type ElderId,
  type Report,
  type State,
} from '@rok/rules'

const SEED = 20260926
const FOE = 380 // sức Huyết Sát Môn (tính bằng đệ tử bậc 1): thắng sát nút sau vài lượt, kịp tung công pháp

const side = (1 - MAIN_SHARE) / 2
const PARTS: Parameters<typeof mob>[2] = [
  ['kiem', MAIN_SHARE],
  ['phap', side],
  ['the', side],
]

export function openingReport(s: State): Report {
  const me = sideOf(s, 'thanhPhong', { kiem1: 160, phap1: 120, the1: 120 })
  const foe = mob(FOE, 1, PARTS)
  return virtual(s, me, foe, 'thanhPhong', 1)
}

// Diễn thử công pháp (nút "Diễn thử" ở Môn hạ): trưởng lão dẫn quân ảo nghiêng về hệ mình đấu địch ngang sức — trận kéo vài lượt, đủ
// chân nguyên tung công pháp. Không ghi vào state
export function skillDemo(s: State, e: ElderId): Report {
  const army = { kiem1: 100, phap1: 100, the1: 100, [`${ELDERS[e].type}1`]: 200 } as Army
  const me = sideOf(s, e, army)
  const foe = mob((1000 * might(me)) / might(mob(1000, 1, PARTS)), 1, PARTS)
  return virtual(s, me, foe, e, elderLevel(s.elders[e]))
}

function virtual(s: State, me: ReturnType<typeof sideOf>, foe: ReturnType<typeof mob>, e: ElderId, lv: number): Report {
  const f = fight(me, foe, SEED)
  return {
    id: 0,
    at: s.time,
    kind: 'sect',
    i: 1, // Huyết Sát Môn
    win: f.win,
    fights: [{ a: snap(me, e, lv), b: snap(foe), rounds: f.rounds }],
    hurt: {},
    dead: {},
    gain: noGain(),
  }
}
