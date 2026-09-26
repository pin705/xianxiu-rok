<script lang="ts">
  // Lịch giới (lịch theo ngày của mùa 49 ngày): pha bản đồ mở (sớm hơn nếu cả giới xong chương Thiên Đạo Biên Niên), hạn từng chương,
  // Tranh Đoạt Linh Châu mỗi tối Chủ nhật (hai tuần cuối là bán kết / chung kết Cửu Thiên), Khai Giới Trảm Tà, thời Thiên Thời, chặng
  // Chính Tà, lễ theo ngày mùa, hết mùa. Chia theo tuần; hôm nay tô vàng.
  import {
    ARK_ROUND,
    ARK_ROUNDS,
    BOOK,
    CAMP_STAGES,
    CAMP_STAGE_DAYS,
    DAY,
    FESTS,
    FEST_IDS,
    THOI_DAYS,
    TOURNEY_DAY,
    thoiAt,
    weekOf,
  } from '@rok/rules'
  import { PHASES, PHASE_CH, SEASON_DAYS, arkAt } from '@rok/rules/world'
  import { Art, Band } from './ui'
  import { L } from './lib'

  let { opened, now }: { opened: number; now: number } = $props()
  const end = $derived(opened + SEASON_DAYS * DAY)
  const today = $derived(Math.floor((now - opened) / DAY))
  // mỗi ngày của mùa: các việc đáng nhớ
  const days = $derived.by(() => {
    const out: string[][] = Array.from({ length: SEASON_DAYS }, () => [])
    out[0].push(L.scal.eve(L.eve.title))
    for (let d = 0; d < SEASON_DAYS; d += THOI_DAYS) out[d].push(L.thoi.names[thoiAt(d).el])
    for (let d = 0, n = 0; d < SEASON_DAYS; d += CAMP_STAGE_DAYS, n++) {
      const m = CAMP_STAGES[n % CAMP_STAGES.length] as keyof typeof L.camp.what
      out[d].push(L.scal.stage(n + 1, L.camp.what[m]))
    }
    for (const id of FEST_IDS) {
      const w = FESTS[id].window
      if (w.kind === 'season') out[w.from]?.push(L.fest.names[id].name)
    }
    ;[16, 8, 4, 2].forEach((n, r) => out[TOURNEY_DAY + r]?.push(L.scal.tourney(L.tourney.round(n))))
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
<header class="split" style:--gap="10px">
  <Art art="fx-calendar" icon="clock" size={56} lift />
  <p class="t-tiny t-lore">{L.scal.hint}</p>
</header>
{#each weeks as w (w)}
  <section class="stack mt-3" style:--gap="6px">
    <h3><Band tone="ink">{L.scal.week(w + 1)}</Band></h3>
    <ol class="almanac">
      {#each days.slice(w * 7, w * 7 + 7) as items, k (k)}
        {@const d = w * 7 + k}
        {#if items.length || d === today}
          <li class:today={d === today} class:past={d < today}>
            <b class="leaf t-num"><span class="sr">{L.scal.day(d + 1)}</span><span aria-hidden="true">{d + 1}</span></b>
            <span class="t-small">{items.length ? items.join(' · ') : L.scal.none}</span>
          </li>
        {/if}
      {/each}
    </ol>
  </section>
{/each}
