<script lang="ts">
  // Băng rôn đầu màn/đầu mục: tên to bên trái, dải lụa (giờ, cấp, trạng thái) dưới tên, tranh đồ vật nghiêng bên phải,
  // nền dải núi mờ; phần con (lời dẫn, số liệu, nút) trải hết bề ngang bên dưới.
  // art: khoá ui:<art> (tắt art thì ẩn tranh); pic: tranh tuỳ ý (Painting, Portrait, Medal…) thay cho art.
  import type { Snippet } from 'svelte'
  import { artOf } from '@rok/art'
  import Band from './Band.svelte'

  let {
    title,
    art,
    pic,
    band,
    bandTone = 'red',
    glow = false,
    children,
  }: {
    title: string
    art?: string
    pic?: Snippet
    band?: string
    bandTone?: 'red' | 'ink' | 'jade'
    glow?: boolean
    children?: Snippet
  } = $props()
  const src = $derived(art ? artOf(`ui:${art}`)?.src : undefined)
</script>

<header class="banner" class:glow class:has-pic={!!(src || pic)}>
  <div class="head">
    <b class="name">{title}</b>
    {#if band}<Band tone={bandTone}>{band}</Band>{/if}
  </div>
  {#if pic}<div class="pic">{@render pic()}</div>{:else if src}<img class="pic" {src} alt="" draggable="false" />{/if}
  {#if children}<div class="body">{@render children()}</div>{/if}
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
    grid-template-columns: minmax(0, 1fr) 80px;
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
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .pic {
    display: grid;
    place-items: center;
    width: 80px;
    margin: -4px -4px 0 0;
    rotate: 4deg;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.25));
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
</style>
