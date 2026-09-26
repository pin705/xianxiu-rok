<script lang="ts">
  // Sân đứng: hàng nhân vật vẽ tay trên nền núi mờ, chạm một người để chọn — người đang chọn đứng lớn trên bệ đá viền son,
  // tên gạch nét cọ. Mỗi mục: tranh (src), tên, dòng phụ, thẻ vàng tuỳ chọn (tag). Chọn hệ đệ tử, chọn phái…
  import { sfx } from '../lib'
  import Tag from './Tag.svelte'

  type Figure = { id: string; src: string; name: string; sub?: string; tag?: string }
  let { items, value, label, onpick }: { items: Figure[]; value: string; label: string; onpick: (id: string) => void } =
    $props()
</script>

<div class="podium" role="group" aria-label={label} style:--n={items.length}>
  {#each items as it (it.id)}
    <button
      type="button"
      class="fig"
      class:on={value === it.id}
      aria-label={it.name}
      aria-pressed={value === it.id}
      onclick={() => {
        sfx('tap')
        onpick(it.id)
      }}
    >
      <span class="pic"><img src={it.src} alt="" draggable="false" /></span>
      <b class="nm">{it.name}</b>
      {#if it.tag}<Tag size="sm" tone="gold">{it.tag}</Tag>{/if}
      {#if it.sub}<small class="t-tiny">{it.sub}</small>{/if}
    </button>
  {/each}
</div>

<style>
  .podium {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    align-items: end;
    padding: 12px 4px 10px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom 58px / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .fig {
    display: grid;
    justify-items: center;
    align-content: end;
    gap: 2px;
    min-width: 0;
    color: var(--text-soft);
    text-align: center;
  }
  .pic {
    position: relative;
    display: grid;
    place-items: end center;
    height: 150px;
  }
  .pic img {
    position: relative;
    z-index: 1;
    height: 104px;
    max-width: 100%;
    object-fit: contain;
    object-position: bottom;
    filter: saturate(0.55) opacity(0.82) drop-shadow(0 3px 3px rgb(0 0 0 / 0.18));
    transition:
      height var(--dur-2) var(--spring),
      filter var(--dur-2) var(--ease);
  }
  /* bóng chân; người đang chọn: bệ đá xám viền son */
  .pic::before {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 18%;
    right: 18%;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgb(0 0 0 / 0.2), transparent 70%);
  }
  .on .pic img {
    height: 146px;
    filter: drop-shadow(0 0 8px rgb(var(--gold-glow) / 0.85)) drop-shadow(0 4px 4px rgb(0 0 0 / 0.2));
  }
  .on .pic::before {
    left: 2%;
    right: 2%;
    bottom: -9px;
    height: 24px;
    background: var(--stone);
    box-shadow:
      inset 0 -3px 0 rgb(0 0 0 / 0.12),
      0 0 0 1.5px var(--cinnabar),
      0 5px 7px rgb(0 0 0 / 0.22);
  }
  .fig:active .pic img {
    transform: scale(0.96);
  }
  .nm {
    margin-top: 8px;
    padding: 0 4px 4px;
    font-size: var(--fs-2);
    line-height: 1.15;
  }
  .on .nm {
    font-size: var(--fs-4);
    color: var(--text);
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
</style>
