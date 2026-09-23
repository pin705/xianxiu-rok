<script lang="ts">
  // Đan phòng: chữa thương binh (cả lô) và luyện đan (1–5 viên mỗi mẻ).
  import {
    BREW_MAX, PILLS, PILL_IDS, UNITS, brewCost, brewError, brewTime, count, healCost, healError, healTime, hospital, unitOf,
    type Action, type PillId, type State,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Medal, Section, Stepper, Tag } from './ui'
  import JobRow from './JobRow.svelte'
  import { GLYPH, L, clock, num, sfx } from './lib'

  let { game, now, act }: { game: State; now: number; act: (a: Action) => State | null } = $props()

  let pill: PillId = $state('tuKhi')
  let n = $state(1)
  const hurt = $derived(count(game.wounded))
  const beds = $derived(hospital(game))
  const healErr = $derived(healError(game))
  const brewErr = $derived(brewError(game, pill, n))
</script>

<Section title={L.alchemy.heal}>
  {#snippet aside()}{L.alchemy.bed(hurt, beds)}{/snippet}
  {#if game.heal}<JobRow {game} {now} kind="heal" label={L.alchemy.healing(count(game.heal.troops))} {act} />{/if}
  {#if hurt}
    <ul class="row wrap">
      {#each UNITS as u (u)}
        {#if game.wounded[u]}
          {@const t = unitOf(u)}
          <li class="row" style:--gap="4px"><Medal glyph={GLYPH.unit[t.type]} tone={t.type} size={28} pips={t.tier} /><b class="t-num">{num(game.wounded[u])}</b></li>
        {/if}
      {/each}
    </ul>
    {#if hurt >= beds}<p class="t-small t-bad">{L.alchemy.overflow}</p>{/if}
    {#if !game.heal}
      <Bag res={healCost(game, game.wounded)} have={game.res} />
      <Button wide icon="heal" trail={clock(healTime(game, game.wounded))} disabled={!!healErr} onclick={() => act({ type: 'heal' }) && sfx('reward')}>{L.alchemy.healAll}</Button>
    {/if}
  {:else if !game.heal}
    <p class="t-small t-soft t-lore">{L.alchemy.noWounded}</p>
  {/if}
</Section>

<Section title={L.alchemy.brew}>
  {#if game.brew}<JobRow {game} {now} kind="brew" label={L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name)} {act} />{/if}
  <div class="grid" style:--cols="3">
    {#each PILL_IDS as p (p)}
      {@const open = game.levels.danPhong >= PILLS[p].unlock}
      <Card selected={pill === p} disabled={!open} onclick={() => (pill = p)} label={L.pills[p].name}>
        <span class="stack center" style:--gap="3px">
          <span class="row center"><Icon name={p} size={34} /></span>
          <b class="t-small">{L.pills[p].name}</b>
          {#if open}
            <small class="t-tiny t-soft">{L.alchemy.have(game.items[p] ?? 0)}</small>
          {:else}
            <Tag icon="lock" size="sm">{L.alchemy.unlock(PILLS[p].unlock)}</Tag>
          {/if}
        </span>
      </Card>
    {/each}
  </div>
  <p class="t-small t-lore">{L.pills[pill].desc}</p>
  <div class="row between">
    <Stepper value={n} max={BREW_MAX} onchange={v => (n = v)} />
    <Bag res={brewCost(game, pill, n)} have={game.res} />
  </div>
  <Button wide icon="cauldron" trail={clock(brewTime(game, pill, n))} disabled={!!brewErr} onclick={() => act({ type: 'brew', pill, n }) && sfx('build')}>{L.alchemy.go} {n}</Button>
</Section>
