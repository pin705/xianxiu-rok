<script lang="ts">
  // Hộp thư: thư (quà nhận ngay tại đây) và chiến báo (chạm để xem lại trận; chia sẻ vào chat), mới nhất trên cùng.
  import { mailText } from '@rok/i18n'
  import { RESOURCES, count, type Mail, type Report, type Res } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, IconButton, Medal, Sheet, Tabs, fly } from './ui'
  import { L, defended, num, reportName, sfx } from './lib'
  import { useGame } from './game'

  let {
    open,
    onclose,
    onopen,
    share,
  }: {
    open: boolean
    onclose: () => void
    onopen: (r: Report) => void
    share?: (text: string) => void // gửi vào chat (kênh minh nếu có minh): người khác chạm "Xem trận"
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  // Thư còn quà chưa nhận: mở thẳng thẻ Thư (người chơi chọn thẻ khác thì giữ tới lần mở sau)
  let picked = $state<'reports' | 'mail' | null>(null)
  $effect(() => {
    if (!open) picked = null
  })
  const tab = $derived(picked ?? (game.mail.some(m => m.gift && !m.got) ? 'mail' : 'reports'))
  const list = $derived([...game.reports].reverse())
  const mails = $derived([...game.mail].reverse())
  const text = (m: Mail) => mailText(L, m)
  const total = (b?: Partial<Record<Res, number>>) => RESOURCES.reduce((n, x) => n + (b?.[x] ?? 0), 0)
  // Dòng phụ: thắng / thua (PvP: đẩy lui hay bị cướp), tài nguyên mất, bao lâu trước, thương vong, chiến lợi phẩm
  function line(r: Report) {
    const parts = [r.def ? defended(r) : r.win ? L.report.win : L.report.lose]
    const lost = total(r.lost),
      hurt = count(r.hurt),
      loot = total(r.gain.res)
    if (lost) parts.push(`${L.pvp.lost} −${num(lost)}`)
    parts.push(L.ago(Math.max(60_000, game.time - r.at)))
    if (hurt) parts.push(`${L.report.hurt} ${num(hurt)}`)
    if (loot) parts.push(`+${num(loot)}`)
    return parts.join(' · ')
  }
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
    {@const gifts = mails.filter(m => m.gift && !m.got)}
    {#if gifts.length > 1}
      <!-- như "Nhận tất cả" của RoK: mọi thư còn quà một chạm -->
      <div class="mt-2">
        <Button
          variant="gold"
          wide
          onclick={() => {
            if (gifts.map(m => act({ type: 'mail', id: m.id })).some(Boolean)) sfx('reward')
          }}>{L.mail.claimAll(gifts.length)}</Button
        >
      </div>
    {/if}
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
              <p class="t-small t-lore" style:white-space="pre-line">{body}</p>
              {#if m.gift}
                <div class="row between">
                  <Bag res={m.gift.res} items={m.gift.items} size="sm" />
                  {#if m.got}
                    <span class="t-small t-good">{L.mail.got}</span>
                  {:else}
                    <Button
                      variant="gold"
                      size="sm"
                      onclick={e => {
                        if (!act({ type: 'mail', id: m.id })) return
                        sfx('reward')
                        fly(e.currentTarget as Element, m.gift?.res ?? {})
                      }}>{L.mail.claim}</Button
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
        <li class="row">
          <span class="grow">
            <Card onclick={() => onopen(r)} label={reportName(r)}>
              <span class="row">
                <Medal emblem={r.win ? 'win' : 'lose'} tone={r.win ? 'red' : 'ink'} size={38} />
                <span class="grow stack" style:--gap="1px">
                  <b>{reportName(r)}{r.f !== undefined ? ` · ${L.level(r.f + 1)}` : ''}</b>
                  <small class="t-small t-soft">{line(r)}</small>
                </span>
                <Icon name="arrow" size={16} />
              </span>
            </Card>
          </span>
          {#if share && r.kind !== 'trib'}<IconButton
              icon="upload"
              label={L.report.share}
              size={36}
              onclick={() => share(`${L.report.fresh(reportName(r), r.win)} #r${r.id}`)}
            />{/if}
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>
