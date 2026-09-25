<script lang="ts">
  // Màn chọn đạo thống (như màn chọn nền văn minh của RoK): tranh tổ sư lớn đứng trước ấn của đạo, tên + lối chơi, ba tiềm năng,
  // dải chín huy hiệu để chọn; vuốt ngang hay phím mũi tên để lướt. Dùng lúc lập tông môn (Title) và khi cải tu (DaoPick).
  import { DAOS, DAO_IDS, DAO_UNITS, type Bonus, type DaoId } from '@rok/rules'
  import { DAO_TONES, emblemArt, paintedUrl, soldier } from '@rok/art'
  import { Button, Medal } from './ui'
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

  // màu nhấn mỗi đạo, theo tông đĩa huy hiệu (emblems.ts DAO_TONES)
  const ACCENT: Record<DaoId, string> = {
    kiemTong: 'var(--azurite)',
    phapTong: 'var(--cinnabar)',
    theTong: 'var(--ochre)',
    danTong: 'var(--malachite)',
    tranTong: 'var(--gold)',
    khiTong: 'var(--ink3)',
    phuTong: '#6f5bb5',
    thuTong: 'var(--indigo)',
    maTong: '#7a1f2b',
  }
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
  let x0: number | null = null
  function swipe(e: PointerEvent) {
    if (x0 !== null && Math.abs(e.clientX - x0) > 40) step(e.clientX < x0 ? 1 : -1)
    x0 = null
  }
  function key(e: KeyboardEvent) {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!d) return
    e.preventDefault()
    step(d)
  }
</script>

