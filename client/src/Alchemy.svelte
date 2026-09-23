<script lang="ts">
  // Đan phòng: chữa thương binh (cả lô) và luyện đan (1–5 viên mỗi mẻ).
  import {
    BREW_MAX, PILLS, PILL_IDS, UNITS, brewCost, brewError, brewTime, count, healCost, healError, healTime, hospital, unitOf,
    type Action, type PillId, type State,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Cost from './Cost.svelte'
  import JobRow from './JobRow.svelte'
  import Unit from './Unit.svelte'
  import { L, clock, num, sfx } from './lib'

  let { game, now, act }: { game: State; now: number; act: (a: Action) => State | null } = $props()

  let pill: PillId = $state('tuKhi')
  let n = $state(1)
  const hurt = $derived(count(game.wounded))
  const beds = $derived(hospital(game))
  const healErr = $derived(healError(game))
  const brewErr = $derived(brewError(game, pill, n))
</script>

<h3>{L.alchemy.heal} · {L.alchemy.bed(hurt, beds)}</h3>
{#if game.heal}
  <JobRow {game} {now} kind="heal" label={L.alchemy.healing(count(game.heal.troops))} {act} />
{/if}
{#if hurt}
  <ul class="hurt">
    {#each UNITS as u (u)}
      {#if game.wounded[u]}
        {@const t = unitOf(u)}
        <li><Unit type={t.type} tier={t.tier} size={28} /><b>{num(game.wounded[u])}</b></li>
      {/if}
    {/each}
  </ul>
  {#if hurt >= beds}<p class="warn note">{L.alchemy.overflow}</p>{/if}
  {#if !game.heal}
    <Cost have={game.res} cost={healCost(game, game.wounded)} />
    <button class="btn wide go" disabled={!!healErr} onclick={() => act({ type: 'heal' }) && sfx('reward')}>
      <Icon name="heal" size={20} /><span>{L.alchemy.healAll}</span>
      <span class="t"><Icon name="clock" size={15} />{clock(healTime(game, game.wounded))}</span>
    </button>
  {/if}
{:else if !game.heal}
  <p class="muted">{L.alchemy.noWounded}</p>
{/if}

<h3>{L.alchemy.brew}</h3>
{#if game.brew}
  <JobRow {game} {now} kind="brew" label={L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name)} {act} />
{/if}
<div class="pills">
  {#each PILL_IDS as p (p)}
    {@const open = game.levels.danPhong >= PILLS[p].unlock}
    <button class="pill" class:on={pill === p} disabled={!open} onclick={() => (pill = p)} aria-pressed={pill === p}>
      <Icon name={p} size={34} />
      <b>{L.pills[p].name}</b>
      {#if open}
        <small>{L.alchemy.have(game.items[p] ?? 0)}</small>
      {:else}
        <small><Icon name="lock" size={10} /> {L.alchemy.unlock(PILLS[p].unlock)}</small>
      {/if}
    </button>
  {/each}
</div>
<p class="desc muted">{L.pills[pill].desc}</p>
<div class="stepper">
  <button class="btn ghost small" disabled={n <= 1} onclick={() => n--} aria-label="−"><Icon name="minus" size={14} /></button>
  <b>{n}</b>
  <button class="btn ghost small" disabled={n >= BREW_MAX} onclick={() => n++} aria-label="+"><Icon name="plus" size={14} /></button>
</div>
<Cost have={game.res} cost={brewCost(game, pill, n)} />
<button class="btn wide go" disabled={!!brewErr} onclick={() => act({ type: 'brew', pill, n }) && sfx('build')}>
  <Icon name="cauldron" size={20} /><span>{L.alchemy.go} {n}</span>
  <span class="t"><Icon name="clock" size={15} />{clock(brewTime(game, pill, n))}</span>
</button>

<style>
  .hurt {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
    padding: 0;
    list-style: none;
  }
  .hurt li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 4px;
    background: rgb(255 255 255 / 0.06);
    border-radius: 999px;
  }
  .note {
    margin-bottom: 10px;
    font-size: 13px;
  }
  .go {
    margin-top: 12px;
  }
  .pills {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .pill {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 10px 4px;
    color: inherit;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(201 161 74 / 0.3);
    border-radius: 12px;
    cursor: pointer;
  }
  .pill.on {
    background: rgb(201 161 74 / 0.18);
    border-color: var(--gold-l);
  }
  .pill:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .pill b {
    font-size: 12.5px;
  }
  .pill small {
    font-size: 10.5px;
    color: #b9c6ca;
  }
  .desc {
    margin: 10px 2px;
    font-size: 13px;
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
  }
  .stepper b {
    min-width: 20px;
    font-size: 18px;
    text-align: center;
  }
</style>
