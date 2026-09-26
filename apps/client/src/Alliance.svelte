<script lang="ts">
  // Trang Tiên minh: chưa có minh thì xem các minh trong giới (vào ngay) hoặc lập minh; có rồi thì cống hiến / Minh khố /
  // Minh lễ, lối vào Hộ Minh Đại Trận và Cống Hiến Các, bố cáo, giúp đỡ, người trong minh (chức vị, đang chơi), chat kênh
  // minh. Luật ở rules/world, server kiểm lại mọi thao tác.
  import {
    ALLY_COST,
    ALLY_GIFT_LV,
    ALLY_HALL,
    ALLY_IDLE,
    ALLY_MAIL_COOL,
    ALLY_MAIL_LEN,
    ALLY_RENAME,
    ALLY_RENAME_COOL,
    OFFICE_IDS,
    DONATE_MAX,
    MOB_GOALS,
    MOB_MIN,
    RESOURCES,
    TERR_FUND,
    dayOf,
    jobOf,
    weekOf,
    LEGION_WAVES,
    type JobKind,
  } from '@rok/rules'
  import {
    warAt,
    legionAt,
    tribeStart,
    tribeEnd,
    boardOf,
    donateLeft,
    mobOf,
    mobProgress,
    giftLevel,
    helpsOf,
    seatsOf,
    type AllyInfo,
    type ArkRow,
    type AllyRow,
    type Role,
    type WorldAction,
  } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { untrack, type Snippet } from 'svelte'
  import { Icon, artOf } from '@rok/art'
  import { Button, Card, Confirm, Medal, Meter, Page, Section, Tabs, Tag, Tile } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'
  import AllyTech from './AllyTech.svelte'
  import AllyShop from './AllyShop.svelte'
  import AllyQuiz from './AllyQuiz.svelte'
  import AllySkills from './AllySkills.svelte'
  import AllyMob from './AllyMob.svelte'
  import AllyPot from './AllyPot.svelte'
  import ArkCard from './ArkCard.svelte'
  import AllyParty from './AllyParty.svelte'
  import AllyPlans from './AllyPlans.svelte'
  import { social } from './social.svelte'

  type ATab = 'home' | 'people' | 'war' | 'chat'
  const ui = (n: string) => artOf(`ui:${n}`)?.src // đồ vật vẽ tay của sảnh minh (cờ, đỉnh đồng, trống trận…)
  let {
    me,
    ally,
    rows,
    send,
    chat,
    onmap,
    onraid,
    list,
    start = 'home',
  }: {
    me: number | null
    ally: (AllyInfo & { ark?: ArkRow }) | null
    rows: AllyRow[] | null // danh sách minh (khi chưa vào minh nào)
    send: (a: WorldAction) => Promise<Ack>
    chat?: Snippet
    onmap?: (x: number, y: number) => void // tới dấu của minh trên bản đồ giới
    onraid?: (pid: number) => void // góp đội vào kết trận công sơn (mở bảng Tranh đoạt ở tông môn đó)
    list?: () => Promise<AllyRow[] | null> // các minh trong giới (minh ước)
    start?: ATab // thẻ mở đầu (test vẽ từng thẻ)
  } = $props()
  const g = useGame()
  const game = $derived(g.game)

  let name = $state('')
  let tag = $state('')
  let editing = $state<string | null>(null)
  let newName = $state('')
  let newTag = $state('')
  let atab = $state<ATab>(untrack(() => start))
  const liveRallies = $derived(ally ? ally.rallies.filter(r => r.at > g.now).length : 0)
  // thư minh (R4 / minh chủ): nội dung đang viết, vừa gửi xong, còn bao lâu mới gửi tiếp được
  let letter = $state('')
  let mailed = $state(false)
  const mailWait = $derived(ally ? (ally.mailAt ?? -Infinity) + ALLY_MAIL_COOL - g.now : 0)
  async function sendMail() {
    if (!(await go({ type: 'allyMail', text: letter }))) return
    letter = ''
    mailed = true
  }
  let pick = $state<number | null>(null)
  let sheet = $state<'tech' | 'shop' | 'mob' | null>(null)
  // nút ở danh sách minh: nhận lời mời · đã gửi đơn · xin vào (minh đóng) · gia nhập
  function joinLabel(r: AllyRow) {
    if (r.invited) return L.ally.accept
    if (r.asked) return L.ally.asked2
    return r.closed ? L.ally.apply : L.ally.join
  }
  // Minh ước: danh sách các minh (tên theo mã) tải khi mở mục
  let others = $state<AllyRow[] | null>(null)
  const napName = (id: number) => others?.find(r => r.id === id)?.name ?? `#${id}`
  const loadOthers = async () => (others = (await list?.()) ?? [])
  const maxHelps = $derived(ally ? helpsOf(ally) : 0)
  const left = $derived(donateLeft(game, g.now))
  const gift = $derived(ally ? giftLevel(ally) : 1)
  // Minh vụ: việc đã đủ chờ nộp, hoặc có mốc quà nhận được
  const mobReady = $derived.by(() => {
    if (!ally || me === null) return false
    const m = mobOf(game, g.now),
      b = boardOf(ally, g.now)
    const done = !!m.task && m.task.until > g.now && mobProgress(game, m) >= m.task.n
    return done || MOB_GOALS.some((goal, k) => b.pts >= goal && (b.by[me] ?? 0) >= MOB_MIN && !m.got.includes(k))
  })
  const giftPart = $derived(
    ally && gift < ALLY_GIFT_LV.length
      ? ((ally.gift ?? 0) - ALLY_GIFT_LV[gift - 1]) / (ALLY_GIFT_LV[gift] - ALLY_GIFT_LV[gift - 1])
      : 1,
  )
  const myRole = $derived<Role | -9>(ally && me !== null ? (ally.members[me] ?? -9) : -9) // −9: chưa vào minh
  const JOBS: JobKind[] = ['build', 'train', 'heal', 'study', 'forge']
  const running = $derived(JOBS.filter(k => jobOf(game, k)))
  const asked = (k: JobKind) =>
    !!ally?.helps.some(h => h.pid === me && h.job === k && h.startAt === jobOf(game, k)?.startAt)
  const helpable = $derived(
    ally ? ally.helps.filter(h => h.pid !== me && me !== null && !h.by.includes(me) && h.by.length < maxHelps) : [],
  )
  const nameOf = (pid: number) => ally?.people.find(p => p.pid === pid)?.name ?? '?'
  // Phá Yêu Trại: đang trong khung (còn bao lâu) hay chờ khung kế tiếp
  const tribeWin = $derived.by(() => {
    const wk = weekOf(g.now),
      s0 = tribeStart(wk),
      e0 = tribeEnd(wk)
    return g.now >= s0 && g.now < e0
      ? { on: true, t: e0 - g.now }
      : { on: false, t: (g.now < s0 ? s0 : tribeStart(wk + 1)) - g.now }
  })
  const officeOf = (pid: number) => OFFICE_IDS.find(o => ally?.offices?.[o] === pid)
  const away = (p: { seen: number }) => (p.seen < 0 ? 0 : dayOf(g.now) - p.seen) // số ngày chưa vào game
  // kết trận đánh gì: tông môn (công sơn), yêu vương, hay điểm để chiếm
  const rallyWhat = (r: AllyInfo['rallies'][number]) => {
    if (r.task === 'raid') return L.world.siege(r.foe ?? '?')
    return r.task === 'hit' ? L.world.point.boss : L.world.point.vein
  }
  // Ma Triều Công Sơn: tuần đang chờ (qua giờ đánh tuần này mà minh không đánh dở thì là tuần sau), như signWeek ở rules
  const week = $derived.by(() => {
    const wk = weekOf(g.now),
      mine = ally?.legion
    const mid = mine?.week === wk && mine.signed && mine.done < LEGION_WAVES
    return g.now < legionAt(wk, 0) || mid ? wk : wk + 1
  })
  const lg = $derived(ally?.legion?.week === week ? ally.legion : { week, signed: false, done: 0, pts: 0, mine: 0 })
  const legionLine = $derived.by(() => {
    if (lg.done >= LEGION_WAVES) return L.legion.over
    const ms = Math.max(0, legionAt(week, lg.done) - g.now)
    const t = ms >= 3_600_000 ? L.ago(ms) : clock(ms) // còn lâu: "5 ngày 16 giờ"; sắp tới: đồng hồ
    return lg.done ? L.legion.next(lg.done + 1, t) : L.legion.at(t)
  })
  const go = async (a: WorldAction, sound: 'reward' | 'tap' = 'tap') => {
    const ok = (await send(a)).ok
    if (ok) sfx(sound)
    return ok
  }
