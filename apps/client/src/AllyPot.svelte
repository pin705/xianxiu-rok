<script lang="ts">
  // Tụ Bảo Minh Đỉnh (rương liên minh của RoK): góp tài nguyên vào đỉnh hương của minh; mỗi lần đỉnh đầy, ai đã góp đủ tuần này mở
  // được một rương — thanh đỉnh, phần mình đã góp, nút góp và nút mở rương
  import { POT_CHEST, POT_FULL, POT_MAX, POT_MIN, POT_RATE, RESOURCES } from '@rok/rules'
  import { potChests, potOf, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import { artOf } from '@rok/art'
  import { Bag, Button, Meter, Section } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let {
    ally,
    me,
    go,
  }: { ally: AllyInfo; me: number; go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean> } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const pot = $derived(potOf(ally, g.now))
  const mine = $derived(pot.by[me] ?? 0)
  const chests = $derived(potChests(ally, me, g.now))
  const gift = artOf('ui:ally-gift')?.src // rương minh (hộp quà sơn son); tắt art thì chỉ còn túi quà
  const full = $derived(Math.min(POT_MAX, Math.floor(pot.pts / POT_FULL)))
</script>

<Section title={L.pot.title}>
  {#snippet aside()}<small class="t-tiny t-gold">{L.pot.filled(full, POT_MAX)}</small>{/snippet}
  <p class="t-tiny t-soft">{L.pot.hint(POT_MIN)}</p>
  <!-- rương minh bên trái, bên phải thanh đỉnh hương, phần mình đã góp, quà trong rương -->
  <div class="row">
    {#if gift}<img src={gift} alt="" width="68" height="68" draggable="false" />{/if}
    <span class="grow stack" style:--gap="6px">
      <Meter value={full >= POT_MAX ? 1 : (pot.pts % POT_FULL) / POT_FULL} tone="gold" size="md" />
      <small class="t-small">{L.pot.mine(num(mine))}</small>
      <Bag items={POT_CHEST.items} size="sm" />
    </span>
  </div>
  <div class="row wrap" style:--gap="6px">
    {#each [10_000, 100_000] as n (n)}
      <Button
        size="sm"
        variant="ghost"
        disabled={RESOURCES.some(r => game.res[r] < n)}
        onclick={() => go({ type: 'potGive', res: { linhThach: n, linhThao: n, linhKhoang: n } }, 'reward')}
        >{L.pot.give(num(n), num((3 * n) / POT_RATE))}</Button
      >
    {/each}
    <Button size="sm" variant="gold" disabled={!chests} onclick={() => go({ type: 'potOpen' }, 'reward')}
      >{L.pot.open(chests)}</Button
    >
  </div>
</Section>
