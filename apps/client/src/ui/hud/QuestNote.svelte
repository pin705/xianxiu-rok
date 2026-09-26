<script lang="ts">
  // Tờ nhiệm vụ trên HUD: nhãn + tiến độ, tên việc, phần thưởng (children); bấm là đi làm / nhận thưởng.
  // state: todo (mũi tên) · done (viền vàng sáng, nút nhận — ink: ấn son đóng góc tờ) · held (dấu tích son vừa đóng).
  // ink: tờ cáo thị ghim đinh son, nghiêng nhẹ. empty: hết nhiệm vụ — chỉ còn dòng chữ trên tờ giấy.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'
  import Seal from '../Seal.svelte'
  import Tag from '../Tag.svelte'

  let {
    ink = false,
    empty,
    title = '',
    prog,
    text = '',
    state = 'todo',
    tick = '',
    claim = '',
    onclick,
    children,
  }: {
    ink?: boolean
    empty?: string
    title?: string
    prog?: string // "3/5"
    text?: string
    state?: 'todo' | 'done' | 'held'
    tick?: string // tranh dấu tích
    claim?: string // chữ nút nhận thưởng
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  } = $props()
</script>

{#if empty}
  <p class="quest t-small t-lore" class:ink>{empty}</p>
{:else}
  <button class="quest" class:ink class:done={state !== 'todo'} class:enter={state !== 'held'} {onclick}>
    <span class="stack grow" style:--gap="3px">
      <small class="row"
        >{title}{#if prog}<b class="t-num">{prog}</b>{/if}</small
      >
      <b class="qt">{text}</b>
      {@render children?.()}
    </span>
    {#if state === 'held'}
      <span class="stamp"><img src={tick} width="48" height="48" alt="" draggable="false" /></span>
    {:else if state === 'done'}
      <span class="claim"
        >{#if ink}<Seal size={60}>{claim}</Seal>{:else}<Tag tone="gold" icon="star">{claim}</Tag>{/if}</span
      >
    {:else}
      <span class="go"><Icon name="arrow" size={16} /></span>
    {/if}
  </button>
{/if}

<style>
  .quest {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    max-width: 80%;
    padding: 11px 12px 13px 15px;
    text-align: left;
    color: var(--text);
    pointer-events: auto;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.3));
  }
  small {
    --gap: 6px;
    font-size: var(--fs-1);
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cinnabar);
  }
  .qt {
    font-size: var(--fs-3);
    font-weight: 800;
    line-height: 1.25;
  }
  .done {
    border-image: var(--sk-card-glow);
    filter: drop-shadow(0 0 12px rgb(var(--gold-glow) / 0.75));
  }
  .claim {
    pointer-events: none;
    animation: glow 1.4s var(--ease) infinite;
  }
  .stamp {
    display: grid;
    padding-inline: var(--sp-2);
    animation: stamp 0.4s cubic-bezier(0.5, 0, 0.75, 0) both;
  }
  @keyframes stamp {
    0% {
      opacity: 0;
      scale: 2.6;
      rotate: -16deg;
    }
    60% {
      opacity: 1;
      scale: 0.92;
      rotate: 0deg;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  .enter {
    animation: enter var(--dur-3) var(--spring);
  }
  @keyframes enter {
    from {
      opacity: 0;
      translate: -14px 0;
    }
  }
  .go {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    color: var(--cinnabar);
    background: var(--img-disc-paper) center / 100% 100% no-repeat;
  }
  @keyframes glow {
    0% {
      filter: drop-shadow(0 0 0 rgb(var(--gold-glow) / 0.9));
    }
    60%,
    100% {
      filter: drop-shadow(0 0 9px rgb(var(--gold-glow) / 0));
    }
  }
  /* điện thoại rất hẹp (320px): nút nhận thưởng xuống dòng, phần thưởng dàn ngang — thẻ không cao lên che biển tên Chủ điện */
  @media (max-width: 360px) {
    .quest {
      flex-wrap: wrap;
      row-gap: 6px;
    }
    .quest > .stack {
      flex-basis: 100%;
    }
  }

  /* đồ vật: tờ cáo thị ghim đinh son; chữ đủ chỗ, nhận thưởng là ấn son đóng ở góc tờ */
  .ink {
    position: relative;
    width: min(236px, 62vw);
    max-width: none;
    padding-right: 16px;
    rotate: -1.2deg;
    filter: drop-shadow(0 6px 10px rgb(var(--shade) / 0.3));
  }
  .ink::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    width: 13px;
    height: 13px;
    translate: -50% 0;
    background: var(--pin);
    border-radius: 50%;
    box-shadow: 0 2px 3px rgb(0 0 0 / 0.35);
  }
  .ink .qt {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ink .claim {
    position: absolute;
    right: -12px;
    bottom: -14px;
    animation: throb 1.4s var(--ease) infinite;
  }
  @keyframes throb {
    50% {
      scale: 1.08;
    }
  }
  .ink .go {
    position: absolute;
    right: 8px;
    bottom: 8px;
    opacity: 0.55;
  }

  /* desktop: trọn bề ngang cột trái (tờ cáo thị giữ bề rộng riêng) */
  @media (min-width: 1024px) and (min-height: 600px) {
    .quest {
      max-width: none;
      cursor: pointer;
    }
    .quest:hover:not(.done) {
      filter: drop-shadow(0 4px 12px rgb(var(--gold-glow) / 0.35));
    }
  }
</style>
