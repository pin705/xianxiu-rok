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
  import { Bag, Button, FirstTap, Medal, Section, Slider, Tag } from './ui'
  import { Icon, artOf, paintedUrl, soldier, type IconName } from '@rok/art'
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
<div class="yard" role="group" aria-label={L.train.pick}>
  {#each TYPES as t (t)}
    <button
      type="button"
      class="fig"
      class:on={type === t}
      aria-label={unitName(t, game)}
      aria-pressed={type === t}
      onclick={() => {
        sfx('tap')
        type = t
        n = 0
      }}
    >
      <span class="pic"><img src={fig(t)} alt="" draggable="false" /></span>
      <b class="nm">{unitName(t, game)}</b>
      {#if uni?.type === t}<Tag size="sm" tone="gold">{L.dao.uni}</Tag>{/if}
      <small class="t-tiny">{L.beats(t)}</small>
    </button>
  {/each}
</div>

<!-- bậc: hàng lá bùa ghim son, bậc chưa mở mờ đi kèm tầng cần -->
<div class="tiers" role="group" aria-label={L.train.tier}>
  {#each TIERS as k (k)}
    {@const open = tierOpen(game, k)}
    <button
      type="button"
      class="slip"
      class:on={tier === k}
      disabled={!open}
      aria-label={L.tiers[k]}
      aria-pressed={tier === k}
      title={open ? undefined : L.train.tierLocked(TIER[k].unlock)}
      onclick={() => {
        sfx('tap')
        tier = k
        n = 0
      }}
    >
      <b>{L.tiers[k]}</b>
      {#if open}
        <i class="pips"
          >{#each { length: k } as _, i (i)}<i></i>{/each}</i
        >
      {:else}
        <small class="row" style:--gap="2px"><Icon name="lock" size={11} />{L.level(TIER[k].unlock)}</small>
      {/if}
    </button>
  {/each}
</div>

<!-- sổ chỉ số: bốn ô một hàng -->
<dl class="ledger">
  <div>
    <dt>{L.stat.atk}</dt>
    <dd class="t-num">{stat('atk')}</dd>
  </div>
  <div>
    <dt>{L.stat.def}</dt>
    <dd class="t-num">{stat('def')}</dd>
  </div>
  <div>
    <dt>{L.stat.hp}</dt>
    <dd class="t-num">{stat('hp')}</dd>
  </div>
  <div>
    <dt>{L.train.home}</dt>
    <dd class="t-num">{num(game.troops[u])}</dd>
  </div>
</dl>

<div class="count">
  <b>{L.train.count}</b>
  <span class="t-num"><b>{num(count)}</b><small>/{num(cap)}</small></span>
  <Button variant="ghost" size="sm" onclick={() => (n = most)}>{L.train.max}</Button>
</div>
<Slider value={count} min={1} max={cap} label={L.train.count} onchange={v => (n = v)} />

<!-- lễ vật trên án son: mỗi tài nguyên một món, số đủ / thiếu -->
<div class="altar">
  {#each RESOURCES as r (r)}
    {#if cost[r]}
      {@const src = artOf(`ui:res-${r}`)?.src}
      <span class="gift" class:short={game.res[r] < cost[r]}>
        {#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={r as IconName} size={40} />{/if}
        <b class="t-num">{num(cost[r])}</b>
        <small class="t-num">{L.panel.have(num(game.res[r]))}</small>
      </span>
    {/if}
  {/each}
</div>
<!-- thiếu tài nguyên: mở nang / đổi ở Thương hội ngay tại đây (như Quick Replenish của RoK) -->
{#if err === 'not_enough'}<Refill {cost} />{/if}
<div class="go">
  <FirstTap key="train">
    <button class="seal" disabled={!!err} onclick={go}><span>{L.train.go} {num(count)}</span></button>
  </FirstTap>
  <span class="when">
    <b class="t-num"><Icon name="clock" size={14} />{clock(trainTime(game, u, count))}</b>
    {#if err === 'busy'}<small>{L.err.busy}</small>
    {:else if !err}<small
        >{L.train.doneAt(
          new Date(g.now + trainTime(game, u, count)).toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit' }),
        )}</small
      >{/if}
  </span>
</div>

{#if from && game.troops[from] > 0 && tierOpen(game, tier)}
  <!-- Nâng bậc (Upgrade Troops của RoK): đệ tử bậc dưới đang ở nhà lên bậc đang chọn -->
  <Section title="{L.train.promote} · {num(pcount)}/{num(Math.min(game.troops[from], cap))}">
    <div class="up">
      <span class="stack center" style:--gap="6px"
        ><Medal emblem={EMBLEM.unit[type]} tone={type} size={44} pips={tier - 1} /><small class="t-tiny t-strong"
          >{L.tiers[(tier - 1) as Tier]}</small
        ></span
      >
      <svg class="arrow" viewBox="0 0 60 24" aria-hidden="true"
        ><path d="M4 14 C 18 4, 30 22, 46 11" /><path d="M40 5 L 52 10 L 42 18" /></svg
      >
      <span class="stack center" style:--gap="6px"
        ><Medal emblem={EMBLEM.unit[type]} tone={type} size={52} pips={tier} /><small class="t-tiny t-strong nx"
          >{L.tiers[tier]}</small
        ></span
      >
      <p class="t-tiny t-soft hint">{L.train.promoteHint}</p>
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

<style>
  /* ---------- sân tập: ba tổ sư trên nền núi mờ, người đang chọn đứng trên bệ đá ---------- */
  .yard {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    margin-top: var(--sp-3);
    padding: 12px 4px 10px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom 58px / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .fig {
    display: grid;
    justify-items: center;
    align-content: end;
    gap: 2px;
    min-width: 0;
    color: var(--text-soft);
    text-align: center;
  }
  .pic {
    position: relative;
    display: grid;
    place-items: end center;
    height: 150px;
  }
  .pic img {
    position: relative;
    z-index: 1;
    height: 104px;
    max-width: 100%;
    object-fit: contain;
    object-position: bottom;
    filter: saturate(0.55) opacity(0.82) drop-shadow(0 3px 3px rgb(0 0 0 / 0.18));
    transition:
      height var(--dur-2) var(--spring),
      filter var(--dur-2) var(--ease);
  }
  /* bóng chân / bệ đá: đĩa đá xám, người đang chọn có viền son */
  .pic::before {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 18%;
    right: 18%;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgb(0 0 0 / 0.2), transparent 70%);
  }
  .fig.on .pic img {
    height: 146px;
    filter: drop-shadow(0 0 8px rgb(var(--gold-glow) / 0.85)) drop-shadow(0 4px 4px rgb(0 0 0 / 0.2));
  }
  .fig.on .pic::before {
    left: 2%;
    right: 2%;
    bottom: -9px;
    height: 24px;
    background: radial-gradient(ellipse at 50% 30%, #fbfbf8, #d4d7cf 55%, #a3a89f);
    box-shadow:
      inset 0 -3px 0 rgb(0 0 0 / 0.12),
      0 0 0 1.5px var(--cinnabar),
      0 5px 7px rgb(0 0 0 / 0.22);
  }
  .fig:active .pic img {
    transform: scale(0.96);
  }
  .nm {
    margin-top: 8px;
    padding: 0 4px 4px;
    font-size: var(--fs-2);
    line-height: 1.15;
  }
  .fig.on .nm {
    font-size: var(--fs-4);
    color: var(--text);
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }

  /* ---------- bậc: lá bùa giấy ghim son ---------- */
  .tiers {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    margin-top: var(--sp-4);
  }
  .slip {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    min-height: 56px;
    padding: 10px 2px 6px;
    font-size: var(--fs-1);
    line-height: 1.15;
    text-align: center;
    color: var(--text-soft);
    background: #fbf7ec;
    border: 1px solid #d8cdb4;
    border-radius: 3px;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.12);
  }
  .slip:nth-child(odd) {
    rotate: -1.5deg;
  }
  .slip:nth-child(even) {
    rotate: 1deg;
  }
  .slip::before {
    content: '';
    position: absolute;
    top: -5px;
    left: calc(50% - 5px);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #f07a62, var(--cinnabar) 60%, #6e1f18);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  }
  .slip.on {
    color: var(--cinnabar);
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 30%, transparent),
      0 3px 8px rgb(0 0 0 / 0.16);
  }
  .slip:disabled {
    opacity: 0.6;
  }
  .slip:disabled::before {
    background: var(--paper3);
  }
  .slip small {
    font-size: 11px;
    font-weight: 700;
  }
  .pips {
    display: flex;
    gap: 2px;
  }
  .pips i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, var(--silk), var(--gold-l) 50%, var(--gold));
    box-shadow: 0 0 0 0.5px var(--gold-d);
  }

  /* ---------- sổ chỉ số ---------- */
  .ledger {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: var(--sp-4) 0 var(--sp-2);
    text-align: center;
  }
  .ledger div + div {
    border-left: 1px dashed var(--paper3);
  }
  dt {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  dd {
    margin: 0;
    font-size: var(--fs-4);
    font-weight: 900;
  }
  .count {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  .count > span {
    flex: 1;
    font-size: var(--fs-4);
  }
  .count small {
    font-size: var(--fs-2);
    color: var(--text-faint);
  }

  /* ---------- án son + nút ấn son (như nghi lễ nâng cấp ở Panel) ---------- */
  .altar {
    position: relative;
    display: flex;
    justify-content: center;
    gap: 18px;
    margin-top: var(--sp-3);
    padding: 4px 20px 26px;
    background:
      linear-gradient(#c9a45a, #c9a45a) left 8px bottom 18px / calc(100% - 16px) 2px no-repeat,
      linear-gradient(#c0443a, #7d2218) left 0 bottom 10px / 100% 12px no-repeat;
  }
  .altar::before,
  .altar::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 12px;
    height: 12px;
    background: linear-gradient(#8a2a20, #5a1510);
    border-radius: 0 0 3px 3px;
  }
  .altar::before {
    left: 26px;
  }
  .altar::after {
    right: 26px;
  }
  .gift {
    display: grid;
    justify-items: center;
    min-width: 64px;
  }
  .gift img {
    width: 52px;
    height: 52px;
    filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.25));
  }
  .gift b {
    font-size: var(--fs-4);
    font-weight: 900;
  }
  .gift small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
  .gift.short b {
    color: var(--cinnabar);
  }
  .go {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
  }
  .seal {
    display: grid;
    place-items: center;
    width: 104px;
    height: 104px;
    padding: 12px;
    font-size: var(--fs-4);
    font-weight: 900;
    line-height: 1.1;
    color: #fff;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
    background: var(--ui-seal-img, radial-gradient(circle at 40% 35%, #e0604c, #a8352a 60%, #6e1f18)) center / 100% 100%
      no-repeat;
    border: 0;
    border-radius: 50%;
    filter: drop-shadow(0 6px 10px rgb(110 31 24 / 0.35));
    transition: transform var(--dur-1) var(--ease);
    cursor: pointer;
  }
  .seal:active {
    transform: scale(0.94) rotate(-4deg);
  }
  .seal:disabled {
    filter: grayscale(0.85) opacity(0.7);
    cursor: default;
  }
  .when {
    display: grid;
    gap: 2px;
    max-width: 150px;
    padding: 6px 12px;
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 8px;
  }
  .when b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-4);
  }
  .when small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }

  /* ---------- nâng bậc: huy hiệu bậc dưới → bậc trên, mũi tên mực ---------- */
  .up {
    display: grid;
    grid-template-columns: auto 44px auto minmax(0, 1fr);
    align-items: center;
    gap: 6px 8px;
  }
  .up .nx {
    color: var(--cinnabar);
  }
  .hint {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
  }
  .arrow {
    width: 44px;
    fill: none;
    stroke: var(--text);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
