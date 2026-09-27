<script lang="ts">
  // Tán Tu Tranh Châu (Silver Ark của RoK): chọn hướng đánh, vào hàng; đủ người thì chia hai đội tán tu, giải trọn trận Linh Châu —
  // kết quả qua thư, trận gần nhất xem lại ở bảng khán giả (ArkWatch). Nằm trong thẻ Hội chiến của Luận Kiếm Đài
  import { SILVER_DAILY, SILVER_HALL, SILVER_TACTICS, SILVER_TEAM, type SilverTactic } from '@rok/rules'
  import { silverUsed, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Button, Card } from './ui'
  import { L } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let {
    q,
    mine,
    send,
    onchange,
  }: { q: number; mine: boolean; send: (a: WorldAction) => Promise<Ack>; onchange: () => void } = $props()
  const g = useGame()
  const used = $derived(silverUsed(g.game, g.now))
  const locked = $derived(g.game.levels.chuDien < SILVER_HALL)
  let tactic = $state<SilverTactic>('center')
</script>

<p class="t-small t-soft"><b class="t-strong">{L.silver.title}</b> · {L.silver.hint(SILVER_TEAM, SILVER_DAILY)}</p>
<Card tone="silk">
  <div class="stack" style:--gap="6px">
    <p class="row between t-small">
      <b>{L.silver.queue(q, 2 * SILVER_TEAM)}</b><span class="t-gold">{L.silver.wins(g.game.silver?.win ?? 0)}</span>
    </p>
    <small class="t-tiny t-soft">{L.silver.left(SILVER_DAILY - used, SILVER_DAILY)}</small>
    {#if mine}
      <Button variant="ghost" onclick={() => send({ type: 'silverLeave' }).then(onchange)}>{L.silver.leave}</Button>
    {:else}
      <div class="row wrap" style:--gap="4px">
        {#each Object.keys(SILVER_TACTICS) as SilverTactic[] as k (k)}
          <Button size="sm" variant={tactic === k ? 'gold' : 'ghost'} onclick={() => (tactic = k)}
            >{L.silver.tactics[k]}</Button
          >
        {/each}
      </div>
      <Button
        variant="gold"
        icon="star"
        disabled={used >= SILVER_DAILY || locked}
        onclick={() => send({ type: 'silverJoin', tactic }).then(onchange)}
        >{locked ? L.royale.locked(SILVER_HALL) : L.silver.join}</Button
      >
    {/if}
    <Button size="sm" variant="ghost" icon="globe" onclick={() => (social.arkWatch = true)}>{L.silver.watch}</Button>
  </div>
</Card>
