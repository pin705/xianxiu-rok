<script lang="ts">
  // Tranh đoạt: kẻ đã cướp mình (báo thù) và vài tông môn gần lực chiến; chọn một → xem dò thám → chọn đội → xuất quân cướp.
  // Danh sách do server ghép (cần state của cả giới); tỉ lệ thắng ước lượng theo phòng thủ đã dò thám.
  import {
    PVP_HALL,
    UNITS,
    marchSlots,
    marchTime,
    might,
    type Army,
    type ElderId,
    type State,
    type UnitId,
  } from '@rok/rules'
  import { raidChance, type Rival } from '@rok/rules/world'
  import { Icon, Portrait } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import { Button, Card, Medal, Section, Sheet, Tag } from './ui'
  import { EMBLEM, L, LOOK, clock, num } from './lib'

  let {
    game,
    now,
    open,
    busy = false,
    focus = null,
    load,
    onclose,
    onraid,
    onrecruit,
  }: {
    game: State
    now: number
    open: boolean
    busy?: boolean
    focus?: number | null // mở thẳng một tông môn (chạm trên bản đồ giới)
    load: (pid?: number) => Promise<Rival[] | null>
    onclose: () => void
    onraid: (pid: number, elder: ElderId, army: Army) => void
    onrecruit: () => void
  } = $props()

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
  const troopsOf = (r: Rival) =>
    r.scout.side.troops.map(t => ({ u: `${t.type}${t.tier}` as UnitId, n: t.n })).filter(x => UNITS.includes(x.u))
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
        {#each troopsOf(r) as t (t.u)}
          <li class="row" style:--gap="5px">
            <Medal
              emblem={EMBLEM.unit[t.u.slice(0, -1) as 'kiem']}
              tone={t.u.slice(0, -1) as 'kiem'}
              size={30}
              pips={Number(t.u.slice(-1))}
            /><span class="t-small t-strong">~{num(t.n)}</span>
          </li>
        {/each}
        {#if !troopsOf(r).length}<li class="t-small t-soft">{L.army.noTroops}</li>{/if}
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
    {#if full}<Tag icon="flag" tone="bad">{L.map.slotsFull}</Tag>{/if}
    <ArmyPick
      {game}
      foe={might(r.scout.side)}
      chance={(e, a) => raidChance(game, e, a, r.scout.side)}
      cta={r.revenge ? L.pvp.revenge : L.pvp.attack}
      time={clock(marchTime(game, { kind: 'pvp', i: r.pid }))}
      disabled={full || busy}
      onsubmit={(e, a) => onraid(r.pid, e, a)}
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
