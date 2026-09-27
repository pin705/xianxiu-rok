// Mọi thao tác giữa các tông môn. Mỗi tính năng ở world/<tên>.ts khai báo kiểu thao tác, pick và run (như sect/apply.ts).
// Thêm tính năng: viết file đó, rồi thêm vào WorldAction và WORLD dưới đây — thiếu pick hay run là lỗi biên dịch.
import { no, type Pick } from '../core/action.ts'
import { obj } from '../core/parse.ts'
import { advance } from '../core/time.ts'
import { secluded } from '../sect/seclude.ts'
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
import { guildActions, type GuildAction } from './guild.ts'
import { marketActions, type MarketAction } from './market.ts'
import { mobActions, type MobAction } from './mob.ts'
import { arenaActions, type ArenaFight } from './arena.ts'
import { lordActions, type LordAction } from './lord.ts'
import { warActions, type WarAction } from './war.ts'
import { raidActions, type RaidAction } from './raid.ts'
import { spotActions, type SpotAction } from './spots.ts'
import { territoryActions, type TerritoryAction } from './territory.ts'
import { flagActions, type FlagAction } from './flags.ts'
import { exploreActions, type ExploreAction } from './explore.ts'
import { legionActions, type LegionAction } from './legion.ts'
import { supplyActions, type SupplyAction } from './supply.ts'
import { groupActions, type GroupAction } from './groups.ts'
import { robActions, type RobAction } from './rob.ts'
import { bookActions, type BookAction } from './book.ts'
import { thoiActions, type ThoiAction } from './thoi.ts'
import { redirectActions, type RedirectAction } from './redirect.ts'
import { packetActions, type PacketAction } from './packet.ts'
import { voteActions, type VoteAction } from './vote.ts'
import { betActions, type BetAction } from './bets.ts'
import { heroActions, type HeroAction } from './heroes.ts'
import { paperActions, type PaperAction } from './paper.ts'
import { recallActions, type RecallAction } from './recall.ts'
import { boardActions, type BoardAction } from './board.ts'
import { loharActions, type LoharAction } from './lohar.ts'
import { potActions, type PotAction } from './pot.ts'
import { arkActions, type ArkAction } from './ark.ts'
import { partyActions, type PartyAction } from './party.ts'
import { convoyActions, type ConvoyAction } from './convoy.ts'
import { assaultActions, type AssaultAction } from './assault.ts'
import { royaleActions, type RoyaleAction } from './royale.ts'
import { daibiActions, type DaibiAction } from './daibi.ts'
import { silverActions, type SilverAction } from './silver.ts'
import { vanchuActions, type VanchuAction } from './vanchu.ts'
import { mysticActions, type MysticAction } from './mystic.ts'
import { campaignActions, type CampaignAction } from './campaign.ts'
import { aquizActions, type AquizAction } from './aquiz.ts'
import { rescueActions, type RescueAction } from './rescue.ts'
import { planActions, type PlanAction } from './plans.ts'
import { spyActions, type SpyAction } from './spy.ts'
import { encampActions, type EncampAction } from './encamp.ts'
import { shutGates } from './points.ts'

export type WorldAction =
  | RaidAction
  | AllianceAction
  | GuildAction
  | MobAction
  | ArenaFight
  | LordAction
  | WarAction
  | SpotAction
  | MarketAction
  | TerritoryAction
  | FlagAction
  | ExploreAction
  | LegionAction
  | SupplyAction
  | GroupAction
  | RobAction
  | BookAction
  | ThoiAction
  | RedirectAction
  | PacketAction
  | VoteAction
  | BetAction
  | HeroAction
  | PaperAction
  | RecallAction
  | BoardAction
  | LoharAction
  | PotAction
  | ArkAction
  | PartyAction
  | ConvoyAction
  | AssaultAction
  | RoyaleAction
  | DaibiAction
  | SilverAction
  | VanchuAction
  | MysticAction
  | CampaignAction
  | AquizAction
  | RescueAction
  | PlanAction
  | SpyAction
  | EncampAction

const WORLD: WorldActions<WorldAction> = {
  ...raidActions,
  ...allianceActions,
  ...guildActions,
  ...mobActions,
  ...arenaActions,
  ...lordActions,
  ...warActions,
  ...spotActions,
  ...marketActions,
  ...territoryActions,
  ...flagActions,
  ...exploreActions,
  ...legionActions,
  ...supplyActions,
  ...groupActions,
  ...robActions,
  ...bookActions,
  ...thoiActions,
  ...redirectActions,
  ...packetActions,
  ...voteActions,
  ...betActions,
  ...heroActions,
  ...paperActions,
  ...recallActions,
  ...boardActions,
  ...loharActions,
  ...potActions,
  ...arkActions,
  ...partyActions,
  ...convoyActions,
  ...assaultActions,
  ...royaleActions,
  ...daibiActions,
  ...silverActions,
  ...vanchuActions,
  ...mysticActions,
  ...campaignActions,
  ...aquizActions,
  ...rescueActions,
  ...planActions,
  ...spyActions,
  ...encampActions,
}
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
  const s = advance(me, now)
  if (secluded(s)) return no('secluded') // Bế Quan Lệnh: đang bế quan thì không làm gì với giới
  const m = map && { ...map, shut: shutGates(w, map.atlas, pid) } // cửa ải: tính theo phe người đang làm
  return (WORLD[a.type].run as WorldRun<WorldAction>)({ ps, w, pid, s, now, seed, map: m }, a)
}

// Người trong các minh vừa đổi (bản ghi minh, hay kết trận của minh mở / giải) — server báo họ hỏi lại
export function allyTouched(prev: World, next: World): number[] {
  const rallies = (w: World, aid: number) =>
    Object.values(w.rallies)
      .filter(r => r.ally === aid || w.allies[aid]?.naps?.includes(r.ally)) // kết trận minh ước cũng báo
      .map(r => r.id)
      .join()
  const out = new Set<number>()
  for (const al of [...Object.values(prev.allies), ...Object.values(next.allies)])
    if (
      prev.allies[al.id] !== next.allies[al.id] ||
      (prev.rallies !== next.rallies && rallies(prev, al.id) !== rallies(next, al.id))
    )
      for (const pid of Object.keys(al.members)) out.add(Number(pid))
  // Tranh Đoạt Linh Châu: ghi danh / hiệp mới / kết quả → người của các minh dự trận
  if (prev.ark !== next.ark)
    for (const x of [prev.ark, next.ark])
      for (const id of [...(x?.signed ?? []), ...(x?.live ?? []).flatMap(f => [f.a, f.b])])
        for (const pid of Object.keys(next.allies[id]?.members ?? {})) out.add(Number(pid))
  return [...out]
}
// Ai ở minh nào (đổi khi có người vào / rời / minh giải tán): lãnh thổ trên bản đồ theo đó mà đổi
export const memberKey = (w: World) =>
  Object.values(w.allies)
    .map(a => `${a.id}:${Object.keys(a.members)}`)
    .join('|')
