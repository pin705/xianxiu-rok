<script lang="ts">
  // Nhãn nhỏ: mẩu giấy/lụa viền mực vẽ tay — chi phí, phần thưởng, yêu cầu. tone: bad = thiếu/không đạt, good = đạt.
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'

  let { icon, tone = 'plain', size = 'md', children }: { icon?: IconName; tone?: 'plain' | 'good' | 'bad' | 'gold' | 'red'; size?: 'sm' | 'md'; children: Snippet } = $props()
</script>

<span class="tag {tone} {size}">
  {#if icon}<Icon name={icon} size={size === 'sm' ? 14 : 17} />{/if}
  <span>{@render children()}</span>
</span>

<style>
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px 6px 8px;
    font-size: var(--fs-2);
    font-weight: 700;
    line-height: 1.15;
    color: var(--text);
    border: 0 solid transparent;
    border-image: var(--sk-tag);
  }
  .sm {
    padding: 3px 8px 4px 6px;
    font-size: var(--fs-1);
  }
  .good {
    color: var(--malachite-d);
    border-image: var(--sk-tag-good);
  }
  .bad {
    color: var(--cinnabar);
    border-image: var(--sk-tag-bad);
  }
  .gold {
    color: var(--gold-d);
    border-image: var(--sk-tag-gold);
  }
  .red {
    color: var(--silk);
    border-image: var(--sk-tag-red);
  }
  :global(.on-dark) .tag {
    color: var(--text-inv);
    border-image: var(--sk-tag-dark);
  }
  :global(.on-dark) .bad {
    color: var(--cinnabar-l);
  }
  :global(.on-dark) .good {
    color: var(--malachite-l);
  }
</style>
