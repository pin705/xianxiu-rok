<script lang="ts">
  // Minh sự lịch (Alliance Schedule / RSVP của RoK): việc chung đã hẹn giờ của minh — giờ, lời nhắn, ai tham gia; bấm Tham gia
  // (bấm lại để rút), 10 phút trước giờ được nhắc. Trưởng lão / minh chủ hẹn việc mới (giờ theo máy mình) hoặc huỷ việc.
  import { PLAN_AHEAD, PLAN_MAX, PLAN_TEXT, PLAN_WARN } from '@rok/rules'
  import type { AllyInfo, WorldAction } from '@rok/rules/world'
  import { Button, Card, Section, Tag } from './ui'
  import { L, LANG, clock, coords } from './lib'
  import { useGame } from './game'

  let {
    ally,
    me,
    go,
    onmap,
  }: {
    ally: AllyInfo
    me: number
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
    onmap?: (x: number, y: number) => void // toạ độ trong lời nhắn: bay tới trên bản đồ giới
  } = $props()
  const g = useGame()
  const now = $derived(g.now)
  const officer = $derived((ally.members[me] ?? -9) >= 1)
  const plans = $derived((ally.plans ?? []).filter(p => p.at > now - 3_600_000))
  const upcoming = $derived(plans.filter(p => p.at > now).length)
  const name = (pid: number) => ally.people.find(p => p.pid === pid)?.name ?? '?'
  const when = (at: number) =>
    new Date(at).toLocaleString(LANG, {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  // ô chọn giờ (datetime-local, giờ máy mình): mặc định một giờ sau, làm tròn 5 phút
  const local = (t: number) => {
    const d = new Date(Math.ceil(t / 300_000) * 300_000)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  }
  let at = $state(local(Date.now() + 3_600_000))
  let text = $state('')
  const pickedAt = $derived(new Date(at).getTime())
  const valid = $derived(
    text.trim().length > 0 && pickedAt > now + PLAN_WARN && pickedAt <= now + PLAN_AHEAD && upcoming < PLAN_MAX,
  )
  async function add() {
    if (await go({ type: 'planAdd', at: pickedAt, text: text.trim() }, 'reward')) text = ''
  }
</script>

<Section title={L.plan.title}>
  <p class="t-small t-soft">{L.plan.hint}</p>
  {#if !plans.length}<p class="t-small t-soft">{L.plan.none}</p>{/if}
  <!-- dòng thời gian: mỗi việc một hạt trên sợi chỉ, việc đã tới giờ hạt son -->
  <ol class="path">
    {#each plans as p (p.id)}
      {@const mine = p.go.includes(me)}
      <li class:hit={p.at <= now}>
        <Card tone={mine ? 'glow' : undefined}>
          <div class="stack" style:--gap="4px">
            <p class="row between">
              <b class="t-small">{when(p.at)}</b>
              <small class="t-num" class:t-soft={p.at <= now} class:t-gold={p.at > now}
                >{p.at > now ? L.plan.in(clock(p.at - now)) : L.plan.past}</small
              >
            </p>
            <p class="t-small">{p.text}</p>
            {#if onmap}
              {#each coords(p.text) as c, k (k)}<Button
                  size="sm"
                  variant="quiet"
                  icon="flag"
                  onclick={() => onmap(c.x, c.y)}>{L.chat.goto(c.x, c.y)}</Button
                >{/each}
            {/if}
            <small class="t-tiny t-soft">{L.plan.by(name(p.by))} · {L.plan.going(p.go.length)}</small>
            {#if p.go.length}
              <div class="row wrap" style:--gap="4px">
                {#each p.go as pid (pid)}<Tag tone={pid === me ? 'gold' : 'plain'}>{name(pid)}</Tag>{/each}
              </div>
            {/if}
            {#if p.at > now}
              <div class="row" style:--gap="6px">
                <Button
                  size="sm"
                  variant={mine ? 'ghost' : 'gold'}
                  onclick={() => go({ type: 'planGo', id: p.id }, 'tap')}>{mine ? L.plan.leave : L.plan.join}</Button
                >
                {#if officer}<Button size="sm" variant="quiet" onclick={() => go({ type: 'planDel', id: p.id }, 'tap')}
                    >{L.plan.cancel}</Button
                  >{/if}
              </div>
            {/if}
          </div>
        </Card>
      </li>
    {/each}
  </ol>
  {#if officer}
    <Card tone="silk">
      <div class="stack" style:--gap="6px">
        <b class="t-small">{L.plan.new}</b>
        <input class="field" type="datetime-local" bind:value={at} aria-label={L.plan.at} />
        <input
          class="field"
          type="text"
          bind:value={text}
          maxlength={PLAN_TEXT}
          placeholder={L.plan.text}
          aria-label={L.plan.text}
        />
        <Button variant="gold" disabled={!valid} onclick={add}>{L.plan.add}</Button>
        {#if upcoming >= PLAN_MAX}<small class="t-tiny t-bad">{L.plan.full(PLAN_MAX)}</small>{/if}
      </div>
    </Card>
  {/if}
</Section>
