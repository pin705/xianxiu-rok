// Xuất quan: so lát state lúc rời game (server lưu khi kết nối cuối đóng) với state lúc quay lại. null: vắng chưa tới 1 phút.
import { IDS, RESOURCES, TECH_IDS, storage, type State } from '@rok/rules'
import type { Seen } from '@rok/protocol'
import { L } from './lib'

export type Away = NonNullable<ReturnType<typeof summarize>>
export function summarize(before: Seen, after: State) {
  const ms = after.time - before.time
  if (ms < 60_000) return null
  const d = (k: keyof State['stats']) => (after.stats[k] ?? 0) - (before.stats[k] ?? 0)
  return {
    ms,
    gains: RESOURCES.filter(r => after.res[r] > before.res[r]).map(r => ({ r, n: after.res[r] - before.res[r] })),
    done: IDS.filter(id => after.levels[id] > before.levels[id]).map(id => ({ id, level: after.levels[id] })),
    techs: TECH_IDS.filter(t => (after.tech[t] ?? 0) > (before.tech[t] ?? 0)).map(t =>
      L.away.tech(L.techs[t], after.tech[t]!),
    ),
    misc: [
      d('trained') && L.away.trained(d('trained')),
      d('healed') && L.away.healed(d('healed')),
      d('brewed') && L.away.brewed(d('brewed')),
      (d('won') || d('lost')) && L.away.battles(d('won'), d('lost')),
    ].filter(Boolean) as string[],
    full: RESOURCES.some(r => after.res[r] >= storage(after)),
  }
}
