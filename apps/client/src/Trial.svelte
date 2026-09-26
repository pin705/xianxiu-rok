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
  import { Button, Card, Tag } from './ui'
  import { L, num } from './lib'
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
  <div class="diffs">
    {#each TRIAL_DIFF as k, d (d)}
      <Card onclick={() => g.act({ type: 'trialStart', d })} label={L.trial.diffs[d]}>
        <span class="stack center" style:--gap="1px"
          ><b>{L.trial.diffs[d]}</b><small class="t-tiny t-soft">{L.trial.per(k, d + 1)}</small></span
        >
      </Card>
    {/each}
  </div>
{:else}
  <Card tone="silk">
    <div class="row between">
      <b>{L.trial.diff(L.trial.diffs[tr.d])}</b>
      <b class="t-num t-gold">{L.trial.gate(Math.min(tr.gate + 1, TRIAL_GATES), TRIAL_GATES)}</b>
    </div>
    {#if foe}
      <p class="row t-small">
        <span class="grow">{L.trial.foe(num(Math.round(might(foe))))}</span>
        {#if trialElite(tr.gate)}<Tag tone="bad" size="sm">{L.trial.elite}</Tag>{/if}
      </p>
    {/if}
  </Card>
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
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: var(--sp-2);
  }
</style>
