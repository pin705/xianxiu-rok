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
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Meter } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let { s }: { s: State } = $props()
  const g = useGame()
  const fx = artOf('ui:fx-pass')?.src
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
    {#if got}<span class="stamp">{L.fest.claimed}</span>
    {:else if isGold && !gold}<span class="mark"><Icon name="lock" size={14} /></span>{/if}
  </button>
{/snippet}

<!-- lệnh bài ngọc là tâm điểm: cấp lệnh trong ấn son, vạch điểm tới cấp sau -->
<header class="token">
  <span class="pic"
    >{#if fx}<img src={fx} alt="" draggable="false" />{:else}<Icon name="scroll" size={48} />{/if}<b
      class="lvseal t-num"
      aria-hidden="true">{lv}</b
    ></span
  >
  <div class="stack" style:--gap="3px">
    <b class="name">{L.pass.title}</b>
    <b class="t-small t-num t-gold">{L.pass.level(lv, PASS_LEVELS)}</b>
    <Meter value={lv >= PASS_LEVELS ? 1 : (xp % PASS_STEP) / PASS_STEP} size="sm" tone="gold" />
    <small class="t-tiny t-soft">{lv >= PASS_LEVELS ? L.pass.max : L.pass.next(xp % PASS_STEP, PASS_STEP)}</small>
  </div>
  <p class="desc t-tiny t-lore">{L.pass.desc(PASS_CHEST, PASS_WEEK)}</p>
</header>
<small class="t-tiny" class:t-gold={gold} class:t-soft={!gold}>{gold ? L.pass.goldOn : L.pass.goldOff(PASS_VIP)}</small>
{#if ready > 1}<Button variant="gold" wide onclick={() => claim({})}>{L.mail.claimAll(ready)}</Button>{/if}
<!-- đường mốc hai hàng: quà thường trên, Kim Lệnh dưới, sợi chỉ cấp chạy giữa (đã tới: chỉ son, hạt son) -->
<div class="strip" bind:this={strip}>
  <div class="col side">
    <b class="t-tiny">{L.pass.free}</b>
    <span></span>
    <b class="t-tiny t-gold">{L.pass.gold}</b>
  </div>
  {#each PASS_FREE as r, i (i)}
    <div class="col" class:cur={i + 1 === Math.min(PASS_LEVELS, lv + 1)} class:reached={i + 1 <= lv}>
      {@render cell(r, i + 1, false)}
      <b class="bead t-num">{i + 1}</b>
      {@render cell(PASS_GOLD[i], i + 1, true)}
    </div>
  {/each}
</div>
<p class="t-tiny t-soft">{L.pass.reset}</p>

<style>
  .token {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 4px 10px;
    align-items: center;
    padding: 8px 10px 8px 6px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .pic {
    position: relative;
    width: 64px;
    height: 64px;
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    rotate: -4deg;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
  .lvseal {
    position: absolute;
    right: -6px;
    bottom: -4px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    font-size: var(--fs-2);
    color: var(--silk);
    background: var(
        --ui-seal-img,
        radial-gradient(circle at 40% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer))
      )
      center / 100% 100% no-repeat;
    border-radius: 50%;
  }
  .name {
    font-size: var(--fs-4);
    line-height: 1.1;
  }
  .desc {
    grid-column: 1 / -1;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .strip {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 4px 2px 8px;
    scroll-snap-type: x proximity;
  }
  .col {
    position: relative;
    flex: 0 0 auto;
    display: grid;
    grid-template-rows: 1fr 26px 1fr;
    gap: 4px;
    width: 76px;
    scroll-snap-align: center;
  }
  /* sợi chỉ cấp chạy ngang qua hạt */
  .col::before {
    content: '';
    position: absolute;
    top: 50%;
    right: -4px;
    left: 0;
    height: 2px;
    translate: 0 -50%;
    background: var(--paper3);
  }
  .col.reached::before {
    background: var(--cinnabar);
  }
  /* nhãn hàng dính mép trái khi cuộn */
  .col.side {
    position: sticky;
    left: 0;
    z-index: 2;
    width: 22px;
    background: var(--paper);
    border-right: 1px solid var(--paper3);
    box-shadow: 4px 0 6px -4px rgb(var(--shade) / 0.25);
  }
  .col.side::before {
    display: none;
  }
  .side b {
    writing-mode: vertical-rl;
    place-self: center;
    font-weight: 800;
  }
  .bead {
    position: relative;
    z-index: 1;
    display: grid;
    place-self: center;
    place-items: center;
    min-width: 26px;
    height: 26px;
    padding: 0 4px;
    font-size: var(--fs-1);
    color: var(--text-soft);
    background: var(--paper);
    border: 2px solid var(--ink3);
    border-radius: 999px;
  }
  .reached .bead {
    color: var(--silk);
    background: var(--cinnabar);
    border-color: var(--cinnabar);
  }
  .cur .bead {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--cinnabar) 25%, transparent);
  }
  .cell {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 64px;
    padding: 4px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 4px;
    box-shadow: 0 2px 4px rgb(var(--shade) / 0.08);
    opacity: 0.6;
  }
  .reached .cell {
    opacity: 1;
  }
  .cell.gold {
    background: color-mix(in srgb, var(--gold) 12%, var(--silk));
    border-color: color-mix(in srgb, var(--gold) 55%, var(--paper3));
  }
  .cell.can {
    cursor: pointer;
    border-color: var(--cinnabar);
    box-shadow: 0 0 0 2px rgb(var(--gold-glow) / 0.6);
    animation: glow 1.6s ease-in-out infinite;
  }
  .cell .stamp {
    position: absolute;
    padding: 1px 4px;
    background: color-mix(in srgb, var(--silk) 80%, transparent);
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
