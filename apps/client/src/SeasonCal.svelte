<script lang="ts">
  // Lịch giới (lịch theo ngày của mùa 49 ngày): pha bản đồ mở (sớm hơn nếu cả giới xong chương Thiên Đạo Biên Niên), hạn từng chương,
  // Tranh Đoạt Linh Châu mỗi tối Chủ nhật (hai tuần cuối là bán kết / chung kết Cửu Thiên), hết mùa. Chia theo tuần; hôm nay tô vàng.
  import { ARK_ROUND, ARK_ROUNDS, BOOK, DAY, weekOf } from '@rok/rules'
  import { PHASES, PHASE_CH, SEASON_DAYS, arkAt } from '@rok/rules/world'
  import { artOf } from '@rok/art'
  import { L } from './lib'

  let { opened, now }: { opened: number; now: number } = $props()
  const disc = artOf('ui:fx-calendar')?.src
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

<!-- đĩa lịch đồng đầu dải lịch; mỗi tuần một dải, mỗi ngày đáng nhớ một tờ lịch (số ngày to trên nền giấy, đầu tờ son) -->
<header class="cover">
  {#if disc}<img src={disc} alt="" draggable="false" />{/if}
  <p class="t-tiny t-lore">{L.scal.hint}</p>
</header>
{#each weeks as w (w)}
  <h3 class="wk">{L.scal.week(w + 1)}</h3>
  <ol class="days">
    {#each days.slice(w * 7, w * 7 + 7) as items, k (k)}
      {@const d = w * 7 + k}
      {#if items.length || d === today}
        <li class:today={d === today} class:past={d < today}>
          <b class="page t-num"><span class="sr">{L.scal.day(d + 1)}</span><span aria-hidden="true">{d + 1}</span></b>
          <span class="t-small">{items.length ? items.join(' · ') : L.scal.none}</span>
        </li>
      {/if}
    {/each}
  </ol>
{/each}

<style>
  .cover {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }
  .cover img {
    width: 56px;
    height: 56px;
    object-fit: contain;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
  .cover p {
    grid-column: 2;
  }
  /* nhãn tuần: dải lụa mực nhỏ */
  .wk {
    width: fit-content;
    margin: 12px 0 6px;
    padding: 1px 12px 2px 8px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 50%, 100% 100%, 0 100%);
  }
  .days {
    display: grid;
    margin: 0;
    padding: 0 0 0 4px;
    list-style: none;
    border-left: 2px solid var(--paper3);
  }
  li {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 5px 0 5px 6px;
    border-bottom: 1px dashed var(--paper3);
  }
  /* tờ lịch: đầu tờ son, số ngày to */
  .page {
    display: grid;
    place-items: center;
    height: 40px;
    padding-top: 6px;
    font-size: var(--fs-4);
    font-weight: 900;
    line-height: 1;
    background:
      linear-gradient(var(--cinnabar), var(--cinnabar)) top / 100% 7px no-repeat,
      var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 2px 3px rgb(var(--shade) / 0.12);
  }
  .today .page {
    color: var(--silk);
    background: var(--cinnabar);
    border-color: var(--cinnabar);
    rotate: -4deg;
  }
  .today {
    font-weight: 800;
  }
  .past {
    opacity: 0.5;
  }
</style>
