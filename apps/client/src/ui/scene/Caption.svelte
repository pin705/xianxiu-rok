<script lang="ts">
  // Chữ nhãn đè lên cảnh (tên mục tiêu, tên tông môn, hiệu minh giữa lãnh thổ): chữ đậm viền giấy dày để đọc được trên mọi
  // nền. size md · lg; tone ink · red (tông môn mình); color: màu tuỳ dữ liệu (màu lãnh thổ); spaced: giãn chữ (hiệu minh);
  // wrap: xuống tối đa hai dòng trong 100px (nhãn sát mép); dim: mờ (chưa mở); shift: dịch ngang px (khỏi tràn mép).
  import type { Snippet } from 'svelte'

  let {
    size = 'md',
    tone = 'ink',
    color,
    spaced = false,
    wrap = false,
    dim = false,
    shift = 0,
    children,
  }: {
    size?: 'md' | 'lg'
    tone?: 'ink' | 'red'
    color?: string
    spaced?: boolean
    wrap?: boolean
    dim?: boolean
    shift?: number
    children: Snippet
  } = $props()
</script>

<span
  class="caption {size} {tone}"
  class:spaced
  class:multi={wrap}
  class:faded={dim}
  style:--c={color}
  style:translate={shift ? `${shift}px 0` : undefined}>{@render children()}</span
>

<style>
  .caption {
    font-size: var(--fs-2);
    font-weight: 800;
    white-space: nowrap;
    color: var(--c, var(--text));
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
  }
  .lg {
    font-size: var(--fs-3);
  }
  .red {
    color: var(--c, var(--cinnabar));
  }
  .spaced {
    letter-spacing: 0.04em;
  }
  .multi {
    width: 100px;
    white-space: normal;
    text-align: center;
    line-height: 1.15;
  }
  .faded {
    opacity: 0.6;
  }
</style>
