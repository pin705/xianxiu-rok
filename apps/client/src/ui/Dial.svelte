<script lang="ts">
  // Đĩa quay như đĩa lịch đồng: kim son trên đầu, mặt giấy chia `n` ô bằng nét mực, ô 0 nền son nhạt, vành đồng mảnh, trục
  // giữa là tranh đồ vật (ui:<hub>, cắt tròn); mỗi ô vẽ bằng snippet `slot(k)`. rot: góc quay (độ) — đổi là đĩa quay tới.
  // Cỡ theo bề ngang chỗ đặt (tối đa 280px): ô đặt theo container query.
  import type { Snippet } from 'svelte'
  import { artOf } from '@rok/art'

  let { n, rot, hub, slot }: { n: number; rot: number; hub?: string; slot: Snippet<[number]> } = $props()
  const src = $derived(hub ? artOf(`ui:${hub}`)?.src : undefined)
  const step = $derived(360 / n)
</script>

<div class="dial" style:--step="{step}deg" aria-hidden="true">
  <span class="pointer"></span>
  <div class="face" style:rotate="{rot}deg">
    <span class="top"></span>
    <span class="hub"
      >{#if src}<img {src} alt="" draggable="false" />{/if}</span
    >
    {#each { length: n } as _, k (k)}
      <span class="slot" style:--a="{k * step}deg">{@render slot(k)}</span>
    {/each}
  </div>
</div>

<style>
  .dial {
    position: relative;
    width: min(100%, 280px);
    aspect-ratio: 1;
    margin: var(--sp-2) auto;
    container-type: inline-size;
  }
  .pointer {
    position: absolute;
    top: -6px;
    left: 50%;
    z-index: 2;
    width: 0;
    height: 0;
    translate: -50% 0;
    border: 11px solid transparent;
    border-top: 20px solid var(--cinnabar);
    filter: drop-shadow(0 2px 2px rgb(var(--shade) / 0.35));
  }
  .face {
    position: absolute;
    inset: 0;
    border: 4px solid var(--ochre);
    border-radius: 50%;
    background:
      repeating-conic-gradient(
        from calc(var(--step) / -2),
        color-mix(in srgb, var(--ink) 55%, transparent) 0deg 0.6deg,
        transparent 0.6deg var(--step)
      ),
      radial-gradient(circle, var(--silk) 55%, color-mix(in srgb, var(--paper2) 35%, var(--silk)));
    box-shadow:
      0 4px 14px rgb(var(--shade) / 0.3),
      inset 0 0 0 3px var(--silk),
      inset 0 0 0 4px var(--ink3);
    transition: rotate 3.2s cubic-bezier(0.15, 0.85, 0.2, 1);
  }
  /* ô 0 (ô lớn nhất): nền son nhạt */
  .top {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from calc(var(--step) / -2),
      color-mix(in srgb, var(--cinnabar) 28%, transparent) 0deg var(--step),
      transparent var(--step)
    );
  }
  .hub {
    position: absolute;
    inset: 36%;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: var(--silk);
    border: 1.5px solid var(--ink3);
    border-radius: 50%;
  }
  /* tranh đĩa có khung vuông: phóng to, cắt tròn chỉ còn mặt đĩa */
  .hub img {
    width: 150%;
    height: 150%;
    object-fit: contain;
  }
  .slot {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    justify-items: center;
    transform: translate(-50%, -50%) rotate(var(--a)) translateY(-37cqw);
  }
  /* số dưới hình trong ô */
  .slot :global(b) {
    font-size: 11px;
    line-height: 1;
    color: var(--ink);
  }
  @media (prefers-reduced-motion: reduce) {
    .face {
      transition: none;
    }
  }
</style>
