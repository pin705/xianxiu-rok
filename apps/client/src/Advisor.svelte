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
  import { Portrait } from '@rok/art'
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
  <aside class="advisor" aria-label={L.tips.who}>
    <Portrait look={LOOK.thanhPhong} size={46} />
    <div class="stack grow" style:--gap="4px">
      <b class="t-small">{L.tips[k].title}</b>
      <p class="t-small">{L.tips[k].text}</p>
      <div class="row" style:--gap="6px">
        <Button size="sm" variant="gold" onclick={() => go(k)}>{L.tips.go}</Button>
        <Button size="sm" variant="quiet" onclick={() => done(k)}>{L.tips.later}</Button>
      </div>
    </div>
  </aside>
{/if}

<style>
  /* điện thoại: trái, trên dải chat, chừa cột nút bên phải (tạp dịch, giúp đỡ) */
  .advisor {
    position: fixed;
    left: 12px;
    bottom: calc(var(--safe-b) + 128px);
    z-index: var(--z-hud);
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
    width: min(calc(100vw - 96px), calc(var(--col) - 96px));
    padding: 10px 12px;
    background: color-mix(in srgb, var(--silk) 96%, transparent);
    border: 1.5px solid var(--gold);
    border-radius: 12px;
    box-shadow: 0 6px 18px rgb(var(--shade) / 0.3);
    animation: rise 0.4s var(--ease);
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
