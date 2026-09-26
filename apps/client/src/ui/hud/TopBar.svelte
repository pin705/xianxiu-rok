<script lang="ts">
  // Thanh trên HUD: chân dung, tên + cảnh giới, thế lực, cụm nút (thư, cài đặt), dải tăng ích, hàng viên tài nguyên,
  // rồi các thẻ báo động (children). Điện thoại: hai tầng; desktop: một hàng ngang trên giấy sương viền kép.
  // ink: cụm nổi trên sương mờ dần (không thanh kín); tắt art: dải giấy bồi lụa. solid: đang ở trang (Môn hạ, Tiên minh,
  // Bảo khố) — thanh giấy kín, không để chữ của trang cuộn chui xuống lớp sương trong suốt.
  import type { Snippet } from 'svelte'

  let {
    ink = false,
    solid = false,
    avatar,
    name,
    power,
    tools,
    boosts,
    res,
    children,
  }: {
    ink?: boolean
    solid?: boolean
    avatar: Snippet
    name: Snippet
    power: Snippet
    tools: Snippet
    boosts: Snippet
    res: Snippet
    children?: Snippet
  } = $props()
  // chiều cao thật của thanh (thêm thẻ báo động thì cao lên) → --hud-top: trang (Page) đệm đúng bằng, không bị thanh che
  let h = $state(0)
  $effect(() => {
    if (!h) return
    document.documentElement.style.setProperty('--hud-top', `${h}px`)
    return () => document.documentElement.style.removeProperty('--hud-top')
  })
</script>

<header class="topbar" class:strip={!ink} class:ink class:solid bind:offsetHeight={h}>
  <div class="who">
    <span class="av">{@render avatar()}</span>
    <span class="id">{@render name()}</span>
    <span class="pow">{@render power()}</span>
    <span class="tools">{@render tools()}</span>
    <span class="boosts">{@render boosts()}</span>
  </div>
  <ul class="res">{@render res()}</ul>
  {@render children?.()}
</header>

<style>
  /* Ván trên: giấy bồi lụa, bóng mực nhẹ dưới đáy */
  .topbar {
    display: grid;
    gap: var(--sp-2);
    padding: calc(var(--sp-2) + var(--safe-t)) 20px 18px;
    pointer-events: auto;
    filter: drop-shadow(0 4px 10px rgb(var(--shade) / 0.18));
  }
  /* điện thoại: chân dung, tên cao hai hàng; hàng dưới của cụm nút là dải tăng ích */
  .who {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    grid-template-rows: 34px auto;
    grid-template-areas: 'av id pow tools' 'av id boosts boosts';
    gap: 2px var(--sp-2);
    align-items: center;
  }
  .av {
    grid-area: av;
  }
  .id {
    display: grid;
    grid-area: id;
    min-width: 0;
  }
  .pow {
    grid-area: pow;
  }
  .tools {
    display: flex;
    grid-area: tools;
    gap: var(--sp-2);
  }
  .boosts {
    grid-area: boosts;
    justify-self: end;
    min-height: 22px;
  }
  .res {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
  }

  /* đồ vật: sương trắng mờ dần xuống cảnh; phần sương dưới đáy là trang trí — chạm xuyên xuống */
  .ink {
    padding-bottom: 26px;
    background: linear-gradient(rgb(var(--mist) / 0.94), rgb(var(--mist) / 0.7) 62%, transparent);
    filter: none;
    pointer-events: none;
  }
  .ink > * {
    pointer-events: auto;
  }
  /* chỉ điện thoại: desktop thanh trên vốn đã là giấy kín viền kép */
  @media (max-width: 1023px), (max-height: 599px) {
    .ink.solid {
      padding-bottom: 12px;
      background:
        var(--paper-tex) 0 0 / 128px,
        var(--paper);
      border-bottom: 4px double var(--rim, var(--ink3));
      box-shadow: 0 4px 10px rgb(var(--shade) / 0.12);
      pointer-events: auto;
    }
  }
  .ink .res {
    gap: 10px;
    padding-left: 10px;
  }
  /* điện thoại: tên tông môn trọn hàng, thế lực xuống dưới cụm nút */
  @media (max-width: 1023px), (max-height: 599px) {
    .ink .who {
      grid-template-columns: auto 1fr auto;
      grid-template-rows: 34px auto auto;
      grid-template-areas: 'av id tools' 'av id pow' 'av id boosts';
    }
    .ink .pow {
      justify-self: end;
    }
  }

  /* desktop: một hàng — chân dung, tên, dải tăng ích, tài nguyên giữa, thế lực, thư + cài đặt cuối */
  @media (min-width: 1024px) and (min-height: 600px) {
    .topbar {
      display: flex;
      align-items: center;
      gap: var(--sp-4);
      height: var(--top);
      padding: 0 28px;
    }
    .who {
      display: contents;
    }
    .id {
      flex: 1;
      width: calc(var(--rail) - 120px);
    }
    .boosts {
      order: 1;
    }
    .res {
      flex: 1;
      max-width: 640px;
      margin: 0 auto;
      gap: var(--sp-3);
      order: 2;
    }
    .pow {
      order: 3;
    }
    .tools {
      gap: var(--sp-4);
      order: 4;
    }
    /* cảnh không phủ tới thanh trên: giấy sương viền kép */
    .ink {
      padding-bottom: 0;
      background: var(--paper) var(--paper-tex);
      background-size: 128px;
      border: 0 solid transparent;
      border-image: var(--sk-strip);
    }
  }
</style>
