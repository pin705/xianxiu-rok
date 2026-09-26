<script lang="ts">
  // Đồ vật vừa mở / vừa nhận đứng trên đĩa sáng: tranh (snippet), tên gạch nét cọ son, dòng son nhỏ (Tới ›); cả món bấm
  // được. Hiện lên lần lượt theo i (thứ tự trong hàng). Xếp bằng .row.wrap.justify-center (ít món đứng giữa).
  import type { Snippet } from 'svelte'

  let {
    label,
    sub,
    i = 0,
    onclick,
    children,
  }: { label: string; sub?: string; i?: number; onclick: (e: MouseEvent) => void; children: Snippet } = $props()
</script>

<button type="button" class="trophy" style:--delay="{Math.min(i, 3) * 0.06}s" aria-label={label} {onclick}>
  <span class="art">{@render children()}</span>
  <b class="nm">{label}</b>
  {#if sub}<small class="t-tiny go">{sub}</small>{/if}
</button>

<style>
  .trophy {
    display: grid;
    justify-items: center;
    flex: 0 1 120px;
    gap: 3px;
    min-width: 96px;
    text-align: center;
    color: var(--text);
    animation: rise var(--dur-2) var(--ease) var(--delay) both;
  }
  .trophy:active .art {
    transform: scale(0.94);
  }
  .art {
    display: grid;
    place-items: center;
    width: 84px;
    height: 72px;
    /* đĩa sáng dưới đồ vật */
    background: radial-gradient(closest-side, rgb(var(--gold-glow) / 0.55), transparent) center / 100% 100% no-repeat;
    transition: transform var(--dur-1) var(--ease);
  }
  .nm {
    max-width: 100%;
    padding: 0 6px 6px;
    font-size: var(--fs-2);
    line-height: 1.2;
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  .go {
    font-weight: 800;
    color: var(--cinnabar);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .trophy {
      animation: none;
    }
  }
</style>
