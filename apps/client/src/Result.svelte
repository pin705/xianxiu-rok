<script module lang="ts">
  import type { Report } from '@rok/rules'
  import { useGame } from './game'
  export type Outcome = { kind: 'trib'; report: Report } | { kind: 'rebirth'; n: number }
</script>

<script lang="ts">
  // Khoảnh khắc lớn: đột phá cảnh giới sau độ kiếp (chữ Hán lớn, hào quang), thất bại, hoặc luân hồi.
  // Tên khoảnh khắc viết trên dải lụa son đuôi én (thành công) hoặc đóng dấu mực nghiêng (thất bại) — như màn thắng/thua của game.
  import { marchSlots } from '@rok/rules'
  import { Button, Medal, Moment, Sheet, Tag } from './ui'
  import { L } from './lib'

  let { outcome, onclose, onreplay }: { outcome: Outcome | null; onclose: () => void; onreplay: (r: Report) => void } =
    $props()
  const g = useGame()
  const game = $derived(g.game)
  const hall = $derived(game.levels.chuDien)
</script>

<Sheet open={!!outcome} {onclose} center label={L.trib.title}>
  {#if outcome?.kind === 'rebirth'}
    <Moment title={L.rebirth.done(outcome.n)} glory spin>
      {#snippet medal()}<Medal emblem="rebirth" tone="gold" size={116} />{/snippet}
      <p class="t-lore">{L.rebirth.perks(outcome.n)}</p>
      <Button variant="gold" wide size="lg" onclick={onclose}>{L.rebirth.start}</Button>
    </Moment>
  {:else if outcome?.report.win}
    <Moment title={L.trib.success} glory>
      {#snippet medal()}<Medal emblem="lotus" tone="jade" size={116} />{/snippet}
      <p class="t-lore">{L.trib.reached(L.realmName(hall), hall)}</p>
      <span class="row center"><Tag icon="flag" tone="good">{L.trib.opens(marchSlots(game))}</Tag></span>
      <div class="grid">
        <Button variant="ghost" onclick={() => outcome?.kind === 'trib' && onreplay(outcome.report)}
          >{L.trib.detail}</Button
        >
        <Button variant="gold" onclick={onclose}>{L.trib.next}</Button>
      </div>
    </Moment>
  {:else if outcome}
    <Moment title={L.trib.fail} fail>
      {#snippet medal()}<Medal emblem="thunder" tone="thunder" size={116} />{/snippet}
      <p class="t-lore">{L.trib.failHint}</p>
      <div class="grid">
        <Button variant="ghost" onclick={() => outcome?.kind === 'trib' && onreplay(outcome.report)}
          >{L.trib.detail}</Button
        >
        <Button onclick={onclose}>{L.trib.next}</Button>
      </div>
    </Moment>
  {/if}
</Sheet>
