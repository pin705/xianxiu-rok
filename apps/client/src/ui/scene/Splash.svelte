<script lang="ts">
  // Khung màn tiêu đề kiêm màn tải: phủ cố định lên cảnh (điện thoại: trong cột game; desktop: trọn màn hình), vạch tiến độ
  // mảnh + phần trăm ở chân khi `progress` (0–1) có giá trị. Các lớp Cover xếp chồng bên trong.
  import type { Snippet } from 'svelte'

  let { progress, children }: { progress?: number; children: Snippet } = $props()
</script>

<div class="splash">
  {#if progress !== undefined}
    {@const pct = Math.round(progress * 100)}
    <div class="load" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <span class="bar"><i style:width="{progress * 100}%"></i></span>
      <span class="pct">{pct}%</span>
    </div>
  {/if}
  {@render children()}
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: var(--z-hud);
    max-width: var(--col);
    margin: 0 auto;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .splash {
      max-width: none;
    }
  }
  .load {
    position: absolute;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 28px);
    translate: -50% 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    pointer-events: none;
  }
  .bar {
    width: min(46vw, 200px);
    height: 3px;
    background: color-mix(in srgb, var(--ink) 15%, transparent);
    border-radius: 2px;
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--ink);
    transition: width 0.3s;
  }
  .pct {
    font-size: var(--fs-1, 12px);
    font-variant-numeric: tabular-nums;
    color: var(--text);
    opacity: 0.7;
    min-width: 3ch;
  }
</style>
