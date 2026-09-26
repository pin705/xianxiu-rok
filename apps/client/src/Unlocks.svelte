<script lang="ts">
  // Mở khoá (Milestone Moment của RoK): Chủ điện vừa lên tầng có tính năng mới — cuộn giấy liệt kê huy hiệu vừa mở, bấm
  // từng cái là tới luôn (công trình: bảng công trình; còn lại: đúng tab). Kèm màn Thu nhận trưởng lão mới (ElderReveal).
  import { Icon, building, paintedUrl, tabIcon, type Kind } from '@rok/art'
  import type { BuildingId } from '@rok/rules'
  import { Card, Medal, Painting, Sheet } from './ui'
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
  <ul class="grid">
    {#each list as u (u.name)}
      <li>
        <Card tone="glow" label={u.name} onclick={e => go(u, e)}>
          <span class="badge">
            <span class="art">
              {#if u.b}<Painting
                  key="unlock:{u.b}"
                  make={() => building(u.b as Kind, social.unlock).art}
                  w={72}
                  h={64}
                />{:else if u.emblem}<Medal emblem={u.emblem[0]} tone={u.emblem[1]} size={54} />{:else if u.icon}<Icon
                  name={u.icon}
                  size={40}
                />{:else if u.tab}<img src={paintedUrl(`tab:${u.tab}`, () => tabIcon(u.tab!), 44)} alt="" />{/if}
            </span>
            <b class="t-small">{u.name}</b>
            <small class="t-tiny t-gold">{L.unlock.go}</small>
          </span>
        </Card>
      </li>
    {/each}
  </ul>
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

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
  }
  .badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }
  li {
    animation: rise var(--dur-2, 0.3s) var(--ease, ease-out) both;
  }
  .art {
    height: 64px;
    display: grid;
    place-items: center;
  }
  .art img {
    width: 44px;
    height: 44px;
  }
  li:nth-child(2) {
    animation-delay: 0.06s;
  }
  li:nth-child(3) {
    animation-delay: 0.12s;
  }
  li:nth-child(n + 4) {
    animation-delay: 0.18s;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    li {
      animation: none;
    }
  }
</style>
