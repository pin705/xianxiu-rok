<script lang="ts">
  // Hình vẽ tay (asset của @rok/art) trong giao diện HTML: nướng một lần ra ảnh đúng độ nét, vừa khung w × h, neo đáy giữa.
  import { paintedUrl, type Asset } from '@rok/art'

  let { key, make, w, h }: { key: string; make: () => Asset<unknown>; w: number; h: number } = $props()
  const src = $derived(paintedUrl(key, make, Math.max(w, h)))
</script>

<img {src} alt="" style:width="{w}px" style:height="{h}px" draggable="false" />

<style>
  img {
    display: block;
    flex: none;
    object-fit: contain;
    object-position: bottom center;
  }
</style>
