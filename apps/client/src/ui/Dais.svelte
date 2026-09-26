<script lang="ts">
  // Đài đầu bảng: ba cột trên nền núi mờ khung đôi — trái (chân dung, tên), giữa tranh đồ vật nghiêng với dải son đuôi én
  // ghi bậc vắt ngang chân tranh, phải (biển điểm); foot trải hết bề ngang bên dưới (lượt, tiền).
  import { Icon, artOf, type IconName } from '@rok/art'
  import type { Snippet } from 'svelte'

  let {
    art,
    icon,
    band,
    left,
    right,
    foot,
  }: { art: string; icon: IconName; band?: string; left: Snippet; right: Snippet; foot?: Snippet } = $props()
  const src = $derived(artOf(`ui:${art}`)?.src)
</script>

<header class="dais">
  <div class="side">{@render left()}</div>
  <div class="mid">
    {#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={icon} size={56} />{/if}
    {#if band}<span class="band">{band}</span>{/if}
  </div>
  {@render right()}
  {#if foot}<div class="foot">{@render foot()}</div>{/if}
</header>

<style>
  .dais {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) 96px;
    gap: 2px 6px;
    align-items: center;
    padding: 10px 8px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .side {
    display: grid;
    justify-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
  }
  .side > :global(*) {
    max-width: 100%;
  }
  .mid {
    position: relative;
    display: grid;
    justify-items: center;
  }
  img {
    width: min(100%, 132px);
    rotate: -2deg;
    filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.25));
  }
  /* dải son đuôi én ghi bậc, vắt ngang chân tranh */
  .band {
    margin-top: -14px;
    padding: 1px 16px 2px;
    font-size: var(--fs-2);
    font-weight: 900;
    color: var(--text-inv);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%, 7px 50%);
  }
  .foot {
    grid-column: 1 / -1;
    margin-top: 4px;
  }
</style>
