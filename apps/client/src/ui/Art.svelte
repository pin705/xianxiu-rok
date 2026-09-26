<script lang="ts">
  // Tranh đồ vật vẽ tay ui:<art> (vật chứa tài nguyên, đồng hồ cát, bí kíp…) cỡ `size` px — tắt art (?art=0) thì về Icon.
  // tilt: nghiêng (độ) như đặt tay; lift: bóng đổ dưới tranh (tranh đứng riêng trên giấy, không trong khung);
  // glow: quầng vàng quanh tranh (có quà chờ nhận).
  import { Icon, artOf, type IconName } from '@rok/art'

  let {
    art,
    icon,
    size = 40,
    tilt = 0,
    lift = false,
    glow = false,
  }: { art: string; icon: IconName; size?: number; tilt?: number; lift?: boolean; glow?: boolean } = $props()
  const src = $derived(artOf(`ui:${art}`)?.src)
</script>

{#if src}<img
    class="art"
    class:lift
    class:glow
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
  .glow {
    filter: drop-shadow(0 0 8px rgb(var(--gold-glow) / 0.9)) drop-shadow(0 3px 5px rgb(var(--shade) / 0.22));
  }
</style>
