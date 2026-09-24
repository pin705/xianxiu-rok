<script module lang="ts">
  import type { Report } from '@rok/rules'
  import { useGame } from './game'
  export type Outcome = { kind: 'trib'; report: Report } | { kind: 'rebirth'; n: number }
</script>

<script lang="ts">
  // Khoảnh khắc lớn: đột phá cảnh giới sau độ kiếp (chữ Hán lớn, hào quang), thất bại, hoặc luân hồi.
  import { marchSlots } from '@rok/rules'
  import { radiance } from '@rok/art'
  import { Button, Medal, Painting, Sheet, Tag } from './ui'
  import { L } from './lib'

  let { outcome, onclose, onreplay }: { outcome: Outcome | null; onclose: () => void; onreplay: (r: Report) => void } =
    $props()
  const g = useGame()
  const game = $derived(g.game)
  const hall = $derived(game.levels.chuDien)
  const glory = $derived(outcome?.kind === 'rebirth' || !!(outcome?.kind === 'trib' && outcome.report.win))
</script>

<Sheet open={!!outcome} {onclose} center label={L.trib.title}>
  <div class="moment center stack" class:glory>
    {#if glory}<div class="rays" aria-hidden="true">
        <Painting key="radiance" make={() => radiance()} w={440} h={440} />
      </div>{/if}
    {#if outcome?.kind === 'rebirth'}
      <span class="big spin"><Medal emblem="rebirth" tone="gold" size={116} /></span>
      <h2 class="t-title">{L.rebirth.done(outcome.n)}</h2>
      <p class="t-lore">{L.rebirth.perks(outcome.n)}</p>
      <Button variant="gold" wide size="lg" onclick={onclose}>{L.rebirth.start}</Button>
    {:else if outcome?.report.win}
      <span class="big"><Medal emblem="lotus" tone="jade" size={116} /></span>
      <h2 class="t-title">{L.trib.success}</h2>
      <p class="t-lore">{L.trib.reached(L.realmName(hall), hall)}</p>
      <span class="row center"><Tag icon="flag" tone="good">{L.trib.opens(marchSlots(game))}</Tag></span>
      <div class="grid">
        <Button variant="ghost" onclick={() => outcome?.kind === 'trib' && onreplay(outcome.report)}
          >{L.trib.detail}</Button
        >
        <Button variant="gold" onclick={onclose}>{L.trib.next}</Button>
      </div>
    {:else if outcome}
      <span class="big"><Medal emblem="thunder" tone="thunder" size={116} /></span>
      <h2 class="t-title t-bad">{L.trib.fail}</h2>
      <p class="t-lore">{L.trib.failHint}</p>
      <div class="grid">
        <Button variant="ghost" onclick={() => outcome?.kind === 'trib' && onreplay(outcome.report)}
          >{L.trib.detail}</Button
        >
        <Button onclick={onclose}>{L.trib.next}</Button>
      </div>
    {/if}
  </div>
</Sheet>

<style>
  .moment {
    position: relative;
    --gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-2) var(--sp-1);
    overflow: hidden;
  }
  .moment > :global(*:not(.rays)) {
    position: relative;
  }
  /* hào quang nét bút vàng (vẽ tay), tâm trùng tâm huy hiệu, xoay chậm */
  .rays {
    position: absolute;
    left: 50%;
    top: calc(var(--sp-3) + 58px);
    translate: -50% -50%;
    animation: turn 18s linear infinite;
    pointer-events: none;
  }
  .big {
    display: grid;
    justify-items: center;
    filter: drop-shadow(0 0 18px rgb(var(--gold-glow) / 0.75));
    animation: stamp 0.7s 0.1s var(--spring) both;
  }
  .spin {
    animation: spinIn 1.2s var(--ease) both;
  }
  @keyframes turn {
    to {
      rotate: 1turn;
    }
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: scale(2.2);
    }
  }
  @keyframes spinIn {
    from {
      opacity: 0;
      transform: rotate(-200deg) scale(0.4);
    }
  }
</style>
