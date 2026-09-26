<script lang="ts">
  // Mục trong bảng: hạt son hình thoi + tiêu đề, đường mực đôi chạy tới mép (như vạch chia mục của game), phần phụ (aside) bên phải.
  import type { Snippet } from 'svelte'

  let { title, aside, children }: { title: string; aside?: Snippet; children?: Snippet } = $props()
</script>

<section class="section">
  <header>
    <h3>{title}</h3>
    {#if aside}<div class="aside">{@render aside()}</div>{/if}
  </header>
  {#if children}{@render children()}{/if}
</section>

<style>
  .section {
    display: grid;
    gap: var(--sp-2);
    margin-top: var(--sp-4);
  }
  /* phần phụ nhiều nút mà không vừa một hàng với tiêu đề (điện thoại hẹp): xuống dòng, không tràn */
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  h3 {
    display: flex;
    flex: 1 1 60%;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-4);
    font-weight: 800;
    line-height: 1.15;
    color: var(--text);
  }
  h3::before {
    content: '';
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 1px;
    background: var(--cinnabar);
    transform: rotate(45deg);
  }
  h3::after {
    content: '';
    flex: 1;
    min-width: 24px;
    height: 4px;
    margin-top: 2px;
    border-block: 1px solid var(--rim, var(--ink3));
    border-bottom-color: var(--paper3);
    opacity: 0.7;
  }
  .aside {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-2);
    color: var(--text-soft);
  }
</style>
