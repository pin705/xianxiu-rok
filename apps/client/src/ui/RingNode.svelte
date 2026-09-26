<script lang="ts">
  // Trận nhãn: đĩa tròn có vòng tiến độ (phần đã góp của tầng đang lên), ấn son ghi tầng dưới đĩa, sao góc trên (được ưu
  // tiên), nhãn tên + dòng phụ. on: đang chọn (phóng to, viền son); full: đầy tầng (vòng vàng). Xếp trong Lattice.
  import { Icon, type IconName } from '@rok/art'
  import { sfx } from '../lib'

  let {
    icon,
    level,
    value,
    label,
    sub,
    on = false,
    full = false,
    star,
    onclick,
  }: {
    icon: IconName
    level: number
    value: number // 0..1
    label: string
    sub?: string
    on?: boolean
    full?: boolean
    star?: string // có: sao góc trên, chữ là lời chú (title)
    onclick: () => void
  } = $props()
</script>

<button
  type="button"
  class="node"
  class:on
  class:full
  aria-pressed={on}
  style:--p={value}
  onclick={() => {
    sfx('tap')
    onclick()
  }}
>
  <span class="eye">
    <Icon name={icon} size={28} />
    <i class="lv t-num" aria-hidden="true">{level}</i>
    {#if star}<span class="star" title={star}><Icon name="star" size={16} /></span>{/if}
  </span>
  <b class="nm">{label}</b>
  {#if sub}<small class="t-tiny t-soft">{sub}</small>{/if}
</button>

<style>
  .node {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 2px;
    min-width: 0;
    padding-top: 8px;
    color: var(--text);
  }
  .eye {
    --ring: var(--malachite);
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    color: var(--text);
    border-radius: 50%;
    background:
      radial-gradient(
        circle closest-side,
        color-mix(in srgb, var(--malachite) 7%, var(--paper)) 0 83%,
        transparent 85%
      ),
      conic-gradient(var(--ring) calc(var(--p) * 1turn), rgb(var(--shade) / 0.14) 0);
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.18);
    transition: transform var(--dur-2) var(--spring);
  }
  .full .eye {
    --ring: var(--gilt);
  }
  .on .eye {
    transform: scale(1.1);
    box-shadow:
      0 0 0 3px var(--paper),
      0 0 0 5px var(--cinnabar),
      0 4px 10px rgb(0 0 0 / 0.2);
  }
  .node:active .eye {
    transform: scale(0.94);
  }
  /* ấn son nhỏ: tầng hiện tại */
  .lv {
    position: absolute;
    bottom: -6px;
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    font-size: 11px;
    font-style: normal;
    font-weight: 900;
    color: var(--pill-fg);
    background: var(--pin);
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  }
  .star {
    position: absolute;
    top: -6px;
    right: -8px;
    filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.3));
  }
  .nm {
    display: -webkit-box;
    max-width: 100%;
    margin-top: 6px;
    padding: 1px 5px 2px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    background: var(--paper);
    border-radius: 4px;
  }
  .on .nm {
    color: var(--pill-fg);
    background: var(--cinnabar);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
  }
</style>
