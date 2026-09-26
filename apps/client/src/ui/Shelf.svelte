<script lang="ts">
  // Tủ gỗ nhiều tầng kệ: đồ vật (con trực tiếp) đứng trên ván, mỗi hàng cao `row` px, mỗi ô tối thiểu `min` px.
  // Dùng cho túi đồ, tủ đan, kệ hàng, kệ bí kíp — không vẽ lại kệ trong từng màn.
  import type { Snippet } from 'svelte'

  let { row = 86, min = 64, children }: { row?: number; min?: number; children: Snippet } = $props()
</script>

<div class="shelf" style:--row="{row}px" style:--min="{min}px">{@render children()}</div>

<style>
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
    grid-auto-rows: var(--row);
    align-items: end;
    justify-items: center;
    gap: 0 var(--sp-2);
    padding: 6px 12px 0;
    background:
      linear-gradient(
          transparent calc(var(--row) - 14px),
          var(--wood) calc(var(--row) - 14px),
          var(--wood-d) calc(var(--row) - 5px),
          rgb(0 0 0 / 0.14) calc(var(--row) - 5px),
          transparent var(--row)
        )
        0 6px / 100% var(--row) repeat-y,
      linear-gradient(90deg, var(--wood-d) 6px, transparent 6px calc(100% - 6px), var(--wood-d) calc(100% - 6px)),
      color-mix(in srgb, var(--paper2) 70%, var(--wood-l) 12%);
    border-top: 8px solid var(--wood-d);
    border-radius: 4px 4px 0 0;
  }
  .shelf > :global(*) {
    padding-bottom: 12px;
  }
</style>
