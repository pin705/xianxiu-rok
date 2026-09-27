<script lang="ts">
  // Nút tạp dịch góc dưới phải cảnh: ink — chú thợ cầm búa (img) + thẻ giờ viên mực; tắt art — đĩa lụa, búa, vòng tiến
  // độ linh khí (ring 0…1). idle: toả sáng, chú thợ nhún, thẻ son "Rảnh". dot: chấm son (tạp dịch thứ hai đang rảnh).
  // away: ẩn trên điện thoại (tab khác); desktop luôn hiện, tránh ngăn kéo đang mở (--dockw).
  import { Icon } from '@rok/art'
  import Badge from '../Badge.svelte'

  let {
    ink = false,
    img,
    away = false,
    idle = false,
    ring = 0,
    time,
    label,
    dot = false,
    onclick,
  }: {
    ink?: boolean
    img?: string
    away?: boolean
    idle?: boolean
    ring?: number
    time: string
    label: string
    dot?: boolean
    onclick: () => void
  } = $props()
</script>

<button class="builder" class:ink class:away class:idle class:pulse={idle} {onclick} aria-label={label}>
  {#if ink}
    <img class="worker" src={img} alt="" draggable="false" />
  {:else}
    <svg class="ring" viewBox="0 0 60 60" aria-hidden="true">
      <circle class="rbg" cx="30" cy="30" r="26" />
      <circle class="rfg" cx="30" cy="30" r="26" stroke-dasharray="{ring * 163.4} 163.4" />
    </svg>
    <Icon name="hammer" size={24} />
  {/if}
  <span class="btime">{time}</span>
  {#if dot}<Badge dot />{/if}
</button>

<style>
  .builder {
    position: absolute;
    right: var(--sp-3);
    bottom: calc(112px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 66px;
    height: 66px;
    color: var(--text);
    pointer-events: auto;
    background: var(--img-disc-silk) center / 100% 100% no-repeat;
  }
  .builder:active {
    transform: scale(0.94);
  }
  .away {
    display: none;
  }
  .ring {
    position: absolute;
    inset: 5px;
    rotate: -90deg;
  }
  .rbg,
  .rfg {
    fill: none;
    stroke-width: 3.5;
  }
  .rbg {
    stroke: color-mix(in srgb, var(--ivory) 15%, transparent);
  }
  .rfg {
    stroke: var(--spirit);
    stroke-linecap: round;
    transition: stroke-dasharray 0.25s linear;
  }
  .btime {
    position: absolute;
    bottom: -9px;
    left: 50%;
    padding: 2px 10px 3px;
    font: 800 var(--fs-1) / 1.4 var(--font);
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--text);
    white-space: nowrap;
    border: 0 solid transparent;
    border-image: var(--sk-tag-silk);
    translate: -50% 0;
  }
  .idle .btime {
    color: var(--silk);
    border-image: var(--sk-tag-red);
  }
  /* chú thợ cầm búa, thẻ giờ viên mực */
  .ink {
    width: 72px;
    height: 84px;
    background: none;
  }
  .worker {
    width: 70px;
    height: 70px;
    margin-top: -10px;
    filter: drop-shadow(0 3px 4px rgb(0 0 0 / 0.3));
  }
  .ink.idle .worker {
    animation: bob 1.8s var(--ease) infinite;
  }
  .ink .btime {
    bottom: -2px;
    color: var(--pill-fg);
    background: var(--pill);
    border-image-source: none; /* không viết border-image: none — bộ nén CSS biến thành `border-image:;` */
    border-radius: 999px;
  }
  .ink.idle .btime {
    background: var(--cinnabar);
  }
  @keyframes bob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -3px;
    }
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .builder,
    .builder.away {
      right: calc(var(--sp-5) + var(--dockw, 0px));
      bottom: var(--sp-5);
      display: grid;
      transition: right var(--dur-2) var(--ease);
    }
  }
</style>
