<script lang="ts">
  // Thôn Trang Gặp Nạn (Strange Incidents của RoK): việc cứu nạn đang làm — tiến độ, hạn, báo công; chạm thôn đang cháy trên
  // bản đồ giới (site) thì xem trước việc của thôn đó và nhận việc. Luật ở rules/world/rescue.ts + sect/nan.ts.
  import { NAN_DAY, NAN_GIFT, NAN_TIME, advance, nanDone } from '@rok/rules'
  import { fires, nanOpen, nanTask, nanToday, type Atlas, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Bag, Button, Card, Meter } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  let { site, atlas, send }: { site?: number; atlas?: Atlas; send?: (a: WorldAction) => Promise<Ack> } = $props()
  const g = useGame()
  const now = $derived(g.now)
  // chỉ số (đệ tử tuyển xong, đan luyện xong…) tăng trong advance: đưa state tới bây giờ để tiến độ đúng
  const s = $derived(advance(g.game, now))
  const q = $derived(s.nan?.q)
  const live = $derived(!!q && q.until > now)
  const done = $derived(nanDone(s))
  const task = $derived(
    site !== undefined && atlas && nanOpen(s, now) && fires(atlas, now).includes(site)
      ? nanTask(atlas, site, now)
      : null,
  )
  const today = $derived(nanToday(s, now))
  // ở một thôn (TileSheet): chỉ hiện việc đang làm khi thôn đó đang cháy hoặc là thôn của việc
  const showQ = $derived(!!q && (site === undefined || (live && (!!task || q.i === site))))
  let busy = $state(false)
  async function take() {
    if (site === undefined || !send) return
    busy = true
    const r = await send({ type: 'rescue', i: site })
    busy = false
    if (r.ok) sfx('tap')
  }
</script>

{#if showQ || task || site === undefined}
  <div class="stack" class:site={site !== undefined} style:--gap="var(--sp-2)">
    {#if q && showQ}
      <Card tone={live && done >= q.n ? 'glow' : undefined}>
        <div class="stack" style:--gap="4px">
          <p class="row between">
            <b class="t-small">{L.nan.title} · {L.fest.task[q.m](num(q.n))}</b>
            <small class="t-num t-soft">{num(Math.min(done, q.n))}/{num(q.n)}</small>
          </p>
          <Meter value={Math.min(1, done / q.n)} size="sm" />
          <div class="row between">
            <small class="t-small t-soft">{live ? L.nan.due(clock(q.until - now)) : L.nan.late}</small>
            {#if live && done >= q.n}
              <Button size="sm" variant="gold" disabled={g.busy} onclick={() => g.act({ type: 'rescueDone' }, 'reward')}
                >{L.nan.done}</Button
              >
            {/if}
          </div>
        </div>
      </Card>
    {/if}
    {#if task && !(live && q?.i === site)}
      <p class="t-small t-bad t-strong">{L.nan.alarm}</p>
      <p class="t-small t-lore">{L.nan.burning(NAN_TIME / 3_600_000)}</p>
      {#if live}
        <p class="t-small t-soft">{L.nan.busy}</p>
      {:else}
        <Card>
          <div class="row between">
            <b class="t-small">{L.fest.task[task.m](num(task.n))}</b>
            <Bag items={NAN_GIFT.items} size="sm" />
          </div>
        </Card>
        <Button wide variant="gold" disabled={busy || today >= NAN_DAY} onclick={take}>{L.nan.take}</Button>
      {/if}
    {:else if site === undefined && !live}
      <p class="t-small t-soft">{L.nan.find}</p>
    {/if}
    {#if task || site === undefined}<small class="t-tiny t-soft">{L.nan.today(today, NAN_DAY)}</small>{/if}
  </div>
{/if}

<style>
  .site {
    margin-bottom: var(--sp-3);
  }
</style>
