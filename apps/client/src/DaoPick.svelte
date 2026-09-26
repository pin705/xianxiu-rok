<script lang="ts">
  // Đạo thống (Civilization của RoK) trong bảng Chủ điện: đạo đang theo (huy hiệu, ba tiềm năng); "Cải tu" mở màn chọn lớn
  // (DaoChoose, như lúc lập tông môn), đổi lại được sau DAO_COOL. Save cũ chưa theo đạo nào: chọn miễn phí.
  // Bố cục: băng rôn đạo (huy hiệu lớn trên cờ lụa treo, tổ sư đứng bên phải, ba tiềm năng là ba tấm biển số) và
  // ba lệnh bài chiến lược mùa treo cạnh nhau — lệnh đã chọn đóng dấu son.
  import {
    DAOS,
    DAO_COOL,
    DAO_HALL,
    STRATS,
    STRAT_HALL,
    STRAT_IDS,
    type Bonus,
    type DaoId,
    type StratId,
  } from '@rok/rules'
  import { DAO_TONES, emblemArt, paintedUrl, type IconName } from '@rok/art'
  import { Band, Button, Crest, Medal, Section, Sheet, Token } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'
  import DaoChoose, { ACCENT } from './DaoChoose.svelte'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  let open = $state(false)
  // "Công Kiếm tu +5%" → [nhãn, số]: số to trên biển, nhãn nhỏ dưới (L.bonus luôn ghép "tên dấu-số" cách một dấu cách)
  const part = (s: string) => {
    const i = s.lastIndexOf(' ')
    return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, '']
  }
  const fx = (id: DaoId) => Object.entries(DAOS[id]).map(([k, v]) => part(L.bonus(k as Bonus, v as number)))
  const sfx2 = (id: StratId) => Object.entries(STRATS[id]).map(([k, v]) => L.bonus(k as Bonus, v as number))
  const STRAT_ICON: Record<StratId, IconName> = { dieuThu: 'dieuThu', toanThan: 'heal', tichCoc: 'thaoNang' }
  const wait = $derived(game.dao ? game.dao.at + DAO_COOL - now : 0)
  const fig = (id: DaoId) => paintedUrl(`fig:${id}`, () => emblemArt(id), 200)
  function pick(id: DaoId) {
    if (g.act({ type: 'dao', id }, 'reward')) open = false
  }
</script>

{#if game.levels.chuDien >= DAO_HALL || game.dao}
  <Section title={L.dao.title}>
    {#if game.dao}
      {@const id = game.dao.id}
      <Crest
        accent={ACCENT[id]}
        name={L.dao.names[id].name}
        way={L.dao.names[id].style}
        fig={fig(id)}
        fx={fx(id).map(([k, v]) => [k, v] as [string, string])}
        fxLabel={L.dao.potential}
      >
        {#snippet medal()}<Medal emblem={id} tone={DAO_TONES[id]} size={62} />{/snippet}
        {#snippet foot()}
          {#if wait > 0}<Band tone="ink">{L.dao.wait(wait >= 3_600_000 ? L.ago(wait) : clock(wait))}</Band>{/if}
          <Button
            size="sm"
            variant="ghost"
            disabled={wait > 0 || game.levels.chuDien < DAO_HALL}
            onclick={() => (open = true)}>{L.dao.change}</Button
          >
        {/snippet}
      </Crest>
    {:else}
      <Crest>
        <p class="t-small">{L.tips.dao.text}</p>
        {#snippet foot()}<Button size="sm" variant="gold" onclick={() => (open = true)}>{L.dao.pick}</Button>{/snippet}
      </Crest>
    {/if}
    <p class="t-tiny t-soft t-lore">{L.dao.lore}</p>
  </Section>
  <Sheet {open} onclose={() => (open = false)} center title={L.dao.pick} lore={L.dao.pickHint}>
    {#if open}
      <DaoChoose
        value={game.dao?.id}
        current={game.dao?.id}
        go={game.dao ? L.dao.change : L.dao.go}
        compact
        onpick={pick}
      />
    {/if}
  </Sheet>
{/if}

<!-- Chiến lược mùa (Seasonal Strategies của RoK): mỗi mùa chọn một, miễn phí; luân hồi thì chọn lại -->
{#if game.levels.chuDien >= STRAT_HALL}
  <Section title={L.strat.title}>
    <p class="t-tiny t-soft t-lore">{L.strat.lore}</p>
    <div class="rack">
      {#each STRAT_IDS as id (id)}
        {@const on = game.strat === id}
        <Token
          icon={STRAT_ICON[id]}
          title={L.strat.names[id][0]}
          fx={sfx2(id).join(' · ')}
          text={L.strat.names[id][1]}
          {on}
          off={!!game.strat && !on}
          disabled={!!game.strat}
          stamp={L.strat.chosen}
          onclick={() => g.act({ type: 'strat', id }, 'reward')}
        />
      {/each}
    </div>
  </Section>
{/if}
