<script lang="ts">
  // Đĩa vàng giúp đỡ đồng minh nổi trên nút tạp dịch (mọi tab), toả sáng; n: số việc giúp được, một chạm giúp hết.
  import { Icon } from '@rok/art'
  import Badge from '../Badge.svelte'

  let { n, label, onclick }: { n: number; label: string; onclick: () => void } = $props()
</script>

<button class="help pulse" {onclick} aria-label={label}><Icon name="people" size={26} /><Badge {n} /></button>

<style>
  .help {
    position: absolute;
    right: calc(var(--sp-3) + 8px);
    bottom: calc(190px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    color: var(--text);
    pointer-events: auto;
    background: var(--img-disc-gold) center / 100% 100% no-repeat;
    border: 0;
    cursor: pointer;
  }
  .help:active {
    transform: scale(0.94);
  }
</style>
