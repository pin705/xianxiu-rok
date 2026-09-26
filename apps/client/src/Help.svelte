<script lang="ts">
  // Nút "?" theo ngữ cảnh (file 8 A18): mở đúng mục Cẩm nang (L.guide.items[k]) ngay tại chỗ, không phải vào Cài đặt tìm
  import { Art, HelpMark, Sheet } from './ui'
  import { L } from './lib'

  let { k }: { k: number } = $props()
  let open = $state(false)
  const item = $derived(L.guide.items[k])
</script>

<HelpMark label="{L.guide.title}: {item[0]}" onclick={() => (open = true)} />
<Sheet {open} onclose={() => (open = false)} center title={item[0]} sub={L.guide.title}>
  <!-- mở ra như lật một trang bí kíp -->
  {#snippet art()}<Art art="fx-scroll" icon="scroll" size={56} />{/snippet}
  <p class="t-small">{item[1]}</p>
</Sheet>
