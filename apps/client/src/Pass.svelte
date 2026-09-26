<script lang="ts">
  // Tu Tiên Lệnh (Lucerne Scroll của RoK — thẻ mùa): cấp lệnh + thanh điểm, dải cấp cuộn ngang — mỗi cột một quà thường (trên) và
  // một quà Kim Lệnh (dưới, khoá tới Hương Hỏa PASS_VIP). Chạm quà đã tới cấp để nhận; "Nhận tất cả"; mở ra cuộn sẵn tới cấp đang lên.
  import {
    PASS_CHEST,
    PASS_FREE,
    PASS_GOLD,
    PASS_LEVELS,
    PASS_STEP,
    PASS_VIP,
    PASS_WEEK,
    passGold,
    passLevel,
    passReady,
    type Reward,
    type State,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Meter } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let { s }: { s: State } = $props()
  const g = useGame()
  const lv = $derived(passLevel(s))
  const xp = $derived(s.pass?.xp ?? 0)
  const gold = $derived(passGold(s))
  const ready = $derived(passReady(s).length)
  const claim = (a: { lv?: number; gold?: boolean }) => g.act({ type: 'pass', ...a }, 'reward')
  let strip = $state<HTMLElement>()
  $effect(() => strip?.querySelector('.cur')?.scrollIntoView?.({ inline: 'center', block: 'nearest' }))
</script>

{#snippet cell(r: Reward, n: number, isGold: boolean)}
  {@const got = !!(isGold ? s.pass?.gold : s.pass?.got)?.includes(n)}
  {@const can = n <= lv && !got && (!isGold || gold)}
  <button
    class="cell"
    class:gold={isGold}
    class:can
    class:got
    disabled={!can}
    aria-label={`${isGold ? L.pass.gold : L.pass.free} · ${L.pass.level(n, PASS_LEVELS)}`}
    onclick={() => claim({ lv: n, ...(isGold && { gold: true }) })}
  >
    <Bag res={r.res} items={r.items} size="sm" />
    {#if got}<span class="mark"><Icon name="check" size={14} /></span>
    {:else if isGold && !gold}<span class="mark"><Icon name="lock" size={14} /></span>{/if}
  </button>
{/snippet}

<div class="stack head" style:--gap="4px">
  <p class="row between">
    <b class="name">{L.pass.title}</b><b class="t-num t-gold">{L.pass.level(lv, PASS_LEVELS)}</b>
  </p>
  <p class="t-small t-lore">{L.pass.desc(PASS_CHEST, PASS_WEEK)}</p>
  <Meter value={lv >= PASS_LEVELS ? 1 : (xp % PASS_STEP) / PASS_STEP} size="sm" />
  <p class="t-tiny t-soft">{lv >= PASS_LEVELS ? L.pass.max : L.pass.next(xp % PASS_STEP, PASS_STEP)}</p>
  <p class="row between t-tiny">
    <span class="row" style:--gap="6px"
      ><i class="swatch"></i>{L.pass.free}<i class="swatch gold"></i>{L.pass.gold}</span
    >
    <span class:t-gold={gold} class:t-soft={!gold}>{gold ? L.pass.goldOn : L.pass.goldOff(PASS_VIP)}</span>
  </p>
</div>
{#if ready > 1}<Button variant="gold" wide onclick={() => claim({})}>{L.mail.claimAll(ready)}</Button>{/if}
<div class="strip" bind:this={strip}>
  {#each PASS_FREE as r, i (i)}
    <div class="col" class:cur={i + 1 === Math.min(PASS_LEVELS, lv + 1)} class:reached={i + 1 <= lv}>
      <b class="t-small lvl">{i + 1}</b>
      {@render cell(r, i + 1, false)}
      {@render cell(PASS_GOLD[i], i + 1, true)}
    </div>
  {/each}
</div>
<p class="t-tiny t-soft">{L.pass.reset}</p>

<style>
  .name {
    font-size: var(--fs-4);
  }
  .strip {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 4px 2px 8px;
    scroll-snap-type: x proximity;
  }
  .col {
    flex: 0 0 auto;
    display: grid;
    grid-template-rows: auto 1fr 1fr;
    gap: 4px;
    width: 84px;
    scroll-snap-align: center;
  }
  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--paper3);
    border-radius: 3px;
    background: var(--paper2);
  }
  .lvl {
    text-align: center;
    border-radius: 999px;
    background: var(--paper2);
  }
  .reached .lvl {
    background: rgb(var(--gold-glow) / 0.45);
  }
  .cur .lvl {
    outline: 2px solid var(--gold);
  }
  .cell {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 64px;
    padding: 4px;
    border: 1.5px solid var(--paper3);
    border-radius: 10px;
    background: var(--paper2);
    opacity: 0.6;
  }
  .reached .cell {
    opacity: 1;
  }
  .swatch.gold,
  .cell.gold {
    border-color: color-mix(in srgb, var(--gold) 55%, var(--paper3));
    background: color-mix(in srgb, var(--gold) 16%, var(--paper2));
  }
  .cell.can {
    cursor: pointer;
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgb(var(--gold-glow) / 0.5);
    animation: glow 1.6s ease-in-out infinite;
  }
  .cell.got {
    opacity: 0.55;
  }
  .mark {
    position: absolute;
    top: 3px;
    right: 3px;
  }
  @keyframes glow {
    50% {
      box-shadow: 0 0 0 4px rgb(var(--gold-glow) / 0.3);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cell.can {
      animation: none;
    }
  }
</style>
