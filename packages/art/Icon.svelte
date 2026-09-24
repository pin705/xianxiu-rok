<script module lang="ts">
  import type { Colored, Mono } from './actions'
  import type { Gear, Item } from './icons'
  export type Name = Item | Gear | Mono | Colored
</script>

<script lang="ts">
  // Icon trong khung 24×24, vẽ bằng bút lông. Vật phẩm, pháp bảo và icon nhiều màu là ảnh vẽ tay;
  // icon thao tác đơn sắc là mặt nạ nét bút tô bằng currentColor (theo màu chữ nơi đặt).
  import { colorIcon, isColored, monoIcon } from './actions'
  import { paintedUrl } from './img'
  import { isGear, isItem, itemIcon } from './icons'

  let { name, size = 20 }: { name: Name; size?: number } = $props()
  const src = $derived(
    isItem(name) || isGear(name)
      ? paintedUrl(`icon:${name}`, () => itemIcon(name), size)
      : isColored(name)
        ? paintedUrl(`icon:${name}`, () => colorIcon(name), size)
        : paintedUrl(`mask:${name}`, () => monoIcon(name as Mono), size),
  )
</script>

{#if isItem(name) || isGear(name) || isColored(name)}
  <img class="icon" {src} width={size} height={size} alt="" aria-hidden="true" draggable="false" />
{:else}
  <span class="icon mask" style:width="{size}px" style:height="{size}px" style:--m="url({src})" aria-hidden="true"
  ></span>
{/if}

<style>
  .icon {
    display: inline-block;
    flex: none;
    vertical-align: middle;
  }
  .mask {
    background: currentColor;
    -webkit-mask: var(--m) center / contain no-repeat;
    mask: var(--m) center / contain no-repeat;
  }
</style>
