<script lang="ts">
  // Xếp hạng trong giới: lực chiến, cảnh giới, chiến công, tranh đoạt, tháp, sự kiện tuần (server tính, cache 30 giây, mình
  // tô đậm; chạm một dòng: hồ sơ) và điểm mùa theo phe + bảng phong thần các mùa trước (actor của giới tính lúc hỏi).
  import type { Season } from '@rok/protocol'
  import type { Ranks } from './net'
  import { Card, Sheet, Tabs } from './ui'
  import { L, num } from './lib'
  import { social } from './social.svelte'

  const BOARDS = ['power', 'hall', 'kills', 'pvp', 'tower', 'week'] as const
  type Board = (typeof BOARDS)[number]

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
</script>

<Sheet {open} {onclose} title={L.rank.title}>
  <Tabs
    items={[
      ...BOARDS.map(id => ({ id, label: L.rank.boards[id] })),
      ...(season ? [{ id: 'season', label: L.rank.season }] : []),
    ]}
    value={board}
    onchange={b => (board = b as Board)}
  />
  {#if board === 'season' && sea}
    <p class="t-small t-soft mt-2">{L.rank.seasonHint}</p>
    {#if sea.camps}
      <!-- Chính Tà Phân Tranh: điểm mùa hai phái, phái mình tô đậm -->
      <p class="row between t-small mt-2">
        {#each [0, 1] as const as c (c)}
          <b class:t-gold={sea.camp === c}>{L.camp.names[c]} · {num(sea.camps[c])}</b>
        {/each}
      </p>
      <small class="t-tiny t-soft">{L.camp.hint(L.camp.names[sea.camp ?? 0])}</small>
    {/if}
    {#if sea.me}<p class="t-small t-gold t-strong mt-2">
        {L.rank.me}: #{sea.me.rank} · {L.rank.pts(num(sea.me.pts))}
      </p>{/if}
    {#if !sea.rows.length}<p class="center t-lore mt-4">{L.rank.none}</p>{/if}
    <ol class="stack mt-2" style:--gap="4px">
      {#each sea.rows as r, k (k)}
        <li>
          <Card tone={sea.me?.rank === k + 1 ? 'glow' : 'paper'}>
            <span class="row">
              <b class="t-num rank" class:top={k < 3}>{k + 1}</b>
              <span class="grow t-strong t-ellipsis">{r.name}</span>
              <b class="t-num t-gold">{num(r.pts)}</b>
            </span>
          </Card>
        </li>
      {/each}
    </ol>
    {#if sea.fame.length}
      <h3 class="t-head mt-4">{L.rank.fame}</h3>
      <ul class="stack mt-2" style:--gap="4px">
        {#each sea.fame as f (f.season)}
          <li class="t-small">
            <b>{L.rank.fameRow(f.season)}:</b>
            {f.top.map(t => t.name).join(' · ') || L.rank.none}
          </li>
        {/each}
      </ul>
    {/if}
  {:else if data}
    {#if data.me}<p class="t-small t-gold t-strong mt-2">{L.rank.me}: #{data.me.rank} · {value(data.me.v)}</p>{/if}
    {#if !data.rows.length}<p class="center t-lore mt-4">{L.rank.none}</p>{/if}
    <ol class="stack mt-2" style:--gap="4px">
      {#each data.rows as r (r.pid)}
        <li>
          <Card tone={r.pid === me ? 'glow' : 'paper'} onclick={() => (social.profile = r.pid)} label={r.name}>
            <span class="row">
              <b class="t-num rank" class:top={r.rank <= 3}>{r.rank}</b>
              <span class="grow t-strong t-ellipsis">{r.name}</span>
              <b class="t-num t-gold">{value(board === 'hall' ? r.hall : r.v)}</b>
            </span>
          </Card>
        </li>
      {/each}
    </ol>
  {/if}
</Sheet>

<style>
  .rank {
    width: 2.2em;
    text-align: center;
    color: var(--text-soft);
  }
  .top {
    color: var(--gold);
  }
</style>
