<script lang="ts">
  // Đường mốc hai hàng cuộn ngang (thẻ mùa): nhãn hai hàng dựng đứng dính mép trái, mỗi cột một mốc — ô trên, hạt số mốc
  // trên sợi chỉ, ô dưới (snippet `cell(i, row)`, i từ 1). Mốc ≤ `reached`: chỉ và hạt tô son; mốc `cur`: quầng son,
  // mở ra thì cuộn sẵn tới đó. Nền dải giấy bồi lụa (.strip).
  import type { Snippet } from 'svelte'

  let {
    n,
    reached,
    cur,
    top,
    bottom,
    cell,
  }: {
    n: number
    reached: number
    cur: number
    top: string
    bottom: string
    cell: Snippet<[number, 'top' | 'bottom']>
  } = $props()
  let el = $state<HTMLElement>()
  $effect(() => el?.querySelector('.cur')?.scrollIntoView?.({ inline: 'center', block: 'nearest' }))
</script>

<div class="track strip" bind:this={el}>
  <div class="col side">
    <b class="t-tiny">{top}</b>
    <span></span>
    <b class="t-tiny t-gold">{bottom}</b>
  </div>
  {#each { length: n } as _, k (k)}
    <div class="col" class:cur={k + 1 === cur} class:reached={k + 1 <= reached}>
      {@render cell(k + 1, 'top')}
      <b class="bead t-num">{k + 1}</b>
      {@render cell(k + 1, 'bottom')}
    </div>
  {/each}
</div>

<style>
  .track {
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
  /* sợi chỉ chạy ngang qua hạt */
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
</style>
