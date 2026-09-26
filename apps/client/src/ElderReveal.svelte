<script lang="ts">
  // Thu nhận trưởng lão mới (màn "Commander obtained" của RoK): tranh chân dung lớn treo giữa hào quang màu phẩm, dấu son phẩm
  // đóng góc tranh, tên, danh hiệu, hệ, lời dẫn, tuyệt kỹ — chạm nền để tiếp tục, hoặc tới Môn hạ xem ngay. Chờ trận / độ kiếp
  // đang diễn xong mới hiện (hold).
  import { ELDERS, RARITY, type ElderId } from '@rok/rules'
  import { Portrait, artOf } from '@rok/art'
  import { Button } from './ui'
  import { L, LOOK, sfx } from './lib'

  let {
    elder,
    hold = false,
    onclose,
    onview,
  }: { elder: ElderId | null; hold?: boolean; onclose: () => void; onview: (e: MouseEvent) => void } = $props()
  let dlg = $state<HTMLDialogElement>()
  const show = $derived(!!elder && !hold)
  const ribbon = artOf('ui:ribbon')?.src // dải lụa đuôi én mang dòng "Thu nhận trưởng lão mới"
  $effect(() => {
    if (!dlg) return
    if (show && !dlg.open) {
      dlg.showModal()
      sfx('reward')
    }
    if (!show && dlg.open) dlg.close()
  })
</script>

<dialog
  bind:this={dlg}
  class="reveal"
  aria-label={L.reveal.title}
  onclose={() => show && onclose()}
  onclick={e => e.target === e.currentTarget && onclose()}
>
  {#if elder}
    {#key elder}<div class="stage rar{RARITY[elder]}">
        <span class="rays" aria-hidden="true"></span>
        <small class="kicker" class:art={!!ribbon} style:--ribbon={ribbon ? `url(${ribbon})` : undefined}
          >{L.reveal.title}</small
        >
        <!-- tranh treo: trục gỗ trên dưới, chân dung vẽ tay khổ lớn (không cắt tròn), dấu son phẩm đóng góc -->
        <span class="scroll">
          <span class="face"><Portrait look={LOOK[elder]} size={208} /></span>
          <b class="seal">{L.rarity[RARITY[elder]]}</b>
        </span>
        <b class="name">{L.elders[elder].name}</b>
        <small class="sub">{L.elders[elder].title} · {L.units[ELDERS[elder].type]} · {L.el[ELDERS[elder].el]}</small>
        <p class="lore">{L.elders[elder].lore}</p>
        <small class="skill">{L.reveal.skill(L.elders[elder].skill)}</small>
        <div class="row acts">
          <Button variant="gold" icon="people" onclick={e => onview(e)}>{L.reveal.view}</Button>
          <Button variant="ink" onclick={onclose}>{L.reveal.ok}</Button>
        </div>
      </div>{/key}
  {/if}
</dialog>

<style>
  .reveal {
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
  .reveal::backdrop {
    background: radial-gradient(circle at 50% 40%, rgb(40 34 26 / 0.88), rgb(10 8 6 / 0.95));
  }
  /* chữ ngà cố định: màn này luôn nền tối, không theo giao diện sáng / tối */
  .stage {
    --glow: 236 208 138;
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
  .rar1 {
    --glow: 200 204 198;
  }
  .rar2 {
    --glow: 120 170 220;
  }
  .rar3 {
    --glow: 190 150 230;
  }
  .rar4 {
    --glow: 246 206 110;
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
  /* ---------- tranh treo ---------- */
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
  .face :global(.portrait) {
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
  .skill {
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
    .rays,
    .kicker,
    .scroll,
    .seal,
    .name,
    .sub,
    .lore,
    .skill,
    .acts {
      animation: none;
    }
  }
</style>
