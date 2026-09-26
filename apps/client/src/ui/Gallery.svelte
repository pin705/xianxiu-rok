<script lang="ts">
  // Hành lang tranh lớn: các tranh (srcs) xếp chồng, tranh thứ `at` hiện rõ (lướt sang), đứng trước ấn (snippet `seal`,
  // diễn lại khi đổi `at`), quầng màu `accent` sau lưng; vuốt ngang hoặc nút ‹ › để đổi (onstep ±1). compact: thấp hơn
  // (trong Sheet). Chọn tổ sư đạo thống, chọn nhân vật.
  import type { Snippet } from 'svelte'

  let {
    srcs,
    at,
    accent = 'var(--gold)',
    compact = false,
    prev,
    next,
    onstep,
    seal,
  }: {
    srcs: string[]
    at: number
    accent?: string
    compact?: boolean
    prev: string
    next: string
    onstep: (d: number) => void
    seal?: Snippet
  } = $props()
  let x0: number | null = null
  function swipe(e: PointerEvent) {
    if (x0 !== null && Math.abs(e.clientX - x0) > 40) onstep(e.clientX < x0 ? 1 : -1)
    x0 = null
  }
</script>

<div
  class="gallery"
  class:compact
  style:--accent={accent}
  role="presentation"
  onpointerdown={e => (x0 = e.clientX)}
  onpointerup={swipe}
  onpointercancel={() => (x0 = null)}
>
  {#if seal}{#key at}<span class="seal">{@render seal()}</span>{/key}{/if}
  {#each srcs as src, i (i)}
    <img class="fig" class:on={i === at} {src} alt="" draggable="false" />
  {/each}
  <button type="button" class="nav prev" aria-label={prev} onclick={() => onstep(-1)}>‹</button>
  <button type="button" class="nav next" aria-label={next} onclick={() => onstep(1)}>›</button>
</div>

<style>
  .gallery {
    position: relative;
    width: 100%;
    height: min(42vh, 340px);
    touch-action: pan-y;
    user-select: none;
    /* quầng màu sau lưng tranh */
    background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 38%, transparent), transparent 85%)
      center 38% / 90% 80% no-repeat;
    transition: background var(--dur-3);
  }
  .compact {
    height: min(34vh, 250px);
  }
  /* ấn: đĩa lớn như vầng hào quang sau đầu */
  .seal {
    position: absolute;
    top: 2%;
    left: 50%;
    translate: -50% 0;
    opacity: 0.9;
    animation: seal 0.45s var(--spring) both;
  }
  .fig {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom center;
    filter: drop-shadow(0 6px 10px rgb(var(--shade) / 0.35));
    opacity: 0;
    transform: translateX(14px) scale(0.97);
    transition:
      opacity var(--dur-3) var(--ease),
      transform var(--dur-3) var(--ease);
    pointer-events: none;
  }
  .fig.on {
    opacity: 1;
    transform: none;
  }
  .nav {
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    width: 40px;
    height: 56px;
    font-size: 34px;
    line-height: 1;
    color: inherit;
    background: none;
    border: 0;
    opacity: 0.75;
    cursor: pointer;
  }
  .prev {
    left: -4px;
  }
  .next {
    right: -4px;
  }
  @keyframes seal {
    from {
      opacity: 0;
      transform: scale(1.4) rotate(-10deg);
    }
  }
</style>
