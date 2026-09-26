// Luận Đạo Bảng (threads của Lost Kingdom trong RoK — doc 4 E4): bảng chủ đề của cả giới. Từ Chủ điện CHAT_HALL ai cũng mở chủ đề
// (tiêu đề + lời; BOARD_COOL mới mở chủ đề tiếp) và trả lời (BOARD_REPLY_COOL giữa hai lời); giữ BOARD_TOPICS chủ đề sôi nổi nhất
// (theo lời mới nhất), mỗi chủ đề BOARD_REPLIES lời cuối; người mở xoá được chủ đề của mình. Hết mùa phần chung làm mới: bảng trống.
// Chữ tục bị server chặn trước khi vào luật (publicText ở server act.ts).
import { no } from '../core/action.ts'
import { cleanText, isId } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  BOARD_COOL,
  BOARD_REPLIES,
  BOARD_REPLY_COOL,
  BOARD_TEXT,
  BOARD_TITLE,
  BOARD_TOPICS,
  CHAT_HALL,
} from '../data.ts'
import { allyOf, type Topic, type World, type WorldActions } from './base.ts'

const line = (x: unknown, max: number) => {
  const t = cleanText(x)
  return t && [...t].length <= max ? t : null
}
// tên hiện trên bảng: kèm hiệu tiên minh như chat ("[TVM] Thanh Vân Tông")
const nameOf = (w: World, pid: number, s: State) => {
  const tag = allyOf(w, pid)?.tag
  return tag ? `[${tag}] ${s.name}` : s.name
}

export type BoardAction =
  | { type: 'boardPost'; title: string; text: string }
  | { type: 'boardReply'; id: number; text: string }
  | { type: 'boardDel'; id: number }
export const boardActions: WorldActions<BoardAction> = {
  boardPost: {
    pick: a => {
      const title = line(a.title, BOARD_TITLE),
        text = line(a.text, BOARD_TEXT)
      return title && text ? { type: 'boardPost', title, text } : null
    },
    run: ({ w, pid, s, now }, a) => {
      if (s.levels.chuDien < CHAT_HALL) return no('locked')
      const b = w.board ?? { next: 1, topics: [] }
      if (b.topics.some(t => t.pid === pid && now - t.at < BOARD_COOL)) return no('cooldown')
      const topic: Topic = {
        id: b.next,
        pid,
        name: nameOf(w, pid, s),
        title: a.title,
        text: a.text,
        at: now,
        last: now,
        replies: [],
      }
      const topics = [topic, ...b.topics].slice(0, BOARD_TOPICS)
      return { ok: true, changed: new Map(), world: { ...w, board: { next: b.next + 1, topics } } }
    },
  },
  boardReply: {
    pick: a => {
      const text = line(a.text, BOARD_TEXT)
      return isId(a.id) && text ? { type: 'boardReply', id: a.id as number, text } : null
    },
    run: ({ w, pid, s, now }, a) => {
      if (s.levels.chuDien < CHAT_HALL) return no('locked')
      const b = w.board
      const t = b?.topics.find(x => x.id === a.id)
      if (!b || !t) return no('gone')
      if (b.topics.some(x => x.replies.some(r => r.pid === pid && now - r.at < BOARD_REPLY_COOL))) return no('cooldown')
      const reply = { pid, name: nameOf(w, pid, s), text: a.text, at: now }
      const next: Topic = { ...t, last: now, replies: [...t.replies, reply].slice(-BOARD_REPLIES) }
      return {
        ok: true,
        changed: new Map(),
        world: { ...w, board: { ...b, topics: [next, ...b.topics.filter(x => x !== t)] } },
      }
    },
  },
  boardDel: {
    pick: a => (isId(a.id) ? { type: 'boardDel', id: a.id as number } : null),
    run: ({ w, pid }, a) => {
      const b = w.board
      const t = b?.topics.find(x => x.id === a.id)
      if (!b || !t) return no('gone')
      if (t.pid !== pid) return no('locked')
      return { ok: true, changed: new Map(), world: { ...w, board: { ...b, topics: b.topics.filter(x => x !== t) } } }
    },
  },
}

// Cho client: các chủ đề (sôi nổi trước) — tiêu đề, người mở, số lời, lời mới nhất lúc nào, có phải của mình
export type BoardRow = ReturnType<typeof boardView>[number]
export const boardView = (w: World, pid: number) =>
  (w.board?.topics ?? []).map(t => ({
    id: t.id,
    title: t.title,
    name: t.name,
    n: t.replies.length,
    last: t.last,
    mine: t.pid === pid,
  }))
// Một chủ đề đủ lời (null: không còn)
export const topicView = (w: World, id: number): Topic | null => w.board?.topics.find(t => t.id === id) ?? null
