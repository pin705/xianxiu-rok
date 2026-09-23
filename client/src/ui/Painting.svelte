<script module lang="ts">
  import { bake, type Asset } from '@rok/art'
  // Ảnh vẽ tay nướng một lần mỗi key (dùng lại giữa các lần mở bảng)
  const cache = new Map<string, { src: string; w: number; h: number }>()
</script>

<script lang="ts">
  // Hình vẽ tay (asset của @rok/art) trong giao diện HTML: nướng ra ảnh đúng độ nét màn hình.
  // Vừa khung w × h (giữ tỉ lệ), neo đáy giữa
  let { key, make, w, h }: { key: string; make: () => Asset<unknown>; w: number; h: number } = $props()

  const img = $derived.by(() => {
    if (typeof document === 'undefined') return { src: '', w, h } // ngoài trình duyệt (test render): không có canvas để nướng
    let v = cache.get(key)
    if (!v) {
      const a = make()
      const scale = Math.min(w / a.w, h / a.h) * Math.min(devicePixelRatio || 1, 2)
      const b = bake(a, scale)
      v = { src: (b.canvas as HTMLCanvasElement).toDataURL(), w: a.w, h: a.h }
      cache.set(key, v)
    }
    return v
  })
</script>

<img src={img.src} alt="" style:width="{Math.min(w, (h * img.w) / img.h)}px" draggable="false" />

<style>
  img {
    display: block;
    flex: none;
  }
</style>
