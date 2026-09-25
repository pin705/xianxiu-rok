// Nhóm chat tự tạo (group chat của RoK): ai cũng lập được nhóm, thêm người vào (người trong nhóm nào cũng thêm được), rời nhóm;
// nhóm trống thì giải tán, người lập rời thì người vào sớm nhất giữ nhóm. Chat của nhóm ở kênh 'g<id>' (server: talk.ts).
import { no } from '../core/action.ts'
import { cleanText, isId } from '../core/parse.ts'
import { GROUP_MAX, GROUPS_PER } from '../data.ts'
import type { Group, World, WorldActions } from './base.ts'

export const groupsOf = (w: World, pid: number) => Object.values(w.groups ?? {}).filter(g => g.members.includes(pid))
const set = (w: World, g: Group): World => ({ ...w, groups: { ...w.groups, [g.id]: g } })

export type GroupAction =
  | { type: 'groupNew'; name: string }
  | { type: 'groupAdd'; id: number; pid: number }
  | { type: 'groupLeave'; id: number }

export const groupActions: WorldActions<GroupAction> = {
  groupNew: {
    pick: a => {
      const name = cleanText(a.name)
      return [...name].length >= 2 && [...name].length <= 20 ? { type: 'groupNew', name } : null
    },
    run: ({ w, pid }, a) => {
      if (groupsOf(w, pid).length >= GROUPS_PER) return no('limit')
      const id = w.nextGroup ?? 1
      return {
        ok: true,
        changed: new Map(),
        world: { ...set(w, { id, name: a.name, owner: pid, members: [pid] }), nextGroup: id + 1 },
      }
    },
  },
  groupAdd: {
    pick: a => (isId(a.id) && isId(a.pid) ? { type: 'groupAdd', id: a.id, pid: a.pid } : null),
    run: ({ w, ps, pid }, a) => {
      const g = w.groups?.[a.id]
      const them = ps.get(a.pid)
      if (!g || !g.members.includes(pid) || !them) return no('locked')
      if (g.members.includes(a.pid)) return no('claimed')
      if (them.blocks.includes(pid)) return no('friend') // người kia đã chặn mình
      if (g.members.length >= GROUP_MAX || groupsOf(w, a.pid).length >= GROUPS_PER) return no('full')
      return { ok: true, changed: new Map(), world: set(w, { ...g, members: [...g.members, a.pid] }) }
    },
  },
  groupLeave: {
    pick: a => (isId(a.id) ? { type: 'groupLeave', id: a.id } : null),
    run: ({ w, pid }, a) => {
      const g = w.groups?.[a.id]
      if (!g || !g.members.includes(pid)) return no('locked')
      const members = g.members.filter(p => p !== pid)
      if (!members.length) {
        const { [g.id]: _, ...groups } = w.groups!
        return { ok: true, changed: new Map(), world: { ...w, groups } }
      }
      return {
        ok: true,
        changed: new Map(),
        world: set(w, { ...g, members, owner: g.owner === pid ? members[0] : g.owner }),
      }
    },
  },
}
