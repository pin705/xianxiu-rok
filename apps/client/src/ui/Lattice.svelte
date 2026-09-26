<script lang="ts">
  // Trận đồ lưới 3 cột: các ô (RingNode…) nối với ô bên phải và ô bên dưới bằng nét mực đứt, chạy qua tâm đĩa (--ey tính
  // từ đỉnh ô). Dùng cho đại trận của minh, cây thần thông.
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="lattice">{@render children()}</div>

<style>
  .lattice {
    --gx: 6px;
    --gy: 14px;
    --ey: 36px; /* tâm đĩa RingNode: đệm trên 8px + nửa đĩa 28px */
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--gy) var(--gx);
    margin: var(--sp-4) 0 var(--sp-3);
    padding: 6px 0;
  }
  .lattice > :global(*) {
    position: relative;
  }
  .lattice > :global(*)::before,
  .lattice > :global(*)::after {
    content: '';
    position: absolute;
    z-index: 0;
    pointer-events: none;
  }
  .lattice > :global(*)::before {
    top: var(--ey);
    left: 50%;
    width: calc(100% + var(--gx));
    border-top: 2px dashed rgb(var(--shade) / 0.28);
  }
  .lattice > :global(*)::after {
    top: var(--ey);
    left: 50%;
    height: calc(100% + var(--gy));
    border-left: 2px dashed rgb(var(--shade) / 0.28);
  }
  .lattice > :global(:nth-child(3n))::before,
  .lattice > :global(:nth-child(n + 7))::after {
    display: none;
  }
</style>
