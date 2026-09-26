// Mọi phần thưởng từ ngoài (admin, sự kiện, xếp hạng, bồi thường, Linh Nang của lễ rơi đồ) chỉ đi qua đây. Đầy thì bỏ thư cũ đã nhận
// (hoặc không có quà) trước.
import { type NewMail, type State } from './types.ts'
import { MAIL_MAX } from '../data.ts'

export function mail(s: State, m: NewMail): State {
  const box = [...s.mail, { ...m, id: s.nextId }]
  while (box.length > MAIL_MAX) {
    const i = box.findIndex(x => !x.gift || x.got)
    box.splice(i >= 0 ? i : 0, 1)
  }
  return { ...s, mail: box, nextId: s.nextId + 1 }
}
