<script lang="ts">
  // Xếp hạng trong giới: lực chiến, cảnh giới, chiến công, tranh đoạt, tháp, sự kiện tuần (server tính, cache 30 giây, mình
  // tô đậm; chạm một dòng: hồ sơ) và điểm mùa theo phe + bảng phong thần các mùa trước (actor của giới tính lúc hỏi).
  // Bố cục như bảng vinh danh của game: dải thẻ bảng (tranh vẽ tay), bục ba hạng đầu (cúp trên hạng nhất), phần còn lại dòng
  // gọn có đồng tiền hạng, hạng của mình ghim ở đáy bảng.
  import type { Season } from '@rok/protocol'
  import type { Ranks } from './net'
  import { CAMP_STAGE_PTS } from '@rok/rules'
  import type { IconName } from '@rok/art'
  import { Card, Laurels, Meter, Pinned, Plaque, Sheet, Tabs } from './ui'
  import { L, num } from './lib'
  import { social } from './social.svelte'

  const BOARDS = ['power', 'hall', 'kills', 'pvp', 'tower', 'week'] as const
  type Board = (typeof BOARDS)[number]
  // tranh thẻ của từng bảng (ui:*), tắt art thì về Icon
  const PIC: Record<Board | 'season', [string, IconName]> = {
    power: ['power', 'power'],
    hall: ['fx-scroll', 'scroll'],
    kills: ['fx-battle', 'swords'],
    pvp: ['fx-flag', 'flag'],
    tower: ['fx-bolt', 'bolt'],
    week: ['fx-calendar', 'clock'],
    season: ['rank-cup', 'rank'],
  }

  let {
    open,
    me,
    load,
    season,
    onclose,
  }: {
    open: boolean
    me: number | null
    load: (b: Board) => Promise<Ranks | null>
    season?: () => Promise<Season | null>
    onclose: () => void
  } = $props()

  let board = $state<Board | 'season'>('power')
  let data = $state<Ranks | null>(null)
  let sea = $state<Season | null>(null)
  $effect(() => {
    if (!open) return
    const b = board
    data = sea = null
    if (b === 'season') void season?.().then(d => board === 'season' && (sea = d))
    else void load(b).then(d => b === board && (data = d))
  })
  const value = (v: number) => (board === 'hall' ? L.realm(v) : num(v))
  const tabs = $derived<(Board | 'season')[]>(season ? [...BOARDS, 'season'] : [...BOARDS])
  // hàng chung cho bục + dòng: bảng thường (chạm: hồ sơ) và bảng mùa (theo phe, không có hồ sơ)
  type Row = { key: string | number; rank: number; name: string; v: string; pid?: number }
  const rows = $derived<Row[]>(
    board === 'season'
      ? (sea?.rows ?? []).map((r, k) => ({ key: k, rank: k + 1, name: r.name, v: num(r.pts) }))
      : (data?.rows ?? []).map(r => ({
          key: r.pid,
          rank: r.rank,
          name: r.name,
          v: value(board === 'hall' ? r.hall : r.v),
          pid: r.pid,
        })),
  )
  const myRank = $derived(board === 'season' ? sea?.me?.rank : data?.me?.rank)
  const mine = (r: Row) => (r.pid !== undefined ? r.pid === me : r.rank === myRank)
  const pick = (r: Row) => r.pid !== undefined && (social.profile = r.pid)
</script>

