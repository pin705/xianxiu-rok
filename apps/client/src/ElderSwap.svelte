<script lang="ts">
  // Truyền công (Commander Swap của RoK — luật ở rules/sect/tavern.ts truyen): trong Truyền Công Đại Hội, đổi tầng công pháp đã ngộ
  // của trưởng lão này với một trưởng lão cùng phẩm, cùng số tâm pháp; tốn Truyền Công Phù theo chênh lệch số tầng. Hỏi lại trước khi đổi.
  import { ELDER_IDS, festOpen, skillLv, truyenCost, truyenError, truyenPair, type ElderId } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import { Button, Card, Confirm } from './ui'
  import { L, LOOK } from './lib'
  import { useGame } from './game'

  let { elder }: { elder: ElderId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const mates = $derived(ELDER_IDS.filter(m => m !== elder && game.elders[m] !== undefined && truyenPair(elder, m)))
  const tiers = (e: ElderId) => skillLv(game, e).join(' · ')
</script>

{#if festOpen(game, 'truyenCong', now)}
  <Card tone="glow">
    <div class="stack" style:--gap="6px">
      <b class="t-small">{L.truyen.title}</b>
      <small class="t-tiny t-soft">{L.truyen.hint(game.items.truyenCong ?? 0)}</small>
      <small class="t-tiny">{L.truyen.mine(tiers(elder))}</small>
      {#each mates as m (m)}
        {@const why = truyenError({ ...game, time: now }, elder, m)}
        <div class="stack" style:--gap="4px">
          <div class="row">
            <Portrait look={LOOK[m]} size={30} />
            <span class="grow stack" style:--gap="0"
              ><b class="t-small">{L.elders[m].name}</b><small class="t-tiny t-soft">{L.truyen.tiers(tiers(m))}</small
              ></span
            >
          </div>
          <Confirm
            warn={L.truyen.sure(L.elders[elder].name, L.elders[m].name)}
            label={L.truyen.go(truyenCost(game, elder, m))}
            disabled={!!why || g.busy}
            onconfirm={() => g.act({ type: 'truyen', a: elder, b: m }, 'reward')}
          >
            {#snippet trigger(ask)}
              <Button size="sm" variant="ghost" wide disabled={!!why || g.busy} onclick={ask}
                >{L.truyen.go(truyenCost(game, elder, m))}</Button
              >
            {/snippet}
          </Confirm>
        </div>
      {/each}
      {#if !mates.length}<small class="t-tiny t-soft">{L.truyen.none}</small>{/if}
    </div>
  </Card>
{/if}
