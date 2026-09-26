<script lang="ts">
  // Đan phòng: chữa thương binh (cả lô) và luyện đan (1–5 viên mỗi mẻ).
  import {
    BREW_MAX,
    PILLS,
    PILL_IDS,
    UNITS,
    brewCost,
    brewError,
    brewNeed,
    brewTime,
    count,
    fallenOf,
    reviveCost,
    healCost,
    healError,
    healTime,
    hospital,
    unitOf,
    type PillId,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Medal, Section, Stepper, Tag } from './ui'
  import JobRow from './JobRow.svelte'
  import { EMBLEM, L, clock, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  let pill: PillId = $state('tuKhi')
  let n = $state(1)
  const hurt = $derived(count(game.wounded))
  const beds = $derived(hospital(game))
  const healErr = $derived(healError(game))
  const brewErr = $derived(brewError(game, pill, n))
  // Anh Linh Điện: đệ tử tử trận còn hồi sinh được
  const fallen = $derived(fallenOf(game, g.now))
  const reviveBag = $derived(reviveCost(fallen))
</script>

<Section title={L.alchemy.heal}>
  {#snippet aside()}{L.alchemy.bed(hurt, beds)}{/snippet}
  {#if game.heal}<JobRow kind="heal" label={L.alchemy.healing(count(game.heal.troops))} />{/if}
  {#if hurt}
    <ul class="row wrap">
      {#each UNITS as u (u)}
        {#if game.wounded[u]}
          {@const t = unitOf(u)}
          <li class="row" style:--gap="4px">
            <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={28} pips={t.tier} /><b class="t-num"
              >{num(game.wounded[u])}</b
            >
          </li>
        {/if}
      {/each}
    </ul>
    {#if hurt >= beds}<p class="t-small t-bad">{L.alchemy.overflow}</p>{/if}
    {#if !game.heal}
      <Bag res={healCost(game, game.wounded)} have={game.res} />
      <Button
        wide
        icon="heal"
        trail={clock(healTime(game, game.wounded))}
        disabled={!!healErr}
        onclick={() => act({ type: 'heal' }, 'reward')}>{L.alchemy.healAll}</Button
      >
    {/if}
  {:else if !game.heal}
    <p class="t-small t-soft t-lore">{L.alchemy.noWounded}</p>
  {/if}
</Section>

{#if count(fallen)}
  <Section title={L.alchemy.heroes}>
    {#snippet aside()}{L.alchemy.heroesLeft(clock((game.fallen?.until ?? g.now) - g.now))}{/snippet}
    <p class="t-small t-soft">{L.alchemy.heroesHint}</p>
    <ul class="row wrap">
      {#each UNITS as u (u)}
        {#if fallen[u]}
          {@const t = unitOf(u)}
          <li class="row" style:--gap="4px">
            <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={28} pips={t.tier} /><b class="t-num"
              >{num(fallen[u] ?? 0)}</b
            >
          </li>
        {/if}
      {/each}
    </ul>
    <Bag res={reviveBag} have={game.res} />
    <Button
      wide
      variant="gold"
      icon="heal"
      disabled={(['linhThach', 'linhThao', 'linhKhoang'] as const).some(r => game.res[r] < reviveBag[r])}
      onclick={() => act({ type: 'revive' }, 'reward')}>{L.alchemy.revive(num(count(fallen)))}</Button
    >
  </Section>
{/if}

<Section title={L.alchemy.brew}>
  {#if game.brew}<JobRow kind="brew" label={L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name)} />{/if}
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
  {#if PILLS[pill].need}
    <!-- đan theo công thức: đan nguyên liệu trừ lúc bắt đầu luyện -->
    <div class="row wrap">
      <span class="t-small t-soft">{L.panel.requires}</span>
      {#each Object.entries(brewNeed(pill, n)) as [q, k] (q)}
        {@const have = game.items[q as PillId] ?? 0}
        <Tag icon={q as PillId} tone={have >= k! ? 'good' : 'bad'}>{L.pills[q as PillId].name} {have}/{k}</Tag>
      {/each}
    </div>
  {/if}
  <div class="row between">
    <Stepper value={n} max={BREW_MAX} onchange={v => (n = v)} />
    <Bag res={brewCost(game, pill, n)} have={game.res} />
  </div>
  <Button
    wide
    icon="cauldron"
    trail={clock(brewTime(game, pill, n))}
    disabled={!!brewErr}
    onclick={() => act({ type: 'brew', pill, n }, 'build')}>{L.alchemy.go} {n}</Button
  >
</Section>
