<script module lang="ts">
  // Số ngăn kéo desktop đang mở — còn thì <html> giữ --dockw để cảnh núi/bản đồ dịch sang trái
  let docks = 0
</script>

<script lang="ts">
  // Bảng trượt từ dưới lên như một cuộn tranh mở ra: trục gỗ sơn mài đầu đồng, giấy bồi lụa, khung mực kẻ tay — vẽ bằng bút lông.
  // Dùng <dialog> gốc: có sẵn bẫy focus, Esc để đóng, nằm trên cùng. Đầu bảng chuẩn: hình (art), tiêu đề, phụ đề, lời dẫn.
  import type { Snippet } from 'svelte'
  import { Icon, artOf } from '@rok/art'
  import { DESK, L, sfx } from '../lib'
  const back = artOf('ui:back')?.src // nút đóng vẽ tay: đám mây mũi tên lùi

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
  // Desktop: bảng thường thành ngăn kéo bên phải, không modal — cảnh vẫn nhìn và bấm được (chọn công trình khác là đổi bảng)
  let dock = $state(false)
  $effect(() => {
    if (!dlg) return
    if (open && !dlg.open) {
      dock = !center && !!DESK?.matches
      if (dock) dlg.show()
      else dlg.showModal()
    }
    if (!open && dlg.open) dlg.close()
  })
  $effect(() => {
    if (!open || !dock) return
    const root = document.documentElement
    if (docks++ === 0) root.style.setProperty('--dockw', getComputedStyle(root).getPropertyValue('--dock'))
    return () => {
      if (--docks === 0) root.style.removeProperty('--dockw')
    }
  })
  // dialog không modal không tự đóng bằng Esc
  $effect(() => {
    if (!open || !dock) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !e.defaultPrevented && dismiss()
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  })

  // Người chơi đóng (nút ×, chạm nền, Esc, vuốt): cuộn giấy trượt xuống rồi mới đóng hẳn
  let leaving = false
  function dismiss(from = 0) {
    if (!dlg?.open || leaving || !panel) return
    leaving = true
    const off = center
      ? [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.92)' },
        ]
      : dock
        ? [{ transform: 'translateX(0)' }, { transform: 'translateX(105%)' }]
        : [{ transform: `translateY(${from}px)` }, { transform: 'translateY(105%)' }]
    panel.animate(off, { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).finished.finally(() => {
      leaving = false
      dlg?.close()
    })
  }

  // Vuốt xuống trên trục/đầu bảng để đóng (bảng dưới). Kéo quá 90px hoặc vuốt nhanh thì đóng, không thì bật về.
  let drag: { y: number; t: number; dy: number } | null = null
  function down(e: PointerEvent) {
    const t = e.target as Element
    if (center || dock || !t.closest('.rod, .head') || t.closest('button, input, textarea')) return
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
    panel.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
      duration: 220,
      easing: 'cubic-bezier(.3,1.4,.5,1)',
    })
    panel.style.transform = ''
  }
</script>

<dialog
  bind:this={dlg}
  class="sheet"
  class:modal={center}
  class:dock
  aria-label={label ?? title}
  {onclose}
  oncancel={e => {
    e.preventDefault()
    dismiss()
  }}
  onclick={e => e.target === dlg && dismiss()}
>
  {#if open}
    <!-- Vuốt để đóng chỉ là cử chỉ thêm; bàn phím dùng nút × hoặc Esc -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="scroll paper"
      bind:this={panel}
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
    >
      <div class="rod" aria-hidden="true"></div>
      <!-- svelte-ignore a11y_autofocus -->
      <div class="body" tabindex="-1" autofocus>
        <button
          class="x"
          aria-label={L.panel.close}
          onclick={() => {
            sfx('tap')
            dismiss()
          }}
          class:cloud={!!back}
          >{#if back}<img src={back} alt="" draggable="false" />{:else}<Icon name="close" size={16} />{/if}</button
        >
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
    background: rgb(var(--shade) / 0.45);
    animation: fade var(--dur-2) var(--ease);
  }
  .scroll {
    position: relative;
    border: 0 solid transparent;
    border-image: var(--sk-scroll);
    filter: drop-shadow(0 10px 24px rgb(var(--shade) / 0.45));
    animation: rise 0.34s var(--spring);
  }
  .rod,
  .head {
    touch-action: none; /* vuốt ở đây là kéo bảng, không cuộn nội dung */
  }
  .modal .scroll {
    animation: pop 0.32s var(--spring);
  }
  /* trục gỗ sơn mài, hai đầu bịt đồng chạm hoa (vẽ tay) */
  .rod {
    visibility: hidden; /* sơn mài: khung góc chạm đã đủ, trục gỗ nâu trông như khúc gỗ — giữ chỗ để kéo bảng */
    position: absolute;
    top: -10px;
    right: -14px;
    left: -14px;
    height: 22px;
    border: 0 solid transparent;
    border-image: var(--sk-rod);
  }
  .body:focus {
    outline: none;
  }
  .body {
    position: relative;
    max-height: min(86dvh, 780px);
    padding: 26px 26px calc(28px + var(--safe-b));
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .modal .body {
    padding-bottom: 28px;
  }
  .x {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    color: var(--text);
    background: var(--img-disc-paper) center / 100% 100% no-repeat;
  }
  .x:active {
    transform: scale(0.9);
  }
  .x.cloud {
    width: 54px;
    height: 40px;
    background: none;
  }
  .x.cloud img {
    width: 54px;
    height: auto;
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.2));
  }
  /* nền bảng: giấy sương + dãy núi mờ ở đáy (theme.ts --img-mountains) */
  .scroll {
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 240% auto no-repeat,
      var(--paper-tex) 0 0 / 128px,
      var(--paper);
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
  /* tiêu đề: chữ to, nét cọ son quét dưới (như biển tiêu đề của game studio) */
  h2 {
    justify-self: start;
    padding: 0 22px 9px 2px;
    font-size: var(--fs-7);
    font-weight: 800;
    line-height: 1.05;
    background: var(--stroke-red) no-repeat left bottom / 100% 11px;
  }
  .sub {
    font-size: var(--fs-2);
    font-weight: 800;
    letter-spacing: 0.03em;
    color: var(--cinnabar);
  }
  /* ---------- Desktop: ngăn kéo ghim bên phải, dưới thanh trên ---------- */
  .dock {
    position: fixed;
    inset: var(--top) 0 0 auto;
    z-index: var(--z-hud);
    width: var(--dock);
    height: auto;
    max-height: none;
    margin: 0;
    padding: 18px 0 0;
    background: transparent;
  }
  .dock .scroll {
    height: 100%;
    animation: slide 0.3s var(--spring);
  }
  .dock .body {
    height: 100%;
    max-height: none;
    padding-bottom: 28px;
  }
  .dock .rod {
    left: -10px;
    right: -6px;
  }
  @keyframes slide {
    from {
      transform: translateX(60%);
      opacity: 0;
    }
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
