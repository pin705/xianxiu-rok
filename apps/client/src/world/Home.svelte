<script lang="ts">
  // Màn núi tông môn: cảnh WebGL (home.ts) + lớp cuộn gốc của trình duyệt (quán tính cuộn như app thật)
  // + nút chạm vô hình trên từng công trình (bàn phím, trình đọc màn hình) + lớp HTML biển tên, đồng hồ.
  // Lớp HTML dịch theo camera trong cùng khung hình với WebGL nên không lệch nhau.
  import { building, type Kind } from '@rok/art'
  import { BUILDINGS, IDS, TRIBS, count, storage, type BuildingId, type State } from '@rok/rules'
  import { Bubble, Hint, Plate, Pointer, Tag } from '../ui'
  import { L, clock, progress } from '../lib'
  import { Home, type Phase } from './home'
  import { HOME, SLOT } from './layout'
  import View from './View.svelte'

  type Burst = { id: BuildingId; level: number; t: number }
  let {
    game,
    now,
    selected = null,
    guide = null,
    bursts = [],
    storm = 0,
    still = false,
    hidden = false,
    onselect,
    scroller = $bindable(),
  }: {
    game: State
    now: number
    selected?: BuildingId | null
    guide?: BuildingId | null
    bursts?: Burst[]
    storm?: number // độ kiếp: số đợt sét
    still?: boolean // chỉ làm nền (màn tiêu đề)
    hidden?: boolean // đang ở tab khác: dừng vẽ, giữ vị trí cuộn
    onselect?: (id: BuildingId) => void
    scroller?: HTMLDivElement
  } = $props()

  let scene = $state.raw<Home>()

  const hour = $derived(new Date(now).getHours())
  const phase: Phase = $derived(
    hour >= 5 && hour < 7 ? 'dawn' : hour >= 7 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night',
  )
  const tops = $derived(
    Object.fromEntries(IDS.map(id => [id, building(id as Kind, Math.max(1, game.levels[id])).top])) as Record<
      BuildingId,
      number
    >,
  )

  $effect(() => scene?.set({ game, selected, storm, phase }))
  $effect(() => {
    if (import.meta.env.DEV && scene && !still) Object.assign(globalThis, { rokHome: scene })
  })
  // Pháo hoa lên tầng: mỗi burst một lần
  const seen = new Set<number>()
  $effect(() => {
    for (const b of bursts) if (scene && !seen.has(b.t)) (seen.add(b.t), scene.burst(b.id))
  })

  // Bong bóng đồng hồ nằm trên nóc; nóc nào ngang tầm biển tên công trình bên cạnh (tầng núi so le) thì dời
  // bong bóng xuống dưới biển tên đó (đè lên chính nóc mình, vẫn rõ là của mình), không đủ chỗ thì nhấc lên trên.
  // Bề ngang biển tên ước theo độ dài tên (~7px mỗi chữ), bong bóng ~84 DU.
  function bubbleY(id: BuildingId, h: number) {
    const [x, y] = SLOT[id]
    let by = y - h - 14
    for (let pass = 0; pass < 3; pass++)
      for (const o of IDS) {
        const [ox, oy] = SLOT[o]
        const py = oy + 13
        if (o !== id && Math.abs(ox - x) < L.b[o].name.length * 3.6 + 26 + 42 && by > py - 30 && by < py + 26)
          by = py + 26 < y - 24 ? py + 26 : py - 30
      }
    return by
  }

  // Việc của công trình chức năng và gợi ý khi rảnh (UX: màn nào cũng trả lời "làm gì tiếp?")
  function work(id: BuildingId) {
    if (id === 'dienVoTruong') return game.train
    if (id === 'tangKinhCac') return game.study
    if (id === 'danPhong') return game.heal ?? game.brew
    return null
  }
  const WORK_ICON = { dienVoTruong: 'people', tangKinhCac: 'scroll', danPhong: 'cauldron' } as const
  function idle(id: BuildingId): 'people' | 'scroll' | 'cauldron' | 'heal' | 'bolt' | null {
    if (game.levels[id] === 0) return null
    if (id === 'dienVoTruong' && !game.train) return 'people'
    if (id === 'tangKinhCac' && !game.study) return 'scroll'
    if (id === 'danPhong' && !game.heal && count(game.wounded)) return 'heal'
    if (id === 'danPhong' && !game.brew) return 'cauldron'
    if (id === 'chuDien' && TRIBS[game.trib]?.hall === game.levels.chuDien && game.tribCool <= now) return 'bolt'
    return null
  }
