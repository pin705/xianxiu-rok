<script lang="ts">
  // Ô tranh: lối vào bằng một đồ vật vẽ tay (ui:* — tranh đóng khung, đỉnh đồng, trống trận…) và nhãn dưới tranh.
  // look="paper": nhãn chữ mực trên nét cọ son (trong bảng giấy); look="ink": nhãn viên mực chữ trắng (nổi trên cảnh).
  // Không có art (?art=0) thì về Icon. n: số việc chờ (giọt son góc tranh); dot: chấm son; sub: dòng phụ dưới nhãn.
  import { Icon, artOf, type IconName } from '@rok/art'
  import { sfx } from '../lib'
  import Badge from './Badge.svelte'

  let {
    art,
    icon,
    label,
    sub,
    n = 0,
    dot = false,
    size = 72,
    look = 'paper',
    selected = false,
    dim = false,
    onclick,
  }: {
    art: string // khoá ui:<art>
    icon: IconName
    label: string
    sub?: string
    n?: number
    dot?: boolean
    size?: number
    look?: 'paper' | 'ink'
    selected?: boolean
    dim?: boolean // ngăn chưa mở của công tắc tranh: mờ, bớt màu
    onclick: (e: MouseEvent) => void
  } = $props()
  const src = $derived(artOf(`ui:${art}`)?.src)
</script>

<button
  type="button"
  class="tile {look}"
  class:selected
  class:faded={dim}
  aria-pressed={selected || undefined}
  style:--size="{size}px"
  onclick={e => {
    sfx('tap')
    onclick(e)
  }}
>
  <span class="pic"
    >{#if src}<img {src} alt="" draggable="false" />{:else}<Icon
        name={icon}
        size={Math.round(size * 0.45)}
      />{/if}</span
  >
  <b class="tl">{label}</b>
  {#if sub}<small class="t-tiny t-soft">{sub}</small>{/if}
  <Badge {n} {dot} />
</button>

<style>
  .tile {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 2px;
    min-width: 0;
    color: var(--text);
  }
  .pic {
    display: grid;
    place-items: center;
    width: var(--size);
    height: var(--size);
    transition: transform var(--dur-1) var(--ease);
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.22));
  }
  /* đang chọn (công tắc bằng tranh: Thư / Chiến báo): tranh to hơn, nhãn tô son */
  .selected .pic {
    transform: scale(1.08) rotate(-2deg);
  }
  .faded {
    opacity: 0.55;
    filter: saturate(0.4);
  }
  .paper.selected .tl {
    color: var(--cinnabar);
  }
  .tile:active .pic {
    transform: scale(0.94);
  }
  .tile :global(.badge) {
    top: -3px;
    right: calc(50% - var(--size) / 2 - 4px);
  }
  .tl {
    max-width: 100%;
    font-size: var(--fs-2);
    line-height: 1.2;
    text-align: center;
  }
  .paper .tl {
    padding: 0 6px 6px;
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  .ink .tl {
    margin-top: -4px;
    padding: 0 8px 1px;
    overflow: hidden;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: #f5f5f1;
    background: rgb(31 27 23 / 0.8);
    border-radius: 999px;
  }
</style>
