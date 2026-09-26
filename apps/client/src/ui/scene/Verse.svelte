<script lang="ts">
  // Các dòng lời dẫn lớn nghiêng trên bìa, mỗi dòng hiện dần như mực loang (lời mở đầu game).
  let { lines }: { lines: readonly string[] } = $props()
</script>

<span class="verse stack">
  {#each lines as text, i (i)}<span class="ln">{text}</span>{/each}
</span>

<style>
  .verse {
    --gap: var(--sp-5);
    max-width: 320px;
  }
  .ln {
    font-size: var(--fs-5);
    font-style: italic;
    line-height: 1.55;
    animation: ink-in 1.2s var(--ease) both;
  }
</style>