<div class="choose stack center" class:compact style:--accent={ACCENT[value]}>
  <div
    class="stage"
    role="presentation"
    onpointerdown={e => (x0 = e.clientX)}
    onpointerup={swipe}
    onpointercancel={() => (x0 = null)}
  >
    {#key value}<span class="seal"><Medal emblem={value} tone={DAO_TONES[value]} size={compact ? 150 : 200} /></span
      >{/key}
    {#each DAO_IDS as id (id)}
      <img class="fig" class:on={id === value} src={fig(id)} alt="" draggable="false" />
    {/each}
    <button type="button" class="nav prev" aria-label={L.dao.prev} onclick={() => step(-1)}>‹</button>
    <button type="button" class="nav next" aria-label={L.dao.next} onclick={() => step(1)}>›</button>
  </div>

  <div class="info stack center">
    <h3 class="name">{L.dao.names[value].name}</h3>
    <span class="way">{L.dao.names[value].style}</span>
    <p class="desc t-small">{L.dao.names[value].desc}</p>
    <ul class="fx" aria-label={L.dao.potential}>
      {#each fx as f (f)}<li>{f}</li>{/each}
    </ul>
    <!-- đệ tử đặc trưng (đơn vị riêng của nền văn minh RoK) -->
    <div class="uni row" style:--gap="8px">
      <img src={uniSrc} width="44" height="44" alt="" draggable="false" />
      <span class="stack" style:--gap="1px">
        <b class="t-small">{L.dao.uniTitle}: {L.dao.names[value].unit}</b>
        <small class="t-tiny">{L.units[uni.type]} · {uniFx(value).join(' · ')}</small>
        <small class="t-tiny soft">{L.dao.names[value].unitDesc}</small>
      </span>
    </div>
  </div>

  <div class="flags" role="radiogroup" aria-label={L.dao.title} tabindex="0" onkeydown={key}>
    {#each DAO_IDS as id (id)}
      <button
        type="button"
        role="radio"
        aria-checked={id === value}
        aria-label={L.dao.names[id].name}
        tabindex="-1"
        class:on={id === value}
        onclick={() => choose(id)}
      >
        <Medal emblem={id} tone={DAO_TONES[id]} size={34} />
        {#if id === current}<i class="cur"></i>{/if}
      </button>
    {/each}
  </div>

  <Button variant="gold" size="lg" wide disabled={busy || value === current} onclick={() => onpick(value)}>{go}</Button>
  {#if note}<small class="t-tiny note">{note}</small>{/if}
</div>

<style>
  .choose {
    --gap: var(--sp-2);
    width: min(100%, 400px);
    margin: 0 auto;
  }
  .stage {
    position: relative;
    width: 100%;
    height: min(42vh, 340px);
    touch-action: pan-y;
    user-select: none;
    /* quầng màu của đạo sau lưng tổ sư */
    background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 38%, transparent), transparent 85%)
      center 38% / 90% 80% no-repeat;
    transition: background var(--dur-3);
  }
  .compact .stage {
    height: min(34vh, 250px);
  }
  /* ấn của đạo: đĩa lớn như vầng hào quang sau đầu tổ sư */
  .seal {
    position: absolute;
    top: 2%;
    left: 50%;
    translate: -50% 0;
    opacity: 0.9;
    animation: seal 0.45s var(--spring) both;
  }
  .fig {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom center;
    filter: drop-shadow(0 6px 10px rgb(var(--shade) / 0.35));
    opacity: 0;
    transform: translateX(14px) scale(0.97);
    transition:
      opacity var(--dur-3) var(--ease),
      transform var(--dur-3) var(--ease);
    pointer-events: none;
  }
  .fig.on {
    opacity: 1;
    transform: none;
  }
  .nav {
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    width: 40px;
    height: 56px;
    font-size: 34px;
    line-height: 1;
    color: inherit;
    background: none;
    border: 0;
    opacity: 0.75;
    cursor: pointer;
  }
  .prev {
    left: -4px;
  }
  .next {
    right: -4px;
  }
  .info {
    --gap: 4px;
    text-align: center;
  }
  .name {
    margin: 0;
    font-size: var(--fs-7);
    font-weight: 900;
    font-style: italic;
    line-height: 1.1;
    letter-spacing: 0.03em;
    background: var(--stroke-gold) no-repeat center bottom / 100% 10px;
    padding: 0 14px 8px;
  }
  .compact .name {
    font-size: var(--fs-6);
  }
  .way {
    justify-self: center;
    padding: 2px 12px 3px;
    font-size: var(--fs-2);
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--silk);
    background: var(--accent);
    border-radius: 999px;
  }
  .desc {
    margin: 2px 0 0;
    font-style: italic;
    opacity: 0.85;
  }
  .fx {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 6px;
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
  }
  .fx li {
    padding: 3px 10px;
    font-size: var(--fs-2);
    font-weight: 700;
    border: 1px solid color-mix(in srgb, var(--accent) 70%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
  }
  .uni {
    margin-top: 4px;
    padding: 4px 12px 4px 6px;
    text-align: left;
    border-radius: 10px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
  .uni img {
    flex: none;
    object-fit: contain;
  }
  .soft {
    font-style: italic;
    opacity: 0.8;
  }
  .flags {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    width: 100%;
    margin-top: var(--sp-1);
    outline-offset: 4px;
  }
  .flags button {
    position: relative;
    display: grid;
    place-items: center;
    padding: 6px 0 8px;
    background: none;
    border: 0;
    cursor: pointer;
    transition: transform var(--dur-2) var(--spring);
  }
  .flags button:not(.on) {
    opacity: 0.62;
  }
  .flags button.on {
    transform: scale(1.22);
  }
  .flags button.on::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 60%;
    height: 3px;
    border-radius: 2px;
    background: var(--gold-l);
  }
  /* đạo đang theo (cải tu) */
  .cur {
    position: absolute;
    top: 2px;
    right: 8%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold-l);
    box-shadow: 0 0 0 1.5px var(--rim, var(--ink3));
  }
  .note {
    opacity: 0.75;
  }
  @keyframes seal {
    from {
      opacity: 0;
      transform: scale(1.4) rotate(-10deg);
    }
  }
</style>
