<script lang="ts">
  // Danh sách chiến báo, mới nhất trên cùng. Chạm để xem lại trận.
  import { RESOURCES, count, type Report, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Card, Medal, Sheet } from './ui'
  import { L, num, reportName } from './lib'

  let { game, open, onclose, onopen }: { game: State; open: boolean; onclose: () => void; onopen: (r: Report) => void } = $props()

  const list = $derived([...game.reports].reverse())
</script>

<Sheet {open} {onclose} title={L.report.title}>
  {#if !list.length}<p class="center t-lore mt-4">{L.report.none}</p>{/if}
  <ul class="stack mt-2">
    {#each list as r (r.id)}
      {@const loot = RESOURCES.reduce((s, x) => s + (r.gain.res[x] ?? 0), 0)}
      <li>
        <Card onclick={() => onopen(r)} label={reportName(r)}>
          <span class="row">
            <Medal emblem={r.win ? 'win' : 'lose'} tone={r.win ? 'red' : 'ink'} size={38} />
            <span class="grow stack" style:--gap="1px">
              <b>{reportName(r)}{r.f !== undefined ? ` · ${L.level(r.f + 1)}` : ''}</b>
              <small class="t-small t-soft">
                {r.win ? L.report.win : L.report.lose} · {L.ago(Math.max(60_000, game.time - r.at))}{#if count(r.hurt)} · {L.report.hurt} {num(count(r.hurt))}{/if}{#if loot} · +{num(loot)}{/if}
              </small>
            </span>
            <Icon name="arrow" size={16} />
          </span>
        </Card>
      </li>
    {/each}
  </ul>
</Sheet>
