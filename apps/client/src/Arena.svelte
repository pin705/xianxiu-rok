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
    arenaUpper,
    elderLevel,
    lineupOf,
    marchSlots,
    KY_SHOP,
    ROYALE_DAILY,
    DAIBI_DAILY,
    DAIBI_HALL,
    DAIBI_TACTICS,
    DAIBI_TEAM,
    type DaibiTactic,
    ROYALE_HALL,
    ROYALE_N,
    kyBought,
    type ArenaTeam,
    type BagId,
    type Report,
  } from '@rok/rules'
  import { canRevenge, daibiUsed, royaleUsed, type WorldAction } from '@rok/rules/world'
  import type { Ack, ArenaView } from '@rok/protocol'
  import type { Net } from './net'
  import { Icon, Portrait, type IconName } from '@rok/art'
  import {
    Art,
    Bag,
    Button,
    Capsule,
    Card,
    Dais,
    Docket,
    Face,
    Medal,
    Pips,
    Segmented,
    Sheet,
    Signboard,
    Tabs,
    Tag,
  } from './ui'
  import Tourney from './Tourney.svelte'
  import SilverCard from './SilverCard.svelte'
  import VanchuCard from './VanchuCard.svelte'
  import MysticCard from './MysticCard.svelte'
  import BalladCard from './BalladCard.svelte'
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

  type Tab = 'foes' | 'lineup' | 'log' | 'board' | 'shop' | 'royale' | 'daibi'
  // thẻ của đài: icon trên, tên dưới (năm thẻ chữ dài — thẻ kẹp sách thường bị cắt chữ trên điện thoại)
  const TABS: { id: Tab; icon: IconName; label: string }[] = [
    { id: 'foes', icon: 'swords', label: L.arena.foes },
    { id: 'lineup', icon: 'people', label: L.arena.lineup },
    { id: 'log', icon: 'scroll', label: L.arena.log },
    { id: 'board', icon: 'rank', label: L.arena.board },
    { id: 'shop', icon: 'star', label: L.arena.shop },
    { id: 'royale', icon: 'skull', label: L.royale.tab },
    { id: 'daibi', icon: 'flag', label: L.daibi.tab },
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
  let tactic = $state<DaibiTactic>('even') // Tiên Môn Đại Bỉ: chiến thuật chọn trước khi vào hàng
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

<Sheet open={social.arena} onclose={() => (social.arena = false)} title={L.arena.title}>
  {#if game.levels.chuDien < PVP_HALL}
    <p class="t-lore">{L.arena.lore}</p>
    <p class="t-small t-soft">{L.arena.locked}</p>
  {:else}
    {@const look = game.face ? LOOK[game.face] : MASTER}
    <div class="stack">
      <!-- đài đấu: mình bên trái (chân dung khung ngọc), tranh đài giữa (dải son ghi bậc), biển gỗ ghi điểm + hạng tuần -->
      <Dais art="ev-arena" icon="swords" band={L.arena.band[band]}>
        {#snippet left()}<Face {look} size={52} /><b class="t-tiny t-ellipsis">{game.name}</b>{/snippet}
        {#snippet right()}<Signboard value={num(a.pts)} label={L.arena.pts}
            >{#if view?.rank}<small class="t-strong t-gold">{L.arena.rank(view.rank)}</small>{/if}</Signboard
          >{/snippet}
        {#snippet foot()}<p class="ruled-top row">
            <Pips total={ARENA_TRIES} left={a.left} />
            <small class="grow t-tiny t-soft">{L.arena.left(a.left, ARENA_TRIES)}</small>
            <b class="t-small t-gold t-num">{L.arena.ky} {num(a.ky ?? 0)}</b>
          </p>{/snippet}
      </Dais>
      <p class="clamp t-tiny t-lore" title={L.arena.lore}>{L.arena.lore}</p>
      {#if arenaUpper(game)}<Tag icon="star" tone="gold">{L.arena.upper}</Tag>{/if}
      <!-- hết lượt mà còn Luận Kiếm Lệnh (từ Nhật Khóa): thêm một lượt -->
      {#if a.left < 1 && (game.items.luanKiem ?? 0) > 0}<Button
          size="sm"
          variant="gold"
          icon="swords"
          onclick={() => g.act({ type: 'arenaTicket' }, 'reward')}>{L.arena.ticket(game.items.luanKiem ?? 0)}</Button
        >{/if}

      <!-- rương ngày theo bậc: đã mở hôm nay thì đóng dấu son -->
      <Docket>
        <Art art="fx-treasure" icon="star" size={52} />
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
      </Docket>

      {#if last}
        <!-- trận vừa đánh: chân dung mình, kết quả, dấu thắng / thua đóng góc -->
        <Docket
          edge={last.win ? 'red' : 'ink'}
          glow={last.win}
          mark={last.win ? L.report.win : L.report.lose}
          markTone={last.win ? 'red' : 'ink'}
        >
          <Face {look} size={38} />
          <span class="grow stack" style:--gap="0"
            ><b class="t-small" class:t-good={last.win} class:t-bad={!last.win}
              >{L.arena.result(last.win, a.log[0]?.delta ?? 0)}</b
            >{#if a.log[0]}<small class="t-tiny t-soft">{a.log[0].foe}</small>{/if}</span
          >
          <Button size="sm" variant="ghost" icon="swords" onclick={() => last && onreplay(last)}
            >{L.report.replay}</Button
          >
        </Docket>
      {/if}

      <!-- thẻ của đài: icon trên, tên dưới, chia đều bề ngang -->
      <Tabs look="chips" fit items={TABS} value={tab} onchange={t => (tab = t)} />

      {#if tab === 'foes'}
        <!-- đối thủ: dòng gọn kẻ mực đứt — tên, cảnh giới, điểm, nút luận kiếm; đội hình thủ của họ bên dưới -->
        <ul class="ledger">
          {#each view?.foes ?? [] as f (f.pid)}
            <li>
              <div class="grow stack" style:--gap="6px">
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
                <div class="row wrap" style:--gap="4px 6px">
                  {#each f.lineup as x (x.elder)}
                    <Capsule
                      >{#snippet pic()}<Portrait look={LOOK[x.elder]} size={26} />{/snippet}<small class="t-tiny"
                        ><b>{L.elders[x.elder].name}</b> · {L.units[x.type]}<br />{L.arena.team(x.lv, x.n)}</small
                      ></Capsule
                    >
                  {/each}
                </div>
              </div>
            </li>
          {/each}
          {#if view && !view.foes.length}<li class="t-small t-soft">{L.arena.noFoes}</li>{/if}
        </ul>
        <Button size="sm" variant="quiet" icon="swords" onclick={load}>{L.arena.refresh}</Button>
      {:else if tab === 'lineup'}
        <p class="t-tiny t-soft">{L.arena.lineupHint(marchSlots(game))}</p>
        <!-- thứ tự ra trận: số son, chân dung, hệ đệ tử chọn bằng ba nấc -->
        <ol class="ledger">
          {#each lineup as x, k (x.elder)}
            <li>
              <div class="grow stack" style:--gap="6px">
                <div class="row">
                  <i class="rank-no red">{k + 1}</i>
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
                      ><span class="row" style:rotate="-90deg"><Icon name="arrow" size={14} /></span></Button
                    >{/if}
                  <Button size="sm" variant="quiet" onclick={() => edit(l => l.filter((_, i) => i !== k))}
                    >{L.arena.remove}</Button
                  >
                </div>
                <!-- lùi vào ngang chân dung -->
                <div class="split" style:--gap="0">
                  <span style:width="32px"></span>
                  <Segmented
                    items={TYPES.map(ty => ({ id: ty, label: L.units[ty] }))}
                    value={x.type}
                    onchange={ty => edit(l => l.map((y, i) => (i === k ? { ...y, type: ty } : y)))}
                  />
                </div>
              </div>
            </li>
          {/each}
        </ol>
        {#if lineup.length < marchSlots(game) && free.length}
          <div class="row wrap" style:--gap="6px">
            {#each free as e (e)}
              <Capsule
                dashed
                icon="plus"
                label="{L.arena.add}: {L.elders[e].name}"
                onclick={() => {
                  sfx('tap')
                  edit(l => [...l, { elder: e, type: ELDERS[e].type }])
                }}>{#snippet pic()}<Portrait look={LOOK[e]} size={22} />{/snippet}{L.elders[e].name}</Capsule
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
        <ul class="ledger">
          {#each a.log as e, k (k)}
            <li class="t-small">
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
        <ul class="fill plain" style:--min="140px">
          {#each KY_SHOP as x, i (x.item)}
            {@const n = kyBought(game, now)[i]}
            <li>
              <Card
                ><div class="stack justify-center t-center" style:--gap="3px">
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
                </div></Card
              >
            </li>
          {/each}
        </ul>
      {:else if tab === 'royale'}
        <!-- Cổ Khư Loạn Chiến: hàng chờ cả giới, đủ 8 tông môn (chờ lâu thì bù NPC) thì loạn chiến, hạng ra điểm — kết quả qua thư -->
        {@const used = royaleUsed(game, now)}
        <p class="t-small t-soft">{L.royale.hint(ROYALE_N, ROYALE_DAILY)}</p>
        <Card tone="silk">
          <div class="stack" style:--gap="6px">
            <p class="row between t-small">
              <b>{L.royale.queue(view?.royale.q ?? 0, ROYALE_N)}</b><span class="t-gold"
                >{L.royale.pts(game.royale?.pts ?? 0)}</span
              >
            </p>
            <small class="t-tiny t-soft">{L.royale.left(ROYALE_DAILY - used, ROYALE_DAILY)}</small>
            {#if view?.royale.mine}
              <Button variant="ghost" onclick={() => send({ type: 'royaleLeave' }).then(load)}>{L.royale.leave}</Button>
            {:else}
              <Button
                variant="gold"
                icon="swords"
                disabled={used >= ROYALE_DAILY || game.levels.chuDien < ROYALE_HALL}
                onclick={() => send({ type: 'royaleJoin' }).then(load)}
                >{game.levels.chuDien < ROYALE_HALL ? L.royale.locked(ROYALE_HALL) : L.royale.join}</Button
              >
            {/if}
          </div>
        </Card>
      {:else if tab === 'daibi'}
        <!-- Tiên Môn Đại Bỉ: chọn chiến thuật (3 đội đứng ở cờ nào), vào hàng; đủ 10 người thì chia đội, giải 3 hiệp — kết quả qua thư -->
        {@const used = daibiUsed(game, now)}
        <p class="t-small t-soft">{L.daibi.hint(DAIBI_TEAM, DAIBI_DAILY)}</p>
        <Card tone="silk">
          <div class="stack" style:--gap="6px">
            <p class="row between t-small">
              <b>{L.daibi.queue(view?.daibi.q ?? 0, 2 * DAIBI_TEAM)}</b><span class="t-gold"
                >{L.daibi.wins(game.daibi?.win ?? 0)}</span
              >
            </p>
            <small class="t-tiny t-soft">{L.daibi.left(DAIBI_DAILY - used, DAIBI_DAILY)}</small>
            {#if view?.daibi.mine}
              <Button variant="ghost" onclick={() => send({ type: 'daibiLeave' }).then(load)}>{L.daibi.leave}</Button>
            {:else}
              <div class="row wrap" style:--gap="4px">
                {#each Object.keys(DAIBI_TACTICS) as DaibiTactic[] as k (k)}
                  <Button size="sm" variant={tactic === k ? 'gold' : 'ghost'} onclick={() => (tactic = k)}
                    >{L.daibi.tactics[k]}</Button
                  >
                {/each}
              </div>
              <Button
                variant="gold"
                icon="flag"
                disabled={used >= DAIBI_DAILY || game.levels.chuDien < DAIBI_HALL}
                onclick={() => send({ type: 'daibiJoin', tactic }).then(load)}
                >{game.levels.chuDien < DAIBI_HALL ? L.royale.locked(DAIBI_HALL) : L.daibi.join}</Button
              >
            {/if}
          </div>
        </Card>
        <SilverCard q={view?.silver.q ?? 0} mine={!!view?.silver.mine} {send} onchange={load} />
        <VanchuCard q={view?.vanchu.q ?? 0} mine={!!view?.vanchu.mine} {send} onchange={load} />
        <MysticCard view={view?.mystic} {send} onchange={load} />
        <BalladCard view={view?.ballad} {send} onchange={load} />
      {:else}
        <!-- bảng tuần: đồng tiền vàng / bạc / đồng cho ba hạng đầu, dòng của mình tô son -->
        <ol class="ledger">
          {#each view?.board ?? [] as r, k (r.pid)}
            <li class="between t-small" class:on={r.pid === me}>
              <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>{r.name}</span><b class="t-num"
                >{num(r.pts)}</b
              >
            </li>
          {/each}
        </ol>
        <Tourney cup={view?.cup} {api} {me} {onreplay} />
      {/if}
    </div>
  {/if}
</Sheet>
