<script lang="ts">
  // Băng rôn đầu màn/đầu mục: tên to bên trái, dải lụa (giờ, cấp, trạng thái) dưới tên, tranh đồ vật nghiêng bên phải,
  // nền dải núi mờ; phần con (lời dẫn, số liệu, nút) trải hết bề ngang bên dưới.
  // art: khoá ui:<art> (tắt art thì ẩn tranh); pic: tranh tuỳ ý (Painting, Portrait, Medal…) thay cho art.
  // icon: dấu nhỏ trước tên; lead: lời dẫn/bonus ngay dưới dải lụa (cạnh tranh); foot: phần dưới vạch mực đứt (chi phí,
  // nút); picSize: bề rộng tranh; picLeft: tranh bên trái (nghiêng ngược); halo: quầng vàng sau tranh (pháp bảo).
  // note: chữ nhỏ mờ sau tên (hiệu minh [ABC]); không title: chỉ tranh + phần con (sảnh trống).
  import type { Snippet } from 'svelte'
  import { Icon, artOf, type IconName } from '@rok/art'
  import Band from './Band.svelte'

  let {
    title,
    note,
    art,
    pic,
    band,
    bandTone = 'red',
    glow = false,
    icon,
    lead,
    foot,
    picSize = 80,
    picLeft = false,
    halo = false,
    children,
  }: {
    title?: string
    note?: string
    art?: string
    pic?: Snippet
    band?: string
    bandTone?: 'red' | 'ink' | 'jade'
    glow?: boolean
    icon?: IconName
    lead?: Snippet
    foot?: Snippet
    picSize?: number
    picLeft?: boolean
    halo?: boolean
    children?: Snippet
  } = $props()
  const src = $derived(art ? artOf(`ui:${art}`)?.src : undefined)
</script>

<header
  class="banner"
  class:glow
  class:has-pic={!!(src || pic)}
  class:pic-left={picLeft}
  class:halo
  style:--pic="{picSize}px"
>
  <div class="head">
    {#if title}<b class="name"
        >{#if icon}<Icon name={icon} size={30} />{/if}{title}{#if note}<small class="note">{note}</small>{/if}</b
      >{/if}
    {#if band}<Band tone={bandTone}>{band}</Band>{/if}
    {#if lead}{@render lead()}{/if}
  </div>
  {#if pic}<div class="pic">{@render pic()}</div>{:else if src}<img class="pic" {src} alt="" draggable="false" />{/if}
  {#if children}<div class="body">{@render children()}</div>{/if}
  {#if foot}<div class="body foot">{@render foot()}</div>{/if}
</header>

<style>
  .banner {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 6px 10px;
    align-items: start;
    padding: 12px 12px 12px 14px;
    color: var(--text);
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .has-pic {
    grid-template-columns: minmax(0, 1fr) var(--pic);
  }
  .has-pic.pic-left {
    grid-template-columns: var(--pic) minmax(0, 1fr);
    align-items: center;
  }
  .glow {
    border-image: var(--sk-card-glow);
  }
  .head {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .note {
    font-size: var(--fs-3);
    color: var(--text-soft);
  }
  .pic {
    display: grid;
    place-items: center;
    width: var(--pic);
    margin: -4px -4px 0 0;
    rotate: 4deg;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.25));
  }
  .pic-left .pic {
    grid-area: 1 / 1;
    margin: 0;
    rotate: -3deg;
  }
  .pic-left .head {
    grid-area: 1 / 2;
  }
  .halo .pic {
    aspect-ratio: 1;
    background: radial-gradient(circle, rgb(var(--gold-glow) / 0.7), transparent 68%);
    rotate: none;
    filter: none;
  }
  img.pic {
    height: auto;
  }
  .body {
    display: grid;
    gap: 6px;
    grid-column: 1 / -1;
    min-width: 0;
  }
  .foot {
    padding-top: 6px;
    border-top: 1px dashed var(--paper3);
  }
</style>
