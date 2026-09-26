<script lang="ts">
  // Khoảnh khắc đóng ấn giữa bìa: vật (children — huy hiệu) đập xuống như ấn, tên hiện dần như mực bên dưới, dòng thêm (after).
  import type { Snippet } from 'svelte'

  let { name, children, after }: { name: string; children: Snippet; after?: Snippet } = $props()
</script>

<div class="slam stack center">
  <span class="obj">{@render children()}</span>
  <span class="nm">{name}</span>
  {#if after}{@render after()}{/if}
</div>

<style>
  .slam {
    position: absolute;
    inset: 0;
    align-content: center;
    justify-items: center;
    --gap: var(--sp-4);
  }
  .obj {
    animation: slam-in 0.55s var(--spring) both;
  }
  .nm {
    font-size: var(--fs-6);
    font-weight: 800;
    letter-spacing: 0.1em;
    animation: ink-in 0.8s 0.4s var(--ease) both;
  }
</style>
