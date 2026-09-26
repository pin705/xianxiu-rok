<script lang="ts">
  // Mở khoá (Milestone Moment của RoK): Chủ điện vừa lên tầng có tính năng mới — cuộn giấy liệt kê huy hiệu vừa mở, bấm
  // từng cái là tới luôn (công trình: bảng công trình; còn lại: đúng tab). Kèm màn Thu nhận trưởng lão mới (ElderReveal).
  // Bố cục: ấn son lớn mang số tầng giữa hào quang làm tâm điểm, dưới là hàng đồ vật vừa mở (tranh / huy hiệu, tên gạch son).
  import { Icon, building, paintedUrl, tabIcon, type Kind } from '@rok/art'
  import type { BuildingId } from '@rok/rules'
  import { Medal, Painting, Rays, Seal, Sheet, Trophy } from './ui'
  import { L, type Tab } from './lib'
  import { unlockList, type Unlock } from './notices'
  import { social } from './social.svelte'
  import ElderReveal from './ElderReveal.svelte'

  let {
    onfocus,
    ontab,
    hold = false,
  }: {
    onfocus: (id: BuildingId) => void
    ontab: (t: Tab, e: MouseEvent) => void
    hold?: boolean // đang xem trận / độ kiếp: màn Thu nhận trưởng lão chờ xong mới hiện
  } = $props()
  const list = $derived(social.unlock ? unlockList(social.unlock) : [])
  function go(u: Unlock, e: MouseEvent) {
    social.unlock = 0
    if (u.b) onfocus(u.b)
    else if (u.tab) ontab(u.tab, e)
  }
</script>

<Sheet
  open={list.length > 0}
  onclose={() => (social.unlock = 0)}
  title={L.unlock.title(social.unlock)}
  sub={L.unlock.sub}
>
  <div class="spot mt-2" aria-hidden="true">
    <Rays />
    <Seal size={96} big>{social.unlock}</Seal>
  </div>
  <!-- ít mục (thường 1–3) thì đứng giữa dưới ấn -->
  <div class="row wrap justify-center items-start mt-1" style:--gap="14px 8px">
    {#each list as u, i (u.name)}
      <Trophy label={u.name} sub={L.unlock.go} {i} onclick={e => go(u, e)}>
        {#if u.b}<Painting
            key="unlock:{u.b}"
            make={() => building(u.b as Kind, social.unlock).art}
            w={72}
            h={64}
          />{:else if u.emblem}<Medal emblem={u.emblem[0]} tone={u.emblem[1]} size={58} />{:else if u.icon}<Icon
            name={u.icon}
            size={44}
          />{:else if u.tab}<img
            src={paintedUrl(`tab:${u.tab}`, () => tabIcon(u.tab!), 56)}
            width="56"
            height="56"
            alt=""
          />{/if}
      </Trophy>
    {/each}
  </div>
</Sheet>

<!-- nhiều trưởng lão cùng tới: lần lượt từng màn; Xem ở Môn hạ thì bỏ các màn còn lại -->
<ElderReveal
  elder={social.elders[0] ?? null}
  {hold}
  onclose={() => (social.elders = social.elders.slice(1))}
  onview={e => {
    social.elders = []
    ontab('monHa', e)
  }}
/>
