<script lang="ts">
  // Ô quà trên đường mốc (Track): giấy trắng (gold: nền vàng nhạt — hàng quà cao cấp); can: viền son nhấp nháy, bấm để nhận;
  // got: dấu son `stamp` đè giữa; lock: ổ khoá góc; dim: mờ (chưa tới mốc). Phần con: túi quà.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'

  let {
    gold = false,
    can = false,
    dim = false,
    lock = false,
    stamp,
    label,
    onclick,
    children,
  }: {
    gold?: boolean
    can?: boolean
    dim?: boolean
    lock?: boolean
    stamp?: string
    label: string
    onclick: () => void
    children: Snippet
  } = $props()
</script>

<button
  class="prize"
  class:gold
  class:can
  class:pulse={can}
  class:faded={dim}
  disabled={!can}
  aria-label={label}
  {onclick}
>
  {@render children()}
  {#if stamp}<span class="got">{stamp}</span>
  {:else if lock}<span class="mark"><Icon name="lock" size={14} /></span>{/if}
</button>

<style>
  .prize {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 64px;
    padding: 4px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 4px;
    box-shadow: 0 2px 4px rgb(var(--shade) / 0.08);
  }
  .faded {
    opacity: 0.6;
  }
  .gold {
    background: color-mix(in srgb, var(--gold) 12%, var(--silk));
    border-color: color-mix(in srgb, var(--gold) 55%, var(--paper3));
  }
  .can {
    cursor: pointer;
    border-color: var(--cinnabar);
    box-shadow: 0 0 0 2px rgb(var(--gold-glow) / 0.6);
  }
  .got {
    position: absolute;
    padding: 1px 4px;
    background: color-mix(in srgb, var(--silk) 80%, transparent);
  }
  .mark {
    position: absolute;
    top: 3px;
    right: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    .can {
      animation: none;
    }
  }
</style>
