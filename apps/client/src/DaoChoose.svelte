<script module lang="ts">
  import type { DaoId as Id } from '@rok/rules'
  // màu nhấn mỗi đạo, theo tông đĩa huy hiệu (emblems.ts DAO_TONES) — Title dùng lại cho thẻ đạo ở bước đặt tên
  export const ACCENT: Record<Id, string> = {
    kiemTong: 'var(--azurite)',
    phapTong: 'var(--cinnabar)',
    theTong: 'var(--ochre)',
    danTong: 'var(--malachite)',
    tranTong: 'var(--gold)',
    khiTong: 'var(--ink3)',
    phuTong: 'var(--dao-phu)',
    thuTong: 'var(--indigo)',
    maTong: 'var(--dao-ma)',
  }
</script>

<script lang="ts">
  // Màn chọn đạo thống (như màn chọn nền văn minh của RoK): tranh tổ sư lớn đứng trước ấn của đạo, tên + lối chơi, ba tiềm năng,
  // dải chín huy hiệu để chọn; vuốt ngang hay phím mũi tên để lướt. Dùng lúc lập tông môn (Title) và khi cải tu (DaoPick).
  import { DAOS, DAO_IDS, DAO_UNITS, type Bonus, type DaoId } from '@rok/rules'
  import { DAO_TONES, emblemArt, paintedUrl, soldier } from '@rok/art'
  import { Button, Emblems, Gallery, Medal, Pill } from './ui'
  import { L, sfx, uniFx } from './lib'

  let {
    value = $bindable(DAO_IDS[0]),
    current,
    go = L.dao.go,
    note,
    busy = false,
    compact = false,
    onpick,
  }: {
    value?: DaoId
    current?: DaoId // đạo đang theo (cải tu): đánh dấu trên dải, không chọn lại được
    go?: string
    note?: string
    busy?: boolean
    compact?: boolean // trong bảng (Sheet): tranh nhỏ hơn
    onpick: (id: DaoId) => void
  } = $props()

  const at = $derived(DAO_IDS.indexOf(value))
  const fx = $derived(Object.entries(DAOS[value]).map(([k, v]) => L.bonus(k as Bonus, v as number)))
  // tổ sư vẽ tay (fig:<đạo>); chưa có tranh thì hình chạm lớn
  const fig = (id: DaoId) => paintedUrl(`fig:${id}`, () => emblemArt(id), 360)
  const uni = $derived(DAO_UNITS[value])
  const uniSrc = $derived(paintedUrl(`sold:dao:${value}`, () => soldier(uni.type, false, 5), 48))

  function choose(id: DaoId) {
    if (id === value) return
    sfx('tap')
    value = id
  }
  const step = (d: number) => choose(DAO_IDS[(at + d + DAO_IDS.length) % DAO_IDS.length])
</script>

<div class="column stack center" style:--accent={ACCENT[value]}>
  <Gallery
    srcs={DAO_IDS.map(fig)}
    {at}
    accent={ACCENT[value]}
    {compact}
    prev={L.dao.prev}
    next={L.dao.next}
    onstep={step}
  >
    {#snippet seal()}<Medal emblem={value} tone={DAO_TONES[value]} size={compact ? 150 : 200} />{/snippet}
  </Gallery>

  <div class="stack center" style:--gap="4px">
    <h3 class="headline" class:sm={compact}>{L.dao.names[value].name}</h3>
    <span class="self-center"><Pill tone="accent">{L.dao.names[value].style}</Pill></span>
    <p class="t-small t-lore">{L.dao.names[value].desc}</p>
    <ul class="row wrap justify-center" style:--gap="4px 6px" aria-label={L.dao.potential}>
      {#each fx as f (f)}<li class="tint t-small">{f}</li>{/each}
    </ul>
    <!-- đệ tử đặc trưng (đơn vị riêng của nền văn minh RoK) -->
    <div class="tint row t-left self-center mt-1">
      <img src={uniSrc} width="44" height="44" alt="" draggable="false" />
      <span class="stack" style:--gap="1px">
        <b class="t-small">{L.dao.uniTitle}: {L.dao.names[value].unit}</b>
        <small class="t-tiny">{L.units[uni.type]} · {uniFx(value).join(' · ')}</small>
        <small class="t-tiny t-lore">{L.dao.names[value].unitDesc}</small>
      </span>
    </div>
  </div>

  <Emblems
    items={DAO_IDS.map(id => ({ id, label: L.dao.names[id].name }))}
    {value}
    {current}
    label={L.dao.title}
    onpick={choose}
    onstep={step}
  >
    {#snippet item(id)}<Medal emblem={id} tone={DAO_TONES[id]} size={34} />{/snippet}
  </Emblems>

  <Button variant="gold" size="lg" wide disabled={busy || value === current} onclick={() => onpick(value)}>{go}</Button>
  {#if note}<small class="t-tiny t-soft">{note}</small>{/if}
</div>
