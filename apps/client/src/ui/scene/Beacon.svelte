<script lang="ts">
  // Mục tiêu trên bản đồ vùng: huy hiệu (phần con) với giọt son ghi cấp/tiến độ góc trên, dấu khoá / đã chinh phục góc
  // dưới, quầng vàng loang khi là mục tiêu nên đánh (hot), tên dưới huy hiệu (Caption) và dòng phụ (giờ hồi). Đặt trong Pin.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'
  import Caption from './Caption.svelte'

  let {
    label,
    badge,
    mark,
    hot = false,
    dim = false,
    wrap = false,
    shift = 0,
    sub,
    children,
  }: {
    label: string
    badge?: string | number
    mark?: 'lock' | 'check'
    hot?: boolean
    dim?: boolean // nhãn mờ (chưa mở)
    wrap?: boolean
    shift?: number
    sub?: string
    children: Snippet
  } = $props()
</script>

<span class="beacon" class:hot>
  <span class="disc">
    {@render children()}
    {#if badge !== undefined}<b class="lv">{badge}</b>{/if}
    {#if mark === 'lock'}<span class="mark"><Icon name="lock" size={11} /></span>{:else if mark === 'check'}<span
        class="mark ok"><Icon name="check" size={12} /></span
      >{/if}
  </span>
  <Caption {wrap} {dim} {shift}>{label}</Caption>
  {#if sub}<span class="t-num"><Caption {shift}>{sub}</Caption></span>{/if}
</span>

<style>
  .beacon {
    display: grid;
    justify-items: center;
    gap: 2px;
  }
  .disc {
    position: relative;
    display: grid;
  }
  .hot .disc::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--gold);
    animation: halo 1.6s var(--ease) infinite;
  }
  @keyframes halo {
    from {
      opacity: 0.9;
      transform: scale(0.8);
    }
    to {
      opacity: 0;
      transform: scale(1.4);
    }
  }
  /* cấp: giọt son viền vàng; dấu khoá / đã chinh phục: đĩa lụa, đĩa vàng vẽ tay */
  .lv {
    position: absolute;
    top: -7px;
    right: -12px;
    min-width: 20px;
    padding: 0 5px 1px;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 17px;
    text-align: center;
    color: var(--silk);
    border: 0 solid transparent;
    border-image: var(--sk-badge);
  }
  .mark {
    position: absolute;
    right: -5px;
    bottom: -3px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    color: var(--text);
    background: var(--img-disc-silk) center / 100% 100% no-repeat;
  }
  .ok {
    background-image: var(--img-disc-gold);
  }
</style>
