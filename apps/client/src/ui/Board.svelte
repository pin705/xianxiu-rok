<script lang="ts">
  // Bảng gỗ ghim giấy: khung gỗ sẫm, vân dọc; bên trong là lưới các Note (tự xếp theo bề ngang, mỗi ô tối thiểu `min` px).
  import type { Snippet } from 'svelte'

  let { min = 140, children }: { min?: number; children: Snippet } = $props()
</script>

<div class="board" style:--min="{min}px">{@render children()}</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(var(--min), 100%), 1fr));
    gap: 16px 12px;
    padding: 18px 12px 14px;
    background:
      repeating-linear-gradient(90deg, rgb(0 0 0 / 0.05) 0 2px, transparent 2px 38px),
      linear-gradient(var(--wood-l), var(--wood));
    border: 6px solid var(--wood-d);
    border-radius: 6px;
    box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.3);
  }
</style>