</script>

<Page title={L.ally.title} icon="tienMinh">
  {#if !ally}
    <!-- chưa có minh: sảnh trống — ba người đứng chờ, cờ chưa có hiệu, lời dẫn trong sảnh -->
    <header class="hall">
      <span class="flag"
        >{#if ui('ally-people')}<img class="crowd" src={ui('ally-people')} alt="" draggable="false" />{:else}<Medal
            emblem="crest"
            tone="gold"
            size={46}
          />{/if}</span
      >
      <p class="t-lore t-small">{L.ally.intro}</p>
    </header>
    <Section title={L.ally.list}>
      {#if rows && !rows.length}<p class="t-small t-soft">{L.ally.none}</p>{/if}
      <ul class="stack">
        {#each rows ?? [] as r (r.id)}
          <li>
            <Card>
              <span class="row">
                {#if ui('ally-banner')}<span class="flag mini"
                    ><img src={ui('ally-banner')} alt="" draggable="false" /><b class="flagtag">{r.tag}</b></span
                  >{:else}<Medal emblem="crest" tone="gold" size={34} />{/if}
                <span class="grow stack" style:--gap="1px"
                  ><b>{r.name} [{r.tag}]</b><small class="t-small t-soft"
                    >{L.ally.members(r.n, r.max)} · {L.power} {num(r.power)}</small
                  ></span
                >
                <Button
                  size="sm"
                  variant={r.invited ? 'gold' : 'primary'}
                  disabled={r.asked}
                  onclick={() => go({ type: 'allyJoin', id: r.id }, 'reward')}>{joinLabel(r)}</Button
                >
              </span>
            </Card>
          </li>
        {/each}
      </ul>
    </Section>
    <Section title={L.ally.found}>
      <p class="t-small t-soft">{L.ally.foundHint}</p>
      <form
        class="stack"
        onsubmit={e => {
          e.preventDefault()
          go({ type: 'allyFound', name, tag }, 'reward')
        }}
      >
        <input bind:value={name} maxlength="20" placeholder={L.ally.name} aria-label={L.ally.name} />
        <input
          bind:value={tag}
          maxlength="4"
          placeholder={L.ally.tag}
          aria-label={L.ally.tag}
          style:text-transform="uppercase"
        />
        <Button
          variant="gold"
          wide
          type="submit"
          disabled={game.levels.chuDien < ALLY_HALL ||
            RESOURCES.some(r => game.res[r] < ALLY_COST) ||
            name.trim().length < 2 ||
            tag.trim().length < 2}>{L.ally.found}</Button
        >
      </form>
    </Section>
  {:else}
    <!-- sảnh minh: cờ minh treo (hiệu minh trong đĩa trắng), tên và ba tấm biển số liệu trên nền núi -->
    <header class="hall">
      <span class="flag">
        {#if ui('ally-banner')}<img src={ui('ally-banner')} alt="" draggable="false" />{:else}<Medal
            emblem="crest"
            tone="gold"
            size={46}
          />{/if}
        {#if ui('ally-banner')}<b class="flagtag">{ally.tag}</b>{/if}
      </span>
      <div class="hall-id">
        <b class="hall-name">{ally.name} <span class="t-soft">[{ally.tag}]</span></b>
        <small class="t-small t-soft"
          >{L.ally.members(ally.people.length, seatsOf(ally))} · {myRole === -9 ? '' : L.ally.role(myRole)}</small
        >
        <div class="stats">
          <span title={L.guild.creditHint}
            ><small>{L.guild.credit}</small><b class="t-num">{num(game.contrib?.credit ?? 0)}</b></span
          >
          <span title={L.guild.fundHint}
            ><small>{L.guild.fund}</small><b class="t-num">{num(ally.fund ?? 0)}</b>{#if ally.terr}<small class="t-good"
                >{L.guild.terrFund(num(ally.terr), num(ally.terr * TERR_FUND))}</small
              >{/if}</span
          >
          <span title={L.guild.giftHint}
            ><small>{L.guild.gift}</small><b class="t-num" aria-label={L.guild.giftLv(gift)}>{gift}</b><Meter
              value={giftPart}
              size="xs"
              tone="gold"
            /></span
          >
        </div>
      </div>
    </header>

    <!-- lối vào như menu tiên minh của RoK: ô hình + tên + dòng phụ, chấm đỏ khi lượt cung phụng đầy (đang phí lượt hồi) -->
    <div class="tiles">
      <Tile
        art="ally-tech"
        icon="shield"
        label={L.guild.tech}
        sub={L.guild.left(left)}
        dot={left >= DONATE_MAX}
        onclick={() => (sheet = 'tech')}
      />
      <Tile
        art="ally-mob"
        icon="scroll"
        label={L.mob.title}
        sub={L.mob.pts(num(boardOf(ally, g.now).pts))}
        dot={mobReady}
        onclick={() => (sheet = 'mob')}
      />
      <Tile
        art="ally-shop"
        icon="hoSon"
        label={L.guild.shop}
        sub="{L.guild.credit} {num(game.contrib?.credit ?? 0)}"
        onclick={() => (sheet = 'shop')}
      />
    </div>
    <AllyTech open={sheet === 'tech'} onclose={() => (sheet = null)} {ally} officer={myRole >= 1} {send} />
    <AllyShop open={sheet === 'shop'} onclose={() => (sheet = null)} {ally} officer={myRole >= 1} {send} />
    <AllyMob open={sheet === 'mob'} onclose={() => (sheet = null)} {ally} {me} {send} />

    <!-- các mục của minh như menu tiên minh RoK: tổng quan · thành viên · chiến sự · trò chuyện (số trên thẻ: việc chờ) -->
    <Tabs
      items={[
        { id: 'home', label: L.ally.tabs.home },
        {
          id: 'people',
          label: `${L.ally.tabs.people}${myRole >= 1 && ally.applicants.length ? ` (${ally.applicants.length})` : ''}`,
        },
        { id: 'war', label: `${L.ally.tabs.war}${liveRallies ? ` (${liveRallies})` : ''}` },
        ...(chat ? [{ id: 'chat', label: L.ally.tabs.chat }] : []),
      ]}
      value={atab}
      onchange={t => (atab = t as ATab)}
    />

    {#if atab === 'people' && myRole >= 1}
      <!-- Quản trị: minh mở (vào tự do) hay đóng (duyệt đơn), đơn xin vào đang chờ -->
      <Section title={L.ally.gate}>
        <div class="row" style:--gap="6px">
          <Button
            size="sm"
            variant={ally.closed ? 'ghost' : 'gold'}
            onclick={() => go({ type: 'allyOpen', open: true })}>{L.ally.open}</Button
          >
          <Button
            size="sm"
            variant={ally.closed ? 'gold' : 'ghost'}
            onclick={() => go({ type: 'allyOpen', open: false })}>{L.ally.closed}</Button
          >
        </div>
        {#each ally.applicants as x (x.pid)}
          <div class="row" style:--gap="6px">
            <span class="grow stack" style:--gap="0"
              ><b class="t-small">{x.name}</b><small class="t-tiny t-soft"
                >{L.realm(x.hall)} · {L.power} {num(x.power)}</small
              ></span
            >
            <Button size="sm" variant="gold" onclick={() => go({ type: 'allyAccept', pid: x.pid, ok: true }, 'reward')}
              >{L.nap.ok}</Button
            >
            <Button size="sm" variant="quiet" onclick={() => go({ type: 'allyAccept', pid: x.pid, ok: false })}
              >{L.nap.no}</Button
            >
          </div>
        {/each}
        {#if !ally.applicants.length}<p class="t-small t-soft">{L.ally.noApps}</p>{/if}
      </Section>
    {/if}

    {#if atab === 'home'}
      <Section title={L.ally.notice}>
        {#if editing !== null}
          <textarea bind:value={editing} maxlength="200" rows="3" aria-label={L.ally.notice}></textarea>
          <Button
            size="sm"
            onclick={async () => (await go({ type: 'allyNotice', text: editing ?? '' })) && (editing = null)}
            >{L.ally.save}</Button
          >
        {:else}
          <p class="note t-small t-lore">{ally.notice || L.ally.noNotice}</p>
          {#if myRole >= 1}<Button size="sm" variant="ghost" onclick={() => (editing = ally?.notice ?? '')}
              >{L.ally.edit}</Button
            >{/if}
        {/if}
      </Section>

      <AllySkills {ally} officer={myRole >= 1} {go} />
      <AllyQuiz {ally} officer={myRole >= 1} {go} />

      {#if myRole >= 1}
        <Section title={L.ally.mail}>
          <p class="t-tiny t-soft">{L.ally.mailHint}</p>
          <textarea bind:value={letter} maxlength={ALLY_MAIL_LEN} rows="3" aria-label={L.ally.mail}></textarea>
          {#if mailWait > 0}<small class="t-tiny t-soft">{L.ally.mailWait(clock(mailWait))}</small>{/if}
          {#if mailed}<small class="t-tiny t-good">{L.ally.mailSent}</small>{/if}
          <Button size="sm" variant="gold" icon="mail" disabled={!letter.trim() || mailWait > 0} onclick={sendMail}
            >{L.ally.mailSend}</Button
          >
        </Section>
      {/if}

      {#if myRole === 2}
        <!-- đổi tên / hiệu tiên minh (minh chủ): tốn Minh khố, mỗi lần cách nhau vài ngày -->
        {@const wait = (ally.named ?? -Infinity) + ALLY_RENAME_COOL - g.now}
        <Section title={L.ally.rename}>
          <p class="t-tiny t-soft">{L.ally.renameHint(num(ALLY_RENAME), ALLY_RENAME_COOL / 86_400_000)}</p>
          <form
            class="stack"
            onsubmit={async e => {
              e.preventDefault()
              if (await go({ type: 'allyRename', name: newName, tag: newTag }, 'reward')) newName = newTag = ''
            }}
          >
            <input bind:value={newName} maxlength="20" placeholder={L.ally.name} aria-label={L.ally.name} />
            <input
              bind:value={newTag}
              maxlength="4"
              placeholder={L.ally.tag}
              aria-label={L.ally.tag}
              style:text-transform="uppercase"
            />
            {#if wait > 0}<small class="t-tiny t-soft">{L.ally.renameWait(clock(wait))}</small>{/if}
            <Button
              size="sm"
              variant="gold"
              type="submit"
              disabled={wait > 0 ||
                (ally.fund ?? 0) < ALLY_RENAME ||
                newName.trim().length < 2 ||
                newTag.trim().length < 2}>{L.ally.renameGo}</Button
            >
          </form>
        </Section>
      {/if}

      <Section title={L.ally.help}>
        <p class="t-small t-soft">{L.ally.helpHint(maxHelps)}</p>
        {#if running.length}
          <div class="row wrap">
            {#each running as k (k)}
              <Button size="sm" variant="ghost" disabled={asked(k)} onclick={() => go({ type: 'helpAsk', job: k })}
                >{L.jobs[k]} · {asked(k) ? L.ally.asked : L.ally.ask}</Button
              >
            {/each}
          </div>
        {/if}
        <ul class="stack" style:--gap="2px">
          {#each ally.helps as h (h.pid + h.job + h.startAt)}<li class="t-small">
              {L.ally.wants(nameOf(h.pid), L.jobs[h.job], h.by.length, maxHelps)}
            </li>{/each}
          {#if !ally.helps.length}<li class="t-small t-soft">{L.ally.noHelp}</li>{/if}
        </ul>
        <Button
          variant="gold"
          wide
          icon="people"
          disabled={!helpable.length}
          onclick={() => go({ type: 'helpAll' }, 'reward')}>{L.ally.helpAll(helpable.length)}</Button
        >
      </Section>
      {#if me !== null}<AllyPot {ally} {me} {go} />{/if}
    {/if}

    {#if atab === 'people'}
      <Section title={L.ally.members(ally.people.length)}>
        <ul class="stack">
          {#each ally.people as p (p.pid)}
            <li>
              <Card onclick={p.pid !== me ? () => (pick = pick === p.pid ? null : p.pid) : undefined} label={p.name}>
                <span class="row">
                  <span class="dot" class:on={p.online} title={p.online ? L.ally.online : ''}></span>
                  <span class="grow stack" style:--gap="0"
                    ><b class="t-small">{p.name}</b><small class="t-tiny t-soft"
                      >{L.realm(p.hall)} · {L.power}
                      {num(p.power)}{#if !p.online && away(p) >= 2}
                        · <span class:t-bad={away(p) >= ALLY_IDLE}>{L.ally.idle(away(p))}</span>{/if}</small
                    ></span
                  >
                  <Tag size="sm" tone={p.role >= 1 ? 'gold' : 'plain'}>{L.ally.role(p.role)}</Tag
                  >{#if officeOf(p.pid)}<Tag size="sm" tone="good">{L.ally.offices[officeOf(p.pid)!][0]}</Tag>{/if}
                </span>
              </Card>
              {#if pick === p.pid}
                <div class="row wrap mt-2">
                  <Button size="sm" variant="ghost" onclick={() => (social.profile = p.pid)}>{L.profile.open}</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="mail"
                    onclick={() => (social.dm = { pid: p.pid, name: p.name })}>{L.profile.dm}</Button
                  >
                  <!-- xếp bậc: minh chủ tới R4, đường chủ (R4) chỉ trong R1–R3 cho người dưới mình -->
                  {#if myRole >= 1 && p.role < myRole - 1}<Button
                      size="sm"
                      variant="ghost"
                      onclick={() => go({ type: 'allyRole', pid: p.pid, role: (p.role + 1) as Role })}
                      >{L.ally.promote}</Button
                    >{/if}
                  {#if myRole >= 1 && myRole > p.role && p.role > -2}<Button
                      size="sm"
                      variant="ghost"
                      onclick={() => go({ type: 'allyRole', pid: p.pid, role: (p.role - 1) as Role })}
                      >{L.ally.demote}</Button
                    >{/if}
                  {#if myRole === 2}<Button
                      size="sm"
                      variant="ghost"
                      onclick={() => go({ type: 'allyRole', pid: p.pid, role: 2 })}>{L.ally.lead}</Button
                    >{/if}
                  <!-- chức vị: minh chủ phong cho đường chủ (R4) — phong lại đúng người đang giữ là bãi chức -->
                  {#if myRole === 2 && p.role === 1}
                    {#each OFFICE_IDS as o (o)}<Button
                        size="sm"
                        variant={officeOf(p.pid) === o ? 'gold' : 'quiet'}
                        onclick={() => go({ type: 'allyOffice', pid: p.pid, office: o })}
                        >{L.ally.officeSet(L.ally.offices[o][0], L.ally.offices[o][1])}</Button
                      >{/each}
                  {/if}
                  <!-- minh chủ vắng lâu: đường chủ nhận thay -->
                  {#if myRole === 1 && p.role === 2 && away(p) >= ALLY_IDLE}<Button
                      size="sm"
                      variant="gold"
                      onclick={() => go({ type: 'allyClaim' }, 'reward')}>{L.ally.claim}</Button
                    >{/if}
                  {#if myRole > p.role}<Button
                      size="sm"
                      variant="danger"
                      onclick={() => go({ type: 'allyKick', pid: p.pid })}>{L.ally.kick}</Button
                    >{/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </Section>
    {/if}

    {#if atab === 'war'}
      {#if me !== null}<AllyPlans {ally} {me} {go} {onmap} />{/if}
      <Section title={L.world.marks}>
        {#if ally.marks?.length}
          <div class="row wrap">
            {#each ally.marks as m (`${m.x},${m.y}`)}
              <Button size="sm" variant="ghost" icon="flag" onclick={() => onmap?.(m.x, m.y)}
                >{m.text} {L.world.coord(m.x, m.y)}</Button
              >
            {/each}
          </div>
        {:else}
          <p class="t-small t-soft">{L.world.noMarks}</p>
        {/if}
      </Section>

      <Section title={L.war.title}>
        <p class="t-small t-soft">{L.war.hint}</p>
        <p class="row between t-small">
          <b>{ally.war.signed ? L.war.signed : L.war.when(clock(warAt(weekOf(g.now)) - g.now))}</b>
          <span class="t-num t-soft">{L.war.pts(ally.war.pts)}</span>
        </p>
        {#if myRole >= 1}
          <Button
            size="sm"
            variant={ally.war.signed ? 'quiet' : 'gold'}
            icon="swords"
            onclick={() => go({ type: ally?.war.signed ? 'warUnsign' : 'warSign' }, 'reward')}
            >{ally.war.signed ? L.war.unsign : L.war.sign}</Button
          >
        {/if}
        {#if ally.war.last.length}
          <small class="t-tiny t-soft">{L.war.last}</small>
          <ul class="stack" style:--gap="2px">
            {#each ally.war.last as r (r.a)}
              <li class="t-small" class:t-strong={r.a === ally.id || r.b === ally.id}>
                {L.war.row(r.an, r.bn, r.wa, r.wb)}
              </li>
            {/each}
          </ul>
        {/if}
      </Section>

      {#if me !== null}<ArkCard row={ally.ark} {me} aid={ally.id} officer={myRole >= 1} {go} />{/if}
      {#if me !== null}<AllyParty {ally} {me} {go} />{/if}

      <Section title={L.legion.title}>
        <p class="t-small t-soft">{L.legion.lore}</p>
        <p class="row between t-small">
          <b>{legionLine}</b>
          <Tag tone={lg.signed ? 'good' : 'plain'}>{lg.signed ? L.legion.signed : L.legion.notSigned}</Tag>
        </p>
        {#if lg.signed && lg.done}<small class="t-small t-num">{L.legion.pts(lg.mine, lg.pts)}</small>{/if}
        {#if myRole >= 1 && g.now < legionAt(week, 0)}
          <Button
            size="sm"
            variant={lg.signed ? 'quiet' : 'gold'}
            icon="shield"
            onclick={() => go({ type: lg.signed ? 'legionUnsign' : 'legionSign' }, 'reward')}
            >{lg.signed ? L.legion.unsign : L.legion.sign}</Button
          >
        {:else if myRole < 1 && !lg.signed}<small class="t-tiny t-soft">{L.legion.hint}</small>{/if}
      </Section>

      <Section title={L.nap.title}>
        <p class="t-small t-soft">{L.nap.hint}</p>
        {#if !others}
          <Button size="sm" variant="ghost" onclick={loadOthers}>{L.nap.open}</Button>
        {:else}
          {#each ally.napIn ?? [] as id (id)}
            <div class="row wrap" style:--gap="6px">
              <span class="t-small grow">{L.nap.asks(napName(id))}</span>
              {#if myRole >= 1}
                <Button size="sm" variant="gold" onclick={() => go({ type: 'napOk', id }, 'reward')}>{L.nap.ok}</Button>
                <Button size="sm" variant="quiet" onclick={() => go({ type: 'napNo', id })}>{L.nap.no}</Button>
              {/if}
            </div>
          {/each}
          {#each ally.naps ?? [] as id (id)}
            <div class="row" style:--gap="6px">
              <span class="t-small grow"><Icon name="shield" size={14} /> {napName(id)}</span>
              {#if myRole >= 1}<Button size="sm" variant="quiet" onclick={() => go({ type: 'napEnd', id })}
                  >{L.nap.end}</Button
                >{/if}
            </div>
          {/each}
          {#if myRole >= 1}
            <div class="row wrap" style:--gap="4px">
              {#each others.filter(r => r.id !== ally?.id && !ally?.naps?.includes(r.id)) as r (r.id)}
                <Button size="sm" variant="ghost" onclick={() => go({ type: 'napAsk', id: r.id })}
                  >{L.nap.ask(`[${r.tag}] ${r.name}`)}</Button
                >
              {/each}
            </div>
          {/if}
        {/if}
      </Section>

      <!-- Phá Yêu Trại: khung thứ Ba – thứ Tư, điểm minh + hạng -->
      <Section title={L.tribe.title}>
        <p class="t-tiny t-soft">{L.tribe.hint}</p>
        <div class="row wrap">
          <Tag tone={tribeWin.on ? 'good' : 'plain'} icon="clock"
            >{tribeWin.on ? L.tribe.on(L.ago(tribeWin.t)) : L.tribe.soon(L.ago(tribeWin.t))}</Tag
          >
          {#if ally.tribe?.week === weekOf(g.now) && ally.tribe.pts}<small class="t-small t-gold"
              >{L.tribe.pts(num(ally.tribe.pts), ally.tribe.rank)}</small
            >{/if}
        </div>
      </Section>

      {#if ally.rallies.length}
        <Section title={L.world.rally}>
          <ul class="stack" style:--gap="2px">
            {#each ally.rallies as r (r.id)}<li class="row t-small">
                <span class="grow"
                  >{L.world.rallyAt(nameOf(r.by), rallyWhat(r), clock(Math.max(0, r.at - game.time)))}</span
                >
                {#if r.task === 'raid' && onraid && r.at > game.time}<Button
                    size="sm"
                    variant="gold"
                    icon="swords"
                    onclick={() => onraid(r.i)}>{L.world.joinRally(clock(r.at - game.time))}</Button
                  >{/if}
              </li>{/each}
          </ul>
          <p class="t-tiny t-soft">{L.world.rallyHint}</p>
        </Section>
      {/if}
    {/if}

    {#if atab === 'chat' && chat}{@render chat()}{/if}

    {#if atab === 'home'}<div class="mt-4">
        <Confirm warn={L.ally.leaveSure} label={L.ally.leave} onconfirm={() => go({ type: 'allyLeave' })}>
          {#snippet trigger(ask)}
            <Button variant="quiet" wide onclick={ask}><Icon name="back" size={16} />{L.ally.leave}</Button>
          {/snippet}
        </Confirm>
      </div>{/if}
  {/if}
</Page>

<style>
  input,
  textarea {
    width: 100%;
    padding: 8px 10px;
    font: inherit;
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: var(--cut);
    background: var(--paper);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ink3);
  }
  .on {
    background: var(--malachite);
  }
  /* ---------- sảnh minh ---------- */
  .hall {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 6px 14px 12px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .flag {
    position: relative;
    display: grid;
    place-items: center;
    width: 72px;
  }
  .flag img {
    width: 72px;
    height: auto;
    margin-top: -14px;
    filter: drop-shadow(0 4px 5px rgb(0 0 0 / 0.25));
    transform-origin: 50% 0;
    animation: sway 5s ease-in-out infinite;
  }
  /* hiệu minh viết trong đĩa trắng của cờ */
  .flagtag {
    position: absolute;
    top: 32%;
    left: 50%;
    translate: -50% -50%;
    max-width: 42px;
    overflow: hidden;
    font-size: 12px;
    font-weight: 900;
    color: var(--cinnabar);
  }
  .flag img.crowd {
    width: 84px;
    margin: 4px 0 0;
    animation: none;
  }
  .flag.mini {
    width: 34px;
  }
  .flag.mini img {
    width: 34px;
    margin: -4px 0 0;
    animation: none;
  }
  .flag.mini .flagtag {
    top: 30%;
    font-size: 8px;
  }
  @keyframes sway {
    50% {
      rotate: 1.5deg;
    }
  }
  .hall-id {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .hall-name {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .hall-name span {
    font-size: var(--fs-3);
  }
  /* ba tấm biển gỗ nhỏ: cống hiến · minh khố · minh lễ */
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    margin-top: 6px;
  }
  .stats > span {
    display: grid;
    align-content: start;
    gap: 1px;
    padding: 4px 6px 5px;
    text-align: center;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  .stats small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .stats b {
    font-size: var(--fs-3);
  }
  /* ---------- lối vào: tranh đóng khung, nhãn giấy ---------- */
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  /* bố cáo: tờ giấy ghim son */
  .note {
    position: relative;
    padding: 12px 14px;
    background: #fbf7ec;
    border: 1px solid #d8cdb4;
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.12);
    rotate: -0.6deg;
  }
  .note::before {
    content: '';
    position: absolute;
    top: -6px;
    left: calc(50% - 6px);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #f07a62, var(--cinnabar) 60%, #6e1f18);
    box-shadow: 0 2px 2px rgb(0 0 0 / 0.3);
  }
</style>
