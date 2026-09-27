<script lang="ts">
  // Vân Chu Hội Chiến (Tempest Clash của RoK): mọi buff tắt — chọn linh chu (3 hệ khắc nhau) và thế công / thủ, vào hàng; đủ 10 người thì
  // chia hai đội, giải ngay — kết quả qua thư. Nằm trong thẻ Hội chiến của Luận Kiếm Đài
  import {
    VANCHU_DAILY,
    VANCHU_HALL,
    VANCHU_SHIPS,
    VANCHU_STANCES,
    VANCHU_TEAM,
    type VanchuShip,
    type VanchuStance,
  } from '@rok/rules'
  import { vanchuUsed, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Button, Card, Segmented } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let {
    q,
    mine,
    send,
    onchange,
  }: { q: number; mine: boolean; send: (a: WorldAction) => Promise<Ack>; onchange: () => void } = $props()
  const g = useGame()
  const used = $derived(vanchuUsed(g.game, g.now))
  const locked = $derived(g.game.levels.chuDien < VANCHU_HALL)
  let ship = $state<VanchuShip>('xung')
  let stance = $state<VanchuStance>('atk')
</script>

<p class="t-small t-soft"><b class="t-strong">{L.vanchu.title}</b> · {L.vanchu.hint(VANCHU_TEAM, VANCHU_DAILY)}</p>
<Card tone="silk">
  <div class="stack" style:--gap="6px">
    <p class="row between t-small">
      <b>{L.vanchu.queue(q, 2 * VANCHU_TEAM)}</b><span class="t-gold">{L.vanchu.wins(g.game.vanchu?.win ?? 0)}</span>
    </p>
    <small class="t-tiny t-soft">{L.vanchu.left(VANCHU_DAILY - used, VANCHU_DAILY)}</small>
    {#if mine}
      <Button variant="ghost" onclick={() => send({ type: 'vanchuLeave' }).then(onchange)}>{L.vanchu.leave}</Button>
    {:else}
      <Segmented
        items={(Object.keys(VANCHU_SHIPS) as VanchuShip[]).map(id => ({ id, label: L.vanchu.ships[id] }))}
        value={ship}
        onchange={id => (ship = id)}
      />
      <small class="t-tiny t-soft">{L.vanchu.shipNote[ship]}</small>
      <Segmented
        items={VANCHU_STANCES.map(id => ({ id, label: L.vanchu.stances[id] }))}
        value={stance}
        onchange={id => (stance = id)}
      />
      <Button
        variant="gold"
        icon="bolt"
        disabled={used >= VANCHU_DAILY || locked}
        onclick={() => send({ type: 'vanchuJoin', ship, stance }).then(onchange)}
        >{locked ? L.royale.locked(VANCHU_HALL) : L.vanchu.join}</Button
      >
    {/if}
  </div>
</Card>
