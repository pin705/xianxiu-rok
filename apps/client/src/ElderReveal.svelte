<script lang="ts">
  // Thu nhận trưởng lão mới (màn "Commander obtained" của RoK): tranh chân dung lớn treo giữa hào quang màu phẩm, dấu son phẩm
  // đóng góc tranh, tên, danh hiệu, hệ, lời dẫn, tuyệt kỹ — chạm nền để tiếp tục, hoặc tới Môn hạ xem ngay. Chờ trận / độ kiếp
  // đang diễn xong mới hiện (hold).
  import { ELDERS, RARITY, type ElderId } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import { Button, Spotlight } from './ui'
  import { L, LOOK, sfx } from './lib'

  let {
    elder,
    hold = false,
    onclose,
    onview,
  }: { elder: ElderId | null; hold?: boolean; onclose: () => void; onview: (e: MouseEvent) => void } = $props()
  const show = $derived(!!elder && !hold)
</script>

<Spotlight
  open={show}
  id={elder ?? ''}
  label={L.reveal.title}
  glow={elder ? `var(--glow-rar${RARITY[elder]})` : undefined}
  kicker={L.reveal.title}
  seal={elder ? L.rarity[RARITY[elder]] : undefined}
  title={elder ? L.elders[elder].name : ''}
  sub={elder ? `${L.elders[elder].title} · ${L.units[ELDERS[elder].type]} · ${L.el[ELDERS[elder].el]}` : undefined}
  lore={elder ? L.elders[elder].lore : undefined}
  tag={elder ? L.reveal.skill(L.elders[elder].skill) : undefined}
  onopen={() => sfx('reward')}
  {onclose}
>
  {#snippet pic()}{#if elder}<Portrait look={LOOK[elder]} size={208} />{/if}{/snippet}
  <Button variant="gold" icon="people" onclick={e => onview(e)}>{L.reveal.view}</Button>
  <Button variant="ink" onclick={onclose}>{L.reveal.ok}</Button>
</Spotlight>
