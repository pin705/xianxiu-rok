<script lang="ts">
  // Ô tạp dịch thứ hai: đĩa lụa nhỏ gắn góc trên-trái nút tạp dịch (không đè dải chat); locked: chưa thuê — mờ, có khoá.
  // hint: mảnh giấy nhắc cách thuê, hiện một lúc trên đĩa. away: ẩn trên điện thoại (tab khác).
  import { Icon } from '@rok/art'

  let {
    locked = false,
    away = false,
    text,
    label,
    hint,
    onclick,
  }: { locked?: boolean; away?: boolean; text: string; label: string; hint?: string; onclick: () => void } = $props()
</script>

<button class="slot" class:away class:locked {onclick} aria-label={label}>
  <Icon name={locked ? 'lock' : 'hammer'} size={14} />
  <span>{text}</span>
</button>
{#if hint}<small class="hint" class:away role="status">{hint}</small>{/if}

<style>
  .slot {
    position: absolute;
    right: calc(var(--sp-3) + 50px);
    bottom: calc(166px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--text);
    pointer-events: auto;
    background: var(--img-disc-silk) center / 100% 100% no-repeat;
  }
  .locked {
    opacity: 0.72;
  }
  .slot:active {
    transform: scale(0.94);
  }
  span {
    font-size: var(--fs-1);
    font-weight: 700;
    line-height: 1;
  }
  .hint {
    position: absolute;
    right: var(--sp-3);
    bottom: calc(216px + var(--safe-b));
    max-width: 240px;
    padding: 6px 10px;
    font-size: var(--fs-1);
    color: var(--ink);
    background: var(--paper);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
  }
  .away {
    display: none;
  }
</style>
