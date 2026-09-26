<script lang="ts">
  // Luận Kiếm Đặt Cược (League Bets — luật ở rules/world/bets.ts): trận playoff Cửu Thiên đang nhận cược — kéo chọn số tệ, chạm minh
  // đoán thắng (mỗi trận một bên, chạm thêm là cược thêm); dưới là cược của mình, cược trượt chờ hoàn sau chung kết
  import { BET_MAX, BET_ODDS, coins } from '@rok/rules'
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack, Season } from '@rok/protocol'
  import { Button, Card, Slider, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let {
    bet,
    send,
    onbet,
  }: { bet: NonNullable<Season['bet']>; send?: (a: WorldAction) => Promise<Ack>; onbet: () => void } = $props()
  const g = useGame()
  const have = $derived(coins(g.game))
  let n = $state(10)
  const pickOf = (m: (typeof bet.open)[number]) => bet.mine.find(x => x.k === m.k && (x.on === m.a || x.on === m.b))
  async function go(on: number) {
    if (send && (await send({ type: 'leagueBet', on, n })).ok) onbet()
  }
</script>

<Card>
  <div class="stack" style:--gap="6px">
    <p class="row between">
      <b class="t-small">{L.bet.title}</b><small class="t-tiny t-soft">{L.bet.have(num(have))}</small>
    </p>
    <small class="t-tiny t-soft">{L.bet.hint}</small>
    {#if bet.open.length}
      <Slider value={n} min={1} max={BET_MAX} label={L.bet.amount} onchange={v => (n = v)} />
      <small class="t-tiny">{L.bet.stake(n, BET_MAX)}</small>
      {#each bet.open as m (m.a)}
        {@const mine = pickOf(m)}
        <small class="t-tiny t-soft">{L.bet.odds(L.ark.cup[m.k], BET_ODDS[m.k])}</small>
        <div class="grid" style:--gap="6px">
          {#each [{ id: m.a, tag: m.ta }, { id: m.b, tag: m.tb }] as t (t.id)}
            <Button
              size="sm"
              wide
              variant={mine?.on === t.id ? 'gold' : 'ghost'}
              disabled={!send || (!!mine && mine.on !== t.id) || (mine?.n ?? 0) + n > BET_MAX || have < n}
              onclick={() => go(t.id)}>[{t.tag}]{mine?.on === t.id ? ` · ${mine.n}` : ''}</Button
            >
          {/each}
        </div>
      {/each}
    {/if}
    {#if bet.mine.length}
      <small class="t-tiny t-soft">{L.bet.wait}</small>
      <div class="row wrap" style:--gap="4px">
        {#each bet.mine as x (x.k + x.on)}
          <Tag tone={x.lost ? 'plain' : 'gold'}>{x.lost ? L.bet.lost(x.tag, x.n) : L.bet.mine(x.tag, x.n)}</Tag>
        {/each}
      </div>
    {/if}
  </div>
</Card>