</script>

<View
  make={() => new Home({ still })}
  height={HOME.h}
  {hidden}
  start={still ? 0 : 0.3}
  bind:scroller
  bind:scene={scene as never}
>
  {#snippet hits(k)}
    {#if !still}
      {#each IDS as id (id)}
        {@const [x, y, w] = SLOT[id]}
        {@const lv = game.levels[id]}
        <button
          class="hit"
          data-b={id}
          style="left:{(x - w / 2 - 6) * k}px;top:{(y - tops[id] - 12) * k}px;width:{(w + 12) * k}px;height:{(tops[id] +
            34) *
            k}px"
          aria-label="{L.b[id].name}{lv ? `, ${L.level(lv)}` : ''}"
          onclick={() => onselect?.(id)}
        ></button>
      {/each}
    {/if}
  {/snippet}
  {#snippet pins(k)}
    {#if !still}
      {@const at = (x: number, y: number) => `left:${x * k}px;top:${y * k}px`}
      {#each IDS as id (id)}
        {@const [x, y, w] = SLOT[id]}
        {@const lv = game.levels[id]}
        {@const h = tops[id]}
        {@const locked = lv === 0 && game.levels.chuDien < BUILDINGS[id].unlock}
        {@const job = game.queue.find(j => j.building === id)}
        {@const wj = !job ? work(id) : null}
        {@const makes = BUILDINGS[id].makes}
        {@const full = !!makes && lv > 0 && game.res[makes] >= storage(game)}
        {@const hint = !job && !wj ? idle(id) : null}
        {@const by = bubbleY(id, h)}
        {#if locked}
          <span class="pin" style={at(x, y - h * 0.4)}
            ><Tag icon="lock" size="sm">{L.level(BUILDINGS[id].unlock)}</Tag></span
          >
        {:else}
          <span class="pin" style={at(x, y + 13)}><Plate name={L.b[id].name} level={lv} dim={!lv} /></span>
        {/if}
        {#if job}
          <span class="pin" style={at(x, by)}
            ><Bubble icon="hammer" time={clock(job.finishAt - now)} value={progress(job, now)} /></span
          >
        {:else if wj}
          <span class="pin" style={at(x, by)}>
            <Bubble
              icon={game.heal && id === 'danPhong' ? 'heal' : WORK_ICON[id as keyof typeof WORK_ICON]}
              time={clock(wj.finishAt - now)}
              value={progress(wj, now)}
            />
          </span>
        {:else if hint}
          <span class="pin" style={at(x + w * 0.3, y - h * 0.72)}><Hint icon={hint} size={26} tone="paper" /></span>
        {:else if lv === 0 && !locked}
          <span class="pin" style={at(x, y - h * 0.5)}><Hint icon="hammer" /></span>
        {/if}
        {#if full}
          <!-- có bong bóng đồng hồ thì nhãn "Đầy" nằm ngay trên bong bóng, không đè nhau -->
          <span class="pin" style={job || wj ? at(x, by - 26) : at(x, y - Math.min(h, 58) - 6)}
            ><Tag tone="bad" size="sm">{L.full}</Tag></span
          >
        {/if}
        {#if guide === id}
          <span class="pin up" style={at(x, job || wj ? by - 26 : y - h - 18)}><Pointer /></span>
        {/if}
        {#each bursts.filter(b => b.id === id) as b (b.t)}
          <span class="pin" style={at(x, y - h - 6)}><b class="lvup">{L.level(b.level)}</b></span>
        {/each}
      {/each}
    {/if}
  {/snippet}
</View>

<style>
  .up {
    translate: -50% -100% !important;
  }
  .lvup {
    display: block;
    font-size: var(--fs-5);
    font-weight: 900;
    color: var(--silk);
    -webkit-text-stroke: 3px var(--gold-d);
    paint-order: stroke fill;
    animation: lvup 1.6s var(--ease) forwards;
  }
  @keyframes lvup {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.6);
    }
    20% {
      opacity: 1;
      transform: translateY(0) scale(1.15);
    }
    100% {
      opacity: 0;
      transform: translateY(-26px);
    }
  }
</style>
