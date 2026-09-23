<script module lang="ts">
  export type ToastItem = { id: number; text: string; bad?: boolean; action?: string; onaction?: () => void }
</script>

<script lang="ts">
  // Thông báo ngắn: thẻ sơn mài viền vàng quét ra như một nét bút; có nút phụ (vd. "Xem lại" chiến báo).
  import { Icon } from '@rok/art'

  let { list, top }: { list: ToastItem[]; top: string } = $props()
</script>

<div class="toasts" style:top aria-live="polite">
  {#each list as t (t.id)}
    {#if t.onaction}
      <button class="toast lacquer" class:bad={t.bad} onclick={t.onaction}>
        <Icon name="swords" size={16} /><span>{t.text}</span><em>{t.action}</em>
      </button>
    {:else}
      <p class="toast lacquer" class:bad={t.bad}>{t.text}</p>
    {/if}
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    left: 50%;
    z-index: var(--z-toast);
    display: grid;
    justify-items: center;
    gap: 6px;
    width: min(100% - 32px, 420px);
    translate: -50% 0;
    pointer-events: none;
  }
  .toast {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    max-width: 100%;
    padding: 9px 16px;
    font-size: var(--fs-3);
    font-weight: 700;
    text-align: left;
    pointer-events: auto;
    box-shadow: inset 0 0 0 1.5px var(--gold), inset 0 0 0 3px rgb(0 0 0 / 0.4), var(--shadow-2);
    clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%);
    -webkit-mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
    mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
    animation:
      drop var(--dur-3) var(--spring),
      wipe 0.45s var(--ease) forwards;
  }
  .bad {
    box-shadow: inset 0 0 0 1.5px var(--cinnabar-l), inset 0 0 0 3px rgb(0 0 0 / 0.4), var(--shadow-2);
  }
  em {
    padding: 2px 8px;
    font-size: var(--fs-2);
    font-style: normal;
    color: var(--ink);
    background: var(--gold-l);
  }
  @keyframes wipe {
    to {
      -webkit-mask-position: 0 0;
      mask-position: 0 0;
    }
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.96);
    }
  }
</style>
