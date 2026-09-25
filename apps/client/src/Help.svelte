<script lang="ts">
  // Nút "?" theo ngữ cảnh (file 8 A18): mở đúng mục Cẩm nang (L.guide.items[k]) ngay tại chỗ, không phải vào Cài đặt tìm
  import { Sheet } from './ui'
  import { L } from './lib'

  let { k }: { k: number } = $props()
  let open = $state(false)
  const item = $derived(L.guide.items[k])
</script>

<button class="help" aria-label="{L.guide.title}: {item[0]}" onclick={() => (open = true)}>?</button>
<Sheet {open} onclose={() => (open = false)} center title={item[0]} sub={L.guide.title}>
  <p class="t-small">{item[1]}</p>
</Sheet>

<style>
  .help {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    font-weight: 800;
    font-size: var(--fs-2);
    color: var(--text-soft);
    border: 1.5px solid currentColor;
    border-radius: 50%;
  }
</style>
