<script lang="ts">
  // Một việc đang chờ: chữ, đồng hồ, thanh tiến độ, và nút Tăng tốc (mở bảng phù/đan) nếu có thứ rút ngắn được.
  import { vipFree, type JobKind } from '@rok/rules'
  import { Button, Card, Meter } from './ui'
  import SpeedUp from './SpeedUp.svelte'
  import { speedsFor } from './bag'
  import { L, clock, progress } from './lib'
  import { useGame } from './game'

  let { kind, label }: { kind: JobKind; label: string } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  const job = $derived(kind === 'build' ? game.queue[0] : game[kind])
  // luyện đan không rút ngắn được
  const boosts = $derived(
    kind === 'brew'
      ? 0
      : (game.items.tuKhi ?? 0) +
          (game.items.daiTuKhi ?? 0) +
          speedsFor(game, kind).reduce((n, id) => n + (game.items[id] ?? 0), 0),
  )
  let open = $state(false)
</script>

{#if job}
  <Card tone="glow">
    <div class="stack">
      <p class="row between"><span class="t-strong">{label}</span><b class="t-num">{clock(job.finishAt - now)}</b></p>
      <Meter value={progress(job, now)} size="md" />
      {#if kind !== 'brew' && job.finishAt - now <= vipFree(game)}
        <Button variant="gold" size="sm" onclick={() => g.act({ type: 'finish', job: kind }, 'reward')}
          >{L.vip.finish}</Button
        >
      {:else if boosts}
        <Button variant="ghost" size="sm" icon="thoiQuang" trail="×{boosts}" onclick={() => (open = true)}
          >{L.bag.speedTitle}</Button
        >
      {/if}
    </div>
  </Card>
  <SpeedUp {kind} {open} onclose={() => (open = false)} />
{/if}
