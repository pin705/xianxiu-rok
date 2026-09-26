<script lang="ts">
  // Thẻ "lần đầu" (Later Tutorials của RoK): lần đầu mở một tính năng lớn (bản đồ Giới, Tiên minh, Tranh đoạt, Độ kiếp) hiện ba thẻ
  // giấy, mỗi thẻ một tranh và một câu; lật bằng Tiếp, xem xong thì thôi (nhớ trên máy). Đặt trong phần chỉ vẽ khi tính năng đang mở.
  import { Icon, artOf, type IconName } from '@rok/art'
  import { Button, Note, Sheet } from './ui'
  import { L, read, write } from './lib'

  type FirstId = 'world' | 'ally' | 'pvp' | 'trib'
  let { id }: { id: FirstId } = $props()
  const KEY = 'rok.first'
  const seen = () => (read(KEY) ?? '').split(',')
  // tranh (ui:<art>, tắt art thì về icon) của ba thẻ mỗi tính năng
  const PICS: Record<FirstId, [string, IconName][]> = {
    world: [
      ['nav-banDo', 'globe'],
      ['fx-flag', 'flag'],
      ['fx-battle', 'swords'],
    ],
    ally: [
      ['ally-people', 'people'],
      ['ally-war', 'swords'],
      ['ally-gift', 'star'],
    ],
    pvp: [
      ['fx-battle', 'swords'],
      ['fx-shield', 'shield'],
      ['ev-report', 'scroll'],
    ],
    trib: [
      ['fx-bolt', 'bolt'],
      ['fx-flag', 'flag'],
      ['fx-cauldron', 'cauldron'],
    ],
  }
  let shut = $state(false)
  const open = $derived(!shut && !seen().includes(id))
  let k = $state(0)
  // xem hết hay đóng giữa chừng đều coi như đã xem
  function done() {
    shut = true
    write(KEY, [...seen().filter(Boolean), id].join(','))
  }
  const next = () => (k < 2 ? (k += 1) : done())
  const pic = $derived(artOf(`ui:${PICS[id][k][0]}`)?.src)
</script>

<Sheet {open} onclose={done} center title={L.first.title[id]}>
  <Note tilt={k % 2 ? 1.2 : -1.2}>
    <div class="stack center" style:--gap="8px">
      <span class="self-center"
        >{#if pic}<img src={pic} alt="" width="112" height="112" draggable="false" />{:else}<Icon
            name={PICS[id][k][1]}
            size={56}
          />{/if}</span
      >
      <p class="t-small t-center">{L.first.cards[id][k]}</p>
    </div>
  </Note>
  <div class="row between mt-3">
    <small class="t-tiny t-soft t-num">{k + 1}/3</small>
    <Button variant="gold" onclick={next}>{k < 2 ? L.first.next : L.first.done}</Button>
  </div>
</Sheet>
