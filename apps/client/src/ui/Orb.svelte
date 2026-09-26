<script lang="ts">
  // Nút tròn chọn một trong hàng (chân dung, khung chân dung): đang chọn viền vàng; khoá: mờ, ổ khoá đè giữa.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'

  let {
    on = false,
    disabled = false,
    lock = false,
    label,
    title,
    onclick,
    children,
  }: {
    on?: boolean
    disabled?: boolean
    lock?: boolean
    label: string
    title?: string
    onclick: () => void
    children: Snippet
  } = $props()
</script>

<button type="button" class="orb" class:on {disabled} aria-pressed={on} aria-label={label} {title} {onclick}
  >{@render children()}{#if lock}<span class="lock"><Icon name="lock" size={14} /></span>{/if}</button
>

<style>
  .orb {
    position: relative;
    display: grid;
    place-items: center;
    padding: 2px;
    border: 2px solid transparent;
    border-radius: 50%;
  }
  .orb:disabled {
    opacity: 0.5;
  }
  .lock {
    position: absolute;
    display: grid;
  }
  .on {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgb(var(--shade) / 0.12);
  }
</style>
