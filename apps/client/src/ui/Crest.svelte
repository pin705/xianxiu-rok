<script lang="ts">
  // Băng rôn đạo thống / môn phái: cờ lụa dọc treo huy hiệu bên trái (snippet `medal`; tắt art: cờ màu `accent` cắt đuôi),
  // tranh tổ sư mờ bên phải (fig), tên nghiêng gạch son, dòng lối chơi màu accent, ba tấm biển số (fx: [nhãn, số]);
  // chưa có huy hiệu: chỉ lời dẫn (phần con). foot: hàng dưới canh phải (giờ chờ, nút). Nền dải núi + quầng accent.
  import type { Snippet } from 'svelte'
  import { artOf } from '@rok/art'

  let {
    accent = 'var(--cinnabar)',
    name,
    way,
    fig,
    fx = [],
    fxLabel,
    medal,
    foot,
    children,
  }: {
    accent?: string
    name?: string
    way?: string
    fig?: string
    fx?: [string, string][]
    fxLabel?: string
    medal?: Snippet
    foot?: Snippet
    children?: Snippet
  } = $props()
  const flag = artOf('ui:ribbon-v')?.src // cờ lụa dọc treo huy hiệu
</script>

<div class="crest" style:--accent={accent}>
  {#if medal}
    {#if fig}<img class="fig" src={fig} alt="" draggable="false" />{/if}
    <span class="flag" class:art={!!flag} style:--flag={flag ? `url(${flag})` : undefined}>{@render medal()}</span>
    <div class="info">
      {#if name}<b class="name">{name}</b>{/if}
      {#if way}<small class="way">{way}</small>{/if}
      {#if fx.length}<ul class="fx" aria-label={fxLabel}>
          {#each fx as [k, v] (k)}<li><b>{v}</b><small>{k}</small></li>{/each}
        </ul>{/if}
    </div>
  {/if}
  {#if children}<div class="lore">{@render children()}</div>{/if}
  {#if foot}<div class="foot">{@render foot()}</div>{/if}
</div>

<style>
  .crest {
    position: relative;
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 6px 12px;
    min-height: 150px;
    padding: 0 12px 12px 10px;
    overflow: hidden;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      radial-gradient(closest-side, color-mix(in srgb, var(--accent) 22%, transparent), transparent) right 10px top
        20% / 60% 90% no-repeat,
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .fig {
    position: absolute;
    right: -6px;
    bottom: 0;
    height: 170px;
    opacity: 0.35; /* tổ sư mờ như tranh nền, không che chữ và nút */
    filter: drop-shadow(0 4px 6px rgb(var(--shade) / 0.25));
    pointer-events: none;
  }
  .flag {
    grid-row: 1 / 3;
    display: grid;
    justify-items: center;
    align-content: start;
    width: 76px;
    height: 128px;
    padding-top: 18px;
    background: var(--accent);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%);
  }
  .flag.art {
    background: var(--flag) center top / 100% 100% no-repeat;
    clip-path: none;
  }
  .info {
    position: relative;
    display: grid;
    justify-items: start;
    gap: 4px;
    padding-top: 12px;
  }
  .name {
    padding: 0 12px 6px 0;
    font-size: var(--fs-6);
    font-style: italic;
    font-weight: 900;
    line-height: 1.1;
    background: var(--stroke-red) no-repeat left bottom / 100% 6px;
  }
  .way {
    font-size: var(--fs-1);
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--accent);
  }
  /* ba tấm biển số: số to, nhãn nhỏ */
  .fx {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
    width: 100%;
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
  }
  .fx li {
    display: grid;
    justify-items: center;
    padding: 3px 3px 4px;
    text-align: center;
    background: color-mix(in srgb, var(--silk) 80%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
    border-radius: 4px;
  }
  .fx b {
    font-size: var(--fs-4);
    line-height: 1.1;
    color: var(--good);
  }
  .fx small {
    font-size: var(--fs-1);
    line-height: 1.15;
  }
  .lore {
    position: relative;
    grid-column: 1 / -1;
    margin: 12px 0 0;
  }
  .foot {
    position: relative;
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
