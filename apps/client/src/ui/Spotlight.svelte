<script lang="ts">
  // Màn trình diện toàn màn hình (thu nhận trưởng lão, được bảo vật hiếm): nền mực sâu, hào quang tia màu `glow` (kênh rgb)
  // xoay chậm, dải lụa son `kicker`, tranh treo lớn trục gỗ (snippet `pic`) có dấu son `seal` đóng góc, tên, dòng phụ màu
  // quầng, lời dẫn, thẻ `tag`, nút (phần con) — hiện lên lần lượt, mỗi lần đổi `id` diễn lại. Chạm nền hoặc Esc → onclose;
  // onopen: lúc vừa mở (âm thanh). Luôn nền tối: chữ ngà cố định.
  import type { Snippet } from 'svelte'
  import { artOf } from '@rok/art'

  let {
    open,
    id,
    label,
    glow = 'var(--gold-glow)',
    kicker,
    seal,
    title,
    sub,
    lore,
    tag,
    pic,
    onopen,
    onclose,
    children,
  }: {
    open: boolean
    id: string
    label: string
    glow?: string
    kicker: string
    seal?: string
    title: string
    sub?: string
    lore?: string
    tag?: string
    pic: Snippet
    onopen?: () => void
    onclose: () => void
    children?: Snippet
  } = $props()
  let dlg = $state<HTMLDialogElement>()
  const ribbon = artOf('ui:ribbon')?.src // dải lụa đuôi én vẽ tay (tắt art: dải son cắt đuôi én)
  $effect(() => {
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
      onopen?.()
    }
    if (!open && dlg.open) dlg.close()
  })
</script>

<dialog
  bind:this={dlg}
  class="spotlight"
  aria-label={label}
  onclose={() => open && onclose()}
  onclick={e => e.target === e.currentTarget && onclose()}
>
  {#if open}
    {#key id}<div class="stage" style:--glow={glow}>
        <span class="rays" aria-hidden="true"></span>
        <small class="kicker" class:art={!!ribbon} style:--ribbon={ribbon ? `url(${ribbon})` : undefined}
          >{kicker}</small
        >
        <!-- tranh treo: trục gỗ trên dưới, tranh khổ lớn (không cắt tròn), dấu son đóng góc -->
        <span class="scroll">
          <span class="face">{@render pic()}</span>
          {#if seal}<b class="seal">{seal}</b>{/if}
        </span>
        <b class="name">{title}</b>
        {#if sub}<small class="sub">{sub}</small>{/if}
        {#if lore}<p class="lore">{lore}</p>{/if}
        {#if tag}<small class="tag">{tag}</small>{/if}
        {#if children}<div class="row acts">{@render children()}</div>{/if}
      </div>{/key}
  {/if}
</dialog>

<style>
  .spotlight {
    width: 100vw;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: hidden;
  }
  .spotlight::backdrop {
    background: var(--veil-deep);
  }
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;
    padding: 20px 16px;
    color: var(--silk);
    text-align: center;
  }
  .rays {
    position: absolute;
    top: 38%;
    left: 50%;
    width: 150vmax;
    height: 150vmax;
    translate: -50% -50%;
    background: repeating-conic-gradient(rgb(var(--glow) / 0.18) 0deg 8deg, transparent 8deg 22deg);
    mask: radial-gradient(circle, #000 0%, transparent 55%);
    animation: spin 28s linear infinite;
    pointer-events: none;
  }
  .kicker {
    position: relative;
    padding: 5px 34px 9px;
    font-size: var(--fs-2);
    font-weight: 900;
    letter-spacing: 0.06em;
    color: var(--silk);
    text-shadow: 0 1px 2px rgb(var(--shade) / 0.45);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%, 10px 50%);
    animation: rise 0.5s var(--ease) both;
  }
  .kicker.art {
    background: var(--ribbon) center / 100% 100% no-repeat;
    clip-path: none;
  }
  .scroll {
    position: relative;
    display: block;
    width: min(58vw, 232px);
    margin: 10px 0 6px;
    padding: 10px;
    background: linear-gradient(var(--silk), var(--paper));
    box-shadow:
      0 0 0 2px rgb(var(--glow) / 0.85),
      0 0 38px rgb(var(--glow) / 0.55),
      0 12px 24px rgb(var(--shade) / 0.45);
    animation: arrive 0.7s var(--spring) both;
  }
  /* trục gỗ sơn mài hai đầu, núm tròn thò ra hai bên */
  .scroll::before,
  .scroll::after {
    content: '';
    position: absolute;
    left: -9px;
    right: -9px;
    height: 10px;
    background: linear-gradient(var(--ochre), var(--lacquer2));
    border-radius: 5px;
    box-shadow: 0 2px 3px rgb(var(--shade) / 0.4);
  }
  .scroll::before {
    top: -6px;
  }
  .scroll::after {
    bottom: -6px;
  }
  .face {
    display: block;
  }
  .face > :global(*) {
    width: 100%;
    height: auto;
    border-radius: 2px;
  }
  /* dấu son: khung vuông mực đỏ đóng nghiêng ở góc tranh */
  .seal {
    position: absolute;
    right: 6px;
    bottom: 14px;
    padding: 3px 7px;
    font-size: var(--fs-2);
    font-weight: 900;
    line-height: 1.1;
    color: var(--silk);
    background: color-mix(in srgb, var(--cinnabar) 88%, transparent);
    border: 2px solid var(--silk);
    outline: 1.5px solid var(--cinnabar);
    border-radius: 4px;
    rotate: -8deg;
    animation: stamp 0.35s 0.55s var(--spring) both;
  }
  .name {
    position: relative;
    font-size: 28px;
    line-height: 1.2;
    text-shadow: 0 2px 8px rgb(var(--shade) / 0.6);
    animation: rise 0.5s 0.25s var(--ease) both;
  }
  .sub {
    position: relative;
    color: rgb(var(--glow));
    animation: rise 0.5s 0.35s var(--ease) both;
  }
  .lore {
    position: relative;
    display: -webkit-box;
    max-width: 30em;
    overflow: hidden;
    font-style: italic;
    opacity: 0.88;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    animation: rise 0.5s 0.45s var(--ease) both;
  }
  .tag {
    position: relative;
    padding: 3px 12px 4px;
    font-weight: 700;
    border: 1px solid rgb(var(--glow) / 0.7);
    border-radius: 999px;
    background: rgb(var(--glow) / 0.14);
    animation: rise 0.5s 0.5s var(--ease) both;
  }
  .acts {
    position: relative;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 12px;
    animation: rise 0.5s 0.6s var(--ease) both;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
  @keyframes arrive {
    from {
      opacity: 0;
      transform: scale(0.6) translateY(-30px);
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: scale(2.2);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .stage > *,
    .seal {
      animation: none;
    }
  }
</style>
