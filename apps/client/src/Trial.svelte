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
  import { Art, Button, Grade, Meter, Seal, Tag } from './ui'
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
  <!-- độ khó như bậc lệnh bài: càng khó càng đậm son -->
  <div class="fill" style:--min="96px">
    {#each TRIAL_DIFF as k, d (d)}
      <Grade
        k={d / (TRIAL_DIFF.length - 1)}
        label={L.trial.diffs[d]}
        sub={L.trial.per(k, d + 1)}
        onclick={() => g.act({ type: 'trialStart', d })}
      />
    {/each}
  </div>
{:else}
  <!-- cửa ải: yêu thú vẽ tay, cửa đang đánh viết trong ấn son, vạch 50 cửa -->
  <header class="vista split" style:--gap="10px">
    <span class="rel stack">
      <Art art="fx-demon" icon="skull" size={72} lift />
      <span class="at-br" aria-hidden="true"><Seal size={30}>{Math.min(tr.gate + 1, TRIAL_GATES)}</Seal></span>
    </span>
    <div class="stack" style:--gap="3px">
      <b class="t-small">{L.trial.diff(L.trial.diffs[tr.d])}</b>
      <b class="t-num t-gold">{L.trial.gate(Math.min(tr.gate + 1, TRIAL_GATES), TRIAL_GATES)}</b>
      <Meter value={tr.gate / TRIAL_GATES} size="sm" tone="bad" />
      {#if foe}
        <small class="t-tiny">{L.trial.foe(num(Math.round(might(foe))))}</small>
        {#if trialElite(tr.gate)}<span class="self-start"><Tag tone="bad" size="sm">{L.trial.elite}</Tag></span>{/if}
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
