<script lang="ts">
  // Viên tài nguyên trên thanh HUD (một <li> trong hàng tài nguyên): vật chứa vẽ tay đè mép trái (thiếu tranh: icon),
  // số + vạch sức chứa, nhãn son "Đầy", cả viên bấm được; gain: "+N" vàng bay lên khi vừa nhận.
  // ink: viên mực chữ trắng; tắt art: viên giấy viền mực.
  import { Icon, type IconName } from '@rok/art'
  import Meter from '../Meter.svelte'

  let {
    id,
    icon,
    img,
    name,
    value,
    ratio,
    full = false,
    fullLabel,
    title,
    label,
    gain,
    ink = false,
    onclick,
  }: {
    id: string // data-res (test, e2e tìm theo đây)
    icon: IconName
    img?: string // tranh vật chứa
    name: string
    value: string
    ratio: number // lượng / sức chứa
    full?: boolean
    fullLabel: string
    title: string
    label: string
    gain?: { text: string; key: number } | null
    ink?: boolean
    onclick: () => void
  } = $props()
</script>

<li class="res" class:full class:ink data-res={id} {title}>
  {#if img}<img class="vessel" src={img} alt="" draggable="false" />{:else}<Icon name={icon} size={22} />{/if}
  <span class="stack col">
    <b class="t-num">{value}<span class="sr"> {name}</span></b>
    <Meter value={ratio} tone={full ? 'bad' : 'spirit'} size="xs" />
  </span>
  {#if full}<em>{fullLabel}</em>{/if}
  <button class="rb" aria-label={label} {onclick}></button>
  {#if gain}{#key gain.key}<span class="float">{gain.text}</span>{/key}{/if}
</li>

<style>
  .res {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 5px 12px 7px 7px;
    border: 0 solid transparent;
    border-image: var(--sk-capsule);
  }
  .col {
    flex: 1;
    min-width: 0;
    --gap: 4px;
  }
  b {
    font-size: var(--fs-4);
    line-height: 1;
  }
  .full b {
    color: var(--cinnabar);
  }
  .rb {
    position: absolute;
    inset: 0;
    cursor: pointer;
    background: none;
    border: 0;
  }
  em {
    position: absolute;
    top: -9px;
    right: 2px;
    padding: 1px 7px 2px;
    font: 800 var(--fs-1) / 1.4 var(--font);
    font-style: normal;
    color: var(--silk);
    border: 0 solid transparent;
    border-image: var(--sk-tag-red);
  }
  .float {
    position: absolute;
    left: 30px;
    font-size: var(--fs-4);
    font-weight: 900;
    color: var(--gold-d);
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
    pointer-events: none;
    animation: float 1.4s var(--ease) forwards;
  }
  @keyframes float {
    from {
      opacity: 1;
      transform: translateY(16px) scale(1.25);
    }
    to {
      opacity: 0;
      transform: translateY(-16px);
    }
  }
  /* viên mực đen chữ trắng, vật chứa vẽ tay đè mép trái */
  .ink {
    padding: 4px 10px 5px 34px;
    color: var(--pill-fg);
    background: var(--pill);
    border: 1px solid rgb(255 255 255 / 0.18);
    border-image-source: none; /* không viết border-image: none — bộ nén CSS biến thành `border-image:;` */
    border-radius: 999px;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
  }
  .ink b {
    font-size: var(--fs-3);
  }
  .ink.full b {
    color: var(--pill-hot);
  }
  .vessel {
    position: absolute;
    top: 50%;
    left: -12px;
    width: 44px;
    height: 44px;
    translate: 0 -50%;
    filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.3));
    pointer-events: none;
  }
</style>
