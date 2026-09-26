<script lang="ts">
  // Bậc thăng "trước → sau": tranh bây giờ, mũi tên mực, tranh sau khi nâng (nhãn tô son; glow: quầng vàng quanh tranh sau).
  // Nâng cấp công trình (đứng chân chung: align="end"), nâng bậc đệ tử (huy hiệu giữa dòng: align="center").
  import type { Snippet } from 'svelte'
  import InkArrow from './InkArrow.svelte'

  let {
    from,
    to,
    fromLabel,
    toLabel,
    align = 'end',
    glow = false,
    small = false,
  }: {
    from: Snippet
    to: Snippet
    fromLabel: string
    toLabel: string
    align?: 'end' | 'center'
    glow?: boolean
    small?: boolean
  } = $props()
</script>

<div class="ascend {align}" class:small>
  <figure>
    {@render from()}
    <figcaption>{fromLabel}</figcaption>
  </figure>
  <span class="arrow"><InkArrow width={align === 'end' ? 52 : 44} /></span>
  <figure class="nx" class:glow>
    {@render to()}
    <figcaption>{toLabel}</figcaption>
  </figure>
</div>

<style>
  .ascend {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
  }
  .center {
    align-items: center;
  }
  figure {
    display: grid;
    justify-items: center;
    gap: 4px;
  }
  figcaption {
    font-size: var(--fs-2);
    font-weight: 800;
    color: var(--text-soft);
  }
  .small figcaption {
    font-size: var(--fs-1);
    color: var(--text);
  }
  .nx figcaption {
    color: var(--cinnabar);
  }
  .glow > :global(img) {
    filter: drop-shadow(0 0 10px rgb(var(--gold-glow) / 0.9)) drop-shadow(0 0 3px rgb(255 255 255 / 0.9));
  }
  .arrow {
    display: grid;
  }
  .end .arrow {
    margin-bottom: 44px;
  }
</style>
