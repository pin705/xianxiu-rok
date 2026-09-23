<script lang="ts">
  // Mục trong bảng: tiêu đề gạch chân bằng một nét bút, phần phụ (aside) bên phải.
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
  header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  h3 {
    padding: 0 18px 7px 1px;
    font-size: var(--fs-4);
    font-weight: 800;
    line-height: 1.15;
    color: var(--text);
    background: var(--stroke-ink) no-repeat left bottom / 100% 7px;
  }
  :global(.on-dark) h3 {
    background-image: var(--stroke-gold);
  }
  .aside {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-2);
    color: var(--text-soft);
  }
</style>
