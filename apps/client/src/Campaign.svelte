<script lang="ts">
  // Viễn Chinh (Expedition của RoK): chương là hàng thẻ, mỗi màn một ô (số màn, sao, khoá); chọn màn xem địch, số đội mang, ba mục tiêu,
  // nút xuất chinh (trận tất định — client tính ngay, chỉ gửi khi có sao mới); rương ngày theo tổng sao, cửa hàng huân chương
  import { VC_CHAPTER, VC_CHEST, VC_HALL, VC_SHOP, VC_STAGES, type BagId } from '@rok/rules'
  import { vcBoss, vcBought, vcChestTier, vcFoe, vcMedals, vcOpen, vcRun, vcStars, vcTeams } from '@rok/rules/world'
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { might } from '@rok/rules'
  import { Button, Card, Sheet, Tabs, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'
  import { itemName } from './bag'

  let { send }: { send: (a: WorldAction) => Promise<Ack> } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const chapters = Array.from({ length: VC_STAGES / VC_CHAPTER }, (_, k) => k)
  let ch = $state(0)
  let pick = $state(0)
  let res = $state<ReturnType<typeof vcRun> | null>(null)
  const stars = (k: number) => game.vc?.stars[k] ?? 0
  const bits = (x: number) => (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1)
  const locked = $derived(game.levels.chuDien < VC_HALL)
  const tier = $derived(vcChestTier(game))
  const bought = $derived(vcBought(game, g.now))
  function go() {
    const r = vcRun(game, pick)
    res = r
    if (r.star & ~stars(pick)) void send({ type: 'vcFight', k: pick })
  }
</script>

<Sheet open={social.campaign} onclose={() => (social.campaign = false)} title={L.campaign.title}>
  <div class="stack">
    <p class="t-tiny t-soft t-lore">{L.campaign.hint}</p>
    <p class="row between t-small">
      <b class="t-gold">{L.campaign.medals(num(vcMedals(game)))}</b><span
        >{L.campaign.stars(vcStars(game), VC_STAGES * 3)}</span
      >
    </p>
    <div class="row between">
      <small class="t-tiny t-soft">{tier ? L.campaign.chest : L.campaign.chestNeed(VC_CHEST[0])}</small>
      <Button
        size="sm"
        variant="gold"
        disabled={!tier || game.vc?.chest === Math.floor((g.now + 7 * 3_600_000) / 86_400_000)}
        onclick={() => send({ type: 'vcChest' })}>{L.campaign.chest}{tier ? ` · ${tier}` : ''}</Button
      >
    </div>
    <Tabs
      look="chips"
      fit
      items={chapters.map(k => ({ id: String(k), label: L.campaign.chapter(k + 1) }))}
      value={String(ch)}
      onchange={k => {
        const n = Number(k)
        ch = n
        pick = n * VC_CHAPTER
        res = null
      }}
    />
    <div class="row wrap" style:--gap="6px">
      {#each Array.from({ length: VC_CHAPTER }, (_, i) => ch * VC_CHAPTER + i) as k (k)}
        <Button
          size="sm"
          variant={pick === k ? 'gold' : 'ghost'}
          disabled={!vcOpen(game, k)}
          onclick={() => {
            pick = k
            res = null
          }}>{k + 1}{vcBoss(k) ? '★' : ''} · {'★'.repeat(bits(stars(k))).padEnd(3, '☆')}</Button
        >
      {/each}
    </div>
    <Card tone="silk">
      <div class="stack" style:--gap="6px">
        <p class="row between">
          <b>{L.campaign.stage(pick + 1)}{vcBoss(pick) ? ` · ${L.campaign.boss}` : ''}</b>
          <Tag size="sm">{L.campaign.teams(vcTeams(pick))}</Tag>
        </p>
        <small class="t-tiny t-soft"
          >{L.campaign.foe(L.units[vcFoe(pick).troops[0].type], num(might(vcFoe(pick))))}</small
        >
        <ul class="stack plain" style:--gap="2px">
          {#each L.campaign.goals as goal, i (i)}
            <li class="t-tiny {stars(pick) & (1 << i) ? 't-good' : 't-soft'}">
              {stars(pick) & (1 << i) ? '✓' : '○'}
              {goal}
            </li>
          {/each}
        </ul>
        <div class="row between">
          <small class="t-tiny {res?.win ? 't-good' : 't-bad'}"
            >{res
              ? L.campaign.result(res.win, Math.round(res.keep * 100))
              : vcOpen(game, pick)
                ? ''
                : L.campaign.locked}</small
          >
          <Button variant="gold" icon="swords" disabled={locked || !vcOpen(game, pick)} onclick={go}
            >{L.campaign.go}</Button
          >
        </div>
      </div>
    </Card>
    <b class="t-small">{L.campaign.shop}</b>
    {#each VC_SHOP as it, i (i)}
      <div class="row between">
        <span class="t-small">{itemName(it.item as BagId)} ×{it.n} · {bought[i] ?? 0}/{it.week}</span>
        <Button
          size="sm"
          variant="gold"
          disabled={vcMedals(game) < it.price || (bought[i] ?? 0) >= it.week}
          onclick={() => send({ type: 'vcBuy', i })}>{num(it.price)}</Button
        >
      </div>
    {/each}
  </div>
</Sheet>
