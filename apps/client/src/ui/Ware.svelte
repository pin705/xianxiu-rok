<script lang="ts">
  // Món bày trên kệ (bí kíp, pháp bảo, lọ đan) để chọn: hình, đồng tiền số (cấp / số đang có; full: tiền vàng), tên gạch
  // nét cọ son khi đang chọn. busy: đồng hồ son góc trái (đang luyện); faded: hình mờ (chưa có); side: vật nhỏ bên trái
  // (chân dung người đeo); children: dòng dưới tên (tầng cần khi khoá). Đặt làm con trực tiếp của Shelf.
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'
  import { sfx } from '../lib'

  let {
    icon,
    size = 40,
    label,
    n,
    full = false,
    on = false,
    disabled = false,
    faded = false,
    busy = false,
    side,
    children,
    onclick,
  }: {
    icon: IconName
    size?: number
    label: string
    n?: number
    full?: boolean
    on?: boolean
    disabled?: boolean
    faded?: boolean
    busy?: boolean
    side?: Snippet
    children?: Snippet
    onclick: () => void
  } = $props()
</script>

<button
  type="button"
  class="ware"
  class:on
  class:faded
  {disabled}
  aria-label={label}
  aria-pressed={on}
  style:--half="{size / 2 + 11}px"
  onclick={() => {
    sfx('tap')
    onclick()
  }}
>
  <span class="pic"><Icon name={icon} {size} /></span>
  {#if n !== undefined}<i class="coin rank-no" class:r1={full}>{n}</i>{/if}
  {#if side}<span class="side">{@render side()}</span>{/if}
  {#if busy}<i class="busy"><Icon name="clock" size={12} /></i>{/if}
  <span class="nm">{label}</span>
  {@render children?.()}
</button>

<style>
  .ware {
    position: relative;
    display: grid;
    justify-items: center;
    width: 100%;
    padding: 4px 2px 12px; /* đáy 12px: đứng trên ván kệ của Shelf */
    color: var(--text-soft);
  }
  .ware:disabled {
    opacity: 0.55;
  }
  .pic {
    display: grid;
  }
  .faded .pic {
    opacity: 0.5;
  }
  .on {
    color: var(--text);
  }
  .nm {
    max-width: 100%;
    padding: 0 2px 4px;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
  }
  .on .nm {
    background: var(--stroke-red) no-repeat center bottom / 100% 5px;
  }
  .coin {
    position: absolute;
    top: 0;
    right: calc(50% - var(--half));
    font-style: normal;
  }
  .side {
    position: absolute;
    top: 26px;
    left: calc(50% - var(--half));
    display: grid;
  }
  .busy {
    position: absolute;
    top: 0;
    left: calc(50% - var(--half));
    color: var(--cinnabar);
  }
</style>
