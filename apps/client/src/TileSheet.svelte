<script lang="ts">
  // Chạm trên bản đồ giới: tông môn (thông tin, đường đi, cướp), điểm (ai giữ, mỏ còn bao nhiêu, yêu vương còn máu; chiếm /
  // khai / đánh; gọi đội về), đội hành quân, ô trống (vùng, vòng, thời tiết). Luật ở rules/world.ts, server kiểm lại.
  // Mọi chỗ có toạ độ: chia sẻ vào chat (kênh minh / giới), trưởng lão / minh chủ đặt dấu cho cả minh.
  import {
    RUNE_HOURS,
    RUNE_KINDS,
    RUNE_TIERS,
    SPY_COST,
    VEIN_HOLD,
    AP_HUNT,
    AP_MAX,
    BEATS,
    TYPES,
    CHAT_HALL,
    MINE_STOCK,
    MOVE_COOL,
    VILLAGE_GIFTS,
    CAVE_GIFTS,
    cellOf,
    clear,
    cranes,
    cranesOut,
    fogOf,
    fold,
    FLAG_COST,
    FLAG_GUARD_MAX,
    FORT_BUILD,
    ALLY_MINE_BUILD,
    ALLY_MINE_COST,
    ALLY_MINE_LIFE,
    ALLY_MINE_STOCK,
    FORT_COST,
    FORT_MAX,
    FORT_MIN,
    FORT_PER,
    FORT_R,
    PVP_HALL,
    BOSSES,
    LOHAR_BONES,
    LOHAR_HP,
    apOf,
    armySpeed,
    count,
    cutOf,
    might,
    type Army,
    type ElderId,
  } from '@rok/rules'
  import { RALLY_WAIT, RESOURCES } from '@rok/rules'
  import {
    TILE_TIME,
    bossSlice,
    guardSide,
    wildSide,
    dayIn,
    craneTime,
    frontier,
    sitesOf,
    flagCap,
    fortCap,
    flagHp,
    flagMax,
    newbieMove,
    ringOpen,
    ownerAt,
    phaseOf,
    snapClaims,
    campTile,
    buildRate,
    raidChance,
    regionOf,
    route,
    ruinWindow,
    contestWindow,
    veinBuffs,
    weather,
    TASK_OF,
    recallable,
    shutFrom,
    type AllyInfo,
    type Atlas,
    type MapMarch,
    type MapSnap,
    type Task,
    type WorldAction,
  } from '@rok/rules/world'
  import type { Ack, Channel, WorldInfo } from '@rok/protocol'
  import type { Net } from './net'
  import { artOf, landAt } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import Help from './Help.svelte'
  import { Bag, Button, Card, Medal, Meter, Section, Sheet, Stat, Tabs, Tag } from './ui'
  import { EMBLEM, L, clock, marchDoing, num, pointName, sfx, spotName } from './lib'
  import type { Pick } from './world/worldmap'
  import { useGame } from './game'
  import { social } from './social.svelte'
  import Rescue from './Rescue.svelte'

  let {
    info,
    atlas,
    me,
    snap,
    pick,
    ally = null,
    onclose,
    onraid,
    send,
    say,
  }: {
    info: WorldInfo
    atlas: Atlas
    me: number | null
    snap: MapSnap | null
    pick: Pick | null
    ally?: AllyInfo | null // tiên minh của mình: kết trận, viện binh
    onclose: () => void
    onraid: (pid: number) => void
    send: (a: WorldAction) => Promise<Ack>
    say?: Net['say'] // gửi toạ độ vào chat
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const busy = $derived(g.busy)

  const phase = $derived(phaseOf(dayIn(info.opened, now), snap?.book?.done))
  const regionName = (r: number) => `${L.world.regions[r] ?? r} · ${L.world.ring[atlas.regions[r].ring]}`
  // cửa ải: trận nhãn phe khác đang giữ (không minh ước) chặn đường
  const shut = $derived(
    snap
      ? shutFrom(
          snap.spots.map(s => [s.i, s.side] as [number, number | undefined]),
          atlas.gates.length,
          ally?.id ?? -(me ?? 0),
          ally?.naps,
        )
      : undefined,
  )
  // đường đi từ tông môn mình; null: chưa có đường (cổng chưa mở, hay cửa ải bị chặn — farText nói rõ)
  const road = (to: { x: number; y: number }) => (game.seat ? route(atlas, game.seat, to, phase, shut) : null)
  const farText = (to: { x: number; y: number }) =>
    game.seat && shut?.size && route(atlas, game.seat, to, phase) ? L.err.blocked : L.err.far
  const time = (len: number, a?: Army) => clock((len * TILE_TIME * cutOf(game, 'march')) / (a ? armySpeed(a, game) : 1))
  const seat = $derived(pick?.kind === 'seat' ? snap?.seats.find(s => s.pid === pick.pid) : undefined)
  const point = $derived(pick?.kind === 'point' ? atlas.points[pick.i] : undefined)
  const spot = $derived(point ? snap?.spots.find(s => s.i === point.i) : undefined)
  const march = $derived(
    pick?.kind === 'march' ? snap?.marches.find(m => m.pid === pick.pid && m.id === pick.id) : undefined,
  )
  const mine = $derived(point ? game.marches.find(m => m.target.kind === 'spot' && m.target.i === point.i) : undefined)
  // khám phá: thôn trang / động phủ đang chạm; mê vụ của mình, linh điểu
  const site = $derived(pick?.kind === 'site' ? sitesOf(atlas)[pick.i] : undefined)
  const fog = $derived(fogOf(game))
  const freeCranes = $derived(cranes(game) - cranesOut(fold(fog, now), now))
  // tranh đầu bảng: thôn trang / động phủ (lữ khách nhìn núi), ô mê vụ (hạc linh điểu); tắt art thì không có tranh
  const ui = (n: string) => artOf(`ui:${n}`)?.src
  const fogged = $derived(pick?.kind === 'tile' && !!game.seat && !clear(fog, cellOf(pick).cx, cellOf(pick).cy, now))
  async function visit(i: number) {
    if (!(await send({ type: 'visit', i })).ok) return
    sfx('reward')
    onclose()
  }
  const title = $derived.by(() => {
    if (seat) return seat.name
    if (point)
      return point.kind === 'ruin' || point.kind === 'altar'
        ? spotName(point.kind)
        : `${pointName(point)} · ${L.lv(point.lv)}`
    if (march) return snap?.seats.find(s => s.pid === march.pid)?.name ?? ''
    if (site) return site.kind === 'village' ? L.world.explore.village : L.world.explore.cave
    return pick?.kind === 'tile' ? regionName(regionOf(atlas, pick)) : ''
  })
  // cách xuất quân tới điểm: một mình, mở kết trận (chờ 5/10/30 phút), hay góp vào kết trận đang mở
  let way = $state<'solo' | 'rally' | number>('solo')
  let wait = $state<0 | 1 | 2>(1)
  $effect(() => {
    if (!pick) return
    way = 'solo'
    guarding = false
    prey = null
  })
  const rallies = $derived(
    point && ally ? ally.rallies.filter(r => r.task !== 'raid' && r.i === point.i && r.at > now) : [],
  )
  const isAlly = (pid: number) => !!ally?.people.some(p => p.pid === pid)
  // cướp khoáng: đội tông môn khác (không phải đồng minh) đang khai ở mỏ này; khai trong lãnh thổ minh mình thì an toàn
  const digging = (m: MapMarch) => (m.dig ?? 0) > now && m.pid !== me && !isAlly(m.pid)
  const diggers = $derived(
    point?.kind === 'mine' && snap
      ? snap.marches.filter(m => digging(m) && m.path.at(-1)?.x === point.x && m.path.at(-1)?.y === point.y)
      : [],
  )
  const safeDig = (m: MapMarch) => {
    const side = snap?.seats.find(s => s.pid === m.pid)?.aid
    const end = m.path.at(-1)
    return !!side && !!end && ownerAt(claims, end.x, end.y) === side
  }
  // đội đang xem: đang khai (cướp được), đang đi, đang về, hay đóng quân
  const marchState = (m: MapMarch) => {
    if ((m.dig ?? 0) > now) return L.world.digging(clock((m.dig ?? now) - now))
    if (now < m.arriveAt) return `${L.map.out} ${clock(m.arriveAt - now)}`
    return m.returnAt ? `${L.map.back} ${clock(m.returnAt - now)}` : L.world.stay
  }
  let prey = $state<MapMarch | null>(null)
  async function rob(d: MapMarch, elder: ElderId, army: Army) {
    if ((await send({ type: 'rob', pid: d.pid, id: d.id, elder, army })).ok) sent()
  }
  const sent = () => {
    sfx('march')
    onclose()
  }
  async function go(task: Task, elder: ElderId, army: Army) {
    if (!point) return
    const a: WorldAction =
      way === 'solo'
        ? { type: 'go', i: point.i, task, elder, army }
        : way === 'rally'
          ? { type: 'rally', i: point.i, wait, elder, army }
          : { type: 'rallyJoin', id: way, elder, army }
    const r = await send(a)
    if (r.ok) sent()
  }
  // ô đang xem (để chia sẻ / đặt dấu): tông môn, điểm hay ô trống
  const pos = $derived.by(() => {
    if (seat) return { x: seat.x, y: seat.y }
    if (point) return { x: point.x, y: point.y }
    if (site) return { x: site.x, y: site.y }
    return pick?.kind === 'tile' ? { x: pick.x, y: pick.y } : null
  })
  const officer = $derived(!!ally && me !== null && (ally.members[me] ?? -9) >= 1)
  // đội săn đang về còn quân: săn liên hoàn được
  const chainable = $derived(
    game.marches.find(m => m.task === 'hunt' && m.returnAt > now && m.back && count(m.back) > 0),
  )
  const marker = $derived(!!ally && me !== null && (ally.members[me] ?? -9) >= 0) // dấu của minh: từ R3
  const markHere = $derived(pos ? ally?.marks?.find(m => m.x === pos.x && m.y === pos.y) : undefined)
  let markText = $state('')
  // đã gửi toạ độ ô này vào kênh nào (hiện ngay trên nút) / lỗi của lần gửi
  let shared = $state<{ ch: Channel; err?: string } | null>(null)
  $effect(() => void (pos && (shared = null)))
  async function share(ch: Channel) {
    if (!say || !pos) return
    const r = await say(ch, `${title} (${pos.x},${pos.y})`)
    shared = r.ok ? { ch } : { ch, err: L.chat.err[r.err] ?? L.chat.err.bad }
    if (r.ok) sfx('tap')
  }
  $effect(() => void (markText = markHere?.text ?? title.slice(0, 20)))
  // lãnh thổ tiên minh ở ô đang xem (cùng luật với server): chủ ô, dời tông môn tới ô trống trong lãnh thổ minh mình
  const claims = $derived(snap ? snapClaims(snap, atlas, now) : [])
  // trận kỳ ở ô đang xem; trưởng lão / minh chủ cắm được ở ô trống trong lãnh thổ minh mình
  const flag = $derived(pos ? snap?.flags?.find(f => f.x === pos.x && f.y === pos.y) : undefined)
  const flagCount = $derived(ally ? (snap?.flags ?? []).filter(f => f.aid === ally.id && !f.fort && !f.mine).length : 0)
  // tên công trình minh: Minh khoáng, trận kỳ, Tổng đà (cái dựng đầu tiên của minh đó — mã nhỏ nhất) hay Phân đà
  function flagName(f: { id: number; aid: number; fort?: boolean; mine?: unknown }) {
    if (f.mine) return L.world.terr.ore
    if (!f.fort) return L.world.terr.flag
    const later = (snap?.flags ?? []).some(x => x.fort && x.aid === f.aid && x.id < f.id)
    return later ? L.world.terr.branch : L.world.terr.fort
  }
  const forts = $derived(ally ? (snap?.flags ?? []).filter(f => f.aid === ally.id && f.fort).length : 0)
  const hasMine = $derived(!!ally && (snap?.flags ?? []).some(f => f.aid === ally.id && f.mine))
  // phá trận kỳ minh khác (không minh ước), từ tầng mở Tranh đoạt
  const canRaze = $derived(
    !!flag && game.levels.chuDien >= PVP_HALL && flag.aid !== ally?.id && !ally?.naps?.includes(flag.aid),
  )
  const owner = $derived(pos ? ownerAt(claims, pos.x, pos.y) : 0)
  const moveWait = $derived((game.moved ?? -Infinity) + MOVE_COOL - now)
  const newbie = $derived(newbieMove(game)) // dời núi tân thủ: một lần, tới mọi ô trống vùng ngoài
  const moveNote = $derived.by(() => {
    if (moveWait > 0) return L.world.terr.moveWait(clock(moveWait))
    if (game.marches.length) return L.world.terr.moveAway
    return newbie ? L.world.terr.newbieHint : L.world.terr.moveHint
  })
  async function move(item = false) {
    if (!pos || !(await send({ type: 'move', x: pos.x, y: pos.y, ...(item && { item: true }) })).ok) return
    sfx('reward')
    onclose()
  }
  // phù dời núi: Càn Khôn Phù tới ô chọn ở vùng đã mở; Di Sơn Phù tới chỗ ngẫu nhiên (bảng chạm tông môn mình)
  const canKhonHere = $derived(
    !!game.items.canKhon && pick?.kind === 'tile' && ringOpen(atlas.regions[regionOf(atlas, pick)].ring, phase),
  )
  async function moveRandom() {
    if (!(await send({ type: 'moveRandom' })).ok) return
    sfx('reward')
    onclose()
  }
  let aiding = $state(false)
  let guarding = $state(false) // đang chọn đội giữ trận kỳ
  let camping = $state(false) // đang chọn đội đóng trại ở ô trống
  let hitting = $state<MapMarch | null>(null) // trại phe khác đang chọn đánh
  async function aid(pid: number, elder: ElderId, army: Army) {
    const r = await send({ type: 'aid', pid, elder, army })
    if (r.ok) sent()
  }
</script>

{#snippet robPick(d: MapMarch, len: number)}
  <p class="t-tiny t-soft mt-3">{L.world.robHint}</p>
  <ArmyPick
    field
    foe={d.might}
    cta={L.world.rob}
    time={time(len)}
    timeOf={a => time(len, a)}
    disabled={busy}
    onsubmit={(e, a) => rob(d, e, a)}
  />
{/snippet}

<Sheet
  open={!!pick}
  {onclose}
  {title}
  sub={[
    point ? regionName(point.region) : seat ? regionName(regionOf(atlas, seat)) : '',
    pos && L.world.coord(pos.x, pos.y),
  ]
    .filter(Boolean)
    .join(' · ') || undefined}
>
  {#snippet art()}
    {#if point}<Medal emblem={EMBLEM.spot[point.kind]} tone="spot" size={84} pips={point.lv} />{:else if seat}<Medal
        emblem="crest"
        tone={seat.pid === me ? 'gold' : seat.npc ? 'ink' : 'pvp'}
        size={84}
      />{:else if site && ui('fx-explore')}<img
        src={ui('fx-explore')}
        alt=""
        width="84"
        height="84"
      />{:else if fogged && ui('ev-mail')}<img src={ui('ev-mail')} alt="" width="84" height="84" />{/if}
  {/snippet}
  {#if seat}
    {@const r = road(seat)}
    <Card>
      <div class="stack" style:--gap="4px">
        <span class="row wrap">
          <Tag>{L.realm(seat.hall)}</Tag>
          <Tag icon="power">{num(seat.power)}</Tag>
          {#if seat.npc}<Tag tone="plain">{L.world.npc}</Tag>{/if}
          {#if seat.shield}<Tag icon="shield" tone="good">{L.world.shielded}</Tag>{/if}
          {#if seat.cloud && seat.cloud > now}<Tag icon="bolt" tone="red"
              >{L.trib.gathering(clock(seat.cloud - now))}</Tag
            >{/if}
        </span>
        {#if seat.pid !== me}
          {#if r}<Stat label={L.map.time}>{time(r.len)}</Stat>{:else}<small class="t-small t-soft"
              >{farText(seat)}</small
            >{/if}
        {/if}
        {#if !seat.npc && seat.pid !== me}<Button size="sm" variant="ghost" onclick={() => (social.profile = seat.pid)}
            >{L.profile.open}</Button
          >{/if}
        {#if seat.pid === me && game.items.diSon}<Button
            size="sm"
            variant="ghost"
            icon="diSon"
            disabled={busy || !!game.marches.length || (game.frenzy ?? 0) > now}
            onclick={moveRandom}>{L.world.terr.diSon(game.items.diSon)}</Button
          >{/if}
      </div>
    </Card>
    {#if seat.pid !== me && isAlly(seat.pid) && r}
      {#if aiding}
        <ArmyPick
          field
          cta={L.world.aid}
          time={time(r.len)}
          timeOf={a => time(r.len, a)}
          disabled={busy}
          onsubmit={(e, a) => aid(seat.pid, e, a)}
        />
      {:else}
        <div class="mt-3">
          <Button variant="gold" wide icon="shield" onclick={() => (aiding = true)}>{L.world.aid}</Button>
        </div>
      {/if}
    {:else if seat.pid !== me && !seat.shield && r}
      <div class="mt-3">
        <Button variant="gold" wide icon="swords" onclick={() => onraid(seat.pid)}>{L.pvp.attack}</Button>
      </div>
    {/if}
  {:else if point}
    {@const r = road(point)}
    {@const task = TASK_OF[point.kind]}
    {@const win = ruinWindow(atlas, point, now)}
    {@const dead = !!spot?.until && spot.until > now}
    <Card>
      <div class="stack" style:--gap="4px">
        {#if point.kind === 'gate' || point.kind === 'heaven'}
          <Tag icon={point.lv <= phase ? 'check' : 'lock'} tone={point.lv <= phase ? 'good' : 'plain'}
            >{point.lv <= phase ? L.world.phase[point.lv] : L.world.gateOpens(L.world.phase[point.lv])}</Tag
          >
          {#if point.kind === 'gate'}<small
              class="t-tiny"
              class:t-bad={shut?.has(point.i)}
              class:t-soft={!shut?.has(point.i)}>{shut?.has(point.i) ? L.world.passShut : L.world.passHint}</small
            >{/if}
        {/if}
        {#if point.kind === 'ruin' || point.kind === 'altar'}
          <!-- di tích: chỉ chiếm được lúc mở; phe giữ khi đóng cửa nhận Công Huân theo phút -->
          <Tag icon={win.open ? 'clock' : 'lock'} tone={win.open ? 'good' : 'plain'}
            >{win.open
              ? L.world.ruinOpen(clock(win.end - now))
              : L.world.ruinOpens(win.start - now >= 3_600_000 ? L.ago(win.start - now) : clock(win.start - now))}</Tag
          >
          <small class="t-tiny t-soft">{L.world.ruinHint}</small>
        {/if}
        {#if task === 'take'}
          {#if spot?.own}<Stat label={L.world.held}>{spot.own} · {spot.n ?? 0}</Stat>
          {:else}<small class="t-small t-soft">{L.world.free}</small>{/if}
        {/if}
        {#if task === 'take' && spot?.side !== undefined && (spot.n ?? 0) > 0 && spot.side !== (ally?.id ?? -(me ?? 0)) && game.levels.chuDien >= PVP_HALL}
          <!-- do thám linh địa phe khác: thư báo số đội, đệ tử, lực chiến đang đóng -->
          <Button
            size="sm"
            variant="ghost"
            icon="globe"
            onclick={async () => {
              const r = await send({ type: 'spySpot', i: point.i })
              if (r.ok) sfx('tap')
            }}>{L.world.spySpot(num(SPY_COST * (point.lv + 5)))}</Button
          >
        {/if}
        {#if point.kind === 'vein'}
          <!-- kỳ tranh chấp: phe kiểm soát nhận tăng ích; có phe kiểm soát thì ngoài kỳ là bảo hộ -->
          {@const cw = contestWindow(atlas, point, now)}
          {#if spot?.ctl}<Stat label={L.world.ctlBy}>{spot.ctl}</Stat>{/if}
          {#if spot?.ctl}<Tag icon={cw.open ? 'swords' : 'shield'} tone={cw.open ? 'bad' : 'good'}
              >{cw.open ? L.world.contestOpen(L.ago(cw.end - now)) : L.world.contestSafe(L.ago(cw.start - now))}</Tag
            >{/if}
          {#if spot?.own && spot.side !== spot.ctlSide && spot.since !== undefined}
            {@const from = spot.ctlSide === undefined ? spot.since : Math.max(spot.since, cw.start)}
            <small class="t-tiny t-gold">{L.world.holdLeft(spot.own, L.ago(Math.max(0, from + VEIN_HOLD - now)))}</small
            >
          {/if}
          <small class="t-tiny t-soft">{L.world.contestHint}</small>
        {/if}
        {#if point.kind === 'vein'}<small class="t-small t-good"
            >{L.world.veinBuff(
              veinBuffs(point)
                .map(b => L.bonus(b.key, b.v))
                .join(' · '),
            )}</small
          >{/if}
        {#if (point.kind === 'vein' || point.kind === 'gate' || point.kind === 'heaven') && !snap?.firsts?.includes(point.i)}<small
            class="t-tiny t-gold">{L.world.firstTake}</small
          >{/if}
        {#if point.kind === 'mine'}
          {#if dead}<small class="t-small">{L.world.refill(clock(spot!.until! - now))}</small>
          {:else}
            {@const full = MINE_STOCK[point.lv - 1]}
            <Stat label={L.world.left}>{num(spot?.left ?? full)}</Stat>
            <Meter value={(spot?.left ?? full) / full} tone="gold" size="sm" />
          {/if}
        {/if}
        {#if point.kind === 'wild'}
          {@const foe = wildSide(atlas, point.i)}
          {#if dead}<small class="t-small">{L.world.respawn(clock(spot!.until! - now))}</small>
          {:else}<Stat label={L.world.might}>{num(foe ? might(foe) : 0)}</Stat>{/if}
          <small class="t-small" class:t-bad={apOf(game, now) < AP_HUNT}
            >{L.world.ap(apOf(game, now), AP_MAX)} · {L.world.apCost(AP_HUNT)}</small
          >
        {/if}
        {#if point.kind === 'boss'}
          {@const roaming = !!spot?.lohar && (spot.loharUntil ?? 0) > now}
          {@const full = (BOSSES[point.lv]?.str ?? 0) * (roaming ? LOHAR_HP : 1)}
          {#if dead}<small class="t-small">{L.world.respawn(clock(spot!.until! - now))}</small>
          {:else}
            <Stat label={L.world.hp} tone="bad">{num(spot?.hp ?? full)}/{num(full)}</Stat>
            <Meter value={(spot?.hp ?? full) / full} tone="bad" size="sm" />
          {/if}
          <!-- Yêu Vương Tuần Sơn: bản mạnh do người chơi triệu hồi bằng yêu cốt, quà lớn khi hạ -->
          {#if roaming}<small class="t-small t-bad"
              ><b>{L.lohar.name}</b> · {L.lohar.by(spot?.lohar ?? '', clock((spot?.loharUntil ?? now) - now))}</small
            >{:else if !dead}
            <span class="row wrap" style:--gap="6px">
              <small class="t-tiny" title={L.lohar.hint}>{L.lohar.bones(game.bones ?? 0)}</small>
              {#if (game.bones ?? 0) >= LOHAR_BONES}<Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onclick={async () => (await send({ type: 'summon', i: point.i })).ok && sfx('reward')}
                  >{L.lohar.summon}</Button
                >{/if}
            </span>
          {/if}
        {/if}
        {#if r}<Stat label={L.map.time}>{time(r.len)}</Stat>{:else}<small class="t-small t-soft">{farText(point)}</small
          >{/if}
      </div>
    </Card>
    {#if diggers.length && game.levels.chuDien >= PVP_HALL}
      <Section title={L.world.diggers}>
        {#each diggers as d (`${d.pid}:${d.id}`)}
          {@const safe = safeDig(d)}
          <div class="row">
            <span class="grow stack" style:--gap="1px"
              ><b class="t-small">{snap?.seats.find(s => s.pid === d.pid)?.name ?? ''}</b><small class="t-tiny t-soft"
                >{safe
                  ? L.world.robSafe
                  : `${L.world.might}: ${num(d.might ?? 0)} · ${L.world.digging(clock((d.dig ?? now) - now))}`}</small
              ></span
            >
            <Button
              size="sm"
              variant={prey?.pid === d.pid && prey.id === d.id ? 'gold' : 'danger'}
              disabled={safe}
              onclick={() => (prey = d)}>{L.world.rob}</Button
            >
          </div>
        {/each}
      </Section>
    {/if}
    {#if prey && r}
      {@render robPick(prey, r.len)}
    {:else if mine}
      <div class="mt-3">
        <Card tone="silk">
          <div class="row">
            <span class="grow t-small">{marchDoing(mine, now)}</span>
            {#if recallable(mine, now)}<Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onclick={() => send({ type: 'recall', id: mine.id })}>{L.world.recall}</Button
              >{/if}
          </div>
        </Card>
      </div>
    {:else if r && !dead && win.open && (point.kind !== 'heaven' || phase >= 3)}
      {@const guard = task === 'take' && spot?.side === undefined && !spot?.tamed ? guardSide(atlas, point.i) : null}
      {@const slice = task === 'hit' ? bossSlice(atlas, point.i) : task === 'hunt' ? wildSide(atlas, point.i) : guard}
      {#if guard}<p class="t-small t-bad mt-2">{L.world.guardians(num(Math.round(might(guard))))}</p>{/if}
      {#if ally && task !== 'gather' && task !== 'hunt'}
        <Section title={L.world.rally}>
          <Tabs
            items={[
              { id: 'solo', label: L.world.solo },
              { id: 'rally', label: L.world.openRally },
              ...rallies.map(rl => ({ id: String(rl.id), label: L.world.joinRally(clock(rl.at - now)) })),
            ]}
            value={String(way)}
            onchange={id => (way = id === 'solo' || id === 'rally' ? id : Number(id))}
          />
          {#if way === 'rally'}
            <Tabs
              look="switch"
              items={RALLY_WAIT.map((ms, k) => ({ id: String(k), label: L.world.wait(ms / 60_000) }))}
              value={String(wait)}
              onchange={id => (wait = Number(id) as 0 | 1 | 2)}
            />
          {/if}
        </Section>
      {/if}
      {#if task === 'hunt' && chainable}
        <!-- săn liên hoàn: đội săn đang về đi thẳng tới con này (quân không hồi, chiến lợi phẩm cộng dồn) -->
        <Button
          wide
          variant="gold"
          icon="swords"
          disabled={busy || apOf(game, now) < AP_HUNT}
          onclick={async () =>
            chainable && (await send({ type: 'huntChain', id: chainable.id, i: point.i })).ok && sent()}
          >{L.world.chain(num(count(chainable.back ?? {})))}</Button
        >
      {/if}
      <ArmyPick
        field
        foe={slice ? might(slice) : undefined}
        chance={slice ? (e, a) => raidChance(game, e, a, slice) : undefined}
        cta={{ take: L.world.take, gather: L.world.gather, hit: L.world.hit, hunt: L.world.hunt }[task]}
        time={time(r.len)}
        timeOf={a => time(r.len, a)}
        disabled={busy || (task === 'hunt' && apOf(game, now) < AP_HUNT)}
        onsubmit={(e, a) => go(task, e, a)}
        counter={slice ? TYPES.find(x => BEATS[x] === slice.troops[0].type) : undefined}
      />
    {/if}
  {:else if march}
    {@const end = march.path.at(-1)}
    {@const rr = end ? road(end) : null}
    {@const own = march.pid === me ? game.marches.find(m => m.id === march.id) : undefined}
    <Card>
      <div class="row">
        <p class="grow t-small">{march.foe ?? spotName(march.spot)} · {marchState(march)}</p>
        {#if own && recallable(own, now)}<Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onclick={() => send({ type: 'recall', id: own.id })}>{L.world.recall}</Button
          >{/if}
      </div>
    </Card>
    {#if digging(march) && game.levels.chuDien >= PVP_HALL && rr}
      {#if safeDig(march)}<p class="t-small t-soft mt-3">{L.world.robSafe}</p>{:else}{@render robPick(
          march,
          rr.len,
        )}{/if}
    {/if}
  {:else if site}
    {@const gift = (site.kind === 'village' ? VILLAGE_GIFTS : CAVE_GIFTS)[site.ring]}
    {#if site.kind === 'village'}<Rescue site={site.i} {atlas} {send} />{/if}
    <Card>
      <div class="stack" style:--gap="6px">
        <p class="t-small t-lore">{site.kind === 'village' ? L.world.explore.villageLore : L.world.explore.caveLore}</p>
        <Bag res={gift.res} items={gift.items} size="sm" />
      </div>
    </Card>
    <div class="mt-3">
      <Button wide variant="gold" disabled={busy || !!game.visited?.includes(site.i)} onclick={() => visit(site.i)}
        >{game.visited?.includes(site.i) ? L.world.explore.visited : L.world.explore.visit}</Button
      >
    </div>
  {:else if pick?.kind === 'tile'}
    {@const reg = regionOf(atlas, pick)}
    {@const c = cellOf(pick)}
    {#if game.seat && !clear(fog, c.cx, c.cy, now)}
      <!-- mê vụ: thả linh điểu vào ô sương kề vùng đã khai -->
      <Card>
        <p class="t-small t-lore">{L.world.explore.fog}</p>
      </Card>
      <div class="stack mt-3" style:--gap="4px">
        {#if frontier(fog, c.cx, c.cy, now)}
          <Button
            wide
            icon="bolt"
            disabled={busy || freeCranes < 1}
            onclick={async () => (await send({ type: 'scout', cx: c.cx, cy: c.cy })).ok && sent()}
            >{L.world.explore.scout(clock(craneTime(game.seat, c.cx, c.cy)))}</Button
          >
        {:else}<small class="t-tiny t-soft">{L.world.explore.far}</small>{/if}
        <small class="t-tiny t-soft"
          >{L.world.explore.cranes(Math.max(0, freeCranes), cranes(game))} · {L.world.explore.hint}</small
        >
      </div>
    {:else}
      <Card>
        <p class="t-small">
          {L.world.land[landAt(atlas.seed, pick.x, pick.y)]} · {L.world.weather[weather(atlas, reg, now)]}
        </p>
      </Card>
    {/if}
  {/if}
  {#if pos && snap}
    <div class="stack mt-2" style:--gap="4px">
      <span class="row wrap" style:--gap="4px"
        ><Tag tone={owner && owner === ally?.id ? 'good' : owner ? 'bad' : 'plain'} icon="flag"
          >{owner && owner === ally?.id
            ? L.world.terr.mine
            : owner
              ? L.world.terr.of(snap.allies?.find(a => a.id === owner)?.tag ?? '?')
              : L.world.terr.none}</Tag
        >{#if point?.kind === 'mine' && owner && owner === ally?.id}<Tag tone="gold">{L.world.terr.gather}</Tag
          >{/if}{#if ally && (flag || owner === ally.id)}<Help k={12} />{/if}</span
      >
      {#if flag}
        <span class="row wrap" style:--gap="4px"
          ><Tag icon={flag.mine ? flag.mine.res : 'flag'} tone={flag.fort || flag.mine ? 'gold' : undefined}
            >{flagName(flag)(snap.allies?.find(a => a.id === flag.aid)?.tag ?? '?')}</Tag
          >{#if flag.done > now}<small class="t-tiny t-soft"
              >{L.world.terr.building(clock(flag.done - now))}{#if flag.guard}{` · ${L.world.terr.speed(
                  buildRate(flag.guard[2]).toFixed(1),
                )}`}{/if}</small
            >{/if}</span
        >
        {@const hp = flagHp(flag, now)}
        <span class="row" style:--gap="6px"
          ><span class="grow"><Meter value={hp / flagMax(flag)} tone="bad" size="sm" /></span><small
            class="t-tiny t-num">{L.world.terr.hp(Math.ceil((hp / flagMax(flag)) * 100))}</small
          ></span
        >
        {#if flag.guard}<small class="t-tiny t-soft">{L.world.terr.guards(flag.guard[0], num(flag.guard[1]))}</small
          >{/if}
        {#if flag.mine}
          <!-- Minh khoáng: kho còn bao nhiêu, bao giờ tự tháo -->
          <span class="row" style:--gap="6px"
            ><span class="grow"><Meter value={flag.mine.left / ALLY_MINE_STOCK} size="sm" /></span><small
              class="t-tiny t-num"
              >{L.world.terr.mineLeft(num(flag.mine.left), clock(Math.max(0, flag.mine.until - now)))}</small
            ></span
          >
        {/if}
        {#if ally && flag.aid === ally.id}
          <!-- cờ minh mình: đóng quân giữ (lực chiến chặn bớt sức phá), trưởng / minh chủ nhổ được -->
          {@const mineG = game.marches.find(m => m.target.kind === 'flag' && m.target.i === flag.id)}
          {#if mineG}
            <div class="row">
              <small class="grow t-small"
                >{mineG.stay
                  ? flag.done > now
                    ? L.world.terr.builders
                    : L.world.terr.guarding
                  : marchDoing(mineG, now)}</small
              >
              {#if mineG.stay && flag.mine && flag.done <= now}<Button
                  size="sm"
                  variant="gold"
                  disabled={busy}
                  onclick={() => send({ type: 'allyGather', id: flag.id, elder: mineG.elder, army: mineG.army })}
                  >{L.world.terr.mineHere}</Button
                >{/if}
              {#if mineG.stay || recallable(mineG, now)}<Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onclick={() => send({ type: 'recall', id: mineG.id })}>{L.world.recall}</Button
                >{/if}
            </div>
          {:else if flag.mine && flag.done <= now}
            <!-- Minh khoáng đã dựng: người trong minh gửi đội tới khai (không ai cướp được) -->
            {@const fr = road(flag)}
            <small class="t-tiny t-soft">{L.world.terr.mineHint}</small>
            <ArmyPick
              field
              cta={L.world.terr.mineGo}
              time={fr ? time(fr.len) : undefined}
              timeOf={a => (fr ? time(fr.len, a) : '')}
              disabled={busy || !fr}
              onsubmit={async (e, a) =>
                (await send({ type: 'allyGather', id: flag.id, elder: e, army: a })).ok && sent()}
            />
          {:else if (flag.guard?.[0] ?? 0) < FLAG_GUARD_MAX}
            <!-- cờ đang dựng: góp quân xây (dựng nhanh hơn), dựng xong thì đội ở lại giữ -->
            {@const fr = road(flag)}
            {@const up = flag.done > now}
            {#if guarding}
              <small class="t-tiny t-soft">{up ? L.world.terr.buildHint : L.world.terr.guardHint}</small>
              <ArmyPick
                field
                cta={up ? L.world.terr.build : L.world.terr.guard}
                time={fr ? time(fr.len) : undefined}
                timeOf={a => (fr ? time(fr.len, a) : '')}
                disabled={busy || !fr}
                onsubmit={async (e, a) =>
                  (await send({ type: 'flagGuard', id: flag.id, elder: e, army: a })).ok && sent()}
              />
            {:else}<Button size="sm" variant="gold" icon={up ? 'hammer' : 'shield'} onclick={() => (guarding = true)}
                >{up ? L.world.terr.build : L.world.terr.guard}</Button
              >{/if}
          {/if}
          {#if officer}<Button
              size="sm"
              variant="quiet"
              onclick={async () => (await send({ type: 'unflag', id: flag.id })).ok && onclose()}
              >{flag.mine ? L.world.terr.pullMine : flag.fort ? L.world.terr.pullFort : L.world.terr.pull}</Button
            >{/if}
        {:else if canRaze}
          {@const fr = road(flag)}
          <small class="t-tiny t-soft">{L.world.terr.razeHint}</small>
          <ArmyPick
            field
            cta={L.world.terr.raze}
            time={fr ? time(fr.len) : undefined}
            timeOf={a => (fr ? time(fr.len, a) : '')}
            disabled={busy || !fr}
            onsubmit={async (e, a) => (await send({ type: 'raze', id: flag.id, elder: e, army: a })).ok && sent()}
          />
        {/if}
      {:else if pick?.kind === 'tile' && officer && ally && owner === ally.id}
        <Button
          size="sm"
          variant="ghost"
          icon="flag"
          disabled={flagCount >= flagCap(ally) || (ally.fund ?? 0) < FLAG_COST}
          onclick={async () => pos && (await send({ type: 'flag', x: pos.x, y: pos.y })).ok && sent()}
          >{L.world.terr.plant(num(FLAG_COST))}</Button
        >
        <small class="t-tiny t-soft">{L.world.terr.plantHint(flagCount, flagCap(ally), num(ally.fund ?? 0))}</small>
        {#if forts < fortCap(ally)}
          <!-- Tổng đà: cần đủ người; nới lãnh thổ rộng, tăng ích cho cả minh. Minh đông người dựng thêm Phân đà (giá tăng dần) -->
          {@const cost = FORT_COST * (forts + 1)}
          <Button
            size="sm"
            variant="gold"
            icon="flag"
            disabled={ally.people.length < FORT_MIN || (ally.fund ?? 0) < cost}
            onclick={async () => pos && (await send({ type: 'fort', x: pos.x, y: pos.y })).ok && sent()}
            >{(forts ? L.world.terr.branchPlant : L.world.terr.fortPlant)(num(cost))}</Button
          >
          <small class="t-tiny t-soft"
            >{forts
              ? L.world.terr.branchHint(FORT_PER, FORT_MAX)
              : L.world.terr.fortHint(FORT_MIN, FORT_R, FORT_BUILD / 3_600_000)}</small
          >
        {/if}
        {#if !hasMine}
          <!-- Minh khoáng: mỗi minh một, chọn loại tài nguyên -->
          <small class="t-tiny t-strong">{L.world.terr.minePlant(num(ALLY_MINE_COST))}</small>
          <span class="row wrap" style:--gap="4px">
            {#each RESOURCES as r (r)}
              <Button
                size="sm"
                variant="ghost"
                icon={r}
                disabled={(ally.fund ?? 0) < ALLY_MINE_COST}
                onclick={async () => pos && (await send({ type: 'allyMine', x: pos.x, y: pos.y, res: r })).ok && sent()}
                >{L.res[r]}</Button
              >
            {/each}
          </span>
          <small class="t-tiny t-soft"
            >{L.world.terr.mineHint2(
              ALLY_MINE_BUILD / 3_600_000,
              num(ALLY_MINE_STOCK),
              ALLY_MINE_LIFE / 86_400_000,
            )}</small
          >
        {/if}
      {/if}
      {#if pick?.kind === 'tile' && !flag && game.seat && (newbie || (ally && owner === ally.id))}
        <Button
          size="sm"
          variant="ghost"
          icon="flag"
          disabled={moveWait > 0 || !!game.marches.length}
          onclick={() => move()}>{newbie ? L.world.terr.newbie : L.world.terr.move}</Button
        >
        <small class="t-tiny t-soft">{moveNote}</small>
      {/if}
      {#if canKhonHere && !flag && game.seat}
        <Button
          size="sm"
          variant="gold"
          icon="canKhon"
          disabled={busy || !!game.marches.length || (game.frenzy ?? 0) > now}
          onclick={() => move(true)}>{L.world.terr.canKhon(game.items.canKhon ?? 0)}</Button
        >
      {/if}
    </div>
  {/if}
  {#if pick?.kind === 'tile' && pos && snap?.runes?.some(r => r.x === pos.x && r.y === pos.y)}
    <!-- phù văn quanh linh địa: loại, phẩm, tăng ích; xuất quân tới nhặt (ai tới trước được) -->
    {@const r = snap.runes.find(x => x.x === pos.x && x.y === pos.y)!}
    {@const going = game.marches.find(m => m.rune && m.target.i === campTile(pos.x, pos.y))}
    {@const rr = road(pos)}
    <Section title={L.world.rune.title(L.world.rune.tiers[r.t], L.world.rune.kinds[r.k])}>
      <small class="t-small t-good">{L.world.rune.fx(L.bonus(RUNE_KINDS[r.k], RUNE_TIERS[r.t]), RUNE_HOURS)}</small>
      {#if going}<small class="t-small">{marchDoing(going, now)}</small>
      {:else}
        <small class="t-tiny t-soft">{L.world.rune.hint}</small>
        <ArmyPick
          field
          cta={L.world.rune.go}
          time={rr ? time(rr.len) : undefined}
          timeOf={a => (rr ? time(rr.len, a) : '')}
          disabled={busy || !rr}
          onsubmit={async (e, a) => (await send({ type: 'rune', x: pos.x, y: pos.y, elder: e, army: a })).ok && sent()}
        />
      {/if}
    </Section>
  {/if}
  {#if pick?.kind === 'tile' && pos && snap?.digs?.some(d => d.x === pos.x && d.y === pos.y)}
    <!-- Tàng Bảo Đồ: điểm đào — của mình thì xuất quân tới đào, của người khác chỉ xem -->
    {@const d = snap.digs.find(x => x.x === pos.x && x.y === pos.y)!}
    {@const going = game.marches.find(m => m.dig && m.target.i === campTile(pos.x, pos.y))}
    {@const dr = road(pos)}
    <Section title={L.world.dig.title}>
      {#if d.pid !== me}<small class="t-small t-soft">{L.world.dig.theirs(d.name)}</small>
      {:else if going}<small class="t-small">{marchDoing(going, now)}</small>
      {:else}
        <small class="t-tiny t-soft">{L.world.dig.hint}</small>
        <ArmyPick
          field
          cta={L.world.dig.go}
          time={dr ? time(dr.len) : undefined}
          timeOf={a => (dr ? time(dr.len, a) : '')}
          disabled={busy || !dr}
          onsubmit={async (e, a) => (await send({ type: 'dig', x: pos.x, y: pos.y, elder: e, army: a })).ok && sent()}
        />
      {/if}
    </Section>
  {/if}
  {#if pick?.kind === 'tile' && pos && !flag && game.seat && clear(fog, cellOf(pos).cx, cellOf(pos).cy, now)}
    <!-- Đóng trại ở ô trống (Encamp): trại của mình (gọi về), trại phe khác trên ô (đánh), hay dựng trại mới -->
    {@const tile = campTile(pos.x, pos.y)}
    {@const myCamp = game.marches.find(
      m => m.target.kind === 'camp' && m.target.i === tile && !m.prey && !m.dig && !m.rune,
    )}
    {@const others = (snap?.marches ?? []).filter(
      m => m.pid !== me && now >= m.arriveAt && !m.returnAt && m.path.at(-1)?.x === pos.x && m.path.at(-1)?.y === pos.y,
    )}
    {@const cr = road(pos)}
    <Section title={L.world.camp.title}>
      {#each others as c (`${c.pid}:${c.id}`)}
        <div class="row">
          <small class="grow t-small">{L.world.camp.of(snap?.seats.find(x => x.pid === c.pid)?.name ?? '?')}</small>
          {#if !isAlly(c.pid) && game.levels.chuDien >= PVP_HALL}<Button
              size="sm"
              variant="ghost"
              icon="swords"
              onclick={() => (hitting = hitting?.id === c.id ? null : c)}>{L.world.camp.hit}</Button
            >{/if}
        </div>
      {/each}
      {#if hitting && others.some(c => c.id === hitting?.id && c.pid === hitting?.pid)}
        {@const h = hitting}
        <small class="t-tiny t-soft">{L.world.camp.hitHint}</small>
        <ArmyPick
          field
          cta={L.world.camp.hit}
          time={cr ? time(cr.len) : undefined}
          timeOf={a => (cr ? time(cr.len, a) : '')}
          disabled={busy || !cr}
          onsubmit={async (e, a) =>
            (await send({ type: 'hitCamp', pid: h.pid, id: h.id, elder: e, army: a })).ok && sent()}
        />
      {:else if myCamp}
        <div class="row">
          <small class="grow t-small">{myCamp.stay ? L.world.camp.mine : marchDoing(myCamp, now)}</small>
          {#if recallable(myCamp, now)}<Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onclick={() => send({ type: 'recall', id: myCamp.id })}>{L.world.recall}</Button
            >{/if}
        </div>
      {:else if camping}
        <small class="t-tiny t-soft">{L.world.camp.hint}</small>
        <ArmyPick
          field
          cta={L.world.camp.go}
          time={cr ? time(cr.len) : undefined}
          timeOf={a => (cr ? time(cr.len, a) : '')}
          disabled={busy || !cr}
          onsubmit={async (e, a) => (await send({ type: 'camp', x: pos.x, y: pos.y, elder: e, army: a })).ok && sent()}
        />
      {:else}<Button size="sm" variant="ghost" icon="flag" onclick={() => (camping = true)}>{L.world.camp.go}</Button
        >{/if}
    </Section>
  {/if}
  {#if pos}
    <Section title={L.world.share}>
      <div class="row wrap">
        <Button
          size="sm"
          variant={game.pins?.some(p => p.x === pos.x && p.y === pos.y) ? 'gold' : 'ghost'}
          icon="star"
          onclick={() => g.act({ type: 'pin', x: pos.x, y: pos.y, text: title.slice(0, 24) })}
          >{game.pins?.some(p => p.x === pos.x && p.y === pos.y) ? L.world.unpin : L.world.pin}</Button
        >
        {#if say && ally}<Button
            size="sm"
            variant="ghost"
            icon={shared?.ch === 'ally' && !shared.err ? 'check' : 'people'}
            onclick={() => share('ally')}>{L.world.shareAlly}</Button
          >{/if}
        {#if say && game.levels.chuDien >= CHAT_HALL}<Button
            size="sm"
            variant="ghost"
            icon={shared?.ch === 'world' && !shared.err ? 'check' : 'globe'}
            onclick={() => share('world')}>{L.world.shareWorld}</Button
          >{/if}
      </div>
      {#if shared}<small class="t-small" class:t-bad={!!shared.err} class:t-soft={!shared.err}
          >{shared.err ?? L.world.shared}</small
        >{/if}
      {#if marker}
        <div class="row mt-2">
          <input
            class="grow"
            bind:value={markText}
            maxlength="20"
            aria-label={L.world.markText}
            placeholder={L.world.markText}
          />
          <Button
            size="sm"
            variant="gold"
            icon="flag"
            disabled={!markText.trim()}
            onclick={() => send({ type: 'allyMark', x: pos.x, y: pos.y, text: markText })}>{L.world.mark}</Button
          >
          {#if markHere}<Button
              size="sm"
              variant="quiet"
              onclick={() => send({ type: 'allyUnmark', x: pos.x, y: pos.y })}>{L.world.unmark}</Button
            >{/if}
        </div>
      {/if}
    </Section>
  {/if}
</Sheet>

<style>
  input {
    min-width: 0;
    padding: 6px 10px;
    font: inherit;
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: var(--cut);
    background: var(--paper);
  }
</style>
