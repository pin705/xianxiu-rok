<script lang="ts">
  // Tàng Kinh Các: 20 công pháp chia 5 hàng, hàng sau mở theo tầng Tàng Kinh Các. Mỗi lúc lĩnh ngộ một môn.
  // Bố cục thư các: án thư trên cùng mở bí kíp đang chọn (tranh bí kíp sáng, bonus, chi phí, nút lĩnh ngộ),
  // dưới là các hàng kệ — mỗi môn một cuộn bí kíp, số tầng đã ngộ trên đồng tiền nhỏ.
  import { TECHS, TECH_IDS, TECH_ROWS, techCost, techError, techTime, type TechId } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Card } from './ui'
  import JobRow from './JobRow.svelte'
  import { L, clock, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act
  const book = artOf('ui:fx-scroll')?.src

  // mặc định: môn đầu tiên lĩnh ngộ được ngay, không có thì môn đầu
  let pick = $state<TechId | null>(null)
  const cur = $derived(pick ?? TECH_IDS.find(t => !techError(game, t)) ?? TECH_IDS[0])
  const d = $derived(TECHS[cur])
  const lv = $derived(game.tech[cur] ?? 0)
  const open = $derived(game.levels.tangKinhCac >= TECH_ROWS[d.row])
  const err = $derived(techError(game, cur))
  const doing = $derived(game.study?.tech === cur)
</script>

{#if game.study}
  <div class="mt-3">
    <JobRow kind="study" label={L.library.doing(L.techs[game.study.tech], game.study.level)} />
  </div>
{/if}

<!-- án thư: bí kíp đang mở -->
<Card
  ><div class="hero">
    {#if book}<img class="art" src={book} alt="" draggable="false" />{:else}<span class="art"
        ><Icon name="scroll" size={56} /></span
      >{/if}
    <b class="name">{L.techs[cur]}</b>
    <span class="lvl t-num">{lv}/{d.max}</span>
    <p class="t-small">
      {L.bonus(d.key, d.v * Math.max(1, lv))}
      {#if lv && lv < d.max}<span class="t-good">
          → {L.bonus(d.key, d.v * (lv + 1))
            .split(' ')
            .at(-1)}</span
        >{/if}
    </p>
    <div class="foot">
      {#if lv >= d.max}
        <span class="stamp">{L.library.maxed}</span>
      {:else if !open}
        <small class="row t-small t-soft" style:--gap="4px"
          ><Icon name="lock" size={14} />{L.library.row(TECH_ROWS[d.row])}</small
        >
      {:else if !doing}
        <Bag res={techCost(cur, lv + 1)} have={game.res} size="sm" />
        <Button
          size="sm"
          variant="gold"
          trail={clock(techTime(cur, lv + 1))}
          disabled={!!err}
          onclick={() => act({ type: 'study', tech: cur }, 'build')}>{L.library.go}</Button
        >
      {/if}
    </div>
  </div></Card
>

<!-- kệ sách: mỗi hàng một tầng Tàng Kinh Các, hàng chưa mở mờ và khoá -->
{#each TECH_ROWS as need, row (row)}
  {@const rowOpen = game.levels.tangKinhCac >= need}
  <h3 class="shelf-h" class:off={!rowOpen}>
    {#if !rowOpen}<Icon name="lock" size={13} />{/if}{L.library.row(need)}
  </h3>
  <ul class="shelf" class:off={!rowOpen}>
    {#each TECH_IDS.filter(t => TECHS[t].row === row) as t (t)}
      {@const tl = game.tech[t] ?? 0}
      <li>
        <button
          type="button"
          class="scroll"
          class:on={t === cur}
          aria-label={L.techs[t]}
          aria-pressed={t === cur}
          onclick={() => {
            sfx('tap')
            pick = t
          }}
        >
          <Icon name="scroll" size={38} />
          <i class="coin rank-no" class:r1={tl >= TECHS[t].max}>{tl}</i>
          {#if game.study?.tech === t}<i class="busy"><Icon name="clock" size={12} /></i>{/if}
          <span class="nm">{L.techs[t]}</span>
        </button>
      </li>
    {/each}
  </ul>
{/each}

<style>
  /* án thư: tên to + dải son bên trái, tranh bí kíp nghiêng bên phải, chi phí + nút dưới vạch đứt */
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    align-items: center;
  }
  .art {
    display: grid;
    grid-area: 1 / 2 / 4 / 3;
    width: 92px;
    rotate: 3deg;
  }
  .name {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .lvl {
    justify-self: start;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text-inv);
    background: var(--cinnabar);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    padding-top: 6px;
    border-top: 1px dashed var(--paper3);
  }
  .shelf-h {
    display: flex;
    gap: 4px;
    margin: var(--sp-3) 0 2px;
    font-size: var(--fs-2);
    color: var(--text-soft);
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 0 0 4px;
    list-style: none;
    border-bottom: 6px solid var(--ochre);
  }
  .off {
    opacity: 0.55;
  }
  .scroll {
    position: relative;
    display: grid;
    justify-items: center;
    width: 100%;
    padding: 4px 2px;
    color: var(--text-soft);
  }
  .scroll.on {
    color: var(--text);
  }
  .scroll.on .nm {
    background: var(--stroke-red) no-repeat center bottom / 100% 5px;
  }
  .nm {
    padding: 0 2px 4px;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
  }
  .coin {
    position: absolute;
    top: 0;
    right: calc(50% - 30px);
    font-style: normal;
  }
  .busy {
    position: absolute;
    top: 0;
    left: calc(50% - 30px);
    color: var(--cinnabar);
  }
</style>
