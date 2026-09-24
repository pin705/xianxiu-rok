<script lang="ts">
  // Bảng tăng tốc một việc đang chờ (như RoK): đồng hồ còn lại, mọi phù/đan dùng được, mệnh giá nhỏ trước.
  // Mỗi dòng: dùng 1 cái, hoặc "dùng đủ" — số cái vừa đủ xong việc (không phí quá một cái).
  import { SPEEDUP, SPEEDUP_BIG, bagFamily, jobOf, type JobKind } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Meter, Sheet } from './ui'
  import { denom, speedMin, speedsFor } from './bag'
  import { L, clock, progress } from './lib'
  import { useGame } from './game'

  let { kind, open, onclose }: { kind: JobKind; open: boolean; onclose: () => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const job = $derived(jobOf(game, kind))
  const left = $derived(job ? Math.max(0, job.finishAt - now) : 0)
  const talismans = $derived(speedsFor(game, kind))
  // đan tăng tốc cũ (Tụ Khí, Đại Tụ Khí) dùng chung bảng này
  const pills = $derived(
    kind === 'brew'
      ? []
      : (
          [
            ['tuKhi', SPEEDUP],
            ['daiTuKhi', SPEEDUP_BIG],
          ] as const
        ).filter(([p]) => (game.items[p] ?? 0) > 0),
  )
  // số cái vừa đủ xong việc, không quá số đang có
  const enough = (ms: number, have: number) => Math.min(have, Math.ceil(left / ms))
  // xong việc thì tự đóng
  $effect(() => {
    if (open && !job) onclose()
  })
</script>

<Sheet {open} {onclose} center title={L.bag.speedTitle} sub={L.jobs[kind]}>
  {#if job}
    <div class="stack">
      <p class="row between"><span class="t-soft">{L.bag.remaining}</span><b class="t-num big">{clock(left)}</b></p>
      <Meter value={progress(job, now)} size="md" />
      <p class="t-small t-soft">{L.bag.speedHint}</p>
      {#if !talismans.length && !pills.length}<p class="t-small t-soft">{L.bag.empty}</p>{/if}
      <ul class="stack rows">
        {#each pills as [p, ms] (p)}
          {@const have = game.items[p] ?? 0}
          <li class="row">
            <Icon name={p} size={36} />
            <span class="grow stack" style:--gap="0"
              ><b>{L.pills[p].name}</b><small class="t-soft">{L.bag.saves(clock(ms))} · ×{have}</small></span
            >
            <Button
              size="sm"
              variant="ghost"
              onclick={() => act({ type: 'speed', job: kind, n: 1, ...(p === 'daiTuKhi' && { pill: p }) }, 'reward')}
              >{L.bag.use}</Button
            >
          </li>
        {/each}
        {#each talismans as id (id)}
          {@const have = game.items[id] ?? 0}
          {@const ms = speedMin(id) * 60_000}
          {@const k = enough(ms, have)}
          <li class="row">
            <Icon name={bagFamily(id)} size={36} />
            <span class="grow stack" style:--gap="0"
              ><b>{L.bag.family[bagFamily(id)].name} · {denom(id)}</b><small class="t-soft">×{have}</small></span
            >
            {#if k > 1}
              <Button
                size="sm"
                variant="ghost"
                onclick={() => act({ type: 'use', item: id, n: k, job: kind }, 'reward')}
                >{ms * k >= left ? L.bag.finish : L.bag.useAll(k)}</Button
              >
            {/if}
            <Button size="sm" onclick={() => act({ type: 'use', item: id, n: 1, job: kind }, 'reward')}
              >{L.bag.use}</Button
            >
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</Sheet>

<style>
  .big {
    font-size: var(--fs-6);
  }
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
