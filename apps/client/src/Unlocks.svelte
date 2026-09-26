<script lang="ts">
  // Mở khoá (Milestone Moment của RoK): Chủ điện vừa lên tầng có tính năng mới — cuộn giấy liệt kê huy hiệu vừa mở, bấm
  // từng cái là tới luôn (công trình: bảng công trình; còn lại: đúng tab). Kèm màn Thu nhận trưởng lão mới (ElderReveal).
  // Bố cục: ấn son lớn mang số tầng giữa hào quang làm tâm điểm, dưới là hàng đồ vật vừa mở (tranh / huy hiệu, tên gạch son).
  import { Icon, artOf, building, paintedUrl, tabIcon, type Kind } from '@rok/art'
  import type { BuildingId } from '@rok/rules'
  import { Medal, Painting, Sheet } from './ui'
  import { L, type Tab } from './lib'
  import { unlockList, type Unlock } from './notices'
  import { social } from './social.svelte'
  import ElderReveal from './ElderReveal.svelte'

  let {
    onfocus,
    ontab,
    hold = false,
  }: {
    onfocus: (id: BuildingId) => void
    ontab: (t: Tab, e: MouseEvent) => void
    hold?: boolean // đang xem trận / độ kiếp: màn Thu nhận trưởng lão chờ xong mới hiện
  } = $props()
  const seal = artOf('ui:seal')?.src
  const list = $derived(social.unlock ? unlockList(social.unlock) : [])
  function go(u: Unlock, e: MouseEvent) {
    social.unlock = 0
    if (u.b) onfocus(u.b)
    else if (u.tab) ontab(u.tab, e)
  }
</script>

<Sheet
  open={list.length > 0}
  onclose={() => (social.unlock = 0)}
  title={L.unlock.title(social.unlock)}
  sub={L.unlock.sub}
>
  <div class="hero" aria-hidden="true">
    <span class="rays"></span>
    <b class="seal" class:art={!!seal} style:--seal={seal ? `url(${seal})` : undefined}>{social.unlock}</b>
  </div>
  <ul class="grid">
    {#each list as u (u.name)}
      <li>
        <button type="button" class="badge" aria-label={u.name} onclick={e => go(u, e)}>
          <span class="art">
            {#if u.b}<Painting
                key="unlock:{u.b}"
                make={() => building(u.b as Kind, social.unlock).art}
                w={72}
                h={64}
              />{:else if u.emblem}<Medal emblem={u.emblem[0]} tone={u.emblem[1]} size={58} />{:else if u.icon}<Icon
                name={u.icon}
                size={44}
              />{:else if u.tab}<img src={paintedUrl(`tab:${u.tab}`, () => tabIcon(u.tab!), 56)} alt="" />{/if}
          </span>
          <b class="nm">{u.name}</b>
          <small class="t-tiny go">{L.unlock.go}</small>
        </button>
      </li>
    {/each}
  </ul>
</Sheet>

<!-- nhiều trưởng lão cùng tới: lần lượt từng màn; Xem ở Môn hạ thì bỏ các màn còn lại -->
<ElderReveal
  elder={social.elders[0] ?? null}
  {hold}
  onclose={() => (social.elders = social.elders.slice(1))}
  onview={e => {
    social.elders = []
    ontab('monHa', e)
  }}
/>

<style>
  /* ấn son số tầng giữa hào quang xoay chậm */
  .hero {
    position: relative;
    display: grid;
    place-items: center;
    height: 118px;
    margin-top: var(--sp-2);
    overflow: hidden;
  }
  .rays {
    position: absolute;
    inset: -60%;
    background: repeating-conic-gradient(rgb(var(--gold-glow) / 0.35) 0deg 8deg, transparent 8deg 22deg);
    mask: radial-gradient(circle, #000 0%, transparent 42%);
    animation: spin 30s linear infinite;
  }
  .seal {
    position: relative;
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
    font-size: 38px;
    font-weight: 900;
    color: var(--silk);
    text-shadow: 0 2px 3px rgb(var(--shade) / 0.4);
    border-radius: 50%;
    background: var(--cinnabar);
    animation: stamp 0.45s var(--spring) both;
  }
  .seal.art {
    background: var(--seal) center / contain no-repeat;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 120px));
    justify-content: center; /* ít mục (thường 1–3) thì đứng giữa dưới ấn */
    gap: 14px 8px;
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
  }
  li {
    animation: rise var(--dur-2, 0.3s) var(--ease, ease-out) both;
  }
  .badge {
    display: grid;
    justify-items: center;
    gap: 3px;
    width: 100%;
    text-align: center;
    color: var(--text);
  }
  .badge:active .art {
    transform: scale(0.94);
  }
  .art {
    display: grid;
    place-items: center;
    width: 84px;
    height: 72px;
    /* đĩa sáng dưới đồ vật */
    background: radial-gradient(closest-side, rgb(var(--gold-glow) / 0.55), transparent) center / 100% 100% no-repeat;
    transition: transform var(--dur-1) var(--ease);
  }
  .art img {
    width: 56px;
    height: 56px;
  }
  .nm {
    max-width: 100%;
    padding: 0 6px 6px;
    font-size: var(--fs-2);
    line-height: 1.2;
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  .go {
    font-weight: 800;
    color: var(--cinnabar);
  }
  li:nth-child(2) {
    animation-delay: 0.06s;
  }
  li:nth-child(3) {
    animation-delay: 0.12s;
  }
  li:nth-child(n + 4) {
    animation-delay: 0.18s;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: scale(1.8) rotate(-12deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    li,
    .rays,
    .seal {
      animation: none;
    }
  }
</style>
