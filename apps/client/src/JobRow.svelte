<script lang="ts">
  // Một việc đang chờ: chữ, đồng hồ, thanh tiến độ, và nút dùng Tụ Khí Đan / Đại Tụ Khí Đan nếu có.
  import type { Action, JobKind, State } from '@rok/rules'
  import { Button, Card, Meter } from './ui'
  import { L, clock, progress } from './lib'

  let { game, now, kind, label, act }: { game: State; now: number; kind: JobKind; label: string; act: (a: Action) => State | null } = $props()

  const job = $derived(kind === 'build' ? game.queue[0] : game[kind])
  const pills = $derived(game.items.tuKhi ?? 0)
  const big = $derived(game.items.daiTuKhi ?? 0)
</script>

{#if job}
  <Card tone="glow">
    <div class="stack">
      <p class="row between"><span class="t-strong">{label}</span><b class="t-num">{clock(job.finishAt - now)}</b></p>
      <Meter value={progress(job, now)} size="md" />
      {#if pills && kind !== 'brew'}
        <Button variant="ghost" size="sm" icon="tuKhi" trail="−15:00" onclick={() => act({ type: 'speed', job: kind, n: 1 })}>{L.panel.speed(pills)}</Button>
      {/if}
      {#if big && kind !== 'brew'}
        <Button variant="ghost" size="sm" icon="daiTuKhi" trail="−2:00:00" onclick={() => act({ type: 'speed', job: kind, n: 1, pill: 'daiTuKhi' })}>{L.pills.daiTuKhi.name} ({big})</Button>
      {/if}
    </div>
  </Card>
{/if}
