<script lang="ts">
  // Chạm trên bản đồ giới: tông môn (thông tin, đường đi, cướp), điểm (ai giữ, mỏ còn bao nhiêu, yêu vương còn máu; chiếm /
  // khai / đánh; gọi đội về), đội hành quân, ô trống (vùng, vòng, thời tiết). Luật ở rules/world.ts, server kiểm lại.
  import { MINE_STOCK, BOSSES, cutOf, might, type Army, type ElderId, type State } from '@rok/rules'
  import { TILE_TIME, bossSlice, dayIn, phaseOf, raidChance, regionOf, route, weather, type Atlas, type MapSnap, type Task, type WorldAction } from '@rok/rules/world'
  import type { Ack, WorldInfo } from '@rok/protocol'
  import { landAt } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import { Button, Card, Medal, Section, Sheet, Tag } from './ui'
  import { EMBLEM, L, clock, num, sfx, spotName } from './lib'
  import type { Pick } from './world/worldmap'

  let {
    game,
    now,
    info,
    atlas,
    me,
    snap,
    pick,
    busy = false,
    onclose,
    onraid,
    send,
  }: {
    game: State
    now: number
    info: WorldInfo
    atlas: Atlas
    me: number | null
    snap: MapSnap | null
    pick: Pick | null
    busy?: boolean
    onclose: () => void
    onraid: (pid: number) => void
    send: (a: WorldAction) => Promise<Ack>
  } = $props()

  const phase = $derived(phaseOf(dayIn(info.opened, now)))
  const TASK = { vein: 'take', gate: 'take', heaven: 'take', mine: 'gather', boss: 'hit' } as const
  const regionName = (r: number) => `${L.world.regions[r] ?? r} · ${L.world.ring[atlas.regions[r].ring]}`
  // đường đi từ tông môn mình; null: chưa có đường (cổng chưa mở)
  const road = (to: { x: number; y: number }) => (game.seat ? route(atlas, game.seat, to, phase) : null)
  const time = (len: number) => clock(len * TILE_TIME * cutOf(game, 'march'))
  const seat = $derived(pick?.kind === 'seat' ? snap?.seats.find(s => s.pid === pick.pid) : undefined)
  const point = $derived(pick?.kind === 'point' ? atlas.points[pick.i] : undefined)
  const spot = $derived(point ? snap?.spots.find(s => s.i === point.i) : undefined)
  const march = $derived(pick?.kind === 'march' ? snap?.marches.find(m => m.pid === pick.pid && m.id === pick.id) : undefined)
  const mine = $derived(point ? game.marches.find(m => m.target.kind === 'spot' && m.target.i === point.i) : undefined)
  const title = $derived(
    seat ? seat.name : point ? `${spotName(point.kind)} · ${L.lv(point.lv)}` : march ? (snap?.seats.find(s => s.pid === march.pid)?.name ?? '') : pick?.kind === 'tile' ? regionName(regionOf(atlas, pick)) : '',
  )
  async function go(task: Task, elder: ElderId, army: Army) {
    if (!point) return
    const r = await send({ type: 'go', i: point.i, task, elder, army })
    if (r.ok) (sfx('march'), onclose())
  }
</script>

