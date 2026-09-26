<script lang="ts">
  // Tranh đồ vật vẽ tay ui:<art> (vật chứa tài nguyên, đồng hồ cát, bí kíp…) cỡ `size` px — tắt art (?art=0) thì về Icon.
  // tilt: nghiêng (độ) như đặt tay; lift: bóng đổ dưới tranh (tranh đứng riêng trên giấy, không trong khung).
  import { Icon, artOf, type IconName } from '@rok/art'

  let {
    art,
    icon,
    size = 40,
    tilt = 0,
    lift = false,
  }: { art: string; icon: IconName; size?: number; tilt?: number; lift?: boolean } = $props()
  const src = $derived(artOf(`ui:${art}`)?.src)
</script>

{#if src}<img
    class="art"
    class:lift
    {src}
    alt=""
    draggable="false"
    style:--size="{size}px"
    style:rotate="{tilt}deg"
  />{:else}<Icon name={icon} size={Math.round(size * 0.7)} />{/if}

<style>
  .art {
    flex: none;
    width: var(--size);
    height: var(--size);
    object-fit: contain;
  }
  .lift {
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
</style>
