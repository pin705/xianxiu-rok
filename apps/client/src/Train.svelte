<script lang="ts">
  // Diễn võ trường: chọn hệ, bậc, số lượng → tuyển. Mỗi lượt một đợt.
  import {
    RESOURCES,
    TIER,
    TIERS,
    TYPES,
    UNIT_BASE,
    batch,
    tierOpen,
    trainCost,
    trainError,
    trainTime,
    unitOf,
    type Action,
    type State,
    type Tier,
    type UnitId,
    type UnitType,
  } from '@rok/rules'
  import { Bag, Button, Card, Medal, Section, Slider, Stat, Tag } from './ui'
  import JobRow from './JobRow.svelte'
  import { EMBLEM, L, clock, num, sfx } from './lib'

  let { game, now, act }: { game: State; now: number; act: (a: Action) => State | null } = $props()

  // Mặc định: hệ tuyển được nhiều nhất với tài nguyên đang có — mỗi hệ ăn chủ yếu một loại, luôn chọn một hệ sẽ cạn một loại
  const afford = (t: UnitType) => Math.min(...RESOURCES.map(r => game.res[r] / UNIT_BASE[t].cost[r]))
  let type: UnitType = $state(TYPES.reduce((a, t) => (afford(t) > afford(a) ? t : a)))
  let tier: Tier = $state(TIERS.filter(t => tierOpen(game, t)).at(-1) ?? 1)
  const u = $derived(`${type}${tier}` as UnitId)
  const cap = $derived(batch(game))
  // Tối đa: vừa sức chứa một đợt, vừa đủ tài nguyên
  const most = $derived(
    Math.max(
      1,
      Math.min(cap, ...RESOURCES.map(r => (trainCost(u, 1)[r] ? Math.floor(game.res[r] / trainCost(u, 1)[r]) : cap))),
    ),
  )
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
  <div class="mt-3">
    <JobRow
      {game}
      {now}
      kind="train"
      label={L.train.doing(game.train.n, `${L.units[t.type]} ${L.tiers[t.tier]}`)}
      {act}
    />
  </div>
{/if}

<Section title={L.train.pick}>
  <div class="grid" style:--cols="3">
    {#each TYPES as t (t)}
      <Card selected={type === t} onclick={() => ((type = t), (n = 0))} label={L.units[t]}>
        <span class="stack center" style:--gap="3px">
          <span class="row center"><Medal emblem={EMBLEM.unit[t]} tone={t} size={38} /></span>
          <b class="t-small">{L.units[t]}</b>
          <small class="t-tiny t-soft">{L.beats(t)}</small>
        </span>
      </Card>
    {/each}
  </div>
</Section>

<Section title={L.train.tier}>
  <div class="grid" style:--cols="3">
    {#each TIERS as k (k)}
      {@const open = tierOpen(game, k)}
      <Card selected={tier === k} disabled={!open} onclick={() => ((tier = k), (n = 0))} label={L.tiers[k]}>
        <span class="stack center" style:--gap="3px">
          <b class="t-small">{L.tiers[k]}</b>
          {#if !open}<Tag icon="lock" size="sm">{L.train.tierLocked(TIER[k].unlock)}</Tag>{/if}
        </span>
      </Card>
    {/each}
  </div>
  <div class="grid" style:--cols="2">
    <Stat label={L.stat.atk}>{stat('atk')}</Stat>
    <Stat label={L.stat.def}>{stat('def')}</Stat>
    <Stat label={L.stat.hp}>{stat('hp')}</Stat>
    <Stat label={L.train.home}>{num(game.troops[u])}</Stat>
  </div>
</Section>

<Section title="{L.train.count} · {num(count)}/{num(cap)}">
  {#snippet aside()}<Button variant="ghost" size="sm" onclick={() => (n = most)}>{L.train.max}</Button>{/snippet}
  <Slider value={count} min={1} max={cap} label={L.train.count} onchange={v => (n = v)} />
  <Bag res={trainCost(u, count)} have={game.res} />
  <Button wide size="lg" trail={clock(trainTime(game, u, count))} trailIcon="clock" disabled={!!err} onclick={go}
    >{L.train.go} {num(count)}</Button
  >
  {#if err === 'busy'}<p class="center t-small t-soft">{L.err.busy}</p>{/if}
</Section>
