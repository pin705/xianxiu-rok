// Mọi thao tác giữa các tông môn. Mỗi tính năng ở world/<tên>.ts khai báo kiểu thao tác, pick và run (như sect/apply.ts).
// Thêm tính năng: viết file đó, rồi thêm vào WorldAction và WORLD dưới đây — thiếu pick hay run là lỗi biên dịch.
import { no, type Pick } from '../core/action.ts'
import { obj } from '../core/parse.ts'
import { advance } from '../core/time.ts'
import { allianceActions, type AllianceAction } from './alliance.ts'
import {
  freshWorld,
  type MapCtx,
  type Players,
  type World,
  type WorldActions,
  type WorldResult,
  type WorldRun,
} from './base.ts'
import { marketActions, type MarketAction } from './market.ts'
import { raidActions, type RaidAction } from './raid.ts'
import { spotActions, type SpotAction } from './spots.ts'

export type WorldAction = RaidAction | AllianceAction | SpotAction | MarketAction

const WORLD: WorldActions<WorldAction> = { ...raidActions, ...allianceActions, ...spotActions, ...marketActions }
export const WORLD_ACTIONS = Object.keys(WORLD) as WorldAction['type'][]

export function parseWorldAction(raw: unknown): WorldAction | null {
  if (!obj(raw) || typeof raw.type !== 'string' || !Object.hasOwn(WORLD, raw.type)) return null
  return (WORLD[raw.type as WorldAction['type']].pick as Pick<WorldAction>)(raw)
}

// world: phần chung trước thao tác (kết quả trả phần chung sau, cùng tham chiếu nếu không đổi)
export function worldAct(
  ps: Players,
  pid: number,
  raw: WorldAction,
  now: number,
  seed: number,
  map?: MapCtx,
  w: World = freshWorld(),
): WorldResult {
  const a = parseWorldAction(raw) // kiểm ở đây cho mọi nơi gọi (server, NPC, sim) — như apply() với parseAction
  if (!a) return no('bad')
  const me = ps.get(pid)
  if (!me) return no('gone')
  return (WORLD[a.type].run as WorldRun<WorldAction>)({ ps, w, pid, s: advance(me, now), now, seed, map }, a)
}
