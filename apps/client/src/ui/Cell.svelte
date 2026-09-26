<script lang="ts">
  // Ô của trò chơi trên lưới (lật bài, mê cung, khảo cổ, bàn cờ…): mặt úp theo `back` — card: lưng bài son kẻ chéo · fog: sương
  // vàng · stone: đá; `up` lật ngửa (giấy); `done` mờ (đã xong); `busy` gõ nhịp chờ server; `ring` viền son (thủ lĩnh, ô đặc biệt);
  // `ratio` tỉ lệ ô (bài: 3 / 4). Lưới ngoài dùng lớp `.grid` với `--cols`.
  import type { Snippet } from 'svelte'

  let {
    back = 'card',
    up = false,
    done = false,
    busy = false,
    ring = false,
    ratio = '1',
    disabled = false,
    label,
    onclick,
    children,
  }: {
    back?: 'card' | 'fog' | 'stone'
    up?: boolean
    done?: boolean
    busy?: boolean
    ring?: boolean
    ratio?: string
    disabled?: boolean
    label?: string
    onclick?: () => void
    children?: Snippet
  } = $props()
</script>

<button
  type="button"
  class="cell {back}"
  class:up
  class:done
  class:busy
  class:ring
  style:--ratio={ratio}
  {disabled}
  aria-label={label}
  {onclick}>{@render children?.()}</button
>

<style>
  .cell {
    display: grid;
    place-items: center;
    aspect-ratio: var(--ratio);
    border: 2px solid var(--gold-d, #9a6b16);
    border-radius: 8px;
    transition: transform var(--dur-1, 0.15s);
  }
  .cell:disabled {
    cursor: default;
  }
  .card {
    background:
      repeating-linear-gradient(45deg, rgb(255 255 255 / 0.12) 0 6px, transparent 6px 12px),
      linear-gradient(145deg, #8f2b24, #5a1a16);
  }
  .fog {
    background:
      radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.35), transparent 50%),
      linear-gradient(145deg, #c9a24a, #8a6a25);
  }
  .stone {
    background:
      radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.25), transparent 45%),
      linear-gradient(145deg, #8d7b66, #5f5245);
    border-color: #4a3f35;
  }
  .up {
    background: var(--paper);
  }
  .done {
    opacity: 0.55;
  }
  .ring {
    border-color: var(--bad);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--bad) 40%, transparent);
  }
  .busy {
    animation: knock 0.35s linear infinite;
  }
  @keyframes knock {
    50% {
      transform: translateY(2px) rotateY(20deg);
    }
  }
</style>
