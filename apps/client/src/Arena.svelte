<script lang="ts">
  // Luận Kiếm Đài (như Sunset Canyon của RoK, bất đồng bộ): điểm + bậc, lượt hôm nay, rương ngày; thẻ Đối thủ (đội hình thủ
  // của họ, Luận kiếm → xem lại trận), Đội hình (thứ tự ra trận, hệ đệ tử của từng trưởng lão), Nhật ký, Bảng tuần.
  // Bố cục: đài đấu vẽ tay giữa, chân dung mình bên trái, biển điểm bên phải; rương ngày, trận vừa đánh, rồi các thẻ.
  import {
    ARENA_CHEST,
    ARENA_TRIES,
    ELDERS,
    ELDER_IDS,
    PVP_HALL,
    TYPES,
    arenaBand,
    arenaN,
    arenaOf,
    elderLevel,
    lineupOf,
    marchSlots,
    KY_SHOP,
    kyBought,
    type ArenaTeam,
    type BagId,
    type Report,
  } from '@rok/rules'
  import { canRevenge, type WorldAction } from '@rok/rules/world'
  import type { Ack, ArenaView } from '@rok/protocol'
  import type { Net } from './net'
  import { Icon, Portrait, artOf, type IconName } from '@rok/art'
  import { Bag, Button, Medal, Sheet } from './ui'
  import { L, LOOK, MASTER, num, sfx } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'

  let {
    api,
    send,
    me,
    onreplay,
  }: {
    api: Pick<Net, 'ask'> | null
    send: (a: WorldAction) => Promise<Ack>
    me: number | null
    onreplay: (r: Report) => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const ui = (n: string) => artOf(`ui:${n}`)?.src // đài đấu, khung ngọc, biển gỗ, rương vẽ tay; tắt art thì về Icon

  type Tab = 'foes' | 'lineup' | 'log' | 'board' | 'shop'
  // thẻ của đài: icon trên, tên dưới (năm thẻ chữ dài — thẻ kẹp sách thường bị cắt chữ trên điện thoại)
  const TABS: { id: Tab; icon: IconName; label: string }[] = [
    { id: 'foes', icon: 'swords', label: L.arena.foes },
    { id: 'lineup', icon: 'people', label: L.arena.lineup },
    { id: 'log', icon: 'scroll', label: L.arena.log },
    { id: 'board', icon: 'rank', label: L.arena.board },
    { id: 'shop', icon: 'star', label: L.arena.shop },
  ]
  let tab = $state<Tab>('foes')
  let view = $state.raw<ArenaView | null>(null)
  let last = $state.raw<Report | null>(null) // trận vừa đánh
  const load = () => api?.ask({ k: 'arena' }).then(v => (view = v))
  $effect(() => {
    if (social.arena) void load()
  })
  const a = $derived(arenaOf(game, now))
  const band = $derived(arenaBand(a.pts))
  // đội hình đang sửa (lưu mới gửi)
  let draft = $state<ArenaTeam[] | null>(null)
  const lineup = $derived(draft ?? lineupOf(game))
  const free = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined && !lineup.some(x => x.elder === e)))
  const edit = (f: (l: ArenaTeam[]) => ArenaTeam[]) => (draft = f([...lineup]))
  async function duel(pid: number, revenge = false) {
    const r = await send({ type: 'arena', pid, ...(revenge && { revenge: true }) })
    if (!r.ok) return
    sfx('march')
    last = r.rep?.find(x => x.kind === 'arena') ?? null
    void load()
  }
</script>

