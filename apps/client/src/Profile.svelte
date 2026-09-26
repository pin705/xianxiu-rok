<script lang="ts">
  // Hồ sơ chưởng môn (như Governor Profile của RoK): chạm chân dung mình, tên ở chat, người trong minh, tông môn trên bản đồ.
  // Cảnh giới, lực chiến, tiên minh, chỗ ngồi (tới xem trên bản đồ), chiến tích; truyền âm, chặn.
  import type { Ack, GroupView, Profile } from '@rok/protocol'
  import { ELDER_IDS, FRAMES, TITLES, TITLE_IDS, frameOpen, honorOf, type TitleId } from '@rok/rules'
  import { DAO_TONES, Portrait, artOf, paintedUrl, portraitRing } from '@rok/art'
  import type { WorldAction } from '@rok/rules/world'
  import type { Net } from './net'
  import { BigStat, Button, Card, Face, Medal, Orb, Plaque, Sheet, Tag } from './ui'
  import { L, LOOK, MASTER, num } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'
  import Supply from './Supply.svelte'

  let {
    api,
    me,
    onmap,
    send,
    onranks,
  }: {
    api: Pick<Net, 'ask'> | null
    me: number | null
    onmap?: (x: number, y: number) => void
    send?: (a: WorldAction) => Promise<Ack> // Giới Chủ sắc phong
    onranks?: () => void // hồ sơ của mình: sang bảng xếp hạng
  } = $props()
  const g = useGame()
  const jade = artOf('ui:frame-portrait')?.src
  const game = $derived(g.game)

  let p = $state.raw<Profile | null>(null)
  let groups = $state.raw<GroupView[]>([]) // nhóm chat của mình: thêm người này vào
  $effect(() => {
    const pid = social.profile
    p = null
    if (pid === null) return
    void api?.ask({ k: 'profile', pid }).then(r => social.profile === pid && (p = r))
    void api?.ask({ k: 'groups' }).then(r => (groups = r ?? []))
  })
  async function addTo(id: number, pid: number) {
    if (send && (await send({ type: 'groupAdd', id, pid })).ok)
      groups = groups.map(x => (x.id === id ? { ...x, members: [...x.members, { pid, name: p?.name ?? '' }] } : x))
  }
  const close = () => (social.profile = null)
  const reload = () => social.profile !== null && api?.ask({ k: 'profile', pid: social.profile }).then(r => (p = r))
  async function crown(title: TitleId) {
    if (p && send && (await send({ type: 'crown', title, pid: p.pid })).ok) void reload()
  }
  // Phóng Trục (kỹ năng Giới Chủ): chạm lần đầu hỏi lại, lần hai mới đẩy tông môn người này ra vùng ngoài
  let banishing = $state(false)
  let banished = $state<string | null>(null)
  async function banish() {
    if (!p || !send) return
    if (!banishing) {
      banishing = true
      return
    }
    banishing = false
    const r = await send({ type: 'banish', pid: p.pid })
    banished = r.ok ? L.lord.banished(p.name) : (L.err[r.err] ?? L.err.bad)
  }
  // hồ sơ của mình: chân dung theo state đang chơi (vừa đổi thì hiện ngay, không chờ hỏi lại server)
  const face = $derived(p?.pid === me ? game.face : p?.face)
  const frame = $derived((p?.pid === me ? game.frame : p?.frame) ?? 'basic')
  const owned = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined))
  const blocked = $derived(p ? game.blocks.includes(p.pid) : false)
  // sáu biển số chiến tích: [nhãn, giá trị]
  const stats = $derived<[string, string | number][]>(
    p
      ? [
          [L.rank.boards.kills, num(p.kp)],
          [L.profile.pvp, L.profile.wl(p.pvp.win, p.pvp.loss)],
          [L.rank.boards.tower, p.tower],
          [L.profile.elders, p.elders],
          [L.profile.rebirths, p.rebirths],
          [L.profile.ach, p.ach],
        ]
      : [],
  )
  const friend = $derived(p ? !!game.friends?.includes(p.pid) : false)
</script>

