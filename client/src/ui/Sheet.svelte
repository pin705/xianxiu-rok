<script lang="ts">
  // Bảng trượt từ dưới lên như một cuộn giấy mở ra: trục gỗ phía trên, giấy xuyến chỉ, khung mực viền tay.
  // Dùng <dialog> gốc: có sẵn bẫy focus, Esc để đóng, nằm trên cùng. Đầu bảng chuẩn: hình (art), tiêu đề, phụ đề, lời dẫn.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'
  import { L, sfx } from '../lib'

  let {
    open,
    onclose,
    title,
    sub,
    lore,
    label,
    center = false,
    art,
    children,
  }: {
    open: boolean
    onclose: () => void
    title?: string
    sub?: string
    lore?: string
    label?: string
    center?: boolean // hộp thoại giữa màn hình thay vì trượt từ dưới
    art?: Snippet
    children: Snippet
  } = $props()

  let dlg = $state<HTMLDialogElement>()
  let panel = $state<HTMLDivElement>()
  $effect(() => {
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  })

  // Người chơi đóng (nút ×, chạm nền, Esc, vuốt): cuộn giấy trượt xuống rồi mới đóng hẳn
  let leaving = false
  function dismiss(from = 0) {
    if (!dlg?.open || leaving || !panel) return
    leaving = true
    const off = center ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.92)' }] : [{ transform: `translateY(${from}px)` }, { transform: 'translateY(105%)' }]
    panel.animate(off, { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).finished.finally(() => {
      leaving = false
      dlg?.close()
    })
  }

  // Vuốt xuống trên trục/đầu bảng để đóng (bảng dưới). Kéo quá 90px hoặc vuốt nhanh thì đóng, không thì bật về.
  let drag: { y: number; t: number; dy: number } | null = null
  function down(e: PointerEvent) {
    const t = e.target as Element
    if (center || !t.closest('.rod, .head') || t.closest('button, input, textarea')) return
    drag = { y: e.clientY, t: performance.now(), dy: 0 }
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {}
  }
  function move(e: PointerEvent) {
    if (!drag || !panel) return
    drag.dy = Math.max(0, e.clientY - drag.y)
    panel.style.transform = `translateY(${drag.dy}px)`
  }
  function up() {
    if (!drag || !panel) return
    const { dy, t } = drag
    drag = null
    if (dy > 90 || dy / (performance.now() - t) > 0.6) return dismiss(dy)
    panel.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.3,1.4,.5,1)' })
    panel.style.transform = ''
  }
</script>

<dialog
  bind:this={dlg}
  class="sheet"
  class:modal={center}
  aria-label={label ?? title}
  {onclose}
  oncancel={e => (e.preventDefault(), dismiss())}
  onclick={e => e.target === dlg && dismiss()}
>
  {#if open}
    <!-- Vuốt để đóng chỉ là cử chỉ thêm; bàn phím dùng nút × hoặc Esc -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="scroll paper" bind:this={panel} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <div class="rod" aria-hidden="true"></div>
      <!-- svelte-ignore a11y_autofocus -->
      <div class="body inked" tabindex="-1" autofocus>
        <button class="x" aria-label={L.panel.close} onclick={() => (sfx('tap'), dismiss())}><Icon name="close" size={16} /></button>
        {#if title}
          <header class="head" class:has-art={!!art}>
            {#if art}<div class="art">{@render art()}</div>{/if}
            <div class="titles">
              <h2>{title}</h2>
              {#if sub}<p class="sub">{sub}</p>{/if}
              {#if lore}<p class="t-lore t-small">{lore}</p>{/if}
            </div>
          </header>
        {/if}
        {@render children()}
      </div>
    </div>
  {/if}
</dialog>

<style>
  .sheet {
    width: min(100%, var(--col));
    margin: auto auto 0;
    overscroll-behavior: contain;
  }
  .modal {
    width: min(100% - 24px, 420px);
    margin: auto;
  }
  .sheet::backdrop {
    background: rgb(20 14 10 / 0.45);
    animation: fade var(--dur-2) var(--ease);
  }
  .scroll {
    position: relative;
    padding-top: 9px;
    box-shadow: var(--shadow-3);
    animation: rise 0.34s var(--spring);
  }
  .rod,
  .head {
    touch-action: none; /* vuốt ở đây là kéo bảng, không cuộn nội dung */
  }
  .modal .scroll {
    animation: pop 0.32s var(--spring);
  }
  /* trục gỗ sơn mài, hai đầu bịt đồng */
  .rod {
    position: absolute;
    top: -6px;
    right: -6px;
    left: -6px;
    height: 16px;
    background:
      linear-gradient(rgb(255 255 255 / 0.25), transparent 40%, rgb(0 0 0 / 0.35)),
      var(--lacquer2) var(--lacquer-tex);
    background-size: auto, 96px;
    border-radius: 8px;
    box-shadow: var(--shadow-1), inset 0 0 0 1px rgb(0 0 0 / 0.5);
  }
  .rod::before,
  .rod::after {
    content: '';
    position: absolute;
    top: -2px;
    width: 14px;
    height: 20px;
    background: linear-gradient(90deg, var(--gold-d), var(--gold-l) 45%, var(--gold-d));
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.35);
  }
  .rod::before {
    left: -4px;
  }
  .rod::after {
    right: -4px;
  }
  .body:focus {
    outline: none;
  }
  .body {
    position: relative;
    max-height: min(86dvh, 780px);
    padding: var(--sp-3) var(--sp-3) calc(var(--sp-4) + var(--safe-b));
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .modal .body {
    padding-bottom: var(--sp-4);
  }
  .x {
    position: absolute;
    top: 2px;
    right: 2px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    color: var(--ink);
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px var(--ink2);
    background: var(--paper);
  }
  .x:active {
    transform: scale(0.9);
  }
  .head {
    display: grid;
    gap: var(--sp-3);
    align-items: center;
    padding: var(--sp-1) 40px var(--sp-2) var(--sp-1);
  }
  .has-art {
    grid-template-columns: auto 1fr;
  }
  .art {
    display: grid;
    place-items: center;
  }
  .titles {
    display: grid;
    gap: 3px;
  }
  h2 {
    font-size: var(--fs-6);
    font-weight: 800;
    line-height: 1.1;
  }
  .sub {
    font-size: var(--fs-2);
    font-weight: 800;
    letter-spacing: 0.03em;
    color: var(--cinnabar);
  }
  @keyframes rise {
    from {
      transform: translateY(60%);
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.86);
      opacity: 0;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
