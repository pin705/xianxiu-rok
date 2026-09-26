<script lang="ts">
  // Chân dung trong vòng ngọc vẽ tay (ui:frame-portrait): hồ sơ, cố vấn, đấu trường, danh sách người.
  // Tắt art thì chỉ còn chân dung tròn. on: vòng son (đang chọn).
  import { Portrait, artOf, type Look } from '@rok/art'

  let {
    look,
    size = 54,
    dim = false,
    on = false,
  }: { look: Look; size?: number; dim?: boolean; on?: boolean } = $props()
  const ring = artOf('ui:frame-portrait')?.src
</script>

<span class="face" class:on style:--size="{size}px"
  ><Portrait {look} {size} {dim} />{#if ring}<img src={ring} alt="" draggable="false" />{/if}</span
>

<style>
  .face {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: calc(var(--size) + 8px);
    height: calc(var(--size) + 8px);
    border-radius: 50%;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.25));
  }
  img {
    position: absolute;
    inset: calc(var(--size) * -0.15);
    width: calc(var(--size) * 1.3 + 8px);
    height: calc(var(--size) * 1.3 + 8px);
    pointer-events: none;
  }
  .on {
    box-shadow: 0 0 0 3px var(--cinnabar);
  }
</style>
