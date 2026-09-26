<script lang="ts">
  // Lô hàng bày trên kệ (chợ ký gửi): hình, số lượng góc dưới phải (chữ viền trắng), thẻ chênh giá góc trên trái —
  // lục khi rẻ hơn giá gốc (off < 0), son khi đắt hơn; off = 0 thì không thẻ.
  import { Icon, type IconName } from '@rok/art'

  let {
    icon,
    size = 44,
    n,
    off = 0,
    offTitle,
  }: { icon: IconName; size?: number; n?: string; off?: number; offTitle?: string } = $props()
</script>

<span class="lot">
  <Icon name={icon} {size} />
  {#if n}<b class="n t-num">{n}</b>{/if}
  {#if off}<small class="off t-num" class:up={off > 0} title={offTitle}>{off > 0 ? '+' : ''}{off}%</small>{/if}
</span>

<style>
  .lot {
    position: relative;
    display: grid;
    justify-items: center;
    width: 80px;
    padding: 2px 0;
  }
  .n {
    position: absolute;
    right: 6px;
    bottom: 0;
    font-size: 13px;
    text-shadow:
      0 0 3px white,
      0 0 3px white;
  }
  .off {
    position: absolute;
    top: 2px;
    left: 0;
    padding: 0 5px;
    font-size: 11px;
    color: var(--silk);
    background: var(--malachite);
    border-radius: 4px;
  }
  .up {
    background: var(--cinnabar);
  }
</style>
