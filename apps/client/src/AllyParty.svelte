<script lang="ts">
  // Man Hoang Cổ Tộc (Ceroli Crisis giản lược): phòng tổ đội của tiên minh — mở phòng (độ khó, vai) hoặc vào phòng đang chờ; đủ
  // người hay hết giờ chờ thì server giải, quà qua thư
  import { PARTY_HALL, PARTY_MAX, PARTY_MIGHT, PARTY_ROLES, dayOf, type PartyRole } from '@rok/rules'
  import type { AllyInfo, WorldAction } from '@rok/rules/world'
  import { Button, Section, Tag } from './ui'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let {
    ally,
    me,
    go,
  }: { ally: AllyInfo; me: number; go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean> } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const ROLES = Object.keys(PARTY_ROLES) as PartyRole[]
  let lv = $state(1)
  let role = $state<PartyRole>('chuCong')
  const room = $derived(ally.party && ally.party.at > g.now ? ally.party : null)
  const played = $derived(game.partyDay === dayOf(g.now))
  const name = (pid: number) => ally.people.find(p => p.pid === pid)?.name ?? '?'
  const inside = $derived(!!room?.members.some(m => m.pid === me))
</script>

<Section title={L.party.title}>
  <p class="t-small t-soft">{L.party.hint}</p>
  {#if game.levels.chuDien < PARTY_HALL}
    <p class="t-small t-soft">{L.party.locked(PARTY_HALL)}</p>
  {:else if room}
    <p class="row between t-small">
      <b>{L.party.room(room.lv, num(PARTY_MIGHT[room.lv - 1]))}</b>
      <span class="t-num t-soft">{L.party.left(clock(room.at - g.now), room.members.length, PARTY_MAX)}</span>
    </p>
    <div class="row wrap" style:--gap="4px">
      {#each room.members as m (m.pid)}<Tag tone={m.pid === me ? 'gold' : 'plain'}
          >{name(m.pid)} · {L.party.roles[m.role]}</Tag
        >{/each}
    </div>
  {:else if played}
    <p class="t-small t-soft">{L.party.done}</p>
  {:else}
    <div class="row wrap" style:--gap="4px">
      {#each PARTY_MIGHT as might, k (k)}
        <Button size="sm" variant={lv === k + 1 ? 'gold' : 'quiet'} onclick={() => (lv = k + 1)}
          >{L.party.lv(k + 1, num(might))}</Button
        >
      {/each}
    </div>
  {/if}
  {#if game.levels.chuDien >= PARTY_HALL && !played && !inside && (!room || room.members.length < PARTY_MAX)}
    <div class="row wrap" style:--gap="4px">
      <small class="t-tiny">{L.party.pick}:</small>
      {#each ROLES as r (r)}
        <Button size="sm" variant={role === r ? 'gold' : 'ghost'} onclick={() => (role = r)}>{L.party.roles[r]}</Button>
      {/each}
    </div>
    <small class="t-tiny t-soft">{L.party.roleHint[role]}</small>
    <Button
      variant="gold"
      icon="swords"
      onclick={() => go(room ? { type: 'partyJoin', role } : { type: 'partyOpen', lv, role }, 'reward')}
      >{room ? L.party.join : L.party.open}</Button
    >
  {/if}
</Section>
