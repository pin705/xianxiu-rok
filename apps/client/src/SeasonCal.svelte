<script lang="ts">
  // Lịch giới (lịch theo ngày của mùa 49 ngày): pha bản đồ mở (sớm hơn nếu cả giới xong chương Thiên Đạo Biên Niên), hạn từng chương,
  // Tranh Đoạt Linh Châu mỗi tối Chủ nhật (hai tuần cuối là bán kết / chung kết Cửu Thiên), hết mùa. Chia theo tuần; hôm nay tô vàng.
  import { ARK_ROUND, ARK_ROUNDS, BOOK, DAY, weekOf } from '@rok/rules'
  import { PHASES, PHASE_CH, SEASON_DAYS, arkAt } from '@rok/rules/world'
  import { L } from './lib'

  let { opened, now }: { opened: number; now: number } = $props()
  const end = $derived(opened + SEASON_DAYS * DAY)
  const today = $derived(Math.floor((now - opened) / DAY))
  // mỗi ngày của mùa: các việc đáng nhớ
  const days = $derived.by(() => {
    const out: string[][] = Array.from({ length: SEASON_DAYS }, () => [])
    PHASES.forEach((d, k) => k && out[d]?.push(L.scal.phase(L.world.phase[k], PHASE_CH[k] + 1)))
    BOOK.forEach((b, k) => out[b.day]?.push(L.scal.chapter(k + 1, L.book.names[k])))
    // trận Linh Châu: mỗi tối Chủ nhật trong mùa; hai trận cuối xong trước khi hết mùa là playoff
    const arks: number[] = []
    for (let wk = weekOf(opened); arkAt(wk) < end; wk++)
      if (arkAt(wk) >= opened && arkAt(wk) + ARK_ROUNDS * ARK_ROUND <= end) arks.push(arkAt(wk))
    arks.forEach((t, k) => {
      const label = k === arks.length - 1 ? L.scal.final : k === arks.length - 2 ? L.scal.semi : L.scal.ark
      out[Math.floor((t - opened) / DAY)]?.push(label)
    })
    out[SEASON_DAYS - 1].push(L.scal.end)
    return out
  })
  const weeks = $derived(Array.from({ length: Math.ceil(SEASON_DAYS / 7) }, (_, w) => w))
</script>

<p class="t-small t-lore">{L.scal.hint}</p>
{#each weeks as w (w)}
  <h3 class="wk">{L.scal.week(w + 1)}</h3>
  <ol class="days">
    {#each days.slice(w * 7, w * 7 + 7) as items, k (k)}
      {@const d = w * 7 + k}
      {#if items.length || d === today}
        <li class:today={d === today} class:past={d < today}>
          <b class="t-tiny">{L.scal.day(d + 1)}</b>
          <span class="t-small">{items.length ? items.join(' · ') : L.scal.none}</span>
        </li>
      {/if}
    {/each}
  </ol>
{/each}

<style>
  .wk {
    margin: 10px 0 4px;
    font-size: var(--fs-2);
    color: var(--text-soft);
  }
  .days {
    display: grid;
    gap: 3px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 8px;
    align-items: baseline;
    padding: 4px 8px;
    border-radius: 8px;
    background: var(--paper2);
  }
  .today {
    outline: 2px solid var(--gold);
  }
  .past {
    opacity: 0.55;
  }
</style>
