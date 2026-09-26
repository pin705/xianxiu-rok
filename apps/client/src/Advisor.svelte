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
  import { Button, Corner, Face, Speech } from './ui'
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
  <!-- cố vấn như game: chân dung trong khung ngọc đứng góc, lời nói trong bong bóng giấy có đuôi chỉ về người nói -->
  <Corner label={L.tips.who}>
    <Face look={LOOK.thanhPhong} size={54} />
    <Speech>
      <b class="t-small">{L.tips[k].title}</b>
      <p class="t-small t-soft clamp" style:--lines="3">{L.tips[k].text}</p>
      <div class="row" style:--gap="10px">
        <Button size="sm" variant="gold" onclick={() => go(k)}>{L.tips.go}</Button>
        <button class="t-link" onclick={() => done(k)}>{L.tips.later}</button>
      </div>
    </Speech>
  </Corner>
{/if}
