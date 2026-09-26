<script lang="ts">
  // Tờ thư giấy trắng sương: mỗi con trực tiếp là một đoạn thư, ngăn bằng nét mực đứt (tiêu đề đoạn <b> chữ mực nhạt);
  // warn: dòng son cuối thư (kho đầy, cảnh báo). Thư xuất quan, thư hệ thống.
  import type { Snippet } from 'svelte'

  let { warn, children }: { warn?: string; children: Snippet } = $props()
</script>

<div class="letter">
  {@render children()}
  {#if warn}<p class="foot t-small">{warn}</p>{/if}
</div>

<style>
  .letter {
    display: grid;
    margin-top: var(--sp-2);
    padding: 4px 14px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 3px 8px rgb(var(--shade) / 0.1);
  }
  .letter > :global(section) {
    display: grid;
    gap: 6px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .letter > :global(section:last-child) {
    border-bottom: 0;
  }
  .letter > :global(section > b) {
    color: var(--text-soft);
  }
  .foot {
    margin: 0 -14px;
    padding: 6px 14px;
    font-weight: 800;
    color: var(--silk);
    background: var(--cinnabar);
  }
</style>
