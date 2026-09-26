<script lang="ts">
  // Thẻ thế lực trên thanh HUD: kiếm + số (thẻ lụa; ink: viên mực chữ trắng). up: "+N" xanh bay lên dưới thẻ
  // khi thế lực vừa tăng (key đổi thì bay lại).
  import { Icon } from '@rok/art'

  let {
    label,
    value,
    up,
    ink = false,
    onclick,
  }: {
    label: string
    value: string
    up?: { text: string; key: number } | null
    ink?: boolean
    onclick: () => void
  } = $props()
</script>

<button class="pow" class:ink title={label} {onclick}
  ><Icon name="power" size={14} /><span class="sr">{label}</span>{value}{#if up}{#key up.key}<span
        class="float"
        aria-hidden="true">{up.text}</span
      >{/key}{/if}</button
>

<style>
  .pow {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 13px 6px 11px;
    font-weight: 800;
    color: var(--text);
    border: 0 solid transparent;
    border-image: var(--sk-tag-silk);
  }
  .ink {
    padding: 4px 12px 5px 10px;
    color: var(--pill-fg);
    background: var(--pill);
    border: 1px solid rgb(255 255 255 / 0.18);
    border-image-source: none; /* không viết border-image: none — bộ nén CSS biến thành `border-image:;` */
    border-radius: 999px;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
  }
  .float {
    position: absolute;
    top: 100%;
    left: 50%;
    font-size: var(--fs-3);
    font-weight: 900;
    white-space: nowrap;
    color: var(--malachite);
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
    pointer-events: none;
    translate: -50% 0;
    animation: float 1.4s var(--ease) forwards;
  }
  @keyframes float {
    from {
      opacity: 1;
      transform: translateY(16px) scale(1.25);
    }
    to {
      opacity: 0;
      transform: translateY(-16px);
    }
  }
</style>
