<script lang="ts">
  // Nút tròn một biểu tượng: đĩa sơn mài vòng vàng (trên HUD) hoặc đĩa giấy vòng mực (trong bảng) — vẽ tay.
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'
  import { sfx } from '../lib'

  let {
    icon,
    label,
    tone = 'lacquer',
    size = 38,
    onclick,
    children,
  }: { icon: IconName; label: string; tone?: 'lacquer' | 'paper'; size?: number; onclick: () => void; children?: Snippet } = $props()
</script>

<button class="ib {tone}" style:--s="{size}px" aria-label={label} onclick={() => (sfx('tap'), onclick())}>
  <Icon name={icon} size={Math.round(size * 0.48)} />
  {#if children}{@render children()}{/if}
</button>

<style>
  .ib {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: var(--s);
    height: var(--s);
    color: var(--gold-l);
    background: var(--img-disc) center / 100% 100% no-repeat;
    transition: transform var(--dur-1) var(--ease);
  }
  .paper {
    color: var(--ink);
    background-image: var(--img-disc-paper);
  }
  .ib:active {
    transform: scale(0.92);
  }
</style>
