<script lang="ts">
  // Nút "?" theo ngữ cảnh (file 8 A18): mở đúng mục Cẩm nang (L.guide.items[k]) ngay tại chỗ, không phải vào Cài đặt tìm
  import { Icon, artOf } from '@rok/art'
  import { Sheet } from './ui'
  import { L } from './lib'

  let { k }: { k: number } = $props()
  let open = $state(false)
  const item = $derived(L.guide.items[k])
  const book = artOf('ui:fx-scroll')?.src // mở ra như lật một trang bí kíp
</script>

<button class="help" aria-label="{L.guide.title}: {item[0]}" onclick={() => (open = true)}>?</button>
<Sheet {open} onclose={() => (open = false)} center title={item[0]} sub={L.guide.title}>
  {#snippet art()}{#if book}<img src={book} alt="" width="56" height="56" draggable="false" />{:else}<Icon
        name="scroll"
        size={36}
      />{/if}{/snippet}
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
    color: var(--cinnabar);
    background: var(--paper);
    border: 1.5px solid currentColor;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(var(--shade) / 0.2);
  }
</style>
