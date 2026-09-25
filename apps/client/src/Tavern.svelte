<script lang="ts">
  // Chiêu Hiền Đài (như Tavern của RoK, không bán): hai thẻ thiếp bạc / vàng — đồng hồ lượt miễn phí, số thiếp trong túi,
  // Mở ×1 / ×10, dòng bảo hiểm thiếp vàng; quà lần mở gần nhất hiện sau khi server trả (quà rút bằng mầm của server).
  import { GOLD_PITY, TAVERN, drawError, tavernFree, type ElderId, type TavernKind } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card } from './ui'
  import { L, LOOK, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const KINDS: TavernKind[] = ['silver', 'gold']
  // chỉ hiện quà của lần mở do chính màn này bấm (không hiện lại quà cũ mỗi lần vào trang)
  let opened = $state(0)
  const last = $derived(game.tavern.last && game.tavern.last.at >= opened && opened ? game.tavern.last : null)
  const waiting = $derived(!!opened && !last)
  const keys = (k: TavernKind) => game.items[TAVERN[k].key] ?? 0
  const can = (k: TavernKind, n: number) => !drawError({ ...game, time: now }, k, n)
  function open(k: TavernKind, n: number) {
    opened = now
    act({ type: 'draw', kind: k, n }, 'reward')
  }
  const tokens = $derived(Object.entries(last?.tokens ?? {}) as [ElderId, number][])
</script>

<p class="t-small t-lore">{L.tavern.lore}</p>
<div class="grid two">
  {#each KINDS as k (k)}
    {@const free = tavernFree({ ...game, time: now }, k)}
    {@const n = keys(k)}
    <Card tone={free ? 'glow' : undefined}>
      <div class="stack card" style:--gap="6px">
        <Icon name={TAVERN[k].key} size={54} />
        <b>{k === 'silver' ? L.tavern.silver : L.tavern.gold}</b>
        <small class="t-small" class:t-good={free} class:t-soft={!free}
          >{free ? L.tavern.free : L.tavern.next(clock(game.tavern[k] - now))}</small
        >
        <small class="t-small t-soft">{L.tavern.keys(n)}</small>
        <div class="row">
          <Button size="sm" variant={free ? 'gold' : 'primary'} disabled={!can(k, 1)} onclick={() => open(k, 1)}
            >{L.tavern.open}</Button
          >
          {#if n + (free ? 1 : 0) >= 10}
            <Button size="sm" variant="ghost" onclick={() => open(k, 10)}>{L.tavern.open10(10)}</Button>
          {/if}
        </div>
      </div>
    </Card>
  {/each}
</div>
<p class="t-small t-soft">{L.tavern.pity(GOLD_PITY - game.tavern.pity)}</p>

{#if waiting}
  <p class="t-small t-soft">{L.tavern.waiting}</p>
{:else if last}
  <Card tone="glow">
    <div class="stack" style:--gap="6px">
      <b>{L.tavern.got}</b>
      <Bag res={last.got.res} items={last.got.items} size="sm" named />
      {#each tokens as [e, n] (e)}
        <span class="row"><Portrait look={LOOK[e]} size={28} /><span>{L.tavern.tokens(L.elders[e].name, n)}</span></span
        >
      {/each}
    </div>
  </Card>
{/if}

<style>
  .two {
    grid-template-columns: 1fr 1fr;
  }
  .card {
    align-items: center;
    text-align: center;
  }
</style>
