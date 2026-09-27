<script lang="ts">
  // Huyễn Vực Bí Cảnh (Realm of Mystique của RoK) trong thẻ Hội chiến của Luận Kiếm Đài: chọn độ khó và vai, vào hàng ghép đội ngẫu nhiên;
  // đủ người thì cả đội đánh ba thủ lĩnh — kết quả qua thư; bảng phá đảo nhanh nhất tuần của độ khó đang chọn
  import {
    MYSTIC_DAILY,
    MYSTIC_HALL,
    MYSTIC_MODES,
    MYSTIC_TEAM,
    PARTY_ROLES,
    type MysticMode,
    type PartyRole,
  } from '@rok/rules'
  import { mysticUsed, type WorldAction } from '@rok/rules/world'
  import type { Ack, ArenaView } from '@rok/protocol'
  import { Button, Card, Segmented } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let {
    view,
    send,
    onchange,
  }: { view: ArenaView['mystic'] | undefined; send: (a: WorldAction) => Promise<Ack>; onchange: () => void } = $props()
  const g = useGame()
  const used = $derived(mysticUsed(g.game, g.now))
  const locked = $derived(g.game.levels.chuDien < MYSTIC_HALL)
  let mode = $state<MysticMode>('normal')
  let role = $state<PartyRole>('chuCong')
  const shown = $derived(view?.mine ?? mode)
</script>

<p class="t-small t-soft"><b class="t-strong">{L.mystic.title}</b> · {L.mystic.hint(MYSTIC_TEAM, MYSTIC_DAILY)}</p>
<Card tone="silk">
  <div class="stack" style:--gap="6px">
    <Segmented
      items={(Object.keys(MYSTIC_MODES) as MysticMode[]).map(id => ({ id, label: L.mystic.modes[id] }))}
      value={shown}
      onchange={id => (mode = id)}
    />
    <p class="row between t-small">
      <b>{L.mystic.queue(view?.q[shown] ?? 0, MYSTIC_TEAM)}</b><span class="t-gold"
        >{L.mystic.wins(g.game.mystic?.win ?? 0)}</span
      >
    </p>
    <small class="t-tiny t-soft">{L.mystic.left(MYSTIC_DAILY - used, MYSTIC_DAILY)}</small>
    {#if view?.mine}
      <Button variant="ghost" onclick={() => send({ type: 'mysticLeave' }).then(onchange)}>{L.mystic.leave}</Button>
    {:else}
      <Segmented
        items={(Object.keys(PARTY_ROLES) as PartyRole[]).map(id => ({ id, label: L.mystic.roles[id] }))}
        value={role}
        onchange={id => (role = id)}
      />
      <Button
        variant="gold"
        icon="people"
        disabled={used >= MYSTIC_DAILY || locked}
        onclick={() => send({ type: 'mysticJoin', mode, role }).then(onchange)}
        >{locked ? L.royale.locked(MYSTIC_HALL) : L.mystic.join}</Button
      >
    {/if}
    <b class="t-small">{L.mystic.board} · {L.mystic.modes[shown]}</b>
    {#if !view?.board[shown].length}<small class="t-tiny t-soft">{L.mystic.none}</small>{/if}
    <ol class="stack plain" style:--gap="2px">
      {#each (view?.board[shown] ?? []).slice(0, 5) as r, k (k)}
        <li class="row between t-tiny">
          <span class="t-ellipsis">{k + 1}. {r.names.join(' · ')}</span><b class="t-num">{L.mystic.rounds(r.rounds)}</b>
        </li>
      {/each}
    </ol>
  </div>
</Card>
