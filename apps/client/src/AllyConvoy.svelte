<script lang="ts">
  // Linh Thương Hộ Tống (Silk Road Speculators giản lược — luật ở rules/world/convoy.ts): trưởng lão / minh chủ tốn Minh khố khởi
  // hành đoàn buôn (độ khó mở dần theo điểm cao nhất của minh), người trong minh ghi danh hộ tống bằng đội đầu Luận Kiếm Đài; tới
  // giờ server giải, quà theo % hàng còn qua thư.
  import { CONVOY_COST, CONVOY_HALL, CONVOY_MAX, CONVOY_MIGHT, dayOf } from '@rok/rules'
  import { convoyTop, type AllyInfo, type WorldAction } from '@rok/rules/world'
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
  const cv = $derived(ally.convoy && ally.convoy.at > g.now ? ally.convoy : null)
  const rode = $derived(game.convoyDay === dayOf(g.now))
  const officer = $derived((ally.members[me] ?? -9) >= 1)
  const top = $derived(convoyTop(ally))
  let chosen = $state(0)
  const lv = $derived(Math.min(chosen || top, top))
  const name = (pid: number) => ally.people.find(p => p.pid === pid)?.name ?? '?'
</script>

<Section title={L.convoy.title}>
  <p class="t-small t-soft">{L.convoy.hint}</p>
  <small class="t-tiny t-gold">{L.convoy.best(ally.convoyBest ?? 0, top)}</small>
  {#if game.levels.chuDien < CONVOY_HALL}
    <p class="t-small t-soft">{L.convoy.locked(CONVOY_HALL)}</p>
  {:else if cv}
    <Card tone="silk">
      <div class="stack" style:--gap="6px">
        <p class="row between t-small">
          <b>{L.convoy.lv(cv.lv, num(CONVOY_MIGHT[cv.lv - 1]))}</b>
          <span class="t-num t-soft">{L.convoy.left(clock(cv.at - g.now), cv.guards.length, CONVOY_MAX)}</span>
        </p>
        <div class="row wrap" style:--gap="4px">
          {#each cv.guards as p (p)}<Tag tone={p === me ? 'gold' : 'plain'}>{name(p)}</Tag>{/each}
        </div>
        {#if !cv.guards.includes(me)}
          <Button
            variant="gold"
            icon="shield"
            disabled={rode || cv.guards.length >= CONVOY_MAX}
            onclick={() => go({ type: 'convoyGuard' }, 'reward')}>{rode ? L.convoy.done : L.convoy.guard}</Button
          >
        {/if}
      </div>
    </Card>
  {:else if officer}
    <div class="grid" style:--cols="4" style:--gap="6px">
      {#each CONVOY_MIGHT as _, k (k)}
        <Button
          size="sm"
          wide
          variant={lv === k + 1 ? 'gold' : 'ghost'}
          icon={k + 1 > top ? 'lock' : undefined}
          disabled={k + 1 > top}
          onclick={() => (chosen = k + 1)}>{L.convoy.star(k + 1)}</Button
        >
      {/each}
    </div>
    <p class="row between t-small">
      <span>{L.convoy.lv(lv, num(CONVOY_MIGHT[lv - 1]))}</span>
      <span class="t-num" class:t-bad={(ally.fund ?? 0) < CONVOY_COST[lv - 1]}
        >{L.convoy.cost(num(CONVOY_COST[lv - 1]), num(ally.fund ?? 0))}</span
      >
    </p>
    <Button
      variant="gold"
      icon="flag"
      disabled={rode || (ally.fund ?? 0) < CONVOY_COST[lv - 1]}
      onclick={() => go({ type: 'convoyGo', lv }, 'reward')}>{rode ? L.convoy.done : L.convoy.go}</Button
    >
  {:else}
    <p class="t-small t-soft">{L.convoy.wait}</p>
  {/if}
</Section>
