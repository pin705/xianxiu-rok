<script lang="ts">
  // Xếp hạng trong giới: lực chiến, cảnh giới, tháp, tranh đoạt, sự kiện tuần. Server tính (cache 30 giây), mình tô đậm.
  import type { Ranks } from './net'
  import { Card, Sheet, Tabs } from './ui'
  import { L, num } from './lib'

  const BOARDS = ['power', 'hall', 'tower', 'pvp', 'week'] as const
  type Board = (typeof BOARDS)[number]

  let { open, me, load, onclose }: { open: boolean; me: number | null; load: (b: Board) => Promise<Ranks | null>; onclose: () => void } = $props()

  let board = $state<Board>('power')
  let data = $state<Ranks | null>(null)
  $effect(() => {
    if (!open) return
    const b = board
    data = null
    void load(b).then(d => b === board && (data = d))
  })
  const value = (v: number) => (board === 'hall' ? L.realm(v) : num(v))
</script>

<Sheet {open} {onclose} title={L.rank.title}>
  <Tabs items={BOARDS.map(id => ({ id, label: L.rank.boards[id] }))} value={board} onchange={b => (board = b as Board)} />
  {#if data}
    {#if data.me}<p class="t-small t-gold t-strong mt-2">{L.rank.me}: #{data.me.rank} · {value(data.me.v)}</p>{/if}
    {#if !data.rows.length}<p class="center t-lore mt-4">{L.rank.none}</p>{/if}
    <ol class="stack mt-2" style:--gap="4px">
      {#each data.rows as r (r.pid)}
        <li>
          <Card tone={r.pid === me ? 'glow' : 'paper'}>
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
