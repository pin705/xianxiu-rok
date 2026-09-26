<script lang="ts">
  // Trảm Yêu Tốc Chiến (Race Against Time của RoK — luật ở rules/core/fest.ts raceHit, sect/fest.ts race): lượt còn hôm nay,
  // đồng hồ lượt đang đua và điểm, kỷ lục; nút bắt đầu. Mốc quà theo kỷ lục vẽ ở danh sách mốc chung của trung tâm sự kiện.
  import { RACE_RUNS, raceAt, raceError, type State } from '@rok/rules'
  import { Button, Card } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

  let { s }: { s: State } = $props()
  const g = useGame()
  const r = $derived(raceAt(s, g.now))
  const err = $derived(raceError({ ...s, time: g.now }))
</script>

<Card tone={r.live ? 'glow' : 'silk'}>
  <div class="stack" style:--gap="4px">
    {#if r.live}
      <b class="t-gold">{L.race.live(clock(r.end - g.now), r.pts)}</b>
    {:else}
      <b>{L.race.runs(RACE_RUNS - r.runs, RACE_RUNS)}</b>
      {#if r.start}<small class="t-small">{L.race.last(r.pts)}</small>{/if}
    {/if}
    <small class="t-small t-gold">{L.race.best(r.best)}</small>
    <small class="t-tiny t-soft">{L.race.tip}</small>
  </div>
</Card>
{#if !r.live && r.runs < RACE_RUNS}
  {#if err === 'locked'}<small class="t-small t-soft">{L.race.late}</small>{/if}
  <Button variant="gold" wide disabled={!!err || g.busy} onclick={() => g.act({ type: 'race' }, 'tap')}
    >{L.race.start}</Button
  >
{/if}
