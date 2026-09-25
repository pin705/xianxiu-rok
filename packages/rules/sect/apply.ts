// Mọi thao tác trên một tông môn. Mỗi tính năng ở sect/<tên>.ts khai báo kiểu thao tác, cách đọc từ JSON (pick) và luật (run).
// Thêm tính năng: viết file đó, rồi thêm vào Action và ACTIONS dưới đây — thiếu pick hay run là lỗi biên dịch.
import { no, type Actions, type Pick, type Run } from '../core/action.ts'
import { obj } from '../core/parse.ts'
import { advance } from '../core/time.ts'
import { type Result, type State } from '../core/types.ts'
import { alchemyActions, type AlchemyAction } from './alchemy.ts'
import { armyActions, type ArmyAction } from './army.ts'
import { bagActions, type BagAction } from './bag.ts'
import { festActions, type FestAction } from './fest.ts'
import { vipActions, type VipAction } from './vip.ts'
import { tavernActions, type TavernAction } from './tavern.ts'
import { achActions, type AchAction } from './ach.ts'
import { arenaActions, type ArenaAction } from './arena.ts'
import { merchantActions, type MerchantAction } from './merchant.ts'
import { pinActions, type PinAction } from './pins.ts'
import { honorActions, type HonorAction } from './honor.ts'
import { drillActions, type DrillAction } from './drill.ts'
import { guestActions, type GuestAction } from './guest.ts'
import { quizActions, type QuizAction } from './quiz.ts'
import { sideActions, type SideAction } from './side.ts'
import { eveActions, type EveAction } from './eve.ts'
import { buildingActions, type BuildingAction } from './buildings.ts'
import { elderActions, type ElderAction } from './elders.ts'
import { expeditionActions, type ExpeditionAction } from './expedition.ts'
import { forgeActions, type ForgeAction } from './forge.ts'
import { inboxActions, type InboxAction } from './inbox.ts'
import { rebirthActions, type RebirthAction } from './rebirth.ts'
import { researchActions, type ResearchAction } from './research.ts'
import { taskActions, type TaskAction } from './tasks.ts'
import { tribActions, type TribAction } from './trib.ts'

export type Action =
  | BuildingAction
  | ArmyAction
  | ResearchAction
  | AlchemyAction
  | ElderAction
  | ForgeAction
  | ExpeditionAction
  | TribAction
  | TaskAction
  | RebirthAction
  | InboxAction
  | BagAction
  | FestAction
  | VipAction
  | TavernAction
  | AchAction
  | ArenaAction
  | MerchantAction
  | PinAction
  | HonorAction
  | DrillAction
  | GuestAction
  | QuizAction
  | SideAction
  | EveAction

const ACTIONS: Actions<Action> = {
  ...buildingActions,
  ...armyActions,
  ...researchActions,
  ...alchemyActions,
  ...elderActions,
  ...forgeActions,
  ...expeditionActions,
  ...tribActions,
  ...taskActions,
  ...rebirthActions,
  ...inboxActions,
  ...bagActions,
  ...festActions,
  ...vipActions,
  ...tavernActions,
  ...achActions,
  ...arenaActions,
  ...merchantActions,
  ...pinActions,
  ...honorActions,
  ...drillActions,
  ...guestActions,
  ...quizActions,
  ...sideActions,
  ...eveActions,
}

export const ACTION_TYPES = Object.keys(ACTIONS) as Action['type'][]

// Thao tác từ client là JSON, có thể là bất cứ thứ gì (chuỗi thay số, 'constructor' thay id, thiếu trường, thừa trường).
// apply() kiểm ở đây trước tiên — một chốt cho mọi nơi gọi (server, client, sim): pick dựng lại object mới chỉ từ trường đã biết.
export function parseAction(raw: unknown): Action | null {
  if (!obj(raw) || typeof raw.type !== 'string' || !Object.hasOwn(ACTIONS, raw.type)) return null
  return (ACTIONS[raw.type as Action['type']].pick as Pick<Action>)(raw)
}

export function apply(s: State, raw: Action, now: number): Result {
  const a = parseAction(raw)
  if (!a) return no('bad')
  return (ACTIONS[a.type].run as Run<Action>)(advance(s, now), a)
}
