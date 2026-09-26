<script lang="ts">
  // Áp Tiêu Hộ Hàng (Protect the Supplies của RoK — luật ở rules/sect/escort.ts): chọn độ khó (sao sau mở khi lượt tốt nhất qua sao
  // trước), đội ảo hộ tống xe hàng qua các đợt phục kích, mỗi lượt tốn hành lực. Trận có mầm bí mật: client chờ server (onfight)
  // rồi cho xem lại.
  import {
    FESTS,
    TYPES,
    apOf,
    escortBest,
    escortTop,
    type Army,
    type ElderId,
    type FestId,
    type Report,
    type State,
  } from '@rok/rules'
  import ArmyPick from './Army.svelte'
  import { Button, Card } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let {
    id,
    s,
    onfight,
    onreplay,
  }: {
    id: FestId
    s: State
    onfight?: (lv: number, elder: ElderId, army: Army) => Promise<Report | null>
    onreplay?: (r: Report) => void
  } = $props()
  const g = useGame()
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'escort' ? def : null
  })
  const best = $derived(escortBest(s, id))
  const top = $derived(escortTop(s, id))
  let chosen = $state(0)
  const lv = $derived(Math.min(chosen || top, top))
  const ap = $derived(apOf(s, g.now))
  const sp = $derived(s.fest[id]?.sp ?? [])
  let last = $state<Report | null>(null)
  async function go(e: ElderId, a: Army) {
    const r = await onfight?.(lv, e, a)
    if (r) last = r
  }
</script>

{#if d}
  <Card tone="silk">
    <div class="row between">
      <b>{L.escort.best(best)}</b>
      <small class="t-small" class:t-bad={ap < d.cost}>{L.escort.ap(ap)}</small>
    </div>
    {#if sp.length > 2}<small class="t-small">{L.escort.last(sp[1] > 0, sp[1])}</small>{/if}
  </Card>
  {#if last}
    <div class="row">
      <span class="grow t-small t-strong" class:t-good={last.win} class:t-bad={!last.win}>{L.escort.name(last.i)}</span>
      <Button size="sm" variant="ghost" icon="arrow" onclick={() => last && onreplay?.(last)}>{L.report.replay}</Button>
    </div>
  {/if}
  <small class="t-tiny t-soft"
    >{L.escort.waves(d.waves.map((_, k) => L.units[TYPES[k % TYPES.length]]).join(' → '))}</small
  >
  <small class="t-tiny t-soft">{L.escort.pick}</small>
  <div class="grid" style:--cols="5" style:--gap="6px">
    {#each { length: d.lv } as _, k (k)}
      <Button
        size="sm"
        wide
        variant={lv === k + 1 ? 'gold' : 'ghost'}
        icon={k + 1 > top ? 'lock' : undefined}
        disabled={k + 1 > top}
        onclick={() => (chosen = k + 1)}>{L.escort.stars(k + 1)}</Button
      >
    {/each}
  </div>
  <ArmyPick cta={L.escort.go(d.cost)} disabled={g.busy || ap < d.cost || !onfight} onsubmit={go} />
{/if}
