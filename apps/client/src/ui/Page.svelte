<script lang="ts">
  // Trang toàn màn hình dưới HUD (Môn hạ, Bảo khố): cuộn tranh dài bồi lụa, tiêu đề có icon vẽ tay.
  import type { Snippet } from 'svelte'
  import { paintedUrl, tabIcon, type TabIcon } from '@rok/art'

  let { title, icon, aside, children }: { title: string; icon: TabIcon; aside?: Snippet; children: Snippet } = $props()
</script>

<div class="page paper">
  <header class="row between">
    <h2 class="row">
      <img
        src={paintedUrl(`tab:${icon}`, () => tabIcon(icon), 38)}
        width="38"
        height="38"
        alt=""
        draggable="false"
      />{title}
    </h2>
    {#if aside}<div class="row t-small t-soft">{@render aside()}</div>{/if}
  </header>
  {@render children()}
</div>

<style>
  .page {
    position: fixed;
    inset: 0;
    z-index: var(--z-page);
    max-width: var(--col);
    margin: 0 auto;
    padding: calc(var(--hud-top, calc(132px + var(--safe-t))) + 12px) 26px
      calc(max(104px, var(--nav-h, 0px) + 20px) + var(--safe-b));
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 0 solid transparent;
    border-image: var(--sk-scroll);
    box-shadow: 0 0 40px rgb(var(--shade) / 0.35);
  }
  /* desktop: vùng bên phải cột trái, dưới thanh trên; nội dung rộng tối đa ~1040px, lưới mặc định 3 cột */
  @media (min-width: 1024px) and (min-height: 600px) {
    .page {
      inset: var(--top) 0 0 var(--rail);
      max-width: none;
      margin: 0;
      padding: 32px max(40px, (100% - 1040px) / 2) 48px;
      --cols: 3;
    }
  }
  /* tiêu đề trang: chữ to, nét cọ son quét dưới */
  h2 {
    --gap: var(--sp-2);
    padding: 0 24px 9px 0;
    font-size: var(--fs-7);
    font-weight: 800;
    background: var(--stroke-red) no-repeat left bottom / 100% 11px;
  }
  /* nền giấy sương + dãy núi mờ ở đáy (theme.ts --img-mountains) */
  .page {
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 240% auto no-repeat fixed,
      var(--paper-tex) 0 0 / 128px,
      var(--paper);
  }
</style>
