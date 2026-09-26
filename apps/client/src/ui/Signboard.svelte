<script lang="ts">
  // Biển gỗ vẽ tay (ui:signboard) ghim tờ giấy ghi số lớn + nhãn, dòng thêm bên dưới (hạng tuần…); tắt art: biển giấy viền mực.
  import type { Snippet } from 'svelte'
  import { artOf } from '@rok/art'

  let { value, label, children }: { value: string | number; label: string; children?: Snippet } = $props()
  const src = artOf('ui:signboard')?.src
</script>

<div class="sign" class:art={!!src} style:--sign={src && `url(${src})`}>
  <b class="t-num">{value}</b>
  <small>{label}</small>
  {#if children}{@render children()}{/if}
</div>

<style>
  .sign {
    display: grid;
    align-content: center;
    justify-items: center;
    min-height: 72px;
    padding: 6px 4px;
    text-align: center;
    line-height: 1.15;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  .art {
    align-content: start;
    height: 100px;
    padding: 17px 14px 0;
    background: var(--sign) center / 100% 100% no-repeat;
    border: 0;
  }
  b {
    font-size: var(--fs-5);
  }
  .sign > :global(small) {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
</style>
