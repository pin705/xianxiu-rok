// Mọi thao tác trên một tông môn. Mỗi tính năng ở sect/<tên>.ts khai báo kiểu thao tác, cách đọc từ JSON (pick) và luật (run).
// Thêm tính năng: viết file đó, rồi thêm vào Action và ACTIONS dưới đây — thiếu pick hay run là lỗi biên dịch.
import { no, type Actions, type Pick, type Run } from '../core/action.ts'
import { obj } from '../core/parse.ts'
import { advance } from '../core/time.ts'
import { type Result, type State } from '../core/types.ts'
import { SECLUDE_OK } from '../data.ts'
import { alchemyActions, type AlchemyAction } from './alchemy.ts'
import { armyActions, type ArmyAction } from './army.ts'
import { bagActions, type BagAction } from './bag.ts'
import { festActions, type FestAction } from './fest.ts'
import { stallActions, type StallAction } from './stall.ts'
import { passActions, type PassAction } from './pass.ts'
import { trialActions, type TrialAction } from './trial.ts'
import { thiefActions, type ThiefAction } from './thief.ts'
import { mazeActions, type MazeAction } from './maze.ts'
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
import { nanActions, type NanAction } from './nan.ts'
import { wallActions, type WallAction } from './wall.ts'
import { heroActions, type HeroAction } from './hero.ts'
import { eveActions, type EveAction } from './eve.ts'
import { secluded, secludeActions, type SecludeAction } from './seclude.ts'
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
  | StallAction
  | PassAction
  | TrialAction
  | ThiefAction
  | MazeAction
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
  | NanAction
  | WallAction
  | HeroAction
  | EveAction
  | SecludeAction

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
  ...stallActions,
  ...passActions,
  ...trialActions,
  ...thiefActions,
  ...mazeActions,
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
  ...nanActions,
  ...wallActions,
  ...heroActions,
  ...eveActions,
  ...secludeActions,
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
  const st = advance(s, now)
  if (secluded(st) && !SECLUDE_OK.includes(a.type)) return no('secluded') // Bế Quan Lệnh
  return (ACTIONS[a.type].run as Run<Action>)(st, a)
}