<!-- chân dung chưởng môn (hoặc trưởng lão đã chọn) trong khung ngọc -->
{#snippet face(size: number)}
  <span class="face" style:--s="{size}px"
    ><Portrait look={game.face ? LOOK[game.face] : MASTER} {size} />{#if ui('frame-portrait')}<img
        src={ui('frame-portrait')}
        alt=""
        draggable="false"
      />{/if}</span
  >
{/snippet}

<Sheet open={social.arena} onclose={() => (social.arena = false)} title={L.arena.title}>
  {#if game.levels.chuDien < PVP_HALL}
    <p class="t-lore">{L.arena.lore}</p>
    <p class="t-small t-soft">{L.arena.locked}</p>
  {:else}
    <div class="stack">
      <!-- đài đấu: mình bên trái, tranh đài giữa (dải son ghi bậc), biển gỗ ghi điểm + hạng tuần bên phải -->
      <header class="dais">
        <div class="me">
          {@render face(52)}
          <b class="t-tiny t-ellipsis">{game.name}</b>
        </div>
        <div class="stage">
          {#if ui('ev-arena')}<img src={ui('ev-arena')} alt="" draggable="false" />{:else}<Icon
              name="swords"
              size={56}
            />{/if}
          <span class="band">{L.arena.band[band]}</span>
        </div>
        <div class="sign" class:art={!!ui('signboard')} style:--sign={ui('signboard') && `url(${ui('signboard')})`}>
          <b class="t-num">{num(a.pts)}</b>
          <small>{L.arena.pts}</small>
          {#if view?.rank}<small class="t-strong t-gold">{L.arena.rank(view.rank)}</small>{/if}
        </div>
        <p class="tries">
          <span class="pips" aria-hidden="true"
            >{#each { length: Math.max(ARENA_TRIES, a.left) } as _, i (i)}<span class:used={i >= a.left}
                ><Icon name="swords" size={15} /></span
              >{/each}</span
          >
          <small class="grow">{L.arena.left(a.left, ARENA_TRIES)}</small>
          <b class="t-small t-gold t-num">{L.arena.ky} {num(a.ky ?? 0)}</b>
        </p>
      </header>
      <p class="lore t-tiny t-lore" title={L.arena.lore}>{L.arena.lore}</p>
      <!-- hết lượt mà còn Luận Kiếm Lệnh (từ Nhật Khóa): thêm một lượt -->
      {#if a.left < 1 && (game.items.luanKiem ?? 0) > 0}<Button
          size="sm"
          variant="gold"
          icon="swords"
          onclick={() => g.act({ type: 'arenaTicket' }, 'reward')}>{L.arena.ticket(game.items.luanKiem ?? 0)}</Button
        >{/if}

      <!-- rương ngày theo bậc: đã mở hôm nay thì đóng dấu son -->
      <div class="chest">
        {#if ui('fx-treasure')}<img src={ui('fx-treasure')} alt="" draggable="false" />{:else}<Icon
            name="star"
            size={30}
          />{/if}
        <span class="grow stack" style:--gap="2px"
          ><small class="t-tiny t-strong">{L.arena.chest(L.arena.band[band])}</small><Bag
            items={ARENA_CHEST[band].items}
            size="sm"
          /></span
        >
        {#if a.chest === a.day}<span class="stamp">{L.mail.got}</span>{:else}<Button
            size="sm"
            variant="gold"
            onclick={() => g.act({ type: 'arenaChest' }, 'reward')}>{L.arena.open}</Button
          >{/if}
      </div>

      {#if last}
        <!-- trận vừa đánh: chân dung mình, kết quả, dấu thắng / thua đóng góc -->
        <div class="bout" class:win={last.win}>
          {@render face(38)}
          <span class="grow stack" style:--gap="0"
            ><b class="t-small" class:t-good={last.win} class:t-bad={!last.win}
              >{L.arena.result(last.win, a.log[0]?.delta ?? 0)}</b
            >{#if a.log[0]}<small class="t-tiny t-soft">{a.log[0].foe}</small>{/if}</span
          >
          <Button size="sm" variant="ghost" icon="swords" onclick={() => last && onreplay(last)}
            >{L.report.replay}</Button
          >
          <span class="stamp mark" class:lose={!last.win}>{last.win ? L.report.win : L.report.lose}</span>
        </div>
      {/if}

      <div class="modes" role="tablist">
        {#each TABS as t (t.id)}
          <button
            role="tab"
            aria-selected={tab === t.id}
            class:on={tab === t.id}
            onclick={() => {
              if (tab === t.id) return
              sfx('tap')
              tab = t.id
            }}><Icon name={t.icon} size={20} /><span>{t.label}</span></button
          >
        {/each}
      </div>

      {#if tab === 'foes'}
        <!-- đối thủ: dòng gọn kẻ mực đứt — tên, cảnh giới, điểm, nút luận kiếm; đội hình thủ của họ bên dưới -->
        <ul class="rows">
          {#each view?.foes ?? [] as f (f.pid)}
            <li class="foe">
              <div class="row">
                <span class="grow stack" style:--gap="0"
                  ><b class="t-ellipsis">{f.name}</b><small class="t-tiny t-soft"
                    >{L.realm(f.hall)} · {L.arena.pts} {num(f.pts)}</small
                  ></span
                >
                <Button size="sm" variant="gold" icon="swords" disabled={a.left < 1} onclick={() => duel(f.pid)}
                  >{L.arena.fight}</Button
                >
              </div>
              <div class="teams">
                {#each f.lineup as x (x.elder)}
                  <span class="team"
                    ><Portrait look={LOOK[x.elder]} size={26} /><small class="t-tiny"
                      ><b>{L.elders[x.elder].name}</b> · {L.units[x.type]}<br />{L.arena.team(x.lv, x.n)}</small
                    ></span
                  >
                {/each}
              </div>
            </li>
          {/each}
          {#if view && !view.foes.length}<li class="t-small t-soft">{L.arena.noFoes}</li>{/if}
        </ul>
        <Button size="sm" variant="quiet" icon="swords" onclick={load}>{L.arena.refresh}</Button>
      {:else if tab === 'lineup'}
        <p class="t-tiny t-soft">{L.arena.lineupHint(marchSlots(game))}</p>
        <!-- thứ tự ra trận: số son, chân dung, hệ đệ tử chọn bằng ba nấc -->
        <ol class="rows">
          {#each lineup as x, k (x.elder)}
            <li class="slot">
              <div class="row">
                <i class="rank-no">{k + 1}</i>
                <Portrait look={LOOK[x.elder]} size={34} />
                <span class="grow stack" style:--gap="0"
                  ><b class="t-small t-ellipsis">{L.elders[x.elder].name}</b><small class="t-tiny t-soft"
                    >{L.arena.team(elderLevel(game.elders[x.elder]), arenaN(game, x.elder))}</small
                  ></span
                >
                {#if k > 0}<Button
                    size="sm"
                    variant="quiet"
                    label={L.arena.up}
                    onclick={() => edit(l => [...l.slice(0, k - 1), l[k], l[k - 1], ...l.slice(k + 1)])}
                    ><span class="up"><Icon name="arrow" size={14} /></span></Button
                  >{/if}
                <Button size="sm" variant="quiet" onclick={() => edit(l => l.filter((_, i) => i !== k))}
                  >{L.arena.remove}</Button
                >
              </div>
              <div class="units">
                {#each TYPES as ty (ty)}
                  <button
                    class:on={x.type === ty}
                    aria-pressed={x.type === ty}
                    onclick={() => {
                      sfx('tap')
                      edit(l => l.map((y, i) => (i === k ? { ...y, type: ty } : y)))
                    }}>{L.units[ty]}</button
                  >
                {/each}
              </div>
            </li>
          {/each}
        </ol>
        {#if lineup.length < marchSlots(game) && free.length}
          <div class="row wrap" style:--gap="6px">
            {#each free as e (e)}
              <button
                class="add"
                aria-label="{L.arena.add}: {L.elders[e].name}"
                onclick={() => {
                  sfx('tap')
                  edit(l => [...l, { elder: e, type: ELDERS[e].type }])
                }}><Portrait look={LOOK[e]} size={22} /><Icon name="plus" size={12} />{L.elders[e].name}</button
              >
            {/each}
          </div>
        {/if}
        <Button
          variant="gold"
          wide
          disabled={!draft}
          onclick={() => {
            if (draft && g.act({ type: 'arenaSet', lineup: draft }, 'reward')) draft = null
          }}>{L.arena.save}</Button
        >
      {:else if tab === 'log'}
        <ul class="rows">
          {#each a.log as e, k (k)}
            <li class="row t-small">
              <Medal emblem={e.win ? 'win' : 'lose'} tone={e.win ? 'red' : 'ink'} size={26} />
              <span class="grow"
                >{#if e.def}{e.win ? L.arena.held(e.foe, e.delta) : L.arena.fell(e.foe, e.delta)}{:else}{e.win
                    ? L.arena.won(e.foe, e.delta)
                    : L.arena.lost(e.foe, e.delta)}{/if}</span
              >
              <!-- phục thù: người vừa thắng mình lúc giữ đài, mỗi ngày một lần, không tốn lượt -->
              {#if e.def && !e.win && canRevenge(game, e.pid, now)}<Button
                  size="sm"
                  variant="danger"
                  icon="swords"
                  onclick={() => duel(e.pid, true)}>{L.arena.revenge}</Button
                >{/if}
            </li>
          {/each}
          {#if !a.log.length}<li class="t-small t-soft">{L.arena.noLog}</li>{/if}
        </ul>
      {:else if tab === 'shop'}
        <!-- Luận Kiếm Thương Điếm: Kiếm Ý từ mỗi trận và rương ngày, mỗi món có hạn mỗi tuần -->
        <ul class="goods">
          {#each KY_SHOP as x, i (x.item)}
            {@const n = kyBought(game, now)[i]}
            <li class="good">
              <ItemCell id={x.item as BagId} n={x.n} />
              <b class="t-tiny">{itemName(x.item as BagId)}</b>
              <small class="t-tiny t-num">{L.arena.ky} {num(x.price)} · {L.arena.limit(n, x.week)}</small>
              <Button
                size="sm"
                variant="gold"
                wide
                disabled={n >= x.week || (a.ky ?? 0) < x.price}
                onclick={() => g.act({ type: 'arenaBuy', i }, 'reward')}>{L.arena.buy}</Button
              >
            </li>
          {/each}
        </ul>
      {:else}
        <!-- bảng tuần: đồng tiền vàng / bạc / đồng cho ba hạng đầu, dòng của mình tô son -->
        <ol class="rows board">
          {#each view?.board ?? [] as r, k (r.pid)}
            <li class="row between t-small" class:mine={r.pid === me}>
              <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>{r.name}</span><b class="t-num"
                >{num(r.pts)}</b
              >
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  /* ---------- đài đấu ---------- */
  .dais {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) 96px;
    gap: 2px 6px;
    align-items: center;
    padding: 10px 8px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .me {
    display: grid;
    justify-items: center;
    gap: 6px;
    min-width: 0;
  }
  .me b {
    max-width: 100%;
  }
  .face {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: var(--s);
    height: var(--s);
    filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.25));
  }
  /* khung ngọc vẽ tay trùm quanh chân dung (như cố vấn ở Advisor) */
  .face img {
    position: absolute;
    inset: -14%;
    width: 128%;
    height: 128%;
  }
  .stage {
    position: relative;
    display: grid;
    justify-items: center;
  }
  .stage img {
    width: min(100%, 132px);
    rotate: -2deg;
    filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.25));
  }
  /* dải son đuôi én ghi bậc đài, vắt ngang chân tranh */
  .band {
    margin-top: -14px;
    padding: 1px 16px 2px;
    font-size: var(--fs-2);
    font-weight: 900;
    color: var(--text-inv);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%, 7px 50%);
  }
  /* biển điểm: tấm giấy ghim trên biển gỗ vẽ tay (tắt art: tấm biển giấy viền mực) */
  .sign {
    display: grid;
    align-content: center;
    justify-items: center;
    min-height: 72px;
    padding: 6px 4px;
    text-align: center;
    line-height: 1.15;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  .sign.art {
    align-content: start;
    height: 100px;
    padding: 17px 14px 0;
    background: var(--sign) center / 100% 100% no-repeat;
    border: 0;
  }
  .sign b {
    font-size: var(--fs-5);
  }
  .sign small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .sign small.t-gold {
    color: var(--gold-d);
  }
  .tries {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px dashed var(--paper3);
  }
  .pips {
    display: flex;
    gap: 1px;
    color: var(--cinnabar);
  }
  .pips .used {
    opacity: 0.22;
    color: var(--text);
  }
  .tries small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .lore {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  /* ---------- rương ngày, trận vừa đánh ---------- */
  .chest,
  .bout {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px 6px 6px;
    background: rgb(255 255 255 / 0.55);
    border: 1px solid var(--paper3);
    border-radius: 4px;
  }
  .chest img {
    width: 52px;
    height: 52px;
    margin: -4px 0;
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.2));
  }
  .bout {
    padding: 8px 10px;
    border-left: 3px solid var(--text-soft);
  }
  .bout.win {
    border-left-color: var(--cinnabar);
    box-shadow: 0 0 12px rgb(var(--gold-glow) / 0.45);
  }
  .mark {
    position: absolute;
    top: -10px;
    left: 58px;
    background: var(--paper);
  }
  .mark.lose {
    color: var(--text-soft);
  }
  /* ---------- thẻ của đài: icon + tên, thẻ đang mở trắng, vệt son đầu ---------- */
  .modes {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    margin-top: var(--sp-2);
    padding-bottom: 4px;
    border-bottom: 1.5px solid var(--rim, var(--ink3));
  }
  .modes button {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 1px;
    min-height: 52px;
    padding: 5px 2px 4px;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.1;
    text-align: center;
    color: var(--text-faint);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 6px 6px 2px 2px;
  }
  .modes button.on {
    color: var(--text);
    background: var(--paper);
    border-color: var(--rim, var(--ink3));
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.1);
  }
  .modes button.on::before {
    content: '';
    position: absolute;
    inset: 2px 8px auto;
    height: 3px;
    border-radius: 2px;
    background: var(--cinnabar);
  }
  .modes button.on :global(.icon) {
    color: var(--cinnabar);
  }
  /* ---------- danh sách gọn: hàng kẻ mực đứt ---------- */
  .rows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows > li {
    padding: 8px 2px;
    border-bottom: 1px dashed var(--paper3);
  }
  .teams {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
    margin-top: 6px;
  }
  .team {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 1px 8px 1px 1px;
    line-height: 1.2;
    background: rgb(255 255 255 / 0.6);
    border: 1px solid var(--paper3);
    border-radius: 999px;
  }
  .slot .rank-no {
    color: var(--text-inv);
    background: var(--cinnabar);
    border-radius: 50%;
    min-width: 24px;
    height: 24px;
  }
  .up {
    display: grid;
    rotate: -90deg;
  }
  /* hệ đệ tử: ba nấc liền nhau, nấc chọn tô son */
  .units {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin: 6px 0 0 32px;
    border: 1px solid var(--rim, var(--ink3));
    border-radius: 6px;
    overflow: hidden;
  }
  .units button {
    min-height: 34px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-soft);
    background: rgb(255 255 255 / 0.5);
  }
  .units button + button {
    border-left: 1px solid var(--paper3);
  }
  .units button.on {
    color: var(--text-inv);
    background: var(--cinnabar);
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 34px;
    padding: 2px 10px 2px 3px;
    font-size: var(--fs-2);
    font-weight: 700;
    background: rgb(255 255 255 / 0.6);
    border: 1px dashed var(--rim, var(--ink3));
    border-radius: 999px;
  }
  .board li {
    padding: 5px 6px;
  }
  .board li.mine {
    font-weight: 800;
    background: color-mix(in srgb, var(--cinnabar) 10%, transparent);
    border-radius: 6px;
  }
  /* ---------- thương điếm: món hàng trên thẻ khung đôi ---------- */
  .goods {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .good {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 10px 8px;
    text-align: center;
    border: 0 solid transparent;
    border-image: var(--sk-card);
  }
</style>
