// Chiến báo đã đọc, nhận quà trong thư, chặn người chơi (chat), kết giao đạo hữu.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { int } from '../core/parse.ts'

const BLOCKS_MAX = 100
export const FRIENDS_MAX = 50 // đạo hữu đã kết giao (danh sách một chiều, như theo dõi)

export type InboxAction =
  | { type: 'seen' } // đã đọc mọi chiến báo
  | { type: 'mail'; id: number } // nhận quà trong thư
  | { type: 'block'; pid: number; on: boolean } // chặn / bỏ chặn một người (chat)
  | { type: 'friend'; pid: number; on: boolean } // kết giao / bỏ kết giao (danh sách đạo hữu)

export const inboxActions: Actions<InboxAction> = {
  seen: {
    pick: () => ({ type: 'seen' }),
    run: s => ok({ ...s, seen: s.nextId - 1 }),
  },
  mail: {
    pick: a => (int(0, 1e12)(a.id) ? { type: 'mail', id: a.id } : null),
    run: (s, a) => {
      const m = s.mail.find(x => x.id === a.id)
      if (!m?.gift) return no('empty')
      if (m.got) return no('claimed')
      return ok({ ...grant(s, m.gift), mail: s.mail.map(x => (x === m ? { ...x, got: true } : x)) })
    },
  },
  friend: {
    pick: a => (int(1, 1e12)(a.pid) && typeof a.on === 'boolean' ? { type: 'friend', pid: a.pid, on: a.on } : null),
    run: (s, a) => {
      const rest = (s.friends ?? []).filter(p => p !== a.pid)
      if (a.on && rest.length >= FRIENDS_MAX) return no('full')
      return ok({ ...s, friends: a.on ? [...rest, a.pid] : rest })
    },
  },
  block: {
    pick: a => (int(1, 1e12)(a.pid) && typeof a.on === 'boolean' ? { type: 'block', pid: a.pid, on: a.on } : null),
    run: (s, a) => {
      const rest = s.blocks.filter(p => p !== a.pid)
      if (a.on && rest.length >= BLOCKS_MAX) return no('full')
      return ok({ ...s, blocks: a.on ? [...rest, a.pid] : rest })
    },
  },
}

export { mail } from '../core/mail.ts'
