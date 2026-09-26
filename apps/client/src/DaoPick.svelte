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
  import { DAO_TONES, Icon, artOf, emblemArt, paintedUrl, type IconName } from '@rok/art'
  import { Button, Medal, Section, Sheet } from './ui'
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
  const flag = artOf('ui:ribbon-v')?.src // cờ lụa dọc treo huy hiệu
  const fig = (id: DaoId) => paintedUrl(`fig:${id}`, () => emblemArt(id), 200)
  function pick(id: DaoId) {
    if (g.act({ type: 'dao', id }, 'reward')) open = false
  }
</script>

{#if game.levels.chuDien >= DAO_HALL || game.dao}
  <Section title={L.dao.title}>
    <div class="banner" style:--accent={game.dao ? ACCENT[game.dao.id] : 'var(--cinnabar)'}>
      {#if game.dao}
        {@const id = game.dao.id}
        <img class="fig" src={fig(id)} alt="" draggable="false" />
        <span class="flag" class:art={!!flag} style:--flag={flag ? `url(${flag})` : undefined}>
          <Medal emblem={id} tone={DAO_TONES[id]} size={62} />
        </span>
        <div class="info">
          <b class="name">{L.dao.names[id].name}</b>
          <small class="way">{L.dao.names[id].style}</small>
          <ul class="fx" aria-label={L.dao.potential}>
            {#each fx(id) as [k, v] (k)}<li><b>{v}</b><small>{k}</small></li>{/each}
          </ul>
        </div>
        <div class="foot">
          {#if wait > 0}<small class="ribbon">{L.dao.wait(wait >= 3_600_000 ? L.ago(wait) : clock(wait))}</small>{/if}
          <Button
            size="sm"
            variant="ghost"
            disabled={wait > 0 || game.levels.chuDien < DAO_HALL}
            onclick={() => (open = true)}>{L.dao.change}</Button
          >
        </div>
      {:else}
        <p class="t-small lore">{L.tips.dao.text}</p>
        <div class="foot"><Button size="sm" variant="gold" onclick={() => (open = true)}>{L.dao.pick}</Button></div>
      {/if}
    </div>
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
    <ul class="tokens">
      {#each STRAT_IDS as id (id)}
        {@const on = game.strat === id}
        <li>
          <button
            type="button"
            class="token"
            class:on
            class:off={!!game.strat && !on}
            disabled={!!game.strat}
            aria-pressed={on}
            aria-label={L.strat.names[id][0]}
            onclick={() => g.act({ type: 'strat', id }, 'reward')}
          >
            <Icon name={STRAT_ICON[id]} size={34} />
            <b class="tn">{L.strat.names[id][0]}</b>
            <small class="t-tiny t-good">{sfx2(id).join(' · ')}</small>
            <small class="t-tiny t-soft desc">{L.strat.names[id][1]}</small>
            {#if on}<span class="stamp">{L.strat.chosen}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  </Section>
{/if}

<style>
  /* ---------- băng rôn đạo: cờ lụa treo huy hiệu bên trái, tổ sư mờ bên phải, dải núi dưới đáy ---------- */
  .banner {
    position: relative;
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 6px 12px;
    min-height: 150px;
    padding: 0 12px 12px 10px;
    overflow: hidden;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      radial-gradient(closest-side, color-mix(in srgb, var(--accent) 22%, transparent), transparent) right 10px top
        20% / 60% 90% no-repeat,
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .fig {
    position: absolute;
    right: -6px;
    bottom: 0;
    height: 170px;
    opacity: 0.35; /* tổ sư mờ như tranh nền, không che chữ và nút */
    filter: drop-shadow(0 4px 6px rgb(var(--shade) / 0.25));
    pointer-events: none;
  }
  .flag {
    grid-row: 1 / 3;
    display: grid;
    justify-items: center;
    align-content: start;
    width: 76px;
    height: 128px;
    padding-top: 18px;
    background: var(--accent);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%);
  }
  .flag.art {
    background: var(--flag) center top / 100% 100% no-repeat;
    clip-path: none;
  }
  .info {
    position: relative;
    display: grid;
    justify-items: start;
    gap: 4px;
    padding-top: 12px;
  }
  .name {
    padding: 0 12px 6px 0;
    font-size: var(--fs-6);
    font-style: italic;
    font-weight: 900;
    line-height: 1.1;
    background: var(--stroke-red) no-repeat left bottom / 100% 6px;
  }
  .way {
    font-size: var(--fs-1);
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--accent);
  }
  /* ba tấm biển số: số to, nhãn nhỏ */
  .fx {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
    width: 100%;
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
  }
  .fx li {
    display: grid;
    justify-items: center;
    padding: 3px 3px 4px;
    text-align: center;
    background: color-mix(in srgb, var(--silk) 80%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
    border-radius: 4px;
  }
  .fx b {
    font-size: var(--fs-4);
    line-height: 1.1;
    color: var(--good);
  }
  .fx small {
    font-size: var(--fs-1);
    line-height: 1.15;
  }
  .lore {
    position: relative;
    grid-column: 1 / -1;
    margin: 12px 0 0;
  }
  .foot {
    position: relative;
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
  .ribbon {
    padding: 2px 12px 3px 10px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%);
  }
  /* ---------- ba lệnh bài chiến lược: treo trên thanh gỗ ngang ---------- */
  .tokens {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 12px 0 0;
    list-style: none;
    background: linear-gradient(var(--ochre), var(--lacquer2)) center 4px / 100% 6px no-repeat;
  }
  .token {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 3px;
    width: 100%;
    height: 100%;
    padding: 16px 6px 10px;
    text-align: center;
    color: var(--text);
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px 3px 10px 10px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.14);
  }
  /* dây treo lên thanh gỗ */
  .token::before {
    content: '';
    position: absolute;
    top: -9px;
    left: calc(50% - 1px);
    width: 2px;
    height: 16px;
    background: var(--cinnabar);
  }
  .token:not(:disabled):active {
    transform: translateY(1px);
  }
  .token.on {
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 30%, transparent),
      0 3px 6px rgb(var(--shade) / 0.14);
  }
  .token.off {
    opacity: 0.6;
  }
  .tn {
    font-size: var(--fs-2);
    line-height: 1.15;
  }
  .desc {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .token .stamp {
    position: absolute;
    top: 6px;
    right: 2px;
  }
</style>
