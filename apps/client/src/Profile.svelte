<script lang="ts">
  // Hồ sơ chưởng môn (như Governor Profile của RoK): chạm chân dung mình, tên ở chat, người trong minh, tông môn trên bản đồ.
  // Cảnh giới, lực chiến, tiên minh, chỗ ngồi (tới xem trên bản đồ), chiến tích; truyền âm, chặn.
  import type { Ack, GroupView, Profile } from '@rok/protocol'
  import { TITLES, TITLE_IDS, type TitleId } from '@rok/rules'
  import type { WorldAction } from '@rok/rules/world'
  import type { Net } from './net'
  import { Button, Card, Medal, Sheet, Stat, Tag } from './ui'
  import { L, num } from './lib'
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
  const blocked = $derived(p ? game.blocks.includes(p.pid) : false)
</script>

<Sheet open={social.profile !== null} onclose={close} title={p?.name ?? '…'} sub={p ? L.realm(p.hall) : undefined}>
  {#snippet art()}<Medal emblem="crest" tone={p?.pid === me ? 'gold' : 'pvp'} size={62} />{/snippet}
  {#if p}
    <div class="stack">
      <Card tone="silk">
        <div class="row wrap">
          {#if p.ally}<Tag tone="gold">[{p.ally.tag}] {p.ally.name} · {L.ally.role(p.ally.role)}</Tag>{:else}<Tag
              >{L.profile.noAlly}</Tag
            >{/if}
          <Tag tone={p.online ? 'good' : 'plain'}>{p.online ? L.ally.online : L.profile.offline}</Tag>
          {#if p.ascended}<Tag tone="gold" icon="star">{L.profile.ascended(p.ascended)}</Tag>{/if}
          {#if p.dao}<Tag tone="plain">{L.dao.names[p.dao].name}</Tag>{/if}
          {#if p.lord}<Tag tone="gold" icon="flag">{L.lord.is}</Tag>{/if}
          {#if p.title}<Tag tone={TITLES[p.title].good ? 'good' : 'bad'}
              >{L.lord.names[p.title]} · {L.lord.fx(p.title)}</Tag
            >{/if}
        </div>
      </Card>
      <div class="stack" style:--gap="0">
        <Stat label={L.power}>{num(p.power)}</Stat>
        <Stat label={L.rank.boards.kills}>{num(p.kp)}</Stat>
        <Stat label={L.profile.pvp}>{L.profile.wl(p.pvp.win, p.pvp.loss)}</Stat>
        <Stat label={L.rank.boards.tower}>{p.tower}</Stat>
        <Stat label={L.profile.elders}>{p.elders}</Stat>
        <Stat label={L.profile.rebirths}>{p.rebirths}</Stat>
        <Stat label={L.profile.ach}>{p.ach}</Stat>
      </div>
      <div class="row wrap">
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
        </div>
      {/if}
    </div>
  {:else}
    <p class="t-small t-soft">…</p>
  {/if}
</Sheet>
