<script lang="ts">
  // Một việc đang chờ (dòng gọn): đồng hồ cát vẽ tay, chữ + giờ còn lại, nét tiến độ, và nút Tăng tốc (mở bảng phù/đan)
  // nếu có thứ rút ngắn được.
  import { vipFree, type JobKind } from '@rok/rules'
  import { Art, Button, Meter } from './ui'
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
  <!-- dòng việc gọn: đồng hồ cát vẽ tay, chữ + giờ còn lại, nét tiến độ, nút bên phải -->
  <div class="row busy-row">
    <Art art="fx-clock" icon="clock" size={40} />
    <span class="grow stack" style:--gap="3px">
      <span class="row between"
        ><span class="t-small t-strong">{label}</span><b class="t-num">{clock(job.finishAt - now)}</b></span
      >
      <Meter value={progress(job, now)} size="sm" />
    </span>
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
  <SpeedUp {kind} {open} onclose={() => (open = false)} />
{/if}
