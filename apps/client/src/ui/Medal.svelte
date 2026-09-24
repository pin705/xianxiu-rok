<script module lang="ts">
  export type { MedalTone } from '@rok/art'
</script>

<script lang="ts">
  // Huy hiệu tròn vẽ tay: đĩa màu khoáng loang, vòng vàng một nét, hình chạm giữa đĩa (yêu thú, tông môn, bí cảnh,
  // lôi kiếp, hệ đệ tử…). Chấm vàng bên dưới = bậc.
  import { medal, paintedUrl, type Emblem, type MedalTone } from '@rok/art'

  let {
    emblem,
    tone = 'ink',
    size = 40,
    pips = 0,
    dim = false,
  }: { emblem: Emblem; tone?: MedalTone; size?: number; pips?: number; dim?: boolean } = $props()
  const src = $derived(paintedUrl(`medal:${emblem}:${tone}`, () => medal(emblem, tone), size))
</script>

<span class="medal" class:dim style:--s="{size}px" aria-hidden="true">
  <img {src} width={size} height={size} alt="" draggable="false" />
  {#if pips}<span class="pips" class:many={pips > 3}
      >{#each { length: pips } as _}<i></i>{/each}</span
    >{/if}
</span>

<style>
  .medal {
    position: relative;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--s);
    height: var(--s);
    filter: drop-shadow(0 1.5px 2px rgb(20 14 10 / 0.35));
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
  }
  .dim {
    filter: grayscale(1) brightness(0.85);
    opacity: 0.72;
  }
  .pips {
    position: absolute;
    bottom: calc(var(--s) * -0.12);
    display: flex;
    gap: 2px;
    padding: 2px 5px 3px;
    border: 0 solid transparent;
    border-image: var(--sk-tag-dark);
  }
  /* bậc 4–5: chấm nhỏ lại cho vừa huy hiệu 28px */
  .many {
    gap: 1px;
    padding: 2px 3px 3px;
  }
  .many i {
    width: 3px;
    height: 3px;
  }
  .pips i {
    width: 4px;
    height: 4px;
    background: radial-gradient(circle at 40% 35%, var(--silk), var(--gold-l) 50%, var(--gold));
    border-radius: 50%;
  }
</style>
