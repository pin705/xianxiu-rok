<script lang="ts">
  // Dải mực quét ngang phía trên núi (tin lớn toàn giới — Newspaper của RoK): trượt vào từ trái, dừng đọc, mờ đi; chạm để mở chi tiết.
  // Màn giữ nội dung và thời lượng (key đổi = tin mới, diễn lại từ đầu)
  let { text, onclick }: { text: string; onclick?: () => void } = $props()
</script>

<button type="button" class="sweep" aria-live="polite" {onclick}>
  <span class="ink t-small">{text}</span>
</button>

<style>
  .sweep {
    position: fixed;
    inset: calc(var(--safe-t, 0px) + 132px) 0 auto 0;
    z-index: var(--z-toast);
    display: flex;
    justify-content: center;
    padding: 0 16px;
    background: none;
    border: 0;
    pointer-events: auto;
    animation: sweep 7s var(--ease) forwards;
  }
  .ink {
    max-width: min(100%, 520px);
    padding: 6px 18px;
    color: var(--text-inv);
    background: linear-gradient(
      90deg,
      transparent,
      rgb(var(--shade) / 0.82) 12%,
      rgb(var(--shade) / 0.82) 88%,
      transparent
    );
    text-align: center;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }
  @keyframes sweep {
    0% {
      opacity: 0;
      transform: translateX(-40%);
    }
    12% {
      opacity: 1;
      transform: translateX(0);
    }
    85% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sweep {
      animation: fade 7s linear forwards;
    }
    @keyframes fade {
      0%,
      85% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        visibility: hidden;
      }
    }
  }
</style>
