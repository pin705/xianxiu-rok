<script lang="ts">
  // Thí Luyện Yêu Hoàng (Karuak Ceremony của RoK — luật ở rules/sect/trial.ts): chọn độ khó một lần mỗi lượt lễ, rồi đánh lần lượt
  // từng cửa bằng quân thật. Trận có mầm bí mật: client chờ server (onfight) rồi cho xem lại.
  import {
    BEATS,
    TRIAL_AP,
    TRIAL_DIFF,
    TRIAL_GATES,
    TYPES,
    apOf,
    chance,
    count,
    deputyOf,
    fight,
    might,
    sideOf,
    trialElite,
    trialFoe,
    trialNow,
    type Army,
    type ElderId,
    type Report,
    type State,
  } from '@rok/rules'
  import ArmyPick from './Army.svelte'
  import { artOf } from '@rok/art'
  import { Button, Meter, Tag } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    s,
    onfight,
    onreplay,
  }: {
    s: State
    onfight?: (elder: ElderId, army: Army) => Promise<Report | null>
    onreplay?: (r: Report) => void
  } = $props()
  const g = useGame()
  const demon = artOf('ui:fx-demon')?.src
  const tr = $derived(trialNow(s))
  const foe = $derived(tr && tr.gate < TRIAL_GATES ? trialFoe(s, tr.d, tr.gate) : null)
  // hệ chính của yêu tướng xoay vòng theo cửa (trialFoe): nút "Theo hệ khắc" mang hệ khắc nó
  const counter = $derived(tr ? TYPES.find(x => BEATS[x] === TYPES[tr.gate % TYPES.length]) : undefined)
  const odds = (e: ElderId, a: Army) =>
    foe && count(a) ? chance(seed => fight(sideOf(g.game, e, a, deputyOf(g.game, e)), foe, seed).win) : 0
  let last = $state<Report | null>(null)
  async function go(e: ElderId, a: Army) {
    const r = await onfight?.(e, a)
    if (r) last = r
  }
</script>

{#if !tr}
  <p class="t-small t-strong">{L.trial.pick}</p>
  <!-- độ khó như bậc lệnh bài: càng khó càng đậm son -->
  <div class="diffs">
    {#each TRIAL_DIFF as k, d (d)}
      <button
        class="diff"
        style:--k={d / (TRIAL_DIFF.length - 1)}
        aria-label={L.trial.diffs[d]}
        onclick={() => {
          sfx('tap')
          g.act({ type: 'trialStart', d })
        }}
      >
        <b>{L.trial.diffs[d]}</b>
        <small class="t-tiny">{L.trial.per(k, d + 1)}</small>
      </button>
    {/each}
  </div>
{:else}
  <!-- cửa ải: yêu thú vẽ tay, cửa đang đánh viết trong ấn son, vạch 50 cửa -->
  <header class="gate">
    <span class="pic"
      >{#if demon}<img src={demon} alt="" draggable="false" />{/if}<b class="seal t-num" aria-hidden="true"
        >{Math.min(tr.gate + 1, TRIAL_GATES)}</b
      ></span
    >
    <div class="stack" style:--gap="3px">
      <b class="t-small">{L.trial.diff(L.trial.diffs[tr.d])}</b>
      <b class="t-num t-gold">{L.trial.gate(Math.min(tr.gate + 1, TRIAL_GATES), TRIAL_GATES)}</b>
      <Meter value={tr.gate / TRIAL_GATES} size="sm" tone="bad" />
      {#if foe}
        <small class="t-tiny">{L.trial.foe(num(Math.round(might(foe))))}</small>
        {#if trialElite(tr.gate)}<Tag tone="bad" size="sm">{L.trial.elite}</Tag>{/if}
      {/if}
    </div>
  </header>
  {#if last}
    <div class="row">
      <span class="grow t-small" class:t-good={last.win} class:t-bad={!last.win}
        >{L.trial.last(last.win, last.i + 1)}</span
      >
      <Button size="sm" variant="ghost" icon="arrow" onclick={() => last && onreplay?.(last)}>{L.report.replay}</Button>
    </div>
  {/if}
  {#if !foe}
    <Tag icon="check" tone="good">{L.trial.done}</Tag>
  {:else}
    <small class="t-tiny t-soft">{L.trial.ap(TRIAL_AP, apOf(s, g.now))}</small>
    <ArmyPick
      foe={might(foe)}
      chance={odds}
      cta={L.trial.go}
      disabled={g.busy || !onfight || apOf(s, g.now) < TRIAL_AP}
      onsubmit={go}
      {counter}
    />
  {/if}
{/if}

<style>
  .diffs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: var(--sp-2);
  }
  /* lệnh bài gỗ: nền trắng sương pha son theo độ khó (--k 0..1) */
  .diff {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-height: 58px;
    padding: 8px 4px;
    text-align: center;
    background: color-mix(in srgb, var(--cinnabar) calc(var(--k) * 30%), var(--silk));
    border: 1px solid color-mix(in srgb, var(--cinnabar) calc(var(--k) * 100%), var(--paper3));
    border-top: 4px solid color-mix(in srgb, var(--cinnabar) calc(var(--k) * 100%), var(--ink3));
    border-radius: 3px;
    box-shadow: 0 2px 4px rgb(var(--shade) / 0.12);
  }
  .diff:active {
    transform: scale(0.96);
  }
  .gate {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 8px 10px 8px 6px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .pic {
    position: relative;
    width: 72px;
    height: 72px;
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
  .seal {
    position: absolute;
    right: -6px;
    bottom: -4px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    font-size: var(--fs-2);
    color: var(--silk);
    background: var(
        --ui-seal-img,
        radial-gradient(circle at 40% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer))
      )
      center / 100% 100% no-repeat;
    border-radius: 50%;
  }
  .gate :global(.tag) {
    justify-self: start;
  }
</style>
