<script lang="ts">
  // Tờ giấy lớn cuộn lụa nổi giữa bìa (đặt tên, đăng nhập): là <form>, chữ mực, hiện như mực loang; gone: mờ đi thu nhỏ.
  import type { Snippet } from 'svelte'

  let {
    gone = false,
    onsubmit,
    children,
  }: { gone?: boolean; onsubmit: (e: SubmitEvent) => void; children: Snippet } = $props()
</script>

<form class="folio scroll-skin stack center" class:gone {onsubmit}>{@render children()}</form>

<style>
  .folio {
    --gap: var(--sp-3);
    color: var(--text); /* tờ giấy nằm trên bìa chữ sáng: đặt lại màu mực */
    width: min(100%, 360px);
    padding: 30px 28px;
    box-shadow: var(--shadow-3);
    animation: ink-in 0.5s var(--ease) both;
    transition:
      opacity var(--dur-3),
      transform var(--dur-3);
  }
  .gone {
    opacity: 0;
    transform: scale(0.94);
  }
</style>
