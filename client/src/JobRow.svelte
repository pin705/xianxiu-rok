<script lang="ts">
  // Một việc đang chờ: chữ, đồng hồ, thanh tiến độ, và nút dùng Tụ Khí Đan nếu có.
  import type { Action, JobKind, State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { L, clock } from './lib'

  let {
    game,
    now,
    kind,
    label,
    act,
  }: { game: State; now: number; kind: JobKind; label: string; act: (a: Action) => State | null } = $props()

  const job = $derived(kind === 'build' ? game.queue[0] : game[kind])
  const pills = $derived(game.items.tuKhi ?? 0)
</script>

{#if job}
  {@const p = Math.min(1, (now - job.startAt) / Math.max(1, job.finishAt - job.startAt))}
  <div class="job">
    <p><span>{label}</span><b>{clock(job.finishAt - now)}</b></p>
    <span class="bar"><i style:width="{p * 100}%"></i></span>
    {#if pills}
      <button class="btn ghost small" onclick={() => act({ type: 'speed', job: kind, n: 1 })}>
        <Icon name="tuKhi" size={18} />{L.panel.speed(pills)} · −15:00
      </button>
    {/if}
  </div>
{/if}
