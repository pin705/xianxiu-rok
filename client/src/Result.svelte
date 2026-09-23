<script module lang="ts">
  import type { Report } from '@rok/rules'
  export type Outcome = { kind: 'trib'; report: Report } | { kind: 'rebirth'; n: number }
</script>

<script lang="ts">
  // Khoảnh khắc lớn: đột phá cảnh giới sau độ kiếp (chữ Hán lớn, hào quang), thất bại, hoặc luân hồi.
  import { marchSlots, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { GLYPH, L } from './lib'

  let { outcome, game, onclose, onreplay }: { outcome: Outcome | null; game: State; onclose: () => void; onreplay: (r: Report) => void } =
    $props()

  let dlg = $state<HTMLDialogElement>()
  $effect(() => {
    if (!dlg) return
    if (outcome && !dlg.open) dlg.showModal()
    if (!outcome && dlg.open) dlg.close()
  })
  const hall = $derived(game.levels.chuDien)
</script>

<dialog bind:this={dlg} class="result" aria-label={L.trib.title} onclose={onclose}>
  {#if outcome?.kind === 'rebirth'}
    <div class="rays"></div>
    <p class="han big spin">{GLYPH.rebirth}</p>
    <h2>{L.rebirth.done(outcome.n)}</h2>
    <p class="sub">{L.rebirth.gain(outcome.n)}</p>
    <button class="btn gold wide" onclick={() => dlg?.close()}>{L.rebirth.start}</button>
  {:else if outcome?.report.win}
    <div class="rays"></div>
    <p class="han big">{L.trib.han[hall] ?? ''}</p>
    <h2>{L.trib.success}</h2>
    <p class="sub">{L.trib.reached(L.realmName(hall), hall)}</p>
    <p class="chip good"><Icon name="flag" size={14} />{L.trib.opens(marchSlots(game))}</p>
    <div class="two">
      <button class="btn ghost" onclick={() => outcome?.kind === 'trib' && onreplay(outcome.report)}>{L.trib.detail}</button>
      <button class="btn gold" onclick={() => dlg?.close()}>{L.trib.next}</button>
    </div>
  {:else if outcome}
    <p class="han big bad">{GLYPH.thunder}</p>
    <h2 class="bad">{L.trib.fail}</h2>
    <p class="sub">{L.trib.failHint}</p>
    <div class="two">
      <button class="btn ghost" onclick={() => outcome?.kind === 'trib' && onreplay(outcome.report)}>{L.trib.detail}</button>
      <button class="btn" onclick={() => dlg?.close()}>{L.trib.next}</button>
    </div>
  {/if}
</dialog>

<style>
  .result {
    width: min(100% - 32px, 400px);
    margin: auto;
    padding: 28px 20px 20px;
    overflow: hidden;
    color: #f6f1e4;
    text-align: center;
    background: radial-gradient(circle at 50% 30%, #2b3f4a, #0d1a20 75%);
    border: 1px solid var(--gold);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.6);
  }
  .result[open] {
    animation: pop 0.5s cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
  }
  .result::backdrop {
    background: rgb(8 12 20 / 0.7);
  }
  .rays {
    position: absolute;
    inset: -50%;
    background: repeating-conic-gradient(from 0deg, rgb(248 227 160 / 0.14) 0 8deg, transparent 8deg 22deg);
    animation: turn 18s linear infinite;
    pointer-events: none;
  }
  @keyframes turn {
    to {
      transform: rotate(1turn);
    }
  }
  .big {
    position: relative;
    font-size: 84px;
    line-height: 1.1;
    color: var(--gold-l);
    text-shadow: 0 0 30px rgb(248 227 160 / 0.7);
    animation: stamp 0.7s 0.1s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  }
  .big.bad {
    color: #c7b6f0;
    text-shadow: 0 0 30px rgb(160 130 240 / 0.7);
  }
  .spin {
    animation: spinIn 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
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
  h2 {
    position: relative;
    margin-top: 6px;
    font-size: 28px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold-l);
  }
  h2.bad {
    color: #ffb4a4;
  }
  .sub {
    position: relative;
    margin: 8px 0 14px;
    font-size: 14px;
    color: #c9d4d7;
  }
  .chip {
    position: relative;
    margin-bottom: 16px;
  }
  .btn {
    position: relative;
  }
  .two {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  @media (prefers-reduced-motion: reduce) {
    .rays,
    .big,
    .spin,
    .result[open] {
      animation: none;
    }
  }
</style>