<!-- một hàng xếp hạng bấm được (bảng thường: mở hồ sơ) hoặc chỉ hiện (bảng mùa) -->
{#snippet line(r: Row)}
  <i class="rank-no r{r.rank}">{r.rank}</i>
  <span class="grow t-strong t-ellipsis">{r.name}</span>
  <b class="t-num t-gold">{r.v}</b>
{/snippet}

<Sheet {open} {onclose} title={L.rank.title}>
  <!-- dải thẻ bảng: tranh nhỏ + tên, cuộn ngang -->
  <Tabs
    look="chips"
    items={tabs.map(id => ({
      id,
      label: id === 'season' ? L.rank.season : L.rank.boards[id],
      art: PIC[id][0],
      icon: PIC[id][1],
    }))}
    value={board}
    onchange={id => (board = id)}
  />

  {#if board === 'season' && sea}
    <p class="t-tiny t-soft mt-2">{L.rank.seasonHint}</p>
    {#if sea.camps}
      <!-- Chính Tà Phân Tranh: hai tấm biển phái đối diện, phái mình viền son -->
      <div class="grid mt-2">
        {#each [0, 1] as const as c (c)}
          <Plaque label={L.camp.names[c]} value={num(sea.camps[c])} on={sea.camp === c} />
        {/each}
      </div>
      <small class="t-tiny t-soft">{L.camp.hint(L.camp.names[sea.camp ?? 0])}</small>
      {#if sea.stage}
        <!-- chặng thi đua đang chạy: việc, giờ còn lại, điểm hai phái, phần mình góp -->
        {@const st = sea.stage}
        {@const tot = st.score[0] + st.score[1]}
        <div class="mt-2">
          <Card
            ><div class="stack" style:--gap="4px">
              <b class="t-small"
                >{L.camp.stage(
                  st.n + 1,
                  L.camp.what[st.m as keyof typeof L.camp.what] ?? st.m,
                  L.ago(Math.max(0, st.end - Date.now())),
                )}</b
              >
              <Meter value={tot ? st.score[0] / tot : 0.5} tone="azure" size="sm" label={L.camp.names[0]} />
              <p class="row between t-tiny">
                {#each [0, 1] as const as c (c)}
                  <span class:t-gold={sea.camp === c}
                    >{L.camp.names[c]} · {num(st.score[c])} · {L.camp.wins(st.wins[c])}</span
                  >
                {/each}
              </p>
              <small class="t-tiny"
                >{L.camp.mine(num(st.mine))}{#if st.last && st.last.won !== null}
                  · {L.camp.last(st.last.n + 1, L.camp.names[st.last.won])}{/if}</small
              >
              <small class="t-tiny t-soft">{L.camp.stageHint(CAMP_STAGE_PTS)}</small>
            </div></Card
          >
        </div>
      {/if}
    {/if}
  {/if}

  {#if (board === 'season' && sea) || (board !== 'season' && data)}
    {#if !rows.length}<p class="center t-lore mt-4">{L.rank.none}</p>{/if}
    {#if rows.length}
      <!-- bục vinh danh: hạng 2 · hạng 1 (cúp, cao nhất) · hạng 3 -->
      <Laurels
        rows={rows
          .slice(0, 3)
          .map(r => ({ ...r, mine: mine(r), onclick: r.pid !== undefined ? () => pick(r) : undefined }))}
      />
      <!-- phần còn lại: dòng gọn kẻ mực đứt, dòng của mình tô son -->
      <ol class="ledger">
        {#each rows.slice(3) as r (r.key)}
          <li class:on={mine(r)}>
            {#if r.pid !== undefined}<button class="row grow t-left" aria-label={r.name} onclick={() => pick(r)}
                >{@render line(r)}</button
              >{:else}<span class="row grow">{@render line(r)}</span>{/if}
          </li>
        {/each}
      </ol>
    {/if}
    {#if board === 'season' && sea?.fame.length}
      <h3 class="t-head mt-4">{L.rank.fame}</h3>
      <!-- bảng phong thần: mỗi mùa một dòng trên cuộn giấy -->
      <ul class="ledger mt-2">
        {#each sea.fame as f (f.season)}
          <li class="t-small">
            <b style:width="64px">{L.rank.fameRow(f.season)}</b>
            <span>{f.top.map(t => t.name).join(' · ') || L.rank.none}</span>
          </li>
        {/each}
      </ul>
    {/if}
    <!-- hạng của mình ghim đáy bảng; còn bao nhiêu để lên một hạng (hạng trên có trong bảng), hay để vào bảng (như RoK) -->
    {#if board === 'season' && sea?.me}
      <Pinned
        ><p class="row">
          <i class="rank-no r{sea.me.rank}">{sea.me.rank}</i><span class="grow t-strong">{L.rank.me}</span><b
            class="t-num t-gold">{L.rank.pts(num(sea.me.pts))}</b
          >
        </p></Pinned
      >
    {:else if board !== 'season' && data?.me}
      {@const my = data.me}
      {@const up = board === 'hall' ? undefined : data.rows.find(r => r.rank === my.rank - 1)}
      {@const last = data.rows.at(-1)}
      <Pinned>
        <p class="row">
          <i class="rank-no r{my.rank}">{my.rank}</i><span class="grow t-strong">{L.rank.me}</span><b
            class="t-num t-gold">{value(my.v)}</b
          >
        </p>
        {#if up}<small class="t-tiny t-soft">{L.rank.need(num(up.v - my.v + 1), up.rank)}</small>
        {:else if board !== 'hall' && last && my.rank > last.rank}<small class="t-tiny t-soft"
            >{L.rank.needTop(num(last.v - my.v + 1), last.rank)}</small
          >{/if}
      </Pinned>
    {/if}
  {/if}
</Sheet>
