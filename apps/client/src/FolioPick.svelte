<script lang="ts">
  // Binh Thư Phong Vân (Storm of Stratagems của RoK) trong bảng Chủ điện — chỉ hiện khi mùa này giới theo luật Binh Thư: ba ô Công · Thủ ·
  // Mưu, mỗi ô một hàng ba lệnh bài trang sách lược (trang đang cài đóng dấu son, chạm lại để gỡ); trang chưa đủ Công Huân mờ và ghi mốc
  import { FOLIO, FOLIO_HONOR, folioOf, folioOn, folioReady, type Bonus } from '@rok/rules'
  import type { IconName } from '@rok/art'
  import { Section, Token } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

  const ICONS: IconName[][] = [
    ['swords', 'arrow', 'bolt'],
    ['shield', 'heal', 'lock'],
    ['clock', 'star', 'flag'],
  ]
  const g = useGame()
  const game = $derived(g.game)
  const f = $derived(folioOf(game))
  const honor = $derived(game.honor ?? 0)
</script>

{#if folioOn(game)}
  <Section title={L.folio.title}>
    <p class="t-tiny t-soft t-lore">{L.folio.lore}</p>
    <small class="t-tiny t-gold">{L.folio.honor(honor)}</small>
    {#each FOLIO as pages, slot (slot)}
      {@const wait = folioReady(game, slot) - g.now}
      <b class="t-small">{L.folio.slots[slot]}</b>
      <div class="rack">
        {#each pages as pg, k (k)}
          {@const on = f.p[slot] === k}
          {@const open = honor >= FOLIO_HONOR[k]}
          <Token
            icon={ICONS[slot][k]}
            title={L.folio.pages[slot][k][0]}
            fx={L.bonus(pg.key as Bonus, pg.v)}
            text={open ? L.folio.pages[slot][k][1] : L.folio.need(FOLIO_HONOR[k])}
            {on}
            off={!open || (f.p[slot] !== null && !on)}
            disabled={!open || wait > 0}
            stamp={L.folio.on}
            onclick={() => g.act({ type: 'folio', slot, page: on ? null : k }, 'reward')}
          />
        {/each}
      </div>
      {#if wait > 0}<small class="t-tiny t-soft">{L.folio.wait(clock(wait))}</small>{/if}
    {/each}
  </Section>
{/if}
