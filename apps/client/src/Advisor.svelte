<script module lang="ts">
  export type Tip = 'events' | 'dao' | 'tavern' | 'daily' | 'map' | 'alliance' | 'arena' | 'merchant'
</script>

<script lang="ts">
  // Trưởng lão dẫn đường (Advisor của RoK): tính năng vừa mở thì Mộc Thanh Phong giới thiệu một câu, có nút "Đi tới".
  // Mỗi mẹo hiện một lần trên máy này (nhớ trong localStorage), từng cái một, chỉ ở màn núi.
  import {
    DAILY_HALL,
    DAO_HALL,
    MAP_HALL,
    MERCHANT_HALL,
    PVP_HALL,
    TAVERN_HALL,
    type BuildingId,
    type State,
  } from '@rok/rules'
  import { Portrait, artOf } from '@rok/art'
  import { Button } from './ui'
  import { L, LOOK, TABS, read, write, type PanelTab, type Tab } from './lib'
  import { social } from './social.svelte'

  let {
    game,
    ontab,
    onfests,
    ondaily,
    onfocus,
  }: {
    game: State
    ontab: (t: Tab) => void
    onfests: () => void
    ondaily: () => void
    onfocus: (id: BuildingId, view: PanelTab) => void
  } = $props()
  const GO: Record<Tip, () => void> = {
    events: () => onfests(),
    dao: () => onfocus('chuDien', 'upgrade'),
    tavern: () => ontab('monHa'),
    daily: () => ondaily(),
    map: () => ontab('banDo'),
    alliance: () => ontab('tienMinh'),
    arena: () => (social.arena = true),
    merchant: () => onfocus('tangBaoCac', 'trade'),
  }

  const hall = (n: number) => (s: State) => s.levels.chuDien >= n
  const TIPS: { k: Tip; when: (s: State) => boolean }[] = [
    { k: 'events', when: hall(2) },
    { k: 'dao', when: s => hall(DAO_HALL)(s) && !s.dao },
    { k: 'tavern', when: hall(TAVERN_HALL) },
    { k: 'daily', when: hall(DAILY_HALL) },
    { k: 'map', when: hall(MAP_HALL) },
    { k: 'alliance', when: hall(TABS.find(t => t.id === 'tienMinh')!.unlock) },
    { k: 'arena', when: hall(PVP_HALL) },
    { k: 'merchant', when: s => s.levels.tangBaoCac >= MERCHANT_HALL },
  ]
  const ring = artOf('ui:frame-portrait')?.src // khung ngọc vẽ tay quanh chân dung cố vấn
  let seen = $state<string[]>((read('rok.tips') ?? '').split(',').filter(Boolean))
  const tip = $derived(TIPS.find(t => !seen.includes(t.k) && t.when(game)))
  function done(k: Tip) {
    seen = [...seen, k]
    write('rok.tips', seen.join(','))
  }
  // k nhận làm tham số: {@const k} trong khuôn đọc lại sau done() đã là mẹo kế tiếp — đi nhầm chỗ
  function go(k: Tip) {
    done(k)
    GO[k]()
  }
</script>

{#if tip}
  {@const k = tip.k}
  <!-- cố vấn như game: chân dung trong khung ngọc đứng góc, lời nói trong bong bóng giấy có đuôi chỉ về người nói -->
  <aside class="advisor" aria-label={L.tips.who}>
    <span class="face"
      ><Portrait look={LOOK.thanhPhong} size={54} />{#if ring}<img src={ring} alt="" draggable="false" />{/if}</span
    >
    <div class="bubble">
      <b class="t-small">{L.tips[k].title}</b>
      <p class="t-small">{L.tips[k].text}</p>
      <div class="row" style:--gap="10px">
        <Button size="sm" variant="gold" onclick={() => go(k)}>{L.tips.go}</Button>
        <button class="later" onclick={() => done(k)}>{L.tips.later}</button>
      </div>
    </div>
  </aside>
{/if}

<style>
  /* điện thoại: trái, trên dải chat, chừa cột nút bên phải (tạp dịch, giúp đỡ) */
  .advisor {
    position: fixed;
    left: 8px;
    bottom: calc(var(--safe-b) + var(--nav-h, 88px) + 44px);
    z-index: var(--z-hud);
    display: flex;
    gap: 12px;
    align-items: flex-end;
    width: min(calc(100vw - 96px), calc(var(--col) - 96px), 330px);
    pointer-events: none;
    animation: rise 0.4s var(--ease);
  }
  .face {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 62px;
    height: 62px;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.3));
  }
  .face img {
    position: absolute;
    inset: -8px;
    width: 78px;
    height: 78px;
  }
  .bubble {
    position: relative;
    display: grid;
    flex: 1;
    gap: 3px;
    min-width: 0;
    padding: 9px 12px 10px;
    color: var(--text);
    pointer-events: auto;
    background: rgb(255 255 255 / 0.96);
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: 14px 14px 14px 4px;
    box-shadow: 0 6px 16px rgb(var(--shade) / 0.25);
  }
  /* đuôi bong bóng chỉ về chân dung */
  .bubble::before {
    content: '';
    position: absolute;
    left: -7.5px;
    bottom: 14px;
    width: 12px;
    height: 12px;
    background: rgb(255 255 255 / 0.96);
    border-bottom: 1.5px solid var(--rim, var(--ink3));
    border-left: 1.5px solid var(--rim, var(--ink3));
    transform: rotate(45deg);
  }
  .bubble p {
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-soft);
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .later {
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-faint);
    text-decoration: underline dotted;
    text-underline-offset: 3px;
  }
  @keyframes rise {
    from {
      opacity: 0;
      translate: 0 12px;
    }
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .advisor {
      left: calc(var(--rail) + 24px);
      bottom: var(--sp-5);
      width: min(520px, 100% - var(--rail) - 140px);
    }
  }
</style>
