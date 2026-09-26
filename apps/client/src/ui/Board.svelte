<script lang="ts">
  // Bảng gỗ ghim giấy: khung gỗ sẫm, vân dọc; bên trong là lưới các Note (tự xếp theo bề ngang, mỗi ô tối thiểu `min` px).
  // pinned: bảng thành danh sách một cột (<ul>) — mỗi con trực tiếp (<li> chứa Card) được ghim đinh son, nghiêng xen kẽ,
  // thẻ nền giấy ngà (bảng bùa nhiệm vụ ngày).
  import type { Snippet } from 'svelte'

  let { min = 140, pinned = false, children }: { min?: number; pinned?: boolean; children: Snippet } = $props()
</script>

{#if pinned}
  <ul class="board pinned">{@render children()}</ul>
{:else}
  <div class="board" style:--min="{min}px">{@render children()}</div>
{/if}

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
  .pinned {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    padding: 16px 12px 14px;
    list-style: none;
  }
  .pinned > :global(li) {
    position: relative;
  }
  .pinned > :global(li:nth-child(odd)) {
    rotate: -0.7deg;
  }
  .pinned > :global(li:nth-child(even)) {
    rotate: 0.6deg;
  }
  .pinned > :global(li)::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    z-index: 1;
    width: 11px;
    height: 11px;
    translate: -50% 0;
    background: var(--pin);
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }
  .pinned :global(.card) {
    background: linear-gradient(var(--talisman), color-mix(in srgb, var(--talisman) 80%, var(--talisman-edge)));
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.28);
  }
</style>
