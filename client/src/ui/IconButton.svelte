<script lang="ts">
  // Nút tròn một biểu tượng: đĩa sơn mài viền đồng (trên HUD) hoặc đĩa giấy viền mực (trong bảng).
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
  <Icon name={icon} size={Math.round(size * 0.5)} />
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
    border-radius: 50%;
    transition: transform var(--dur-1) var(--ease);
  }
  .lacquer {
    color: var(--gold-l);
    background:
      radial-gradient(circle at 50% 30%, rgb(255 255 255 / 0.14), transparent 60%),
      var(--lacquer) var(--lacquer-tex);
    background-size: auto, 96px;
    box-shadow: inset 0 0 0 1.5px var(--gold), inset 0 0 0 3px rgb(0 0 0 / 0.45), var(--shadow-1);
  }
  .paper {
    color: var(--ink);
    background: var(--paper) var(--paper-tex);
    background-size: 128px;
    box-shadow: inset 0 0 0 1.5px var(--ink2), var(--shadow-1);
  }
  .ib:active {
    transform: scale(0.92);
  }
</style>
