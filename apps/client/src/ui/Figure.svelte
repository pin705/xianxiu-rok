<script lang="ts">
  // Hình người vẽ tay đứng trên vệt đất (lính theo hệ + bậc, đệ tử đặc trưng): src ảnh, faded: xám mờ (không mang theo).
  let { src, faded = false }: { src: string; faded?: boolean } = $props()
</script>

<span class="figure" class:faded><img {src} alt="" draggable="false" /></span>

<style>
  .figure {
    display: grid;
    flex: none;
    place-items: end center;
    width: 50px;
    height: 54px;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--ochre) 35%, transparent), transparent) center
      bottom / 46px 10px no-repeat;
  }
  img {
    width: 46px;
    height: 50px;
    object-fit: contain;
    filter: drop-shadow(0 2px 2px rgb(var(--shade) / 0.2));
  }
  .faded img {
    filter: grayscale(1);
    opacity: 0.55;
  }
</style>
