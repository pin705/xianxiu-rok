<script module lang="ts">
  export type { Look } from './figures'
</script>

<script lang="ts">
  // Chân dung vẽ tay (figures.ts): nướng một lần mỗi dáng + cỡ, hiện như ảnh tròn.
  import { portrait, type Look } from './figures'
  import { paintedUrl } from './img'

  let { look, size = 48, dim = false }: { look: Look; size?: number; dim?: boolean } = $props()
</script>

<img
  class="portrait"
  class:dim
  src={paintedUrl(`face:${JSON.stringify(look)}`, () => portrait(look), size)}
  width={size}
  height={size}
  alt=""
  aria-hidden="true"
  draggable="false"
/>

<style>
  .portrait {
    display: block;
    flex: none;
    border-radius: 50%;
  }
  .dim {
    filter: grayscale(1) brightness(0.45) contrast(0.85);
  }
</style>
