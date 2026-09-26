<script lang="ts">
  // Trận mở màn: tông môn vừa lập (Chủ điện ≤ 1) và máy này chưa xem → thẻ truyện; "Nghênh chiến" diễn trận dựng sẵn (onplay mở
  // Replay), "Bỏ qua" thì thôi. Nhớ trên máy cùng khoá thẻ "lần đầu" (rok.first) — e2e coi như đã xem.
  import type { Report } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import { Button, Note, Sheet } from './ui'
  import { L, LOOK, read, write } from './lib'
  import { useGame } from './game'
  import { openingReport } from './opening'

  let { onplay }: { onplay: (r: Report) => void } = $props()
  const g = useGame()
  const KEY = 'rok.first'
  const seen = () => (read(KEY) ?? '').split(',').filter(Boolean)
  let shut = $state(false)
  const open = $derived(!shut && g.game.levels.chuDien <= 1 && !seen().includes('opening'))
  function done() {
    if (shut) return
    shut = true
    write(KEY, [...new Set([...seen(), 'opening'])].join(','))
  }
  function fight() {
    const r = openingReport(g.game)
    done()
    onplay(r)
  }
</script>

<Sheet {open} onclose={done} center title={L.opening.title}>
  <Note tilt={-1.2}>
    <div class="stack center" style:--gap="8px">
      <Portrait look={LOOK.thanhPhong} size={72} />
      <p class="t-small t-lore">{L.opening.text}</p>
    </div>
  </Note>
  <div class="row between mt-3">
    <Button variant="ghost" onclick={done}>{L.opening.skip}</Button>
    <Button variant="gold" icon="swords" onclick={fight}>{L.opening.fight}</Button>
  </div>
</Sheet>
