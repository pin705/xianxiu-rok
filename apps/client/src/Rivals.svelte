<script lang="ts">
  // Tranh đoạt: kẻ đã cướp mình (báo thù) và vài tông môn gần lực chiến; chọn một → xem dò thám → chọn đội → xuất quân cướp
  // (một mình, mở kết trận công sơn, hay góp vào kết trận đồng minh đang mở nhắm tông môn đó — mặc định góp nếu có).
  // Danh sách do server ghép (cần state của cả giới); tỉ lệ thắng ước lượng theo phòng thủ đã dò thám (chỉ khi đi một mình).
  import { untrack } from 'svelte'
  import { PVP_HALL, RALLY_WAIT, marchSlots, marchTime, might, type Army, type ElderId } from '@rok/rules'
  import { raidChance, type AllyInfo, type Rival, type WorldAction } from '@rok/rules/world'
  import { Icon, Portrait } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import { Button, Card, Medal, Section, Sheet, Tag } from './ui'
  import { EMBLEM, L, LOOK, clock, num } from './lib'
  import { useGame } from './game'

  let {
    open,
    focus = null,
    ally = null,
    load,
    onclose,
    onraid,
    onrecruit,
  }: {
    open: boolean
    focus?: number | null // mở thẳng một tông môn (chạm trên bản đồ giới)
    ally?: AllyInfo | null // minh của mình: kết trận
    load: (pid?: number) => Promise<Rival[] | null>
    onclose: () => void
    onraid: (a: WorldAction) => void
    onrecruit: () => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const busy = $derived(g.busy)

  let list = $state<Rival[] | null>(null)
  let pick = $state<Rival | null>(null)
  let loading = $state(false)
  async function refresh() {
    loading = true
    list = await load(focus ?? undefined)
    loading = false
    if (focus !== null) pick = list?.find(r => r.pid === focus) ?? null
  }
  $effect(() => {
    if (!open) return
    pick = null
    void refresh()
  })
  const full = $derived(game.marches.length >= marchSlots(game))

  // cách xuất quân: một mình, mở kết trận (chờ 5/10/30 phút), hay góp vào kết trận đang mở nhắm tông môn này
  let way = $state<'solo' | 'rally' | number>('solo')
  let wait = $state<0 | 1 | 2>(1)
  const rallies = $derived(
    pick && ally ? ally.rallies.filter(x => x.task === 'raid' && x.i === pick?.pid && x.at > now) : [],
  )
  $effect(() => {
    if (pick) untrack(() => (way = rallies[0]?.id ?? 'solo'))
  })
  function cta(r: Rival) {
    if (way === 'solo') return r.revenge ? L.pvp.revenge : L.pvp.attack
    const rl = rallies.find(x => x.id === way)
    return rl ? L.world.joinRally(clock(rl.at - now)) : L.world.openRally
  }
  function go(r: Rival, elder: ElderId, army: Army) {
    if (way === 'solo') onraid({ type: 'raid', pid: r.pid, elder, army })
    else if (way === 'rally') onraid({ type: 'raidRally', pid: r.pid, wait, elder, army })
    else onraid({ type: 'raidJoin', id: way, elder, army })
  }
</script>

<Sheet
  {open}
  {onclose}
  title={pick ? pick.name : L.pvp.title}
  sub={pick
    ? `${L.realm(pick.hall)} · ${L.power} ${num(pick.power)}`
    : `${L.pvp.pts(game.pvp.pts)} · ${L.pvp.record(game.pvp.win, game.pvp.loss)}`}
>
  {#snippet art()}<Medal emblem="crest" tone="pvp" size={62} />{/snippet}
  {#if game.levels.chuDien < PVP_HALL}
    <Tag icon="lock" tone="bad">{L.pvp.locked}</Tag>
  {:else if pick}
    {@const r = pick}
    <Section title={L.pvp.defense}>
      <ul class="row wrap">
        {#each r.scout.side.troops as t (`${t.type}${t.tier}`)}
          <li class="row" style:--gap="5px">
            <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={30} pips={t.tier} /><span class="t-small t-strong"
              >~{num(t.n)}</span
            >
          </li>
        {/each}
        {#if !r.scout.side.troops.length}<li class="t-small t-soft">{L.army.noTroops}</li>{/if}
      </ul>
      <div class="row wrap">
        {#if r.scout.guard}
          <Tag icon="power" tone="bad"
            ><Portrait look={LOOK[r.scout.guard]} size={18} />{L.elders[r.scout.guard].name} · {L.lv(
              r.scout.level,
            )}</Tag
          >
        {:else}
          <Tag>{L.pvp.noGuard}</Tag>
        {/if}
        {#if r.scout.wall}<Tag icon="shield">{L.pvp.wall(r.scout.wall)}</Tag>{/if}
      </div>
    </Section>
    {#if ally}
      <Section title={L.world.rally}>
        <div class="row wrap">
          <Button size="sm" variant={way === 'solo' ? 'gold' : 'ghost'} onclick={() => (way = 'solo')}
            >{L.world.solo}</Button
          >
          <Button size="sm" variant={way === 'rally' ? 'gold' : 'ghost'} onclick={() => (way = 'rally')}
            >{L.world.openRally}</Button
          >
          {#each rallies as rl (rl.id)}
            <Button size="sm" variant={way === rl.id ? 'gold' : 'ghost'} onclick={() => (way = rl.id)}
              >{L.world.joinRally(clock(rl.at - now))}</Button
            >
          {/each}
        </div>
        {#if way === 'rally'}
          <div class="row wrap">
            {#each RALLY_WAIT as ms, k (k)}
              <Button size="sm" variant={wait === k ? 'gold' : 'quiet'} onclick={() => (wait = k as 0 | 1 | 2)}
                >{L.world.wait(ms / 60_000)}</Button
              >
            {/each}
          </div>
        {/if}
        <p class="t-tiny t-soft">{L.pvp.rallyHint}</p>
      </Section>
    {/if}
    {#if full}<Tag icon="flag" tone="bad">{L.map.slotsFull}</Tag>{/if}
    <ArmyPick
      field
      foe={might(r.scout.side)}
      chance={way === 'solo' ? (e, a) => raidChance(game, e, a, r.scout.side) : undefined}
      cta={cta(r)}
      time={clock(marchTime(game, { kind: 'pvp', i: r.pid }))}
      disabled={full || busy}
      onsubmit={(e, a) => go(r, e, a)}
      {onrecruit}
    />
    <div class="mt-3"><Button variant="ghost" wide icon="back" onclick={() => (pick = null)}>{L.pvp.find}</Button></div>
  {:else}
    <Card>
      <div class="row">
        <Icon name="shield" size={26} />
        <span class="grow stack" style:--gap="1px">
          <b class="t-small">{game.shield > now ? L.pvp.shield(clock(game.shield - now)) : L.pvp.noShield}</b>
          <small class="t-tiny t-soft">{L.pvp.shieldHint}</small>
        </span>
      </div>
    </Card>
    <p class="t-small t-lore mt-2">{L.pvp.hint}</p>
    <ul class="stack mt-2">
      {#each list ?? [] as r (r.pid)}
        <li>
          <Card onclick={() => (pick = r)} tone={r.revenge ? 'glow' : 'paper'} label={r.name}>
            <span class="row">
              <Medal emblem="crest" tone="pvp" size={38} />
              <span class="grow stack" style:--gap="1px">
                <b>{r.name}</b>
                <small class="t-small t-soft">{L.realm(r.hall)} · {L.power} {num(r.power)} · {L.pvp.pts(r.pts)}</small>
              </span>
              {#if r.revenge}<Tag tone="red" size="sm">{L.pvp.revengeTag}</Tag>{/if}
              <Icon name="arrow" size={16} />
            </span>
          </Card>
        </li>
      {/each}
    </ul>
    {#if list && !list.length}<p class="center t-small t-soft mt-3">{L.pvp.none}</p>{/if}
    <div class="mt-3"><Button variant="ghost" wide disabled={loading} onclick={refresh}>{L.pvp.refresh}</Button></div>
  {/if}
</Sheet>
