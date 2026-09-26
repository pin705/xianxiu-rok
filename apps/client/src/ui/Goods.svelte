<script lang="ts">
  // Món đồ đứng trên kệ Shelf để chạm chọn: hình, nhãn mệnh giá góc trên (tag), số lượng góc dưới (n).
  // look: cell (ô túi đồ — viền vàng khi chọn, số chữ viền trắng) · jar (lọ đan — quầng vàng + nhấc lên khi chọn, số viên
  // mực); faded: hết hàng (hình xám mờ); dot: chấm lục góc trên (đang hiệu lực).
  import { Icon, type IconName } from '@rok/art'

  let {
    icon,
    size = 48,
    look = 'cell',
    tag,
    n,
    on = false,
    faded = false,
    dot = false,
    label,
    onclick,
  }: {
    icon: IconName
    size?: number
    look?: 'cell' | 'jar'
    tag?: string
    n?: string
    on?: boolean
    faded?: boolean
    dot?: boolean
    label: string
    onclick?: () => void
  } = $props()
</script>

<button class="goods {look}" class:on class:faded type="button" aria-label={label} aria-pressed={on} {onclick}>
  <Icon name={icon} {size} />
  {#if tag}<span class="tag">{tag}</span>{/if}
  {#if n !== undefined}<b class="n t-num">{n}</b>{/if}
  {#if dot}<i class="dot"></i>{/if}
</button>

<style>
  .goods {
    position: relative;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    cursor: pointer;
    transition:
      transform var(--dur-1) var(--ease),
      border-color var(--dur-1);
  }
  .goods:active {
    transform: scale(0.95);
  }
  /* ô túi đồ: không hộp nền, chỉ bóng đổ xuống ván */
  .cell {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    background: radial-gradient(ellipse at 50% 92%, rgb(0 0 0 / 0.22), transparent 55%);
  }
  .cell.on {
    border-color: var(--gold);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent),
      inset 0 0 0 2px color-mix(in srgb, white 40%, transparent);
  }
  .jar {
    width: 56px;
    height: 58px;
    border-radius: 8px;
  }
  .jar :global(.icon) {
    filter: drop-shadow(0 3px 3px rgb(var(--shade) / 0.25));
  }
  .jar.on {
    background: radial-gradient(closest-side, rgb(var(--gold-glow) / 0.8), transparent);
    transform: translateY(-3px);
  }
  .faded :global(.icon) {
    filter: grayscale(1);
    opacity: 0.5;
  }
  .tag {
    position: absolute;
    top: 2px;
    left: 3px;
    padding: 0 4px;
    border-radius: 6px;
    background: var(--ink);
    color: var(--paper);
    font-size: 12px;
    font-weight: 700;
    line-height: 16px;
  }
  .n {
    position: absolute;
    right: 4px;
    bottom: 1px;
    color: var(--text);
    font-size: 13px;
    text-shadow:
      0 0 3px white,
      0 0 3px white;
  }
  .jar .n {
    right: -4px;
    bottom: 0;
    padding: 0 6px 1px;
    font-size: var(--fs-1);
    color: var(--pill-fg);
    text-shadow: none;
    background: var(--pill);
    border-radius: 999px;
  }
  .dot {
    position: absolute;
    top: 0;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--malachite);
    box-shadow: 0 0 0 2px var(--paper);
  }
</style>
