<script lang="ts">
  // Xếp hạng trong giới: lực chiến, cảnh giới, chiến công, tranh đoạt, tháp, sự kiện tuần (server tính, cache 30 giây, mình
  // tô đậm; chạm một dòng: hồ sơ) và điểm mùa theo phe + bảng phong thần các mùa trước (actor của giới tính lúc hỏi).
  // Bố cục như bảng vinh danh của game: dải thẻ bảng (tranh vẽ tay), bục ba hạng đầu (cúp trên hạng nhất), phần còn lại dòng
  // gọn có đồng tiền hạng, hạng của mình ghim ở đáy bảng.
  import type { Season } from '@rok/protocol'
  import type { Ranks } from './net'
  import { CAMP_STAGE_PTS } from '@rok/rules'
  import { Icon, artOf, type IconName } from '@rok/art'
  import { Meter, Sheet } from './ui'
  import { L, num, sfx } from './lib'
  import { social } from './social.svelte'

  const BOARDS = ['power', 'hall', 'kills', 'pvp', 'tower', 'week'] as const
  type Board = (typeof BOARDS)[number]
  // tranh thẻ của từng bảng (ui:*), tắt art thì về Icon
  const PIC: Record<Board | 'season', [string, IconName]> = {
    power: ['power', 'power'],
    hall: ['fx-scroll', 'scroll'],
    kills: ['fx-battle', 'swords'],
    pvp: ['fx-flag', 'flag'],
    tower: ['fx-bolt', 'bolt'],
    week: ['fx-calendar', 'clock'],
    season: ['rank-cup', 'rank'],
  }
  const ui = (n: string) => artOf(`ui:${n}`)?.src

  let {
    open,
    me,
    load,
    season,
    onclose,
  }: {
    open: boolean
    me: number | null
    load: (b: Board) => Promise<Ranks | null>
    season?: () => Promise<Season | null>
    onclose: () => void
  } = $props()

  let board = $state<Board | 'season'>('power')
  let data = $state<Ranks | null>(null)
  let sea = $state<Season | null>(null)
  $effect(() => {
    if (!open) return
    const b = board
    data = sea = null
    if (b === 'season') void season?.().then(d => board === 'season' && (sea = d))
    else void load(b).then(d => b === board && (data = d))
  })
  const value = (v: number) => (board === 'hall' ? L.realm(v) : num(v))
  const tabs = $derived<(Board | 'season')[]>(season ? [...BOARDS, 'season'] : [...BOARDS])
  // hàng chung cho bục + dòng: bảng thường (chạm: hồ sơ) và bảng mùa (theo phe, không có hồ sơ)
  type Row = { key: string | number; rank: number; name: string; v: string; pid?: number }
  const rows = $derived<Row[]>(
    board === 'season'
      ? (sea?.rows ?? []).map((r, k) => ({ key: k, rank: k + 1, name: r.name, v: num(r.pts) }))
      : (data?.rows ?? []).map(r => ({
          key: r.pid,
          rank: r.rank,
          name: r.name,
          v: value(board === 'hall' ? r.hall : r.v),
          pid: r.pid,
        })),
  )
  const myRank = $derived(board === 'season' ? sea?.me?.rank : data?.me?.rank)
  const mine = (r: Row) => (r.pid !== undefined ? r.pid === me : r.rank === myRank)
  const pick = (r: Row) => r.pid !== undefined && (social.profile = r.pid)
</script>

