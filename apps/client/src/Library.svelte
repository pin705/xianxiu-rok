<script lang="ts">
  // Tàng Kinh Các: 20 công pháp chia 5 hàng, hàng sau mở theo tầng Tàng Kinh Các. Mỗi lúc lĩnh ngộ một môn.
  // Bố cục thư các: án thư trên cùng mở bí kíp đang chọn (tranh bí kíp sáng, bonus, chi phí, nút lĩnh ngộ),
  // dưới là các hàng kệ — mỗi môn một cuộn bí kíp, số tầng đã ngộ trên đồng tiền nhỏ.
  import {
    TECHS,
    TECH_IDS,
    TECH_ROWS,
    stallCost,
    stallOf,
    techCost,
    techError,
    techTime,
    type TechId,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Art, Bag, Banner, Button, Shelf, Tag, Ware } from './ui'
  import JobRow from './JobRow.svelte'
  import { L, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  // mặc định: môn đầu tiên lĩnh ngộ được ngay, không có thì môn đầu
  let pick = $state<TechId | null>(null)
  const cur = $derived(pick ?? TECH_IDS.find(t => !techError(game, t)) ?? TECH_IDS[0])
  const d = $derived(TECHS[cur])
  const lv = $derived(game.tech[cur] ?? 0)
  const open = $derived(game.levels.tangKinhCac >= TECH_ROWS[d.row])
  const err = $derived(techError(game, cur))
  const doing = $derived(game.study?.tech === cur)
  // dấu son "Nên học" cho người mới: môn rẻ nhất còn học được — hàng thấp trước, rồi tầng đã ngộ ít nhất
  const advise = $derived(
    TECH_IDS.filter(t => game.levels.tangKinhCac >= TECH_ROWS[TECHS[t].row] && (game.tech[t] ?? 0) < TECHS[t].max).sort(
      (a, b) => TECHS[a].row - TECHS[b].row || (game.tech[a] ?? 0) - (game.tech[b] ?? 0),
    )[0],
  )
</script>

{#if game.study}
  <div class="mt-3">
    <JobRow kind="study" label={L.library.doing(L.techs[game.study.tech], game.study.level)} />
  </div>
{/if}

<!-- án thư: bí kíp đang mở -->
<Banner title={L.techs[cur]} picSize={92} band="{lv}/{d.max}">
  {#snippet pic()}<Art art="fx-scroll" icon="scroll" size={92} />{/snippet}
  {#snippet lead()}
    <p class="t-small">
      {L.bonus(d.key, d.v * Math.max(1, lv))}
      {#if lv && lv < d.max}<span class="t-good">
          → {L.bonus(d.key, d.v * (lv + 1))
            .split(' ')
            .at(-1)}</span
        >{/if}
    </p>
  {/snippet}
  {#snippet foot()}
    <div class="row wrap between">
      {#if lv >= d.max}
        <span class="stamp">{L.library.maxed}</span>
      {:else if !open}
        <small class="row t-small t-soft" style:--gap="4px"
          ><Icon name="lock" size={14} />{L.library.row(TECH_ROWS[d.row])}</small
        >
      {:else if !doing}
        <Bag res={stallCost(game, 'tech', techCost(cur, lv + 1))} have={game.res} size="sm" />
        {#if stallOf(game, 'tech')}<Tag tone="gold" icon="star"
            >{L.stall.tag(Math.round((stallOf(game, 'tech')?.cut ?? 0) * 100))}</Tag
          >{/if}
        <Button
          size="sm"
          variant="gold"
          trail={clock(techTime(game, cur, lv + 1))}
          disabled={!!err}
          onclick={() => act({ type: 'study', tech: cur }, 'build')}>{L.library.go}</Button
        >
      {/if}
    </div>
  {/snippet}
</Banner>

<!-- kệ sách: mỗi hàng một tầng Tàng Kinh Các, hàng chưa mở mờ và khoá -->
{#each TECH_ROWS as need, row (row)}
  {@const rowOpen = game.levels.tangKinhCac >= need}
  <section class="stack mt-3" class:dim={!rowOpen} style:--gap="2px">
    <h3 class="row t-small t-soft" style:--gap="4px">
      {#if !rowOpen}<Icon name="lock" size={13} />{/if}{L.library.row(need)}
    </h3>
    <Shelf cols={4} row={96}>
      {#each TECH_IDS.filter(t => TECHS[t].row === row) as t (t)}
        {@const tl = game.tech[t] ?? 0}
        <Ware
          icon="scroll"
          size={38}
          label={L.techs[t]}
          n={tl}
          full={tl >= TECHS[t].max}
          on={t === cur}
          busy={game.study?.tech === t}
          onclick={() => (pick = t)}
          >{#if t === advise}<Tag tone="bad" size="sm">{L.library.advise}</Tag>{/if}</Ware
        >
      {/each}
    </Shelf>
  </section>
{/each}
