<script lang="ts">
  // Bong bóng sản lượng chờ thu trên công trình: viên giấy đuôi nhọn góc dưới trái, biểu tượng + số, nhún nhẹ; over: kho đã
  // đầy (viền son, chạm không thu được). x, y: điểm đuôi (px trong lớp chạm).
  import { Icon, type IconName } from '@rok/art'

  let {
    x,
    y,
    icon,
    n,
    over = false,
    label,
    onclick,
  }: {
    x: number
    y: number
    icon: IconName
    n: string
    over?: boolean
    label: string
    onclick: (e: MouseEvent) => void
  } = $props()
</script>

<button class="yield" class:over style:left="{x}px" style:top="{y}px" aria-label={label} {onclick}
  ><Icon name={icon} size={22} /><b class="t-num">{n}</b></button
>

<style>
  .yield {
    position: absolute;
    display: grid;
    justify-items: center;
    min-width: 44px;
    padding: 3px 7px 2px;
    color: var(--text);
    font-size: var(--fs-1);
    background: var(--paper);
    border: 2px solid var(--gold-d);
    border-radius: 14px 14px 14px 3px;
    box-shadow: 0 2px 6px color-mix(in srgb, var(--ink) 30%, transparent);
    translate: -20% -100%;
    animation: bob 1.8s ease-in-out infinite;
    cursor: pointer;
  }
  .over {
    border-color: var(--bad);
  }
  @keyframes bob {
    50% {
      transform: translateY(-5px);
    }
  }
</style>
