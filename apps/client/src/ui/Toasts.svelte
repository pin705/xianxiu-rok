<script module lang="ts">
  export type ToastItem = { id: number; text: string; bad?: boolean; action?: string; onaction?: () => void }
</script>

<script lang="ts">
  // Thông báo ngắn: dải giấy hai đầu lụa lam lục, viền mực (báo lỗi: giấy ửng son), hiện ra như nét bút đang vẽ;
  // có nút phụ (vd. "Xem lại" chiến báo). popover: lên lớp trên cùng — mở lại mỗi khi có dòng mới để nổi trên bảng (hộp thoại
  // modal) đang mở, không thì báo lỗi lúc đang ở trong bảng bị che mất
  import { Icon } from '@rok/art'

  let { list, top }: { list: ToastItem[]; top: string } = $props()
  let el = $state<HTMLElement>()
  $effect(() => {
    if (!el?.showPopover) return
    el.hidePopover()
    if (list.length) el.showPopover()
  })
</script>

<div class="toasts" popover="manual" bind:this={el} style:top aria-live="polite">
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
    inset: auto;
    left: 50%;
    margin: 0;
    padding: 0;
    overflow: visible;
    background: none;
    border: 0;
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
    color: var(--text);
    pointer-events: auto;
    border: 0 solid transparent;
    border-image: var(--sk-slip);
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.35));
    -webkit-mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
    mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
    animation:
      drop var(--dur-3) var(--spring),
      wipe 0.45s var(--ease) forwards;
  }
  .bad {
    color: var(--cinnabar);
    border-image: var(--sk-slip-bad);
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
