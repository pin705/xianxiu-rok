<script lang="ts">
  // Tứ Nhân Thám Bí (Ian's Ballads của RoK) trong thẻ Hội chiến của Luận Kiếm Đài: chọn độ khó mở phòng, danh sách phòng đang chờ của cả
  // giới (vào ngay), phòng của mình (giờ đi, rời phòng); đủ người hay hết giờ thì server giải — kết quả qua thư
  import { BALLAD_LV, BALLAD_MAX } from '@rok/rules'
  import { balladGifted, type WorldAction } from '@rok/rules/world'
  import type { Ack, ArenaView } from '@rok/protocol'
  import { Button, Card, Segmented } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

  let {
    view,
    send,
    onchange,
  }: { view: ArenaView['ballad'] | undefined; send: (a: WorldAction) => Promise<Ack>; onchange: () => void } = $props()
  const g = useGame()
  const hall = $derived(g.game.levels.chuDien)
  let lv = $state(0)
  const mine = $derived(view?.rooms.find(r => r.id === view?.mine))
</script>

<p class="t-small t-soft"><b class="t-strong">{L.ballad.title}</b> · {L.ballad.hint}</p>
<Card tone="silk">
  <div class="stack" style:--gap="6px">
    {#if balladGifted(g.game, g.now)}<small class="t-tiny t-gold">{L.ballad.gifted}</small>{/if}
    {#if mine}
      <p class="t-small">{L.ballad.room(mine.by, L.ballad.lv[mine.lv], mine.n, BALLAD_MAX)}</p>
      <small class="t-tiny t-soft">{L.ballad.mine(clock(Math.max(0, mine.at - g.now)))}</small>
      <Button variant="ghost" onclick={() => send({ type: 'balladLeave' }).then(onchange)}>{L.ballad.leave}</Button>
    {:else}
      <Segmented
        items={BALLAD_LV.map((_, id) => ({ id: String(id), label: L.ballad.lv[id] }))}
        value={String(lv)}
        onchange={id => (lv = Number(id))}
      />
      {#if hall < BALLAD_LV[lv].hall}<small class="t-tiny t-bad">{L.ballad.locked(BALLAD_LV[lv].hall)}</small>{/if}
      <Button
        variant="gold"
        icon="people"
        disabled={hall < BALLAD_LV[lv].hall}
        onclick={() => send({ type: 'balladOpen', lv }).then(onchange)}>{L.ballad.open}</Button
      >
      {#if !view?.rooms.length}<small class="t-tiny t-soft">{L.ballad.none}</small>{/if}
      <ul class="stack plain" style:--gap="4px">
        {#each view?.rooms ?? [] as r (r.id)}
          <li class="row between">
            <span class="t-small"
              >{L.ballad.room(r.by, L.ballad.lv[r.lv], r.n, BALLAD_MAX)} · {clock(Math.max(0, r.at - g.now))}</span
            >
            <Button
              size="sm"
              variant="gold"
              disabled={r.n >= BALLAD_MAX || hall < BALLAD_LV[r.lv].hall}
              onclick={() => send({ type: 'balladJoin', id: r.id }).then(onchange)}>{L.ballad.join}</Button
            >
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Card>
