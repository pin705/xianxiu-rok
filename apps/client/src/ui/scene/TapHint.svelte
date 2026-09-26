<script lang="ts">
  // Lời mời chạm trên bìa: dải giấy sáng (--sk-toast) chữ mực, thở nhịp mờ — tỏ nhẹ.
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<span class="tap">{@render children()}</span>

<style>
  .tap {
    margin-top: var(--sp-5);
    padding: 13px 40px 14px;
    color: var(--ink); /* khung giấy sáng: chữ mực, không để chữ sáng của màn bìa */
    font-weight: 700;
    letter-spacing: 0.06em;
    border: 0 solid transparent;
    border-image: var(--sk-toast);
    animation: breathe 1.8s var(--ease) infinite;
  }
  @keyframes breathe {
    50% {
      opacity: 0.45;
    }
  }
</style>
