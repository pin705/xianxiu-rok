<script lang="ts">
  // Thôn Trang Gặp Nạn (Strange Incidents của RoK): việc cứu nạn đang làm — tiến độ, hạn, báo công; chạm thôn đang cháy trên
  // bản đồ giới (site) thì xem trước việc của thôn đó và nhận việc. Luật ở rules/world/rescue.ts + sect/nan.ts.
  import { NAN_DAY, NAN_GIFT, NAN_TIME, advance, nanDone } from '@rok/rules'
  import { fires, nanOpen, nanTask, nanToday, type Atlas, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { artOf } from '@rok/art'
  import { Bag, Button, Meter } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  let { site, atlas, send }: { site?: number; atlas?: Atlas; send?: (a: WorldAction) => Promise<Ack> } = $props()
  const g = useGame()
  const gate = artOf('ui:fx-shield')?.src // cổng làng có lính gác
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
      <!-- việc đang làm: tờ cáo thị ghim son, hạn trên dải son -->
      <div class="note" class:ready={live && done >= q.n}>
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
      </div>
    {/if}
    {#if task && !(live && q?.i === site)}
      <!-- thôn cháy: cổng làng vẽ tay, lời báo động trên dải son -->
      <header class="alarm">
        {#if gate}<img src={gate} alt="" draggable="false" />{/if}
        <b class="t-small">{L.nan.alarm}</b>
        <p class="t-tiny t-lore">{L.nan.burning(NAN_TIME / 3_600_000)}</p>
      </header>
      {#if live}
        <p class="t-small t-soft">{L.nan.busy}</p>
      {:else}
        <div class="note">
          <div class="row between wrap">
            <b class="t-small">{L.fest.task[task.m](num(task.n))}</b>
            <Bag items={NAN_GIFT.items} size="sm" />
          </div>
        </div>
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
  /* tờ cáo thị ghim son (như bố cáo tiên minh) */
  .note {
    position: relative;
    padding: 12px 12px 10px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.12);
    rotate: -0.5deg;
  }
  .note::before {
    content: '';
    position: absolute;
    top: -6px;
    left: calc(50% - 6px);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
    box-shadow: 0 2px 2px rgb(var(--shade) / 0.3);
  }
  .note.ready {
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 35%, transparent),
      0 0 14px rgb(var(--gold-glow) / 0.6);
  }
  .alarm {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 4px 10px;
    align-items: center;
  }
  .alarm:not(:has(img)) {
    grid-template-columns: minmax(0, 1fr);
  }
  .alarm img {
    grid-row: span 2;
    width: 64px;
    height: 64px;
    object-fit: contain;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
  .alarm b {
    justify-self: start;
    padding: 1px 10px 2px;
    color: var(--silk);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%);
  }
</style>
