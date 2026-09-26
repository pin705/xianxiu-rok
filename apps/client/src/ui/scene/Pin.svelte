<script lang="ts">
  // Ghim HTML đặt theo toạ độ trên cảnh (px trong lớp ghim): biển tên, bong bóng, nhãn. at: center (tâm ở điểm) · up (đáy ở
  // điểm, nằm trên) · below (đỉnh ở điểm, nằm dưới).
  import type { Snippet } from 'svelte'

  let {
    x,
    y,
    at = 'center',
    children,
  }: { x: number; y: number; at?: 'center' | 'up' | 'below'; children: Snippet } = $props()
</script>

<span class="pin {at}" style:left="{x}px" style:top="{y}px">{@render children()}</span>

<style>
  .pin {
    position: absolute;
    translate: -50% -50%;
    white-space: nowrap;
  }
  .up {
    translate: -50% -100%;
  }
  .below {
    translate: -50% 0;
  }
</style>
