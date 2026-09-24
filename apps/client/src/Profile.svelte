<script lang="ts">
  // Hồ sơ chưởng môn (như Governor Profile của RoK): chạm tên ở chat, người trong minh, tông môn trên bản đồ giới.
  // Cảnh giới, lực chiến, tiên minh, chỗ ngồi (tới xem trên bản đồ), chiến tích; truyền âm, chặn.
  import type { Profile } from '@rok/protocol'
  import type { Net } from './net'
  import { Button, Card, Medal, Sheet, Stat, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let {
    api,
    me,
    onmap,
  }: {
    api: Pick<Net, 'ask'> | null
    me: number | null
    onmap?: (x: number, y: number) => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)

  let p = $state.raw<Profile | null>(null)
  $effect(() => {
    const pid = social.profile
    p = null
    if (pid !== null) void api?.ask({ k: 'profile', pid }).then(r => social.profile === pid && (p = r))
  })
  const close = () => (social.profile = null)
  const blocked = $derived(p ? game.blocks.includes(p.pid) : false)
</script>

<Sheet open={social.profile !== null} onclose={close} title={p?.name ?? '…'} sub={p ? L.realm(p.hall) : undefined}>
  {#snippet art()}<Medal emblem="crest" tone={p?.pid === me ? 'gold' : 'pvp'} size={62} />{/snippet}
  {#if p}
    <div class="stack">
      <Card tone="silk">
        <div class="row wrap">
          {#if p.ally}<Tag tone="gold">[{p.ally.tag}] {p.ally.name} · {L.ally.role[p.ally.role]}</Tag>{:else}<Tag
              >{L.profile.noAlly}</Tag
            >{/if}
          <Tag tone={p.online ? 'good' : 'plain'}>{p.online ? L.ally.online : L.profile.offline}</Tag>
          {#if p.ascended}<Tag tone="gold" icon="star">{L.profile.ascended(p.ascended)}</Tag>{/if}
        </div>
      </Card>
      <div class="stack" style:--gap="0">
        <Stat label={L.power}>{num(p.power)}</Stat>
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
          <Button size="sm" variant="quiet" onclick={() => g.act({ type: 'block', pid: p!.pid, on: !blocked })}
            >{blocked ? L.chat.unblock : L.chat.block}</Button
          >
        {/if}
      </div>
    </div>
  {:else}
    <p class="t-small t-soft">…</p>
  {/if}
</Sheet>
