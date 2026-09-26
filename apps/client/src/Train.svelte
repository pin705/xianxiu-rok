<script lang="ts">
  // Diễn võ trường: chọn hệ, bậc, số lượng → tuyển. Mỗi lượt một đợt.
  // Bố cục sân tập: ba tổ sư ba hệ đứng trên nền đá (hệ đang chọn đứng lớn trên bệ), bậc là hàng lá bùa ghim,
  // chi phí là lễ vật trên án son, tuyển bằng nút ấn son — cùng họ với nghi lễ nâng cấp của bảng công trình.
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
  import { Altar, Ascend, Bag, Button, FirstTap, Medal, Podium, Seal, Section, Slider, Slip, Tally, Timer } from './ui'
  import { paintedUrl, soldier, type IconName } from '@rok/art'
  import JobRow from './JobRow.svelte'
  import Refill from './Refill.svelte'
  import { EMBLEM, L, LANG, clock, num, sfx, unitName } from './lib'
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
  const cost = $derived(trainCost(u, count))
  const uni = $derived(daoUnit(game)) // đệ tử đặc trưng của đạo thống: chỉ số gốc cao hơn
  const stat = (k: 'atk' | 'def' | 'hp') =>
    Math.round(UNIT_BASE[type][k] * TIER[tier].stat * (uni?.type === type ? 1 + (uni[k] ?? 0) : 1))
  // tổ sư vẽ tay đứng cho mỗi hệ (fig:theTong/kiemTong/phapTong); hệ đặc trưng thì tổ sư đạo thống của mình
  const fig = (t: UnitType) =>
    paintedUrl(uni?.type === t && game.dao ? `fig:${game.dao.id}` : `fig:${t}Tong`, () => soldier(t, false, 5), 150)

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

<!-- sân tập: chạm một tổ sư để chọn hệ; hệ đang chọn bước lên bệ đá -->
<div class="mt-3">
  <Podium
    label={L.train.pick}
    value={type}
    items={TYPES.map(t => ({
      id: t,
      src: fig(t),
      name: unitName(t, game),
      sub: L.beats(t),
      tag: uni?.type === t ? L.dao.uni : undefined,
    }))}
    onpick={t => {
      type = t as UnitType
      n = 0
    }}
  />
</div>

<!-- bậc: hàng lá bùa ghim son, bậc chưa mở mờ đi kèm tầng cần -->
<div class="grid mt-4" style:--cols="5" style:--gap="6px" role="group" aria-label={L.train.tier}>
  {#each TIERS as k (k)}
    {@const open = tierOpen(game, k)}
    <Slip
      label={L.tiers[k]}
      pips={open ? k : 0}
      lock={open ? undefined : L.level(TIER[k].unlock)}
      on={tier === k}
      disabled={!open}
      title={open ? undefined : L.train.tierLocked(TIER[k].unlock)}
      onclick={() => {
        tier = k
        n = 0
      }}
    />
  {/each}
</div>

<!-- sổ chỉ số: bốn ô một hàng -->
<div class="mt-4">
  <Tally
    items={[
      { label: L.stat.atk, value: stat('atk') },
      { label: L.stat.def, value: stat('def') },
      { label: L.stat.hp, value: stat('hp') },
      { label: L.train.home, value: num(game.troops[u]) },
    ]}
  />
</div>

<div class="row mt-3">
  <b>{L.train.count}</b>
  <span class="grow t-num t-big"><b>{num(count)}</b><small class="t-small t-faint">/{num(cap)}</small></span>
  <Button variant="ghost" size="sm" onclick={() => (n = most)}>{L.train.max}</Button>
</div>
<Slider value={count} min={1} max={cap} label={L.train.count} onchange={v => (n = v)} />

<!-- lễ vật trên án son: mỗi tài nguyên một món, số đủ / thiếu -->
<div class="mt-3">
  <Altar
    items={RESOURCES.filter(r => cost[r]).map(r => ({
      key: r,
      art: `res-${r}`,
      icon: r as IconName,
      n: num(cost[r]),
      sub: L.panel.have(num(game.res[r])),
      short: game.res[r] < cost[r],
    }))}
  />
</div>
<!-- thiếu tài nguyên: mở nang / đổi ở Thương hội ngay tại đây (như Quick Replenish của RoK) -->
{#if err === 'not_enough'}<Refill {cost} />{/if}
<div class="row justify-center mt-3" style:--gap="var(--sp-3)">
  <FirstTap key="train">
    <Seal disabled={!!err} onclick={go}>{L.train.go} {num(count)}</Seal>
  </FirstTap>
  <Timer
    time={clock(trainTime(game, u, count))}
    sub={err === 'busy'
      ? L.err.busy
      : !err
        ? L.train.doneAt(
            new Date(g.now + trainTime(game, u, count)).toLocaleTimeString(LANG, {
              hour: '2-digit',
              minute: '2-digit',
            }),
          )
        : undefined}
  />
</div>

{#if from && game.troops[from] > 0 && tierOpen(game, tier)}
  <!-- Nâng bậc (Upgrade Troops của RoK): đệ tử bậc dưới đang ở nhà lên bậc đang chọn -->
  <Section title="{L.train.promote} · {num(pcount)}/{num(Math.min(game.troops[from], cap))}">
    <!-- huy hiệu bậc dưới → bậc trên, mũi tên mực -->
    <div class="row">
      <Ascend align="center" small fromLabel={L.tiers[(tier - 1) as Tier]} toLabel={L.tiers[tier]}>
        {#snippet from()}<Medal emblem={EMBLEM.unit[type]} tone={type} size={44} pips={tier - 1} />{/snippet}
        {#snippet to()}<Medal emblem={EMBLEM.unit[type]} tone={type} size={52} pips={tier} />{/snippet}
      </Ascend>
      <p class="grow t-tiny t-soft clamp" style:--lines="4">{L.train.promoteHint}</p>
    </div>
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
