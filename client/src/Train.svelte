<script lang="ts">
  // Diễn võ trường: chọn hệ, bậc, số lượng → tuyển. Mỗi lượt một đợt.
  import {
    RESOURCES, TIER, TIERS, TYPES, UNIT_BASE, batch, tierOpen, trainCost, trainError, trainTime, unitOf,
    type Action, type State, type Tier, type UnitId, type UnitType,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Cost from './Cost.svelte'
  import JobRow from './JobRow.svelte'
  import Unit from './Unit.svelte'
  import { L, clock, num, sfx } from './lib'

  let { game, now, act }: { game: State; now: number; act: (a: Action) => State | null } = $props()

  let type: UnitType = $state('kiem')
  let tier: Tier = $state(TIERS.filter(t => tierOpen(game, t)).at(-1) ?? 1)
  const u = $derived(`${type}${tier}` as UnitId)
  const cap = $derived(batch(game))
  // Tối đa: vừa sức chứa một đợt, vừa đủ tài nguyên
  const most = $derived(Math.max(1, Math.min(cap, ...RESOURCES.map(r => (trainCost(u, 1)[r] ? Math.floor(game.res[r] / trainCost(u, 1)[r]) : cap)))))
  let n = $state(0)
  const count = $derived(Math.min(n || most, cap))
  const err = $derived(trainError(game, u, count))
  const stat = (k: 'atk' | 'def' | 'hp') => Math.round(UNIT_BASE[type][k] * TIER[tier].stat)

  function go() {
    if (act({ type: 'train', unit: u, n: count })) {
      sfx('build')
      n = 0
    }
  }
</script>

{#if game.train}
  {@const t = unitOf(game.train.unit)}
  <JobRow {game} {now} kind="train" label={L.train.doing(game.train.n, `${L.units[t.type]} ${L.tiers[t.tier]}`)} {act} />
{/if}

<h3>{L.train.pick}</h3>
<div class="types">
  {#each TYPES as t (t)}
    <button class="type" class:on={type === t} onclick={() => ((type = t), (n = 0))} aria-pressed={type === t}>
      <Unit type={t} size={38} />
      <b>{L.units[t]}</b>
      <small>{L.beats(t)}</small>
    </button>
  {/each}
</div>

<h3>{L.train.tier}</h3>
<div class="tiers">
  {#each TIERS as k (k)}
    {@const open = tierOpen(game, k)}
    <button class="tier" class:on={tier === k} disabled={!open} onclick={() => ((tier = k), (n = 0))} aria-pressed={tier === k}>
      <b>{L.tiers[k]}</b>
      {#if !open}<small><Icon name="lock" size={10} /> {L.train.tierLocked(TIER[k].unlock)}</small>{/if}
    </button>
  {/each}
</div>

<p class="stats">
  <span>{L.stat.atk} <b>{stat('atk')}</b></span>
  <span>{L.stat.def} <b>{stat('def')}</b></span>
  <span>{L.stat.hp} <b>{stat('hp')}</b></span>
  <span class="muted">{L.train.home}: <b>{num(game.troops[u])}</b></span>
</p>

<h3>{L.train.count} · {num(count)}/{num(cap)}</h3>
<div class="count">
  <input type="range" min="1" max={cap} value={count} oninput={e => (n = +e.currentTarget.value)} aria-label={L.train.count} />
  <button class="btn ghost small" onclick={() => (n = most)}>{L.train.max}</button>
</div>

<Cost have={game.res} cost={trainCost(u, count)} />
<button class="btn wide go" disabled={!!err} onclick={go}>
  <span>{L.train.go} {num(count)}</span>
  <span class="t"><Icon name="clock" size={15} />{clock(trainTime(game, u, count))}</span>
</button>
{#if err === 'busy'}<p class="muted note">{L.err.busy}</p>{/if}

<style>
  .types {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .type,
  .tier {
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
  .type.on,
  .tier.on {
    background: rgb(201 161 74 / 0.18);
    border-color: var(--gold-l);
  }
  .type b,
  .tier b {
    font-size: 13px;
  }
  .type small,
  .tier small {
    font-size: 10.5px;
    color: #b9c6ca;
  }
  .tiers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .tier:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin-top: 12px;
    font-size: 13px;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  input[type='range'] {
    flex: 1;
    accent-color: var(--gold);
  }
  .go {
    margin-top: 14px;
  }
  .note {
    margin-top: 8px;
    font-size: 13px;
    text-align: center;
  }
</style>
