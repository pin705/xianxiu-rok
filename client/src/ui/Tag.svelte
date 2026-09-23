<script lang="ts">
  // Nhãn nhỏ góc vát: chi phí, phần thưởng, yêu cầu. tone: bad = thiếu/không đạt, good = đạt.
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'

  let { icon, tone = 'plain', size = 'md', children }: { icon?: IconName; tone?: 'plain' | 'good' | 'bad' | 'gold'; size?: 'sm' | 'md'; children: Snippet } = $props()
</script>

<span class="tag {tone} {size}">
  {#if icon}<Icon name={icon} size={size === 'sm' ? 14 : 17} />{/if}
  <span>{@render children()}</span>
</span>

<style>
  .tag {
    --bg: color-mix(in srgb, var(--paper2) 80%, var(--ink3));
    --fg: var(--text);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px 5px 7px;
    font-size: var(--fs-2);
    font-weight: 700;
    line-height: 1.15;
    color: var(--fg);
    background: var(--bg);
    clip-path: polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px);
  }
  .sm {
    padding: 3px 7px 3px 5px;
    font-size: var(--fs-1);
  }
  .good {
    --bg: color-mix(in srgb, var(--malachite-l) 45%, var(--paper));
    --fg: var(--malachite-d);
  }
  .bad {
    --bg: color-mix(in srgb, var(--cinnabar-l) 30%, var(--paper));
    --fg: var(--cinnabar);
  }
  .gold {
    --bg: color-mix(in srgb, var(--gold-l) 60%, var(--paper));
    --fg: var(--gold-d);
  }
  :global(.on-dark) .tag {
    --bg: rgb(255 255 255 / 0.1);
    --fg: var(--text-inv);
  }
  :global(.on-dark) .bad {
    --bg: rgb(184 56 42 / 0.3);
    --fg: var(--cinnabar-l);
  }
  :global(.on-dark) .good {
    --bg: rgb(140 192 157 / 0.18);
    --fg: var(--malachite-l);
  }
</style>
