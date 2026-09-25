// Vấn Đạo Đài (Peerless Scholar của RoK): mỗi ngày QUIZ_DAY câu rút tất định theo ngày từ bộ câu, trả lời lần lượt; xong câu cuối
// thì nhận quà theo số câu đúng. Đáp án ở data.ts (QUIZ_KEY), chữ câu hỏi ở i18n.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { QUIZ_DAY, QUIZ_GIFTS, QUIZ_HALL, QUIZ_KEY } from '../data.ts'

// Bộ câu của ngày day: QUIZ_DAY câu khác nhau (xáo tất định theo ngày)
export function quizOf(day: number): number[] {
  const idx = QUIZ_KEY.map((_, i) => i)
  let x = (day * 2654435761) >>> 0
  for (let i = idx.length - 1; i > 0; i--) {
    x = (Math.imul(x ^ (x >>> 15), 2246822519) + 3266489917) >>> 0
    const j = x % (i + 1)
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, QUIZ_DAY)
}
// Vấn Đạo hôm nay (ngày mới: làm lại từ đầu)
export const quizToday = (s: State) => (s.quiz?.day === dayOf(s.time) ? s.quiz : { day: dayOf(s.time), n: 0, right: 0 })

export type QuizAction = { type: 'quiz'; pick: number }
export const quizActions: Actions<QuizAction> = {
  quiz: {
    pick: a => (int(0, 3)(a.pick) ? { type: 'quiz', pick: a.pick } : null),
    run: (s, a) => {
      if (s.levels.chuDien < QUIZ_HALL) return no('locked')
      const q = quizToday(s)
      if (q.n >= QUIZ_DAY) return no('claimed') // hôm nay đã xong
      const good = QUIZ_KEY[quizOf(q.day)[q.n]] === a.pick
      const next = { day: q.day, n: q.n + 1, right: q.right + (good ? 1 : 0), last: good }
      const st = { ...s, quiz: next }
      return ok(next.n >= QUIZ_DAY ? grant(st, QUIZ_GIFTS[next.right]) : st)
    },
  },
}
