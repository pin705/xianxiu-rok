<script lang="ts">
  // Vây Công Yêu Vương 12 người (Ceroli Assault giản lược — luật ở rules/world/assault.ts): trong kỳ lễ vayCong, mở phòng độ khó (mở dần
  // theo độ khó minh đã hạ) hay vào phòng đang chờ bằng đội đầu Luận Kiếm Đài; đủ 12 người hay hết giờ thì server giải, thư báo kết quả.
  import { ASSAULT_FORTS, ASSAULT_MAX, ASSAULT_MIGHT, advance, dayOf, festOpen } from '@rok/rules'
  import { assaultTop, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import { Button, Card, Section, Tag } from './ui'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let {
    ally,
    me,
    go,
  }: { ally: AllyInfo; me: number; go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean> } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const on = $derived(festOpen(advance(game, g.now), 'vayCong', g.now))
  const room = $derived(ally.assault && ally.assault.at > g.now ? ally.assault : null)
  const used = $derived(game.assaultDay === dayOf(g.now))
  const top = $derived(assaultTop(ally))
  let chosen = $state(0)
  const lv = $derived(Math.min(chosen || top, top))
  const name = (pid: number) => ally.people.find(p => p.pid === pid)?.name ?? '?'
</script>

{#if on}
  <Section title={L.assault.title}>
    <p class="t-small t-soft">{L.assault.hint(ASSAULT_MAX)}</p>
    {#if room}
      <Card tone="silk">
        <div class="stack" style:--gap="6px">
          <p class="row between t-small">
            <b>{L.assault.lv(room.lv, num(ASSAULT_MIGHT[room.lv - 1]))}</b>
            <span class="t-num t-soft">{L.assault.left(clock(room.at - g.now), room.members.length, ASSAULT_MAX)}</span>
          </p>
          <div class="row wrap" style:--gap="4px">
            {#each room.members as p (p)}<Tag tone={p === me ? 'gold' : 'plain'}>{name(p)}</Tag>{/each}
          </div>
          {#if !room.members.includes(me)}
            <Button
              variant="gold"
              icon="swords"
              disabled={used || room.members.length >= ASSAULT_MAX}
              onclick={() => go({ type: 'assaultJoin' }, 'reward')}>{used ? L.assault.done : L.assault.join}</Button
            >
          {/if}
        </div>
      </Card>
    {:else}
      <div class="grid" style:--cols="4" style:--gap="6px">
        {#each ASSAULT_MIGHT as _, k (k)}
          <Button
            size="sm"
            wide
            variant={lv === k + 1 ? 'gold' : 'ghost'}
            icon={k + 1 > top ? 'lock' : undefined}
            disabled={k + 1 > top}
            onclick={() => (chosen = k + 1)}>{L.assault.star(k + 1)}</Button
          >
        {/each}
      </div>
      <p class="row between t-small">
        <span>{L.assault.lv(lv, num(ASSAULT_MIGHT[lv - 1]))}</span>
        <span class="t-gold">{L.assault.reward(ASSAULT_FORTS[lv - 1] * 10)}</span>
      </p>
      <Button variant="gold" icon="swords" disabled={used} onclick={() => go({ type: 'assaultOpen', lv }, 'reward')}
        >{used ? L.assault.done : L.assault.open}</Button
      >
    {/if}
  </Section>
{/if}
