<script lang="ts">
  // Cột nhiệm vụ của HUD: note (QuestNote), events (EventTile), jobs (RunList). Điện thoại: tờ nhiệm vụ trái, cột sự kiện phải, việc đang chạy dưới tờ nhiệm vụ — chỉ ở tab
  // Tông môn (away: ẩn). Desktop: luôn nằm dọc trong cột trái dưới menu. ink: các ô tranh sự kiện gom một cột.
  import type { Snippet } from 'svelte'

  let {
    ink = false,
    away = false,
    note,
    events,
    jobs,
  }: { ink?: boolean; away?: boolean; note: Snippet; events: Snippet; jobs: Snippet } = $props()
</script>

<div class="side" class:away>
  {@render note()}
  {#if ink}<span class="tiles">{@render events()}</span>{:else}{@render events()}{/if}
  {@render jobs()}
</div>

<style>
  .side {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    justify-content: space-between;
    justify-items: start;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3) 0;
  }
  .away {
    display: none;
  }
  .side > :global(.quest) {
    grid-column: 1;
    grid-row: 1;
  }
  .side > :global(.daily) {
    grid-column: 2;
  }
  .side > :global(.runs) {
    grid-column: 1;
    grid-row: 2 / span 2;
  }
  /* cột ô tranh sự kiện, nhãn mực dưới tranh */
  .tiles {
    display: grid;
    justify-items: center;
    gap: 8px;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .side,
    .side.away {
      position: absolute;
      top: calc(var(--top) + var(--sp-4) + 5 * 60px + var(--sp-4));
      bottom: 0;
      left: 0;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      width: var(--rail);
      padding: 0 var(--sp-4) var(--sp-4);
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .tiles {
      grid-auto-flow: column;
      justify-content: start;
    }
  }
</style>