<Sheet open={social.profile !== null} onclose={close} title={p?.name ?? '…'} sub={p ? L.realm(p.hall) : undefined}>
  <!-- chân dung (chưa chọn: chưởng môn) trong khung: khung thường là vòng ngọc vẽ tay, khung đặc biệt vẽ bằng code -->
  {#snippet art()}<Face
      look={face ? LOOK[face] : MASTER}
      size={62}
      ring={frame === 'basic' && jade ? jade : paintedUrl(`ring:${frame}`, () => portraitRing(frame), 76)}
    />{/snippet}
  {#if p}
    <div class="stack">
      <!-- danh thiếp chưởng môn: ấn minh bên trái (chưa vào minh: ấn mờ), minh · trạng thái · đạo · tước hiệu bên phải -->
      <div class="vista split items-start" style:--gap="12px">
        <Medal emblem="crest" tone={p.ally ? 'gold' : 'ink'} size={48} dim={!p.ally} />
        <div class="stack" style:--gap="4px">
          <b class="t-small"
            >{#if p.ally}[{p.ally.tag}] {p.ally.name} · {L.ally.role(p.ally.role)}{:else}<span class="t-soft"
                >{L.profile.noAlly}</span
              >{/if}</b
          >
          <span class="row" style:--gap="5px"
            ><i class="lamp" class:on={p.online}></i><small class="t-tiny t-soft"
              >{p.online ? L.ally.online : L.profile.offline}</small
            ></span
          >
          {#if p.dao}<span class="row" style:--gap="4px"
              ><Medal emblem={p.dao} tone={DAO_TONES[p.dao]} size={22} /><small class="t-tiny t-strong"
                >{L.dao.names[p.dao].name} · {L.dao.names[p.dao].unit}</small
              ></span
            >{/if}
          <div class="row wrap" style:--gap="4px">
            {#if p.ascended}<Tag tone="gold" icon="star">{L.profile.ascended(p.ascended)}</Tag>{/if}
            {#each p.crowns ?? [] as n (n)}<Tag tone="gold" icon="rank">{L.profile.crown(n)}</Tag>{/each}
            {#each p.honors ?? [] as code (code)}{@const h = honorOf(code)}<Tag tone="gold" icon="star"
                >{L.profile.honor(h.k, h.season)}</Tag
              >{/each}
            {#if p.lord}<Tag tone="gold" icon="flag">{L.lord.is}</Tag>{/if}
            {#if p.title}<Tag tone={TITLES[p.title].good ? 'good' : 'bad'}
                >{L.lord.names[p.title]} · {L.lord.fx(p.title)}</Tag
              >{/if}
          </div>
        </div>
      </div>
      <!-- chiến tích: lưới biển số (thế lực to nhất, trên cùng) -->
      <BigStat art="power" icon="power" label={L.power} value={num(p.power)} />
      <div class="grid" style:--cols="3" style:--gap="6px">
        {#each stats as [k, v] (k)}
          <Plaque label={k} value={v} />
        {/each}
      </div>
      {#if p.pid === me}
        <!-- đổi chân dung (Change Avatar của RoK): chưởng môn hoặc trưởng lão đã thu nhận -->
        <Card
          ><div class="stack" style:--gap="6px">
            <b class="t-small">{L.profile.face}</b>
            <small class="t-tiny t-soft">{L.profile.faceHint}</small>
            <div class="row wrap" style:--gap="6px">
              <Orb on={!game.face} label={L.profile.master} onclick={() => g.act({ type: 'face', elder: null }, 'tap')}
                ><Portrait look={MASTER} size={40} /></Orb
              >
              {#each owned as e (e)}<Orb
                  on={game.face === e}
                  label={L.elders[e].name}
                  onclick={() => g.act({ type: 'face', elder: e }, 'tap')}><Portrait look={LOOK[e]} size={40} /></Orb
                >{/each}
            </div>
            <b class="t-small">{L.profile.frame}</b>
            <div class="row wrap" style:--gap="6px">
              {#each FRAMES as fr (fr)}
                {@const open = frameOpen(game, fr)}
                <Orb
                  on={(game.frame ?? 'basic') === fr}
                  disabled={!open}
                  lock={!open}
                  label={L.profile.frames[fr]}
                  title={open ? L.profile.frames[fr] : L.profile.frameNeed[fr]}
                  onclick={() => g.act({ type: 'frame', id: fr }, 'tap')}
                  ><img src={paintedUrl(`ring:${fr}`, () => portraitRing(fr), 40)} alt="" width="40" height="40" /></Orb
                >
              {/each}
            </div>
          </div></Card
        >
      {/if}
      <div class="ruled-top row wrap" style:--gap="6px">
        {#if p.seat && onmap}
          {@const seat = p.seat}
          <Button
            size="sm"
            variant="ghost"
            icon="flag"
            onclick={() => {
              close()
              onmap(seat.x, seat.y)
            }}>{L.profile.seat} {L.world.coord(seat.x, seat.y)}</Button
          >
        {/if}
        {#if p.pid === me && onranks}
          <Button
            size="sm"
            variant="ghost"
            icon="rank"
            onclick={() => {
              close()
              onranks()
            }}>{L.rank.open}</Button
          >
        {/if}
        {#if p.pid !== me}
          <Button
            size="sm"
            variant="gold"
            icon="mail"
            onclick={() => {
              social.dm = { pid: p!.pid, name: p!.name }
              close()
            }}>{L.profile.dm}</Button
          >
          {#if p.invite && send}<Button
              size="sm"
              variant="ghost"
              icon="people"
              onclick={async () => p && (await send({ type: 'allyInvite', pid: p.pid })).ok && reload()}
              >{L.ally.invite}</Button
            >{/if}
          <Button
            size="sm"
            variant={friend ? 'quiet' : 'ghost'}
            icon="people"
            onclick={() => g.act({ type: 'friend', pid: p!.pid, on: !friend })}
            >{friend ? L.chat.unfriend : L.chat.befriend}</Button
          >
          <Button size="sm" variant="quiet" onclick={() => g.act({ type: 'block', pid: p!.pid, on: !blocked })}
            >{blocked ? L.chat.unblock : L.chat.block}</Button
          >
        {/if}
      </div>
      {#if p.pid !== me && send && groups.some(x => !x.members.some(m => m.pid === p?.pid))}
        <div class="row wrap" style:--gap="4px">
          {#each groups.filter(x => !x.members.some(m => m.pid === p?.pid)) as x (x.id)}
            <Button size="sm" variant="ghost" icon="people" onclick={() => p && addTo(x.id, p.pid)}
              >{L.chat.groupAdd(x.name)}</Button
            >
          {/each}
        </div>
      {/if}
      {#if p.supply && send}<Supply to={p.pid} name={p.name} room={p.supply} {send} onsent={reload} />{/if}
      {#if p.crown && send}
        <!-- Giới Chủ sắc phong: phúc cho đồng minh, hoạ cho kẻ thù (mỗi người một tước, giữ 24 giờ) -->
        <div class="stack" style:--gap="4px">
          <b class="t-small">{L.lord.crown}</b>
          {#each [true, false] as good (good)}
            <div class="row wrap" style:--gap="4px">
              <small class="t-tiny t-soft">{good ? L.lord.good : L.lord.bad}</small>
              {#each TITLE_IDS.filter(id => TITLES[id].good === good) as id (id)}
                <Button
                  size="sm"
                  variant={p.title === id ? 'gold' : good ? 'ghost' : 'quiet'}
                  label="{L.lord.names[id]}: {L.lord.fx(id)}"
                  onclick={() => crown(id)}>{L.lord.names[id]}</Button
                >
              {/each}
            </div>
          {/each}
          {#if p.boon}<Button
              size="sm"
              variant="gold"
              icon="star"
              onclick={async () => p && (await send({ type: 'boon', pid: p.pid })).ok && reload()}
              >{L.lord.boon(p.boon)}</Button
            >{/if}
          {#if p.title}<Button
              size="sm"
              variant="quiet"
              onclick={async () => p?.title && (await send({ type: 'uncrown', title: p.title })).ok && reload()}
              >{L.lord.strip}</Button
            >{/if}
          {#if p.pid !== me}<Button size="sm" variant={banishing ? 'danger' : 'quiet'} icon="flag" onclick={banish}
              >{banishing ? L.lord.banishAsk(p.name) : L.lord.banish}</Button
            >{/if}
          {#if banished}<small class="t-tiny t-soft">{banished}</small>{:else}<small class="t-tiny t-soft"
              >{L.lord.banishHint}</small
            >{/if}
        </div>
      {/if}
    </div>
  {:else}
    <p class="t-small t-soft">…</p>
  {/if}
</Sheet>
