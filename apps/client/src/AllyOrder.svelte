<script lang="ts">
  // Minh lệnh (Alliance Directives của RoK — luật ở rules/world/thoi.ts allyOrder): mỗi thời Thiên Thời đường chủ / minh chủ ban một
  // lệnh cho cả minh tới hết thời; người khác thấy lệnh đang chạy và ai ban
  import { ALLY_ORDERS, thoiAt } from '@rok/rules'
  import { dayIn, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import { Button, Section, Tag } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let {
    ally,
    officer,
    go,
  }: {
    ally: AllyInfo
    officer: boolean
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
  } = $props()
  const g = useGame()
  const day = $derived(g.game.seasonAt === undefined ? null : dayIn(g.game.seasonAt, g.now))
  const t = $derived(day === null ? null : thoiAt(day))
  const cur = $derived(t && ally.order?.n === t.n ? ally.order : null)
  const fx = (k: number) => L.bonus(ALLY_ORDERS[k].key, ALLY_ORDERS[k].v)
</script>

{#if t && day !== null}
  <Section title={L.order.title}>
    <p class="t-tiny t-soft">{L.order.hint(L.thoi.names[t.el], t.end - day)}</p>
    {#if cur}
      <p class="row wrap" style:--gap="6px">
        <Tag icon="flag" tone="good">{L.order.names[cur.k]}</Tag><small class="t-small">{fx(cur.k)}</small>
      </p>
      <small class="t-tiny t-soft">{L.order.by(ally.people.find(p => p.pid === cur.by)?.name ?? '—')}</small>
    {:else if officer}
      <div class="grid" style:--cols="2" style:--gap="6px">
        {#each ALLY_ORDERS as _, k (k)}
          <Button size="sm" variant="ghost" onclick={() => go({ type: 'allyOrder', k }, 'reward')}
            >{L.order.names[k]} · {fx(k)}</Button
          >
        {/each}
      </div>
    {:else}
      <p class="t-small t-soft">{L.order.none}</p>
    {/if}
  </Section>
{/if}
