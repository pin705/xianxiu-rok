// Trận mở màn (trận dẫn dắt đầu game của RoK): Huyết Sát Môn tập kích sơn môn vừa lập, Mộc Thanh Phong dẫn đệ tử còn lại nghênh
// chiến. Trận thật của luật (fight, mầm cố định — ai xem cũng như nhau) nhưng quân ảo: chỉ để xem, không ghi vào state.
import { MAIN_SHARE, fight, mob, noGain, sideOf, snap, type Report, type State } from '@rok/rules'

const SEED = 20260926
const FOE = 380 // sức Huyết Sát Môn (tính bằng đệ tử bậc 1): thắng sát nút sau vài lượt, kịp tung công pháp

export function openingReport(s: State): Report {
  const me = sideOf(s, 'thanhPhong', { kiem1: 160, phap1: 120, the1: 120 })
  const side = (1 - MAIN_SHARE) / 2
  const foe = mob(FOE, 1, [
    ['kiem', MAIN_SHARE],
    ['phap', side],
    ['the', side],
  ])
  const f = fight(me, foe, SEED)
  return {
    id: 0,
    at: s.time,
    kind: 'sect',
    i: 1, // Huyết Sát Môn
    win: f.win,
    fights: [{ a: snap(me, 'thanhPhong', 1), b: snap(foe), rounds: f.rounds }],
    hurt: {},
    dead: {},
    gain: noGain(),
  }
}
