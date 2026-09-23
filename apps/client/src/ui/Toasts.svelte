<script module lang="ts">
  export type ToastItem = { id: number; text: string; bad?: boolean; action?: string; onaction?: () => void }
</script>

<script lang="ts">
  // Thông báo ngắn: một dải mực quét ngang (hai đầu bút khô tước sợi, chỉ vàng bên trong) hiện ra như nét bút đang vẽ;
  // có nút phụ (vd. "Xem lại" chiến báo).
  import { Icon } from '@rok/art'

  let { list, top }: { list: ToastItem[]; top: string } = $props()
</script>

<div class="toasts" style:top aria-live="polite">
  {#each list as t (t.id)}
    {#if t.onaction}
      <button class="toast" class:bad={t.bad} onclick={t.onaction}>
        <Icon name="swords" size={16} /><span>{t.text}</span><em>{t.action}</em>
      </button>
    {:else}
      <p class="toast" class:bad={t.bad}>{t.text}</p>
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
    padding: 12px 34px 13px;
    font-size: var(--fs-3);
    font-weight: 700;
    text-align: left;
    color: var(--text-inv);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
    pointer-events: auto;
    border: 0 solid transparent;
    border-image: var(--sk-toast);
    filter: drop-shadow(0 4px 8px rgb(20 14 10 / 0.35));
    -webkit-mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
    mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
    animation:
      drop var(--dur-3) var(--spring),
      wipe 0.45s var(--ease) forwards;
  }
  .bad {
    border-image: var(--sk-toast-bad);
  }
  em {
    padding: 3px 10px 4px;
    font-size: var(--fs-2);
    font-style: normal;
    color: var(--ink);
    text-shadow: none;
    border: 0 solid transparent;
    border-image: var(--sk-tag-gold);
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
