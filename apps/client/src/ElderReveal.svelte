<script lang="ts">
  // Thu nhận trưởng lão mới (màn "Commander obtained" của RoK): chân dung lớn giữa quầng hào quang màu phẩm, tên, danh hiệu,
  // hệ, lời dẫn, tuyệt kỹ — chạm nền để tiếp tục, hoặc tới Môn hạ xem ngay. Chờ trận / độ kiếp đang diễn xong mới hiện (hold).
  import { ELDERS, RARITY, type ElderId } from '@rok/rules'
  import { Portrait } from '@rok/art'
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
        <small class="kicker">{L.reveal.title}</small>
        <span class="face"><Portrait look={LOOK[elder]} size={176} /></span>
        <b class="name">{L.elders[elder].name}</b>
        <small class="sub"
          >{L.rarity[RARITY[elder]]} · {L.elders[elder].title} · {L.units[ELDERS[elder].type]} · {L.el[
            ELDERS[elder].el
          ]}</small
        >
        <p class="lore">{L.elders[elder].lore}</p>
        <small class="skill">{L.reveal.skill(L.elders[elder].skill)}</small>
        <div class="row acts">
          <Button variant="gold" icon="people" onclick={e => onview(e)}>{L.reveal.view}</Button>
          <Button variant="ghost" onclick={onclose}>{L.reveal.ok}</Button>
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
    background: radial-gradient(circle at 50% 40%, rgb(40 30 18 / 0.86), rgb(10 8 6 / 0.94));
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
    padding: 24px 16px;
    color: #f6eedc;
    text-align: center;
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
    top: 40%;
    left: 50%;
    width: 150vmax;
    height: 150vmax;
    translate: -50% -50%;
    background: repeating-conic-gradient(rgb(var(--glow) / 0.16) 0deg 8deg, transparent 8deg 22deg);
    mask: radial-gradient(circle, #000 0%, transparent 55%);
    animation: spin 28s linear infinite;
    pointer-events: none;
  }
  .kicker {
    position: relative;
    font-size: var(--fs-2);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgb(var(--glow));
  }
  .face {
    position: relative;
    display: grid;
    place-items: center;
    padding: 6px;
    margin: 8px 0 4px;
    border: 3px solid rgb(var(--glow));
    border-radius: 50%;
    box-shadow:
      0 0 32px rgb(var(--glow) / 0.55),
      inset 0 0 12px rgb(var(--glow) / 0.4);
    animation: arrive 0.7s var(--spring) both;
  }
  .name {
    position: relative;
    font-size: 26px;
    line-height: 1.2;
    text-shadow: 0 2px 8px rgb(0 0 0 / 0.6);
    animation: rise 0.5s 0.25s var(--ease) both;
  }
  .sub {
    position: relative;
    color: rgb(var(--glow));
    animation: rise 0.5s 0.35s var(--ease) both;
  }
  .lore {
    position: relative;
    max-width: 30em;
    font-style: italic;
    opacity: 0.88;
    animation: rise 0.5s 0.45s var(--ease) both;
  }
  .skill {
    position: relative;
    opacity: 0.9;
    animation: rise 0.5s 0.5s var(--ease) both;
  }
  .acts {
    position: relative;
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
      transform: scale(0.55);
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .rays,
    .face,
    .name,
    .sub,
    .lore,
    .skill,
    .acts {
      animation: none;
    }
  }
</style>
