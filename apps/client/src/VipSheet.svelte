<script lang="ts">
  // Hương Hỏa (như VIP của RoK, không bán): cấp, điểm tới cấp sau, chuỗi ngày vào game (mai được bao nhiêu), rương hôm nay,
  // tăng ích cấp này và cấp sau, số phút xong miễn phí.
  import { VIP_CHEST, VIP_FREE, VIP_LEVELS, VIP_PERKS, dayOf, vipLevel, vipToday, type Bonus } from '@rok/rules'
  import { Bag, Button, Card, Meter, Sheet } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const lv = $derived(vipLevel(game))
  const next = $derived(VIP_LEVELS[lv + 1])
  const got = $derived(game.vip.chest === dayOf(now))
  const perks = (i: number) => Object.entries(VIP_PERKS[i] ?? {}) as [Bonus, number][]
</script>

<Sheet {open} {onclose} title={L.vip.title} sub={L.vip.level(lv)}>
  <div class="stack">
    <p class="t-small t-lore">{L.vip.lore}</p>
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <p class="row between">
          <b>{L.vip.level(lv)}</b>
          <small class="t-num t-soft">{next ? `${num(game.vip.pts)} / ${num(next)}` : num(game.vip.pts)}</small>
        </p>
        {#if next}<Meter value={(game.vip.pts - VIP_LEVELS[lv]) / (next - VIP_LEVELS[lv])} size="md" />{/if}
        <p class="t-small">{L.vip.streak(game.vip.streak, vipToday(game.vip.streak + 1))}</p>
      </div>
    </Card>
    <Card>
      <div class="stack" style:--gap="6px">
        <p class="row between"><b>{L.vip.chest}</b></p>
        <Bag res={VIP_CHEST[lv].res} items={VIP_CHEST[lv].items} size="sm" />
        {#if got}
          <small class="t-soft">{L.vip.chestGot}</small>
        {:else}
          <Button variant="gold" onclick={() => act({ type: 'vipChest' }, 'reward')}>{L.vip.open}</Button>
        {/if}
      </div>
    </Card>
    {#each [lv, lv + 1] as i (i)}
      {#if i < VIP_LEVELS.length}
        <Card tone={i === lv ? undefined : 'silk'}>
          <p class="t-small t-strong">{i === lv ? L.vip.now(i) : L.vip.nextLv(i)}</p>
          <ul class="perks t-small">
            {#each perks(i) as [k, v] (k)}<li>
                {L.vip.perk[k as keyof typeof L.vip.perk] ?? k} +{Math.round(v * 100)}%
              </li>{/each}
            {#if VIP_FREE[i]}<li>{L.vip.free(VIP_FREE[i])}</li>{/if}
            {#if !perks(i).length && !VIP_FREE[i]}<li class="t-soft">—</li>{/if}
          </ul>
        </Card>
      {/if}
    {/each}
  </div>
</Sheet>

<style>
  .perks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px var(--sp-3);
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
</style>
