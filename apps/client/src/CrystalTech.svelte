<script lang="ts">
  // Linh Tinh Trận Pháp (Crystal Tech của RoK) trong bảng Công Huân mùa: linh tinh (Công Huân × CTECH_PER − đã tiêu), hai nhánh Căn Cơ /
  // Chiến Pháp — mỗi trận một dòng (tầng, tăng ích hiện có → tầng kế, nút nâng / lý do khoá)
  import { CTECH, CTECH_MAX, CTECH_PER, crystals, ctechCost, ctechError, ctechLv, ctechPrev } from '@rok/rules'
  import { Button, Section } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
</script>

<Section title={L.ctech.title}>
  {#snippet aside()}<b class="t-num t-gold">{L.ctech.have(num(Math.max(0, crystals(game))))}</b>{/snippet}
  <p class="t-tiny t-soft">{L.ctech.hint(CTECH_PER)}</p>
  {#if game.seasonAt === undefined}<small class="t-tiny t-bad">{L.ctech.off}</small>{/if}
  {#each [0, 1] as br (br)}
    <b class="t-small">{L.ctech.branches[br]}</b>
    <ul class="stack plain" style:--gap="6px">
      {#each CTECH as c, i (i)}
        {#if c.branch === br}
          {@const lv = ctechLv(game, i)}
          {@const err = ctechError(game, i)}
          {@const prev = ctechPrev(i)}
          <li class="row between">
            <span class="stack" style:--gap="2px">
              <b class="t-small">{L.ctech.names[i]} · {L.ctech.lv(lv, CTECH_MAX)}</b>
              <small class="t-tiny t-good">{L.bonus(c.key, c.v * Math.max(1, lv))}</small>
              {#if err === 'locked' && prev >= 0 && game.seasonAt !== undefined}<small class="t-tiny t-soft"
                  >{L.ctech.need(L.ctech.names[prev])}</small
                >{/if}
            </span>
            <Button size="sm" variant="gold" disabled={!!err} onclick={() => g.act({ type: 'ctech', i }, 'reward')}
              >{lv >= CTECH_MAX ? L.ctech.max : L.ctech.up(num(ctechCost(i, lv)))}</Button
            >
          </li>
        {/if}
      {/each}
    </ul>
  {/each}
</Section>