<Sheet open={!!pick} {onclose} {title} sub={point ? regionName(point.region) : seat ? regionName(regionOf(atlas, seat)) : undefined}>
  {#snippet art()}
    {#if point}<Medal emblem={EMBLEM.spot[point.kind]} tone="spot" size={62} />{:else if seat}<Medal emblem="crest" tone={seat.pid === me ? 'gold' : seat.npc ? 'ink' : 'pvp'} size={62} />{/if}
  {/snippet}
  {#if seat}
    {@const r = road(seat)}
    <Card>
      <div class="stack" style:--gap="4px">
        <span class="row wrap">
          <Tag>{L.realm(seat.hall)}</Tag>
          <Tag icon="power">{num(seat.power)}</Tag>
          {#if seat.npc}<Tag tone="plain">{L.world.npc}</Tag>{/if}
          {#if seat.shield}<Tag icon="shield" tone="good">{L.world.shielded}</Tag>{/if}
        </span>
        {#if seat.pid !== me}
          <small class="t-small t-soft">{r ? `${L.map.time}: ${time(r.len)}` : L.err.far}</small>
        {/if}
      </div>
    </Card>
    {#if seat.pid !== me && !seat.shield && r}
      <div class="mt-3"><Button variant="danger" wide icon="swords" onclick={() => onraid(seat.pid)}>{L.pvp.attack}</Button></div>
    {/if}
  {:else if point}
    {@const r = road(point)}
    {@const task = TASK[point.kind]}
    {@const dead = !!spot?.until && spot.until > now}
    <Card>
      <div class="stack" style:--gap="4px">
        {#if point.kind === 'gate' || point.kind === 'heaven'}
          <Tag icon={point.lv <= phase ? 'check' : 'lock'} tone={point.lv <= phase ? 'good' : 'plain'}>{point.lv <= phase ? L.world.phase[point.lv] : L.world.gateOpens(L.world.phase[point.lv])}</Tag>
        {/if}
        {#if task === 'take'}<small class="t-small">{spot?.own ? `${L.world.held}: ${spot.own} · ${spot.n ?? 0}` : L.world.free}</small>{/if}
        {#if point.kind === 'mine'}
          <small class="t-small">{dead ? L.world.refill(clock(spot!.until! - now)) : `${L.world.left}: ${num(spot?.left ?? MINE_STOCK[point.lv - 1])}`}</small>
        {/if}
        {#if point.kind === 'boss'}
          {@const hp = spot?.hp ?? BOSSES[point.lv]?.str ?? 0}
          <small class="t-small">{dead ? L.world.respawn(clock(spot!.until! - now)) : `${L.world.hp}: ${num(hp)}/${num(BOSSES[point.lv]?.str ?? 0)}`}</small>
        {/if}
        <small class="t-small t-soft">{r ? `${L.map.time}: ${time(r.len)}` : L.err.far}</small>
      </div>
    </Card>
    {#if mine}
      <div class="mt-3">
        <Card tone="silk">
          <div class="row">
            <span class="grow t-small">{mine.stay ? L.world.stay : mine.mine && mine.mine.end > now ? L.world.gathering : now < mine.arriveAt ? L.map.out : L.map.back}</span>
            {#if mine.stay || (mine.mine && mine.mine.end > now)}<Button size="sm" variant="ghost" disabled={busy} onclick={() => send({ type: 'recall', id: mine.id })}>{L.world.recall}</Button>{/if}
          </div>
        </Card>
      </div>
    {:else if r && !dead && (point.kind !== 'heaven' || phase >= 3)}
      {@const slice = task === 'hit' ? bossSlice(atlas, point.i) : null}
      <ArmyPick
        {game}
        foe={slice ? might(slice) : undefined}
        chance={slice ? (e, a) => raidChance(game, e, a, slice) : undefined}
        cta={task === 'take' ? L.world.take : task === 'gather' ? L.world.gather : L.world.hit}
        time={time(r.len)}
        disabled={busy}
        onsubmit={(e, a) => go(task, e, a)}
      />
    {/if}
  {:else if march}
    <Card>
      <p class="t-small">{march.foe ?? spotName(march.spot)} · {now < march.arriveAt ? `${L.map.out} ${clock(march.arriveAt - now)}` : march.returnAt ? `${L.map.back} ${clock(march.returnAt - now)}` : L.world.stay}</p>
    </Card>
  {:else if pick?.kind === 'tile'}
    {@const reg = regionOf(atlas, pick)}
    <Card>
      <p class="t-small">{L.world.land[landAt(atlas.seed, pick.x, pick.y)]} · {L.world.weather[weather(atlas, reg, now)]}</p>
    </Card>
  {/if}
</Sheet>