<!-- một hàng xếp hạng bấm được (bảng thường: mở hồ sơ) hoặc chỉ hiện (bảng mùa) -->
{#snippet line(r: Row)}
  <i class="rank-no r{r.rank}">{r.rank}</i>
  <span class="grow t-strong t-ellipsis">{r.name}</span>
  <b class="t-num t-gold">{r.v}</b>
{/snippet}

<Sheet {open} {onclose} title={L.rank.title}>
  <div class="boards" role="tablist">
    {#each tabs as id (id)}
      {@const src = ui(PIC[id][0])}
      <button
        role="tab"
        aria-selected={board === id}
        class:on={board === id}
        onclick={() => {
          if (board === id) return
          sfx('tap')
          board = id
        }}
        ><span class="pic"
          >{#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={PIC[id][1]} size={26} />{/if}</span
        ><span class="bn">{id === 'season' ? L.rank.season : L.rank.boards[id]}</span></button
      >
    {/each}
  </div>

  {#if board === 'season' && sea}
    <p class="t-tiny t-soft mt-2">{L.rank.seasonHint}</p>
    {#if sea.camps}
      <!-- Chính Tà Phân Tranh: hai tấm biển phái đối diện, phái mình viền son -->
      <div class="camps mt-2">
        {#each [0, 1] as const as c (c)}
          <span class="camp" class:mine={sea.camp === c}
            ><small>{L.camp.names[c]}</small><b class="t-num">{num(sea.camps[c])}</b></span
          >
        {/each}
      </div>
      <small class="t-tiny t-soft">{L.camp.hint(L.camp.names[sea.camp ?? 0])}</small>
      {#if sea.stage}
        <!-- chặng thi đua đang chạy: việc, giờ còn lại, điểm hai phái, phần mình góp -->
        {@const st = sea.stage}
        {@const tot = st.score[0] + st.score[1]}
        <div class="stage stack" style:--gap="4px">
          <b class="t-small"
            >{L.camp.stage(
              st.n + 1,
              L.camp.what[st.m as keyof typeof L.camp.what] ?? st.m,
              L.ago(Math.max(0, st.end - Date.now())),
            )}</b
          >
          <Meter value={tot ? st.score[0] / tot : 0.5} tone="azure" size="sm" label={L.camp.names[0]} />
          <p class="row between t-tiny">
            {#each [0, 1] as const as c (c)}
              <span class:t-gold={sea.camp === c}
                >{L.camp.names[c]} · {num(st.score[c])} · {L.camp.wins(st.wins[c])}</span
              >
            {/each}
          </p>
          <small class="t-tiny"
            >{L.camp.mine(num(st.mine))}{#if st.last && st.last.won !== null}
              · {L.camp.last(st.last.n + 1, L.camp.names[st.last.won])}{/if}</small
          >
          <small class="t-tiny t-soft">{L.camp.stageHint(CAMP_STAGE_PTS)}</small>
        </div>
      {/if}
    {/if}
  {/if}

  {#if (board === 'season' && sea) || (board !== 'season' && data)}
    {#if !rows.length}<p class="center t-lore mt-4">{L.rank.none}</p>{/if}
    {#if rows.length}
      <!-- bục vinh danh: hạng 2 · hạng 1 (cúp, cao nhất) · hạng 3 -->
      <ol class="podium">
        {#each [1, 0, 2] as k (k)}
          {@const r = rows[k]}
          {#if r}
            <li class="p{k + 1}" class:mine={mine(r)}>
              <button disabled={r.pid === undefined} aria-label={r.name} onclick={() => pick(r)}>
                {#if k === 0}<span class="cup"
                    >{#if ui('rank-cup')}<img src={ui('rank-cup')} alt="" draggable="false" />{:else}<Icon
                        name="rank"
                        size={36}
                      />{/if}</span
                  >{/if}
                <b class="nm">{r.name}</b>
                <small class="t-num t-gold">{r.v}</small>
                <span class="step"><i class="rank-no r{r.rank}">{r.rank}</i></span>
              </button>
            </li>
          {/if}
        {/each}
      </ol>
      <ol class="list">
        {#each rows.slice(3) as r (r.key)}
          <li class:mine={mine(r)}>
            {#if r.pid !== undefined}<button class="row" aria-label={r.name} onclick={() => pick(r)}
                >{@render line(r)}</button
              >{:else}<span class="row">{@render line(r)}</span>{/if}
          </li>
        {/each}
      </ol>
    {/if}
    {#if board === 'season' && sea?.fame.length}
      <h3 class="t-head mt-4">{L.rank.fame}</h3>
      <!-- bảng phong thần: mỗi mùa một dòng trên cuộn giấy -->
      <ul class="fame">
        {#each sea.fame as f (f.season)}
          <li class="t-small">
            <b>{L.rank.fameRow(f.season)}</b>
            <span>{f.top.map(t => t.name).join(' · ') || L.rank.none}</span>
          </li>
        {/each}
      </ul>
    {/if}
    <!-- hạng của mình ghim đáy bảng; còn bao nhiêu để lên một hạng (hạng trên có trong bảng), hay để vào bảng (như RoK) -->
    {#if board === 'season' && sea?.me}
      <p class="pin row">
        <i class="rank-no r{sea.me.rank}">{sea.me.rank}</i><span class="grow t-strong">{L.rank.me}</span><b
          class="t-num t-gold">{L.rank.pts(num(sea.me.pts))}</b
        >
      </p>
    {:else if board !== 'season' && data?.me}
      {@const my = data.me}
      {@const up = board === 'hall' ? undefined : data.rows.find(r => r.rank === my.rank - 1)}
      {@const last = data.rows.at(-1)}
      <div class="pin">
        <p class="row">
          <i class="rank-no r{my.rank}">{my.rank}</i><span class="grow t-strong">{L.rank.me}</span><b
            class="t-num t-gold">{value(my.v)}</b
          >
        </p>
        {#if up}<small class="t-tiny t-soft">{L.rank.need(num(up.v - my.v + 1), up.rank)}</small>
        {:else if board !== 'hall' && last && my.rank > last.rank}<small class="t-tiny t-soft"
            >{L.rank.needTop(num(last.v - my.v + 1), last.rank)}</small
          >{/if}
      </div>
    {/if}
  {/if}
</Sheet>

<style>
  /* ---------- dải thẻ bảng: tranh nhỏ + tên, cuộn ngang, thẻ đang xem nổi lên có vệt son ---------- */
  .boards {
    display: flex;
    gap: 6px;
    margin: 0 -8px;
    padding: 4px 8px 8px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1.5px solid var(--rim, var(--ink3));
  }
  .boards button {
    position: relative;
    display: grid;
    flex: none;
    justify-items: center;
    gap: 2px;
    width: 68px;
    padding: 4px 2px 5px;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.1;
    text-align: center;
    color: var(--text-faint);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 6px;
  }
  .pic {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    filter: saturate(0.6);
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .boards button.on {
    color: var(--text);
    background: var(--paper);
    border-color: var(--rim, var(--ink3));
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.14);
  }
  .boards button.on .pic {
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.25));
  }
  .boards button.on::before {
    content: '';
    position: absolute;
    inset: 2px 10px auto;
    height: 3px;
    border-radius: 2px;
    background: var(--cinnabar);
  }
  .bn {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  /* ---------- bục vinh danh ---------- */
  .podium {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    gap: 6px;
    margin: var(--sp-4) 0 0;
    padding: 0 4px;
    list-style: none;
    /* nền đất: dãy núi mờ sau bục */
    background: var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 260% auto no-repeat;
  }
  .podium button {
    display: grid;
    justify-items: center;
    gap: 1px;
    width: 100%;
    text-align: center;
    cursor: pointer;
  }
  .podium button:disabled {
    cursor: default;
  }
  .cup img {
    width: 64px;
    height: 64px;
    filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.25));
  }
  .nm {
    display: -webkit-box;
    max-width: 100%;
    overflow: hidden;
    font-size: var(--fs-2);
    line-height: 1.15;
    overflow-wrap: anywhere;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .podium small {
    font-size: var(--fs-1);
    line-height: 1.2;
  }
  /* bậc bục: khối giấy dày viền mực, hạng nhất cao nhất */
  .step {
    display: grid;
    place-items: start center;
    width: 100%;
    margin-top: 4px;
    padding-top: 8px;
    background: linear-gradient(var(--paper), var(--paper2));
    border: 1.5px solid var(--rim, var(--ink3));
    border-bottom: 0;
    border-radius: 4px 4px 0 0;
    box-shadow: inset 0 3px 0 rgb(255 255 255 / 0.7);
  }
  .p1 .step {
    height: 64px;
    border-top: 3px solid var(--cinnabar);
  }
  .p2 .step {
    height: 46px;
  }
  .p3 .step {
    height: 34px;
  }
  .podium .rank-no {
    min-width: 30px;
    height: 30px;
  }
  .podium .mine .nm {
    color: var(--cinnabar);
  }
  /* ---------- dòng gọn: hàng kẻ mực đứt ---------- */
  .list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1.5px solid var(--rim, var(--ink3));
  }
  .list li > .row {
    width: 100%;
    min-height: 40px;
    padding: 4px 6px;
    text-align: left;
    border-bottom: 1px dashed var(--paper3);
  }
  .list li.mine > .row {
    background: color-mix(in srgb, var(--cinnabar) 10%, transparent);
    border-radius: 6px;
  }
  /* hạng của mình: dải giấy ghim ở đáy bảng khi cuộn */
  .pin {
    position: sticky;
    bottom: -28px;
    z-index: 1;
    display: grid;
    gap: 1px;
    margin: var(--sp-3) -6px 0;
    padding: 8px 10px 9px;
    background: var(--paper);
    border: 1px solid var(--rim, var(--ink3));
    border-top: 3px solid var(--cinnabar);
    border-radius: 6px;
    box-shadow: 0 -4px 12px rgb(0 0 0 / 0.12);
  }
  /* ---------- mùa: hai biển phái, chặng thi đua, bảng phong thần ---------- */
  .camps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .camp {
    display: grid;
    justify-items: center;
    padding: 6px;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  .camp small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .camp b {
    font-size: var(--fs-5);
  }
  .camp.mine {
    border-color: var(--cinnabar);
    border-top-width: 3px;
  }
  .stage {
    margin-top: var(--sp-2);
    padding: 10px 12px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
  }
  .fame {
    display: grid;
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .fame li {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 8px;
    padding: 5px 2px;
    border-bottom: 1px dashed var(--paper3);
  }
</style>
