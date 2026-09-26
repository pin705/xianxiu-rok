<script lang="ts">
  // Lệnh bài giấy treo dây son lên thanh gỗ (đặt trong hàng `.rack`): hình, tên, dòng hiệu lực (lục), lời ngắn (cắt 3 dòng);
  // on: viền son + dấu son `stamp`; off: mờ (đã chọn cái khác). Cả tấm bấm được.
  import { Icon, type IconName } from '@rok/art'

  let {
    icon,
    title,
    fx,
    text,
    on = false,
    off = false,
    disabled = false,
    stamp,
    onclick,
  }: {
    icon: IconName
    title: string
    fx?: string
    text?: string
    on?: boolean
    off?: boolean
    disabled?: boolean
    stamp?: string
    onclick: () => void
  } = $props()
</script>

<button type="button" class="token" class:on class:off {disabled} aria-pressed={on} aria-label={title} {onclick}>
  <Icon name={icon} size={34} />
  <b class="tn">{title}</b>
  {#if fx}<small class="t-tiny t-good">{fx}</small>{/if}
  {#if text}<small class="t-tiny t-soft clamp" style:--lines="3">{text}</small>{/if}
  {#if on && stamp}<span class="mark">{stamp}</span>{/if}
</button>

<style>
  .token {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 3px;
    width: 100%;
    height: 100%;
    padding: 16px 6px 10px;
    text-align: center;
    color: var(--text);
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px 3px 10px 10px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.14);
  }
  /* dây treo lên thanh gỗ */
  .token::before {
    content: '';
    position: absolute;
    top: -9px;
    left: calc(50% - 1px);
    width: 2px;
    height: 16px;
    background: var(--cinnabar);
  }
  .token:not(:disabled):active {
    transform: translateY(1px);
  }
  .on {
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 30%, transparent),
      0 3px 6px rgb(var(--shade) / 0.14);
  }
  .off {
    opacity: 0.6;
  }
  .tn {
    font-size: var(--fs-2);
    line-height: 1.15;
  }
  .mark {
    position: absolute;
    top: 6px;
    right: 2px;
  }
</style>
