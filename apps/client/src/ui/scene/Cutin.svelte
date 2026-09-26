<script lang="ts">
  // Dải xuất chiêu quét ngang cả màn cảnh: nét mực sơn mài (foe: mực son, nghiêng ngược) + chân dung (pic; ring: khung vàng
  // vẽ tay, url css) trượt vào, tên người + tên chiêu viết lớn gạch vàng, dòng phụ (sub). d: thời lượng (giây).
  import type { Snippet } from 'svelte'

  let {
    foe = false,
    d,
    ring,
    pic,
    who,
    skill,
    sub,
  }: { foe?: boolean; d: number; ring?: string; pic: Snippet; who: string; skill: string; sub?: string } = $props()
</script>

<div class="cutin" class:foe style:--d="{d}s" aria-live="polite">
  <span class="band"></span>
  <span class="who" class:ring={!!ring} style:--ring={ring}>{@render pic()}</span>
  <span class="stack name" style:--gap="0"
    ><small class="t-strong">{who}</small><b class="skill">{skill}</b>{#if sub}<small class="t-strong sub">{sub}</small
      >{/if}</span
  >
</div>

<style>
  .cutin {
    position: absolute;
    z-index: 1;
    top: 64%;
    left: 0;
    width: 100%;
    height: 104px;
    translate: 0 -50%;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding-inline: max(var(--sp-4), calc(50% - var(--col) / 2 + var(--sp-4)));
    pointer-events: none;
    animation: cut-out var(--d) linear forwards;
  }
  .foe {
    top: 30%;
    flex-direction: row-reverse;
    text-align: right;
  }
  /* một nét mực quét ngang cả màn (địch: mực son), hai đầu bút khô tước sợi */
  .band {
    position: absolute;
    inset: 8px -12px;
    z-index: -1;
    border: 0 solid transparent;
    border-image: var(--sk-toast);
    filter: drop-shadow(0 6px 10px rgb(var(--shade) / 0.4));
    rotate: -3deg;
    animation: band-in var(--d) var(--ease) both;
  }
  .foe .band {
    border-image: var(--sk-toast-bad);
    rotate: 3deg;
    animation-name: band-in-r;
  }
  .who {
    position: relative;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.45));
    animation: slide-in var(--d) var(--spring) both;
  }
  /* chân dung trong khung vàng vẽ tay */
  .ring::after {
    content: '';
    position: absolute;
    inset: -8%;
    background: var(--ring) center / 100% 100% no-repeat;
    pointer-events: none;
  }
  .foe .who {
    animation-name: slide-in-r;
  }
  .name {
    color: var(--silk);
    text-shadow: var(--text-shadow-inv);
    animation: slide-in-r var(--d) var(--spring) both;
  }
  .foe .name {
    animation-name: slide-in;
  }
  /* dòng phụ dưới tên chiêu: xuống dòng trong bề ngang màn, không tràn mép */
  .sub {
    max-width: min(60vw, 360px);
    font-size: var(--fs-1);
  }
  .skill {
    padding-bottom: 6px;
    font-size: min(var(--fs-7), 7.4vw);
    white-space: nowrap;
    font-style: italic;
    font-weight: 900;
    line-height: 1.1;
    color: var(--gold-l);
    background: var(--stroke-gold) left bottom / 100% 12px no-repeat;
  }
  @keyframes band-in {
    0% {
      clip-path: inset(0 100% 0 0);
    }
    16%,
    82% {
      clip-path: inset(0 0 0 0);
    }
    100% {
      clip-path: inset(0 0 0 100%);
    }
  }
  @keyframes band-in-r {
    0% {
      clip-path: inset(0 0 0 100%);
    }
    16%,
    82% {
      clip-path: inset(0 0 0 0);
    }
    100% {
      clip-path: inset(0 100% 0 0);
    }
  }
  @keyframes slide-in {
    0%,
    8% {
      opacity: 0;
      translate: -70px 0;
    }
    30%,
    100% {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes slide-in-r {
    0%,
    12% {
      opacity: 0;
      translate: 70px 0;
    }
    34%,
    100% {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes cut-out {
    0%,
    84% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
