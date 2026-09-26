<script lang="ts">
  // Bảng vinh danh treo: khung gỗ sơn mài viền chỉ vàng, lòng giấy trắng sương; `head` (tranh cúp, tổng, nút) ngăn với
  // phần dưới bằng nét mực đôi. Thành tựu, bảng công trạng.
  import type { Snippet } from 'svelte'

  let { head, children }: { head?: Snippet; children: Snippet } = $props()
</script>

<div class="tablet">
  {#if head}<header class="head">{@render head()}</header>{/if}
  {@render children()}
</div>

<style>
  .tablet {
    padding: 8px 12px 10px;
    background: var(--silk);
    border: 6px solid var(--lacquer2);
    border-radius: 4px;
    box-shadow:
      inset 0 0 0 2px var(--ochre),
      0 4px 10px rgb(var(--shade) / 0.18);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 3px double var(--ink3);
  }
</style>
