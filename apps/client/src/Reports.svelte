<script lang="ts">
  // Hộp thư: thư (quà nhận ngay tại đây) và chiến báo (chạm để xem lại trận), mới nhất trên cùng.
  import { mailText } from '@rok/i18n'
  import { RESOURCES, count, type Action, type Mail, type Report, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Medal, Sheet, Tabs, fly } from './ui'
  import { L, num, reportName, sfx } from './lib'

  let {
    game,
    open,
    onclose,
    onopen,
    act = () => null,
  }: {
    game: State
    open: boolean
    onclose: () => void
    onopen: (r: Report) => void
    act?: (a: Action) => State | null
  } = $props()

  // Thư còn quà chưa nhận: mở thẳng thẻ Thư (người chơi chọn thẻ khác thì giữ tới lần mở sau)
  let picked = $state<'reports' | 'mail' | null>(null)
  $effect(() => {
    if (!open) picked = null
  })
  const tab = $derived(picked ?? (game.mail.some(m => m.gift && !m.got) ? 'mail' : 'reports'))
  const list = $derived([...game.reports].reverse())
  const mails = $derived([...game.mail].reverse())
  const text = (m: Mail) => mailText(L, m)
</script>

<Sheet {open} {onclose} title={tab === 'mail' ? L.mail.title : L.report.title}>
  <Tabs
    items={[
      { id: 'mail', label: L.mail.title },
      { id: 'reports', label: L.mail.reports },
    ]}
    value={tab}
    onchange={t => (picked = t as 'mail' | 'reports')}
  />
  {#if tab === 'mail'}
    {#if !mails.length}<p class="center t-lore mt-4">{L.mail.empty}</p>{/if}
    <ul class="stack mt-2">
      {#each mails as m (m.id)}
        {@const [title, body] = text(m)}
        <li>
          <Card tone={m.gift && !m.got ? 'glow' : 'paper'}>
            <div class="stack" style:--gap="4px">
              <span class="row"
                ><Icon name="mail" size={18} /><b class="grow">{title}</b><small class="t-tiny t-soft"
                  >{L.ago(Math.max(60_000, game.time - m.at))}</small
                ></span
              >
              <p class="t-small t-lore">{body}</p>
              {#if m.gift}
                <div class="row between">
                  <Bag res={m.gift.res} items={m.gift.items} size="sm" />
                  {#if m.got}
                    <span class="t-small t-good">{L.mail.got}</span>
                  {:else}
                    <Button
                      variant="gold"
                      size="sm"
                      onclick={e =>
                        act({ type: 'mail', id: m.id }) &&
                        (sfx('reward'), fly(e.currentTarget as Element, m.gift?.res ?? {}))}>{L.mail.claim}</Button
                    >
                  {/if}
                </div>
              {/if}
            </div>
          </Card>
        </li>
      {/each}
    </ul>
  {:else}
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
                  {r.def
                    ? r.win
                      ? L.pvp.repelled(r.foe ?? '')
                      : L.pvp.raided(r.foe ?? '')
                    : r.win
                      ? L.report.win
                      : L.report.lose}{#if r.lost && RESOURCES.some(x => r.lost?.[x])}
                    · {L.pvp.lost} −{num(RESOURCES.reduce((sum, x) => sum + (r.lost?.[x] ?? 0), 0))}{/if} · {L.ago(
                    Math.max(60_000, game.time - r.at),
                  )}{#if count(r.hurt)}
                    · {L.report.hurt} {num(count(r.hurt))}{/if}{#if loot}
                    · +{num(loot)}{/if}
                </small>
              </span>
              <Icon name="arrow" size={16} />
            </span>
          </Card>
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>
