<script lang="ts">
  // Khách ghé trên cảnh (vân du khách chờ ở mỏm đá): chân dung trong vòng giấy viền vàng, nhún nhẹ, hộp quà sao góc trên;
  // chạm để nhận. x, y: tâm (px trong lớp chạm).
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'

  let {
    x,
    y,
    label,
    onclick,
    children,
  }: { x: number; y: number; label: string; onclick: (e: MouseEvent) => void; children: Snippet } = $props()
</script>

<button class="visitor" style:left="{x}px" style:top="{y}px" aria-label={label} {onclick}
  >{@render children()}<span class="gift" aria-hidden="true"><Icon name="star" size={14} /></span></button
>

<style>
  .visitor {
    position: absolute;
    padding: 2px;
    background: var(--paper);
    border: 2px solid var(--gold-d);
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgb(var(--gold-glow) / 0.45);
    translate: -50% -50%;
    animation: bob 1.8s ease-in-out infinite;
    cursor: pointer;
  }
  .gift {
    position: absolute;
    top: -6px;
    right: -6px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    color: var(--text);
    background: var(--gold-l);
    border: 1px solid var(--gold-d);
    border-radius: 50%;
  }
  @keyframes bob {
    50% {
      transform: translateY(-5px);
    }
  }
</style>
