<script lang="ts">
  // Một mục menu HUD: huy hiệu tranh + tên. on: đang mở — nhô lên, tên son gạch nét cọ (ink: nằm trên ấn son, nhãn
  // dải lụa đỏ); locked: xám, dấu khoá, dòng phụ (mở ở tầng mấy). children: Badge báo việc chờ đè góc huy hiệu.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'

  let {
    img,
    label,
    on = false,
    locked = false,
    sub,
    ink = false,
    id,
    onclick,
    children,
  }: {
    img: string
    label: string
    on?: boolean
    locked?: boolean
    sub?: string // dòng phụ khi khoá
    ink?: boolean
    id: string // data-tab (test, e2e tìm theo đây)
    onclick: (e: MouseEvent) => void
    children?: Snippet
  } = $props()
</script>

<button
  class="tab"
  class:ink
  class:on
  class:locked
  disabled={locked}
  data-tab={id}
  aria-current={on ? 'page' : undefined}
  {onclick}
>
  <span class="medal">
    <img src={img} width="40" height="40" alt="" draggable="false" />
    {#if locked}<span class="lk"><Icon name="lock" size={10} /></span>{/if}
    {@render children?.()}
  </span>
  <span class="tl">{label}</span>
  {#if sub}<small>{sub}</small>{/if}
</button>

<style>
  .tab {
    display: grid;
    justify-items: center;
    gap: 1px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-soft);
  }
  .medal {
    position: relative;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    transition:
      transform var(--dur-2) var(--spring),
      filter var(--dur-2) var(--ease);
  }
  .medal img {
    display: block;
    opacity: 0.85;
    filter: saturate(0.85);
  }
  .on .medal {
    transform: translateY(-7px) scale(1.14);
    filter: drop-shadow(0 0 7px color-mix(in srgb, var(--gilt) 55%, transparent));
  }
  .on .medal img {
    opacity: 1;
    filter: none;
  }
  .on .tl {
    padding: 0 6px 5px;
    font-weight: 800;
    color: var(--cinnabar);
    background: var(--stroke-red) no-repeat center bottom / 100% 5px;
  }
  .locked .medal img {
    opacity: 0.55;
    filter: grayscale(1);
  }
  .lk {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    color: var(--text);
    background: var(--img-disc-silk) center / 100% 100% no-repeat;
  }
  small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .tab {
      display: flex;
      align-items: center;
      gap: var(--sp-3);
      padding: 0 var(--sp-3);
      font-size: var(--fs-4);
      border-radius: 10px;
      transition: background var(--dur-2) var(--ease);
    }
    .tab:not(:disabled):hover {
      background: color-mix(in srgb, var(--azurite-l) 18%, transparent);
    }
    .on .medal {
      transform: scale(1.12);
    }
    small {
      margin-left: auto;
      font-size: var(--fs-1);
    }
  }

  /* đồ vật: huy hiệu tranh, nhãn lụa đỏ; mục đang mở nhô lên trên dấu son */
  .ink .medal {
    width: 62px;
    height: 62px;
  }
  .ink .medal img {
    width: 60px;
    height: 60px;
    opacity: 1;
    filter: drop-shadow(0 3px 4px rgb(0 0 0 / 0.25));
  }
  .ink.on .medal {
    transform: translateY(-10px) scale(1.12);
    filter: none;
  }
  .ink.on .medal::before {
    content: '';
    position: absolute;
    inset: -7px;
    z-index: -1;
    background: var(--ui-seal-img) center / contain no-repeat;
    opacity: 0.92;
  }
  .ink .tl {
    margin-top: -9px;
    padding: 1px 12px 3px;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 800;
    color: var(--pill-fg);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.35);
    background: var(--ui-ribbon-img) center / 100% 100% no-repeat;
  }
  .ink.on .tl {
    padding: 1px 14px 3px;
  }
  .ink.locked .medal img {
    opacity: 0.6;
    filter: grayscale(1);
  }
  .ink.locked .tl {
    filter: grayscale(0.85);
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .ink .medal,
    .ink .medal img {
      width: 46px;
      height: 46px;
    }
    .ink.on .medal {
      transform: scale(1.1);
    }
    .ink .tl,
    .ink.on .tl {
      margin: 0;
      padding: 0;
      font-size: var(--fs-4);
      color: var(--text);
      text-shadow: none;
      background: none;
    }
    .ink.on .tl {
      color: var(--cinnabar);
    }
  }
</style>
