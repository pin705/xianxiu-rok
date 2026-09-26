<script lang="ts">
  // Nút mũi tên thu/mở một thẻ gập (thẻ mùa trên bản đồ): mũi tên xuống khi gọn, xoay lên khi mở.
  import { Icon } from '@rok/art'

  let { open, label, onclick }: { open: boolean; label: string; onclick: () => void } = $props()
</script>

<button class="expander" class:open aria-label={label} aria-expanded={open} {onclick}
  ><Icon name="arrow" size={14} /></button
>

<style>
  .expander {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--text-soft);
    background: none;
    border: 0;
    rotate: 90deg;
    transition: rotate var(--dur-2) var(--ease);
    cursor: pointer;
  }
  .open {
    rotate: -90deg;
  }
</style>
