<script lang="ts">
  // Bệ gỗ thấp bày một đồ vật lớn (thiệp chiêu hiền, lệnh bài…): dải lụa hai đuôi én trên đầu (hot: son — việc làm ngay;
  // không: mực), quầng sáng sau đồ vật (halo: kênh rgb, mặc định vàng), đồ vật nghiêng `tilt` độ (hot: nhún nhẹ), tên gạch
  // nét cọ son; phần con (số đang có, nút) xếp dưới, canh giữa.
  import type { Snippet } from 'svelte'

  let {
    band,
    hot = false,
    name,
    halo = 'var(--gold-glow)',
    tilt = 0,
    pic,
    children,
  }: {
    band?: string
    hot?: boolean
    name: string
    halo?: string
    tilt?: number
    pic: Snippet
    children?: Snippet
  } = $props()
</script>

<div class="plinth" class:hot style:--halo={halo} style:--tilt="{tilt}deg">
  {#if band}<small class="ribbon">{band}</small>{/if}
  <span class="stand">{@render pic()}</span>
  <b class="nm">{name}</b>
  {@render children?.()}
</div>

<style>
  .plinth {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 30px 4px 0;
    text-align: center;
  }
  .ribbon {
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% 0;
    max-width: 100%;
    padding: 2px 12px 3px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--silk);
    background: var(--pill);
    clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 50%, 100% 100%, 0 100%, 6px 50%);
  }
  .hot .ribbon {
    background: var(--cinnabar);
  }
  .stand {
    position: relative;
    display: grid;
    place-items: center;
    width: 118px;
    height: 104px;
    /* quầng sau đồ vật + án gỗ thấp: mặt án, hai chân, bóng dưới đất */
    background:
      radial-gradient(closest-side, rgb(var(--halo) / 0.6), transparent) center 38% / 100% 86% no-repeat,
      linear-gradient(var(--ochre), var(--lacquer2)) center bottom 12px / 80% 7px no-repeat,
      linear-gradient(90deg, var(--lacquer2), var(--lacquer)) 22% bottom 3px / 5px 10px no-repeat,
      linear-gradient(90deg, var(--lacquer2), var(--lacquer)) 78% bottom 3px / 5px 10px no-repeat,
      radial-gradient(closest-side, rgb(var(--shade) / 0.2), transparent) center bottom / 90% 8px no-repeat;
  }
  .stand::before {
    /* viền son chạy dọc mép án (án sơn mài) */
    content: '';
    position: absolute;
    bottom: 17px;
    left: 10%;
    width: 80%;
    height: 2px;
    background: var(--cinnabar);
    opacity: 0.8;
  }
  .stand > :global(*) {
    margin-bottom: 16px;
    rotate: var(--tilt);
    filter: drop-shadow(0 4px 5px rgb(var(--shade) / 0.25));
  }
  .hot .stand > :global(*) {
    animation: bob 2.6s var(--ease) infinite;
  }
  .nm {
    padding: 0 10px 6px;
    font-size: var(--fs-4);
    line-height: 1.15;
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  @keyframes bob {
    50% {
      transform: translateY(-4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hot .stand > :global(*) {
      animation: none;
    }
  }
</style>
