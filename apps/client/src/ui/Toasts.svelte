<script module lang="ts">
  export type ToastItem = { id: number; text: string; bad?: boolean; action?: string; onaction?: () => void }
</script>

<script lang="ts">
  // Thông báo ngắn: viên mực gọn giữa màn (cùng họ viên mực của HUD) — dấu tích + chữ; báo lỗi: viên son, dấu chấm than;
  // có nút phụ (vd. "Xem lại" chiến báo): nhãn vàng nhỏ trong viên. Nhỏ, không che cảnh: chữ 13px, rộng tối đa 340px.
  // popover: lên lớp trên cùng — mở lại mỗi khi có dòng mới để nổi trên bảng (hộp thoại modal) đang mở, không thì báo lỗi
  // lúc đang ở trong bảng bị che mất
  import { Icon } from '@rok/art'

  let { list, top }: { list: ToastItem[]; top: string } = $props()
  let el = $state<HTMLElement>()
  // bấm nút trên thông báo (Xem lại…): thông báo tắt ngay — nó nằm lớp trên cùng, để lại tới hết giờ thì che màn vừa mở
  let gone = $state<number[]>([])
  const shown = $derived(list.filter(t => !gone.includes(t.id)))
  function act(t: ToastItem) {
    gone = [...gone.filter(id => list.some(x => x.id === id)), t.id]
    t.onaction?.()
  }
  $effect(() => {
    if (!el?.showPopover) return
    el.hidePopover()
    if (shown.length) el.showPopover()
  })
</script>

<div class="toasts" popover="manual" bind:this={el} style:top aria-live="polite">
  {#each shown as t (t.id)}
    {#if t.onaction}
      <button class="toast" class:bad={t.bad} onclick={() => act(t)}>
        <Icon name="swords" size={14} /><span>{t.text}</span><em>{t.action}</em>
      </button>
    {:else}
      <p class="toast" class:bad={t.bad}>
        <i class="mark" aria-hidden="true">{t.bad ? '!' : '✓'}</i><span>{t.text}</span>
      </p>
    {/if}
  {/each}
</div>

<style>
  /* popover: khung chứa KHÔNG được giãn — trình duyệt nào giữ inset: 0 của popover (bottom: 0) thì khung cao tới đáy màn và
     viên thông báo (mục lưới) giãn theo thành cột son dài cả màn. Khoá cả bốn cạnh, cao theo nội dung, mục không giãn. */
  .toasts {
    position: fixed;
    inset: auto;
    right: auto;
    bottom: auto;
    left: 50%;
    height: max-content;
    max-height: none;
    align-content: start;
    align-items: start;
    margin: 0;
    padding: 0;
    overflow: visible;
    background: none;
    border: 0;
    z-index: var(--z-toast);
    display: grid;
    justify-items: center;
    gap: 6px;
    width: min(100% - 32px, 340px);
    translate: -50% 0;
    pointer-events: none;
  }
  .toast {
    display: inline-flex;
    align-self: start;
    align-items: center;
    height: auto;
    gap: 7px;
    max-width: 100%;
    padding: 6px 14px 7px 8px;
    font-size: var(--fs-2);
    font-weight: 700;
    line-height: 1.3;
    text-align: left;
    color: var(--pill-fg);
    pointer-events: auto;
    background: var(--pill);
    border: 1px solid rgb(255 255 255 / 0.18);
    border-radius: 999px;
    box-shadow: 0 3px 8px rgb(var(--shade) / 0.3);
    animation: drop var(--dur-3) var(--spring);
  }
  .bad {
    background: color-mix(in srgb, var(--cinnabar) 92%, var(--ink));
  }
  /* dấu đầu viên: tích lục (xong) · chấm than trắng trên son (lỗi) */
  .mark {
    display: grid;
    flex: none;
    place-items: center;
    width: 18px;
    height: 18px;
    font-size: 11px;
    font-style: normal;
    font-weight: 900;
    color: var(--pill-fg);
    background: var(--malachite);
    border-radius: 50%;
  }
  .bad .mark {
    color: var(--cinnabar);
    background: var(--pill-fg);
  }
  em {
    flex: none;
    padding: 1px 9px 2px;
    font-size: var(--fs-1);
    font-style: normal;
    color: var(--ink);
    background: var(--gold-l, var(--gilt));
    border-radius: 999px;
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
  }
</style>
