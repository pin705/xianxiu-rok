<script lang="ts">
  // Màn núi tông môn: cảnh WebGL (home.ts) + lớp cuộn gốc của trình duyệt (quán tính cuộn như app thật)
  // + nút chạm vô hình trên từng công trình (bàn phím, trình đọc màn hình) + lớp HTML biển tên, đồng hồ.
  // Lớp HTML dịch theo camera trong cùng khung hình với WebGL nên không lệch nhau.
  import { onMount } from 'svelte'
  import { building, type Kind } from '@rok/art'
  import { BUILDINGS, IDS, TRIBS, count, storage, type BuildingId, type State } from '@rok/rules'
  import { Bubble, Hint, Plate, Pointer, Tag } from '../ui'
  import { L, SEAL, clock, progress } from '../lib'
  import { Home, type Phase } from './home'
  import { HOME, SLOT } from './layout'
  import { cssPerDU, getApp } from './stage'

  type Burst = { id: BuildingId; level: number; t: number }
  let {
    game,
    now,
    selected = null,
    guide = null,
    bursts = [],
    storm = false,
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
    storm?: boolean
    still?: boolean // chỉ làm nền (màn tiêu đề)
    hidden?: boolean // đang ở tab khác: dừng vẽ, giữ vị trí cuộn
    onselect?: (id: BuildingId) => void
    scroller?: HTMLDivElement
  } = $props()

  let k = $state(cssPerDU())
  let overlay = $state<HTMLDivElement>()
  let scene = $state.raw<Home>()

  const hour = $derived(new Date(now).getHours())
  const phase: Phase = $derived(hour >= 5 && hour < 7 ? 'dawn' : hour >= 7 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night')
  const tops = $derived(Object.fromEntries(IDS.map(id => [id, building(id as Kind, Math.max(1, game.levels[id]), '').top])) as Record<BuildingId, number>)

  onMount(() => {
    let dead = false
    let off = () => {}
    const resize = () => (k = cssPerDU())
    addEventListener('resize', resize)
    getApp().then(app => {
      if (dead) return
      if (!app.canvas.isConnected) document.body.prepend(app.canvas)
      const s = new Home({ still })
      app.stage.addChild(s.root)
      scene = s
      const tick = () => {
        const kk = cssPerDU()
        const top = scroller?.scrollTop ?? 0
        s.root.scale.set(kk)
        s.root.position.set((innerWidth - 400 * kk) / 2, -top)
        if (overlay) overlay.style.transform = `translate3d(0, ${-top}px, 0)`
        s.tick(app.ticker.deltaMS / 1000, top / kk)
      }
      app.ticker.add(tick)
      off = () => {
        app.ticker.remove(tick)
        s.destroy()
      }
    })
    return () => {
      dead = true
      removeEventListener('resize', resize)
      off()
    }
  })

  $effect(() => scene?.set({ game, seal: SEAL, selected, storm, phase }))
  $effect(() => {
    if (scene) scene.root.visible = !hidden
  })
  // Pháo hoa lên tầng: mỗi burst một lần
  const seen = new Set<number>()
  $effect(() => {
    for (const b of bursts) if (scene && !seen.has(b.t)) (seen.add(b.t), scene.burst(b.id))
  })

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
  const at = (x: number, y: number) => `left:${x * k}px;top:${y * k}px`
</script>

<div class="scroller" class:off={still || hidden} bind:this={scroller}>
  <div class="space" style:width="{400 * k}px" style:height="{HOME.h * k}px">
    {#if !still}
      {#each IDS as id (id)}
        {@const [x, y, w] = SLOT[id]}
        {@const lv = game.levels[id]}
        <button
          class="hit"
          data-b={id}
          style="left:{(x - w / 2 - 6) * k}px;top:{(y - tops[id] - 12) * k}px;width:{(w + 12) * k}px;height:{(tops[id] + 34) * k}px"
          aria-label="{L.b[id].name}{lv ? `, ${L.level(lv)}` : ''}"
          onclick={() => onselect?.(id)}
        ></button>
      {/each}
    {/if}
  </div>
</div>

{#if !still}
  <div class="overlay" class:off={hidden} aria-hidden="true">
    <div class="layer" bind:this={overlay} style:width="{400 * k}px">
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
        {#if locked}
          <span class="pin" style={at(x, y - h * 0.4)}><Tag icon="lock" size="sm">{L.level(BUILDINGS[id].unlock)}</Tag></span>
        {:else}
          <span class="pin" style={at(x, y + 13)}><Plate name={L.b[id].name} level={lv} dim={!lv} /></span>
        {/if}
        {#if job}
          <span class="pin" style={at(x, y - h - 14)}><Bubble icon="hammer" time={clock(job.finishAt - now)} value={progress(job, now)} /></span>
        {:else if wj}
          <span class="pin" style={at(x, y - h - 14)}>
            <Bubble icon={game.heal && id === 'danPhong' ? 'heal' : WORK_ICON[id as keyof typeof WORK_ICON]} time={clock(wj.finishAt - now)} value={progress(wj, now)} />
          </span>
        {:else if hint}
          <span class="pin" style={at(x + w * 0.3, y - h * 0.72)}><Hint icon={hint} size={26} tone="paper" /></span>
        {:else if lv === 0 && !locked}
          <span class="pin" style={at(x, y - h * 0.5)}><Hint icon="hammer" /></span>
        {/if}
        {#if full}
          <span class="pin" style={at(x, y - Math.min(h, 58) - 6)}><Tag tone="bad" size="sm">{L.full}</Tag></span>
        {/if}
        {#if guide === id}
          <span class="pin up" style={at(x, y - h - (job ? 40 : 18))}><Pointer /></span>
        {/if}
        {#each bursts.filter(b => b.id === id) as b (b.t)}
          <span class="pin" style={at(x, y - h - 6)}><b class="lvup">{L.level(b.level)}</b></span>
        {/each}
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Lớp cuộn trong suốt phủ cả màn hình: nhận cử chỉ, cuộn có quán tính của hệ điều hành */
  .scroller {
    position: fixed;
    inset: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .space {
    position: relative;
    margin: 0 auto;
  }
  .hit {
    position: absolute;
    border-radius: 12px;
  }
  .hit:focus-visible {
    outline: 2px dashed var(--gold-l);
  }
  .off {
    visibility: hidden;
  }
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    overflow: hidden;
    pointer-events: none;
  }
  .layer {
    position: relative;
    height: 100%;
    margin: 0 auto;
    will-change: transform;
  }
  .pin {
    position: absolute;
    translate: -50% -50%;
    white-space: nowrap;
  }
  .up {
    translate: -50% -100%;
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
