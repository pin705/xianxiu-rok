<script lang="ts">
  // Lối vào sự kiện ở cột HUD (trung tâm sự kiện, Luận Kiếm Đài, nhiệm vụ ngày): ink — ô tranh + nhãn viên mực;
  // tắt art — đĩa lụa một biểu tượng. n: số quà/lượt chờ (chấm đỏ, toả sáng). tag: dải lụa son nhỏ dưới ô (cuối tuần).
  import { type IconName } from '@rok/art'
  import Badge from '../Badge.svelte'
  import IconButton from '../IconButton.svelte'
  import Tag from '../Tag.svelte'

  let {
    ink = false,
    img,
    icon,
    label,
    n = 0,
    tag,
    onclick,
  }: {
    ink?: boolean
    img?: string
    icon: IconName
    label: string
    n?: number
    tag?: string
    onclick: () => void
  } = $props()
  const aria = $derived(`${label}${n ? ` (${n})` : ''}`)
</script>

{#if ink}
  <button class="tile" class:ready={n > 0} class:pulse={n > 0} {onclick} aria-label={aria}
    ><img src={img} alt="" draggable="false" /><span class="tn">{label}</span><Badge {n} /></button
  >
  {#if tag}<span class="wk">{tag}</span>{/if}
{:else}
  <span class="daily" class:ready={n > 0} class:pulse={n > 0}>
    <IconButton {icon} label={aria} size={46} {onclick}><Badge {n} /></IconButton>
    {#if tag}<Tag tone="gold" size="sm" icon="star">{tag}</Tag>{/if}
  </span>
{/if}

<style>
  .daily {
    display: grid;
    justify-items: end;
    gap: 4px;
    white-space: nowrap;
    pointer-events: auto;
  }
  .daily.ready :global(.ib) {
    border-radius: 50%;
  }
  .tile {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 1px;
    width: 64px;
    pointer-events: auto;
  }
  .tile img {
    width: 60px;
    height: 60px;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.28));
    transition: transform var(--dur-1) var(--ease);
  }
  .tile:active img {
    transform: scale(0.94);
  }
  .tn {
    max-width: 78px;
    padding: 0 7px 1px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.25;
    text-align: center;
    color: var(--pill-fg);
    background: var(--pill);
    border-radius: 999px;
  }
  .tile :global(.badge) {
    position: absolute;
    top: -4px;
    right: -2px;
  }
  /* cuối tuần: dải lụa son nhỏ dưới hàng tranh (không tràn sang cảnh) */
  .wk {
    align-self: start;
    width: 64px;
    padding: 2px 4px 8px;
    font-size: 10.5px;
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    color: var(--pill-fg);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%);
    filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.25));
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .daily {
      align-self: flex-start;
      justify-items: start;
    }
  }
</style>
