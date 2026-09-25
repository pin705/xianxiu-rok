<script lang="ts">
  // Diễn võ trường: chọn hệ, bậc, số lượng → tuyển. Mỗi lượt một đợt.
  import {
    RESOURCES,
    TIER,
    TIERS,
    TYPES,
    UNIT_BASE,
    batch,
    daoUnit,
    tierOpen,
    trainCost,
    trainError,
    trainTime,
    unitOf,
    promoteCost,
    promoteError,
    promoteTime,
    type Tier,
    type UnitId,
    type UnitType,
  } from '@rok/rules'
  import { Bag, Button, Card, FirstTap, Medal, Section, Slider, Stat, Tag } from './ui'
  import { paintedUrl, soldier } from '@rok/art'
  import JobRow from './JobRow.svelte'
  import { EMBLEM, L, clock, num, sfx, unitName } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

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
  const uni = $derived(daoUnit(game)) // đệ tử đặc trưng của đạo thống: chỉ số gốc cao hơn
  const stat = (k: 'atk' | 'def' | 'hp') =>
    Math.round(UNIT_BASE[type][k] * TIER[tier].stat * (uni?.type === type ? 1 + (uni[k] ?? 0) : 1))

  // Nâng bậc: bậc thấp hơn bậc đang chọn một bậc, cùng hệ (đang chọn bậc 1 thì không có)
  const from = $derived(tier > 1 ? (`${type}${tier - 1}` as UnitId) : null)
  let pn = $state(0)
  const pcount = $derived(from ? Math.min(pn || game.troops[from], game.troops[from], cap) : 0)
  const perr = $derived(from && pcount ? promoteError(game, from, pcount) : 'empty')
  function promote() {
    if (from && act({ type: 'promote', unit: from, n: pcount })) {
      sfx('build')
      pn = 0
    }
  }

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
    <JobRow kind="train" label={L.train.doing(game.train.n, `${unitName(t.type, game)} ${L.tiers[t.tier]}`)} />
  </div>
{/if}

<Section title={L.train.pick}>
  <div class="grid" style:--cols="3">
    {#each TYPES as t (t)}
      <Card
        selected={type === t}
        onclick={() => {
          type = t
          n = 0
        }}
        label={unitName(t, game)}
      >
        <span class="stack center" style:--gap="3px">
          <span class="row center"
            >{#if uni?.type === t && game.dao}<img
                src={paintedUrl(`sold:dao:${game.dao.id}`, () => soldier(t, false, 5), 44)}
                width="44"
                height="44"
                alt=""
              />{:else}<Medal emblem={EMBLEM.unit[t]} tone={t} size={38} />{/if}</span
          >
          <b class="t-small">{unitName(t, game)}</b>
          {#if uni?.type === t}<Tag size="sm" tone="gold">{L.dao.uni}</Tag>{/if}
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
      <Card
        selected={tier === k}
        disabled={!open}
        onclick={() => {
          tier = k
          n = 0
        }}
        label={L.tiers[k]}
      >
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
  <FirstTap key="train">
    <Button wide size="lg" trail={clock(trainTime(game, u, count))} trailIcon="clock" disabled={!!err} onclick={go}
      >{L.train.go} {num(count)}</Button
    >
  </FirstTap>
  {#if err === 'busy'}<p class="center t-small t-soft">{L.err.busy}</p>{/if}
</Section>

{#if from && game.troops[from] > 0 && tierOpen(game, tier)}
  <!-- Nâng bậc (Upgrade Troops của RoK): đệ tử bậc dưới đang ở nhà lên bậc đang chọn -->
  <Section title="{L.train.promote} · {num(pcount)}/{num(Math.min(game.troops[from], cap))}">
    <p class="t-small t-soft">{L.train.promoteHint}</p>
    <Slider
      value={pcount}
      min={1}
      max={Math.max(1, Math.min(game.troops[from], cap))}
      label={L.train.promote}
      onchange={v => (pn = v)}
    />
    <Bag res={promoteCost(from, pcount)} have={game.res} />
    <Button
      wide
      variant="gold"
      trail={clock(promoteTime(game, from, pcount))}
      trailIcon="clock"
      disabled={!!perr}
      onclick={promote}>{L.train.promoteGo(num(pcount), L.tiers[(tier - 1) as Tier], L.tiers[tier])}</Button
    >
  </Section>
{/if}
