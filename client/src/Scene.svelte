<script lang="ts">
  // Ngọn núi của tông môn: tranh thanh lục sơn thủy sống, công trình đặt trên các tầng núi.
  // Trời đổi theo giờ thật của máy người chơi.
  import { fade } from 'svelte/transition'
  import { BUILDINGS, IDS, TRIBS, count, storage, type BuildingId, type State } from '@rok/rules'
  import { Art, Defs, Icon } from '@rok/art'
  import { L, SEAL, clock } from './lib'

  type Burst = { id: BuildingId; level: number; t: number }
  let {
    game,
    now,
    selected = null,
    guide = null,
    bursts = [],
    still = false,
    storm = false,
    onselect,
  }: {
    game: State
    now: number
    selected?: BuildingId | null
    guide?: BuildingId | null
    bursts?: Burst[]
    still?: boolean // chỉ làm nền (màn tiêu đề): ẩn nhãn, bong bóng
    storm?: boolean // độ kiếp: trời tối, kiếp vân, sét đánh xuống Chủ điện
    onselect?: (id: BuildingId) => void
  } = $props()

  // Việc của công trình chức năng (hiện đồng hồ) và gợi ý khi đang rảnh (UX: màn nào cũng trả lời "làm gì tiếp?")
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

  // Chân công trình trên núi (hệ toạ độ 400 × 860) và bề ngang của nó
  const SLOT: Record<BuildingId, [number, number, number]> = {
    chuDien: [200, 262, 112],
    tangKinhCac: [92, 362, 64],
    danPhong: [314, 368, 84],
    tangBaoCac: [80, 462, 74],
    dienVoTruong: [232, 464, 116],
    tuLinhTran: [142, 566, 100],
    khoangMach: [326, 574, 112],
    linhDien: [118, 668, 120],
  }
  function height(id: BuildingId, lv: number) {
    const tier = lv <= 5 ? 1 : lv <= 10 ? 2 : 3
    if (id === 'chuDien') return tier === 1 ? 66 : 86
    if (id === 'tangKinhCac') return 42 + tier * 20
    return { danPhong: 50, tangBaoCac: 70, dienVoTruong: 62, tuLinhTran: 82, khoangMach: 70, linhDien: 44 }[id]
  }
  const ORDER = [...IDS].sort((a, b) => SLOT[a][1] - SLOT[b][1]) // vẽ từ xa (cao) tới gần (thấp)

  const hour = $derived(new Date(now).getHours())
  const phase = $derived(hour >= 5 && hour < 7 ? 'dawn' : hour < 17 && hour >= 7 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night')

  // Ngẫu nhiên nhưng cố định giữa các lần vẽ
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const STARS = Array.from({ length: 28 }, () => [rnd() * 400, rnd() * 260, 0.4 + rnd() * 1.1])
  const MOTES = Array.from({ length: 14 }, () => [40 + rnd() * 320, 420 + rnd() * 300, rnd() * 9, 7 + rnd() * 6])
  const MISTS = [
    [318, 34, 38, 0.85],
    [414, 36, 46, 0.9],
    [516, 34, 42, 0.85],
    [620, 36, 50, 0.9],
    [724, 40, 40, 0.95],
    [812, 46, 56, 0.8],
  ]
  // Mỏm núi: mặt trên phẳng có cỏ, vách tụt dần vào sương
  const ledge = (cx: number, cy: number, w: number, h: number) =>
    `M${cx - w / 2} ${cy}Q${cx} ${cy - 7} ${cx + w / 2} ${cy}` +
    `C${cx + w / 2 + 6} ${cy + h * 0.45} ${cx + w * 0.3} ${cy + h} ${cx + w * 0.05} ${cy + h * 1.05}` +
    `C${cx - w * 0.3} ${cy + h} ${cx - w / 2 - 6} ${cy + h * 0.45} ${cx - w / 2} ${cy}Z`
  const LEDGES = [
    [200, 262, 180, 76],
    [92, 362, 160, 66],
    [314, 368, 160, 62],
    [166, 464, 322, 74],
    [142, 566, 214, 70],
    [120, 668, 240, 76],
  ]
</script>

{#snippet Pine(x: number, y: number, s: number)}
  <g transform="translate({x} {y}) scale({s})">
    <path d="M0 0C1 -8 -2 -14 1 -24" stroke="var(--bark)" stroke-width="2" fill="none" stroke-linecap="round" />
    <path d="M1 -14C5 -16 10 -15 13 -17" stroke="var(--bark)" stroke-width="1.2" fill="none" />
    <ellipse cx="9" cy="-19" rx="9" ry="3.6" fill="var(--pine)" />
    <ellipse cx="-3" cy="-24" rx="10" ry="4" fill="var(--pine)" />
    <ellipse cx="3" cy="-30" rx="8" ry="3.4" fill="var(--pine-l)" />
    <ellipse cx="0" cy="-35" rx="5.4" ry="2.6" fill="var(--pine-l)" />
  </g>
{/snippet}

{#snippet Cloud(x: number, y: number, s: number, dur: number)}
  <g transform="translate({x} {y}) scale({s})">
    <g class="drift" style="animation-duration: {dur}s">
      <path
        d="M-26 6C-34 6 -34 -4 -26 -4C-26 -12 -14 -14 -10 -8C-6 -18 10 -18 12 -8C18 -14 30 -10 28 -2C36 -2 36 6 28 6Z"
        fill="var(--cloud)"
        stroke="var(--cloud-line)"
        stroke-width=".8"
      />
      <path d="M-12 1c3 -4 9 -3 9 1c0 3 -5 3 -5 0M8 0c3 -4 9 -3 9 1c0 3 -5 3 -5 0" fill="none" stroke="var(--cloud-line)" stroke-width="1.1" stroke-linecap="round" />
    </g>
  </g>
{/snippet}

<svg class="scene {phase}" class:still class:storm viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" aria-label={game.name}>
  <defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color: var(--sky1)" />
      <stop offset="1" style="stop-color: var(--sky2)" />
    </linearGradient>
    <radialGradient id="sunG">
      <stop offset="0" stop-color="#fffaf0" />
      <stop offset=".5" stop-color="#ffe6b8" stop-opacity=".9" />
      <stop offset="1" stop-color="#ffe6b8" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="farG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color: var(--far)" />
      <stop offset="1" style="stop-color: var(--sky2); stop-opacity: 0" />
    </linearGradient>
    <linearGradient id="rockG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color: var(--rock-top)" />
      <stop offset=".45" style="stop-color: var(--rock)" />
      <stop offset=".85" style="stop-color: var(--rock-d)" />
      <stop offset="1" style="stop-color: var(--rock-d); stop-opacity: 0" />
    </linearGradient>
    <linearGradient id="ledgeG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color: var(--turf)" />
      <stop offset=".13" style="stop-color: var(--turf)" />
      <stop offset=".17" style="stop-color: var(--rock-top)" />
      <stop offset=".55" style="stop-color: var(--rock)" />
      <stop offset=".85" style="stop-color: var(--rock-d); stop-opacity: .8" />
      <stop offset="1" style="stop-color: var(--rock-d); stop-opacity: 0" />
    </linearGradient>
    <radialGradient id="mistR">
      <stop offset="0" style="stop-color: var(--mist-c); stop-opacity: .95" />
      <stop offset=".6" style="stop-color: var(--mist-c); stop-opacity: .6" />
      <stop offset="1" style="stop-color: var(--mist-c); stop-opacity: 0" />
    </radialGradient>
    <linearGradient id="fallG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".95" />
      <stop offset="1" stop-color="#dff3f5" stop-opacity=".5" />
    </linearGradient>
    <linearGradient id="waterG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color: var(--water-l)" />
      <stop offset="1" style="stop-color: var(--water)" />
    </linearGradient>
  </defs>
  <Defs />

  <!-- Trời -->
  <rect width="400" height="860" fill="url(#skyG)" />
  <g class="stars">
    {#each STARS as [x, y, r]}<circle cx={x} cy={y} {r} fill="#fff" />{/each}
  </g>
  <circle class="sun" cx="318" cy="124" r="34" fill="url(#sunG)" />
  <g class="moon">
    <circle cx="86" cy="118" r="16" fill="#f2efe2" />
    <circle cx="80" cy="113" r="3" fill="#dcd8c8" />
    <circle cx="92" cy="123" r="2.2" fill="#dcd8c8" />
  </g>

  <!-- Cả núi dời xuống 50 để Chủ điện không nằm dưới HUD -->
  <g transform="translate(0 50)">
  <!-- Núi xa -->
  <path
    d="M0 330C30 300 55 262 80 270C105 278 118 236 146 226C176 216 190 262 214 256C238 250 256 206 284 200C312 194 330 240 352 236C374 232 390 214 400 216V560H0Z"
    fill="url(#farG)"
    opacity=".55"
  />
  <path
    d="M0 376C24 344 48 326 76 334C104 342 124 304 150 300C178 296 196 334 222 330C250 326 266 290 296 288C326 286 344 322 368 316C386 312 396 304 400 304V600H0Z"
    fill="url(#farG)"
    opacity=".8"
  />
  {@render Cloud(64, 196, 1.1, 34)}
  {@render Cloud(338, 238, 0.9, 42)}

  <g class="flock">
    {#each [[0, 0, 1], [28, 12, 0.78]] as [dx, dy, s], i}
      <g transform="translate({dx} {dy}) scale({s})">
        <g class="crane" style="animation-delay: {i * 0.25}s">
          <path d="M-12 0C-6 -1 4 -1 10 -3L14 -4" stroke="#f4f6f2" stroke-width="2.2" fill="none" stroke-linecap="round" />
          <circle cx="14.6" cy="-4.2" r="1.2" fill="var(--cinnabar)" />
          <path d="M-12 0-21 2.4" stroke="#1c2a33" stroke-width="1.1" />
          <path class="wing" d="M-2 -1C-4 -10 -10 -14 -17 -14C-11 -8 -8 -4 -4 -1Z" fill="#f4f6f2" stroke="#1c2a33" stroke-width=".6" />
        </g>
      </g>
    {/each}
  </g>

  <!-- Đỉnh chính sau Chủ điện -->
  <path d="M92 336C118 284 150 214 176 160C188 136 198 116 208 114C220 114 232 140 244 168C266 216 292 272 318 336Z" fill="url(#rockG)" />
  <path d="M188 150q-6 20 -16 36M214 136q4 26 18 44M200 196q-4 18 -14 30M232 214q6 16 16 26" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="1.2" stroke-linecap="round" />
  <g class="drift" style="animation-duration: 60s">
    <ellipse cx="200" cy="200" rx="120" ry="16" fill="url(#mistR)" />
  </g>

  <!-- Vách phải: thác nước đổ xuống từ dưới Đan phòng -->
  <path d="M250 650C254 590 268 530 290 492C310 458 350 444 400 442V660Z" fill="url(#rockG)" />
  <path d="M296 520q-8 22 -10 44M330 486q-4 26 -2 48" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="1.2" stroke-linecap="round" />
  <path d="M370 404Q372 470 368 544H386Q382 470 384 404Z" fill="url(#fallG)" />
  <path class="fall" d="M373 408V540M377.5 406V542M382 408V540" stroke="#fff" stroke-width="1.1" stroke-dasharray="7 9" stroke-opacity=".85" />
  <ellipse class="spray" cx="377" cy="546" rx="24" ry="9" fill="#fff" />

  <!-- Các tầng núi, sương xen giữa -->
  {#each LEDGES as [cx, cy, w, h], i}
    {@const [my, mh, dur, o] = MISTS[i]}
    <path d={ledge(cx, cy, w, h)} fill="url(#ledgeG)" />
    <path d="M{cx - w * 0.3} {cy + h * 0.35}q-4 12 -2 22M{cx + w * 0.22} {cy + h * 0.3}q5 12 3 24" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="1.1" stroke-linecap="round" />
    <g class="drift" style="animation-duration: {dur}s">
      <ellipse cx="200" cy={my} rx="260" ry={mh / 2} fill="url(#mistR)" opacity={o} />
    </g>
  {/each}
  <!-- Suối dưới chân núi -->
  <path d="M400 700C360 712 330 730 300 752C272 772 250 800 236 860H264C276 806 300 780 326 762C352 744 380 728 400 722Z" fill="url(#waterG)" />
  <path class="ripple" d="M392 712C360 724 330 744 306 764C284 782 266 810 252 852" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none" stroke-dasharray="4 10" />
  {@render Pine(262, 252, 1)}
  {@render Pine(30, 356, 0.9)}
  {@render Pine(366, 458, 0.8)}
  {@render Pine(236, 562, 0.9)}
  {@render Pine(16, 660, 1)}

  <rect class="veil" width="400" height="860" fill="#0b1527" />

  <!-- Công trình -->
  {#each ORDER as id (id)}
    {@const [x, y, w] = SLOT[id]}
    {@const lv = game.levels[id]}
    {@const h = height(id, lv)}
    {@const locked = lv === 0 && game.levels.chuDien < BUILDINGS[id].unlock}
    {@const job = game.queue.find(j => j.building === id)}
    {@const makes = BUILDINGS[id].makes}
    {@const full = !!makes && lv > 0 && game.res[makes] >= storage(game)}
    {@const name = L.b[id].name}
    {@const pw = name.length * 5.4 + (lv ? 26 : 14)}
    <g transform="translate({x} {y})" data-b={id}>
      <g
        class="bld"
        class:sel={selected === id}
        role="button"
        tabindex="0"
        aria-label="{name}{lv ? `, ${L.level(lv)}` : ''}"
        onclick={() => onselect?.(id)}
        onkeydown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onselect?.(id)
          }
        }}
      >
        <rect class="hit" x={-w / 2 - 6} y={-h - 10} width={w + 12} height={h + 30} />
        {#if selected === id}
          <ellipse class="ring" rx={w / 2 + 6} ry="8" />
        {/if}
        {#if locked}
          <g class="fog" out:fade={{ duration: 900 }}>
            <g class="bob">
              <ellipse cx={-w * 0.24} cy={-h * 0.34} rx={w * 0.34} ry={h * 0.34} />
              <ellipse cx={w * 0.22} cy={-h * 0.46} rx={w * 0.34} ry={h * 0.38} />
              <ellipse cy={-h * 0.18} rx={w * 0.52} ry={h * 0.26} />
              <ellipse cy={-h * 0.66} rx={w * 0.26} ry={h * 0.26} />
              <path d="M{-w * 0.3} {-h * 0.3}c4 -6 12 -4 12 1c0 4 -7 4 -7 0M{w * 0.12} {-h * 0.5}c4 -6 12 -4 12 1c0 4 -7 4 -7 0" class="curl" />
            </g>
            <g class="lockTag" transform="translate(0 {-h * 0.42})">
              <rect x="-26" y="-10" width="52" height="20" rx="10" />
              <g class="lockIcon"><Icon name="lock" size={11} x={-21} y={-5.5} /></g>
              <text x="5" y="4" text-anchor="middle">{L.level(BUILDINGS[id].unlock)}</text>
            </g>
          </g>
        {:else if lv === 0}
          <ellipse class="plot" cy="-1" rx={w / 2 - 4} ry="7" />
          <g class="ghost"><Art {id} level={1} glyph={SEAL[id]} /></g>
        {:else}
          <Art {id} level={lv} glyph={SEAL[id]} />
        {/if}

        {#if job}
          {@const p = Math.min(1, (now - job.startAt) / (job.finishAt - job.startAt))}
          <g class="scaffold">
            {#each [-0.45, -0.15, 0.15, 0.45] as k}<path d="M{k * w * 0.95} 0V{-h * 0.95}" />{/each}
            {#each [0.3, 0.62, 0.92] as k}<path d="M{-w * 0.46} {-h * k}H{w * 0.46}" />{/each}
            <path d="M{-w * 0.43} {-h * 0.3}L{-w * 0.14} {-h * 0.62}M{w * 0.14} {-h * 0.3}L{w * 0.43} {-h * 0.62}" />
          </g>
          <g transform="translate({w * 0.36} -2)">
            <path d="M-2.6 0-1.8-6.6H1.8L2.6 0Z" fill="#8a6a4a" />
            <circle cy="-8.4" r="1.9" fill="var(--skin)" />
            <path d="M-3 -9.6H3L0 -12Z" fill="var(--straw)" />
            <g class="arm">
              <path d="M1.2 -5.4 5 -9.2" stroke="var(--wood-d)" stroke-width="1.1" />
              <rect x="4" y="-11.4" width="3.6" height="2.4" fill="var(--steel)" />
            </g>
          </g>
          <g class="timer" transform="translate(0 {-h - 18})">
            <rect x="-32" y="-11" width="64" height="22" rx="11" />
            <circle cx="-21" r="7.5" class="tbg" />
            <Icon name="hammer" size={10} x={-26} y={-5} />
            <text x="7" y="3.6" text-anchor="middle">{clock(job.finishAt - now)}</text>
            <rect x="-11" y="6" width="36" height="2.2" rx="1.1" class="track" />
            <rect x="-11" y="6" width={36 * p} height="2.2" rx="1.1" class="fill" />
          </g>
        {/if}

        {#if !job && work(id)}
          {@const wj = work(id)!}
          {@const p = Math.min(1, (now - wj.startAt) / (wj.finishAt - wj.startAt))}
          <g class="timer work" transform="translate(0 {-h - 18})">
            <rect x="-32" y="-11" width="64" height="22" rx="11" />
            <circle cx="-21" r="7.5" class="tbg" />
            <Icon name={game.heal && id === 'danPhong' ? 'heal' : WORK_ICON[id as keyof typeof WORK_ICON]} size={10} x={-26} y={-5} />
            <text x="7" y="3.6" text-anchor="middle">{clock(wj.finishAt - now)}</text>
            <rect x="-11" y="6" width="36" height="2.2" rx="1.1" class="track" />
            <rect x="-11" y="6" width={36 * p} height="2.2" rx="1.1" class="fill" />
          </g>
        {:else if !job && idle(id)}
          <g transform="translate({w * 0.3} {-h * 0.72})">
            <g class="buildBubble hint"><circle r="11" /><Icon name={idle(id)!} size={13} x={-6.5} y={-6.5} /></g>
          </g>
        {/if}

        {#if storm && id === 'chuDien'}
          <g class="kiepvan" transform="translate(0 {-h - 36})">
            {#each [0, 1, 2] as i}
              <path class="bolt" style="animation-delay: {0.7 + i * 1.2}s" d="M{-14 + i * 14} 4l-7 16h8l-9 20 20 -26h-9l7 -10Z" />
            {/each}
            <ellipse cx="-34" rx="46" ry="14" />
            <ellipse cx="30" cy="-4" rx="52" ry="16" />
            <ellipse cx="0" cy="-12" rx="40" ry="14" />
          </g>
        {/if}

        {#if full}
          <g class="fullTag" transform="translate(0 {-Math.min(h, 58) - 10})">
            <rect x="-17" y="-8" width="34" height="16" rx="8" />
            <text y="3.6" text-anchor="middle">{L.full}</text>
          </g>
        {:else if makes && lv && !job}
          <g transform="translate({w * 0.22} {-h * 0.7})">
            <g class="pulse" style="animation-delay: {SLOT[id][1] % 7 / 3}s"><Icon name={makes} size={14} x={-7} y={-7} /></g>
          </g>
        {/if}

        {#if lv === 0 && !locked && !job}
          <g transform="translate(0 {-h * 0.56})">
            <g class="buildBubble">
              <circle r="13" />
              <Icon name="hammer" size={14} x={-7} y={-7} />
            </g>
          </g>
        {/if}

        {#if !locked}
          <g class="plate" class:dim={lv === 0} transform="translate(0 15)">
            <rect x={-pw / 2} y="-7.5" width={pw} height="15" rx="7.5" />
            {#if lv}
              <rect class="lvb" x={-pw / 2 + 2} y="-5.5" width="12" height="11" rx="3" />
              <text class="lvn" x={-pw / 2 + 8} y="3.4" text-anchor="middle">{lv}</text>
            {/if}
            <text class="pn" x={lv ? -pw / 2 + 17 : 0} y="3.4" text-anchor={lv ? 'start' : 'middle'}>{name}</text>
          </g>
        {/if}

        {#if guide === id}
          <g transform="translate(0 {-h - (job ? 44 : 24)})">
            <g class="pointer"><path d="M0 12-8.5 1H-3.4V-10H3.4V1H8.5Z" /></g>
          </g>
        {/if}
      </g>

      {#each bursts.filter(b => b.id === id) as b (b.t)}
        <g class="burst" transform="translate(0 {-h / 2})">
          <circle class="shock" r="12" />
          {#each Array.from({ length: 12 }, (_, k) => k * 30) as a}
            <g style="transform: rotate({a}deg)"><circle class="spark" r="2.2" /></g>
          {/each}
          <text class="lvup" y={-h / 2 - 8} text-anchor="middle">{L.level(b.level)}</text>
        </g>
      {/each}
    </g>
  {/each}
  </g>

  <!-- Tiền cảnh + linh khí -->
  <path d="M0 780C24 770 46 776 64 792C80 806 88 830 92 860H0Z" fill="var(--fore)" />
  <path d="M400 800C376 796 356 808 344 826C336 838 332 850 330 860H400Z" fill="var(--fore)" />
  {@render Pine(34, 800, 1.9)}
  {@render Pine(370, 830, 1.5)}
  {#each MOTES as [x, y, delay, dur]}
    <circle class="mote" cx={x} cy={y} r="1.9" fill="url(#orb)" style="animation-delay: {delay}s; animation-duration: {dur}s" />
  {/each}
</svg>

<style>
  /* Cao hơn khung nhìn thì cuộn dọc được; thấp hơn thì phủ kín. Màu vật liệu ban ngày ở app.css */
  .scene {
    display: block;
    width: 100%;
    min-height: 100%;
    aspect-ratio: 400 / 860;
    /* Ban ngày */
    --sky1: #b9d2d8;
    --sky2: #eef3ee;
    --far: #7ea4b4;
    --sun-o: 1;
    --moon-o: 0;
    --stars-o: 0;
    --veil-o: 0;
    --win: #36566c;
    --glow-o: 0;
    --cloud: #fbfcf8;
    --cloud-line: #93adb6;
    --mist-c: #ffffff;
    --turf: #86b98d;
    --rock-top: #5f9e84;
    --rock: #2f6a73;
    --rock-d: #1d4e73;
    --water: #4f98a8;
    --water-l: #a4d6dc;
    --fore: #173341;
  }
  .dawn {
    --sky1: #e7bfa8;
    --sky2: #f5ece1;
    --far: #a4a6b8;
  }
  .dusk {
    --sky1: #d6936c;
    --sky2: #f0dcc6;
    --far: #9a8aa0;
    --win: #f0c56a;
    --glow-o: 0.6;
    --veil-o: 0.1;
  }
  .storm {
    --sky1: #1a1430 !important;
    --sky2: #3a3350 !important;
    --far: #2b2744 !important;
    --sun-o: 0 !important;
    --veil-o: 0.45 !important;
    --glow-o: 1 !important;
  }
  .night {
    --sky1: #0d1a2e;
    --sky2: #2a3a55;
    --far: #34496a;
    --sun-o: 0;
    --moon-o: 1;
    --stars-o: 1;
    --veil-o: 0.35;
    --win: #ffd27a;
    --glow-o: 1;
    --cloud: #c3cedb;
    --cloud-line: #71839a;
    --mist-c: #aebed0;
    --turf: #3b6158;
    --rock-top: #2e5552;
    --rock: #1d3b4a;
    --rock-d: #132c45;
    --water: #243f55;
    --water-l: #3f6078;
    --fore: #0a1822;
    --wall: #969a9a;
    --tile: #1a252d;
    --glaze: #1d4a45;
    --stone: #6c7279;
    --stone-l: #7d838a;
    --stone-d: #52585e;
    --wood: #6a5036;
    --skin: #b8a38f;
    --robe: #a3a8aa;
    --field: #466a4e;
    --field-l: #55795a;
    --pine: #163831;
    --pine-l: #1f4a40;
  }

  .sun {
    opacity: var(--sun-o);
  }
  .moon {
    opacity: var(--moon-o);
  }
  .stars {
    opacity: var(--stars-o);
    animation: twinkle 5s ease-in-out infinite;
  }
  .veil {
    opacity: var(--veil-o);
    pointer-events: none;
  }

  .drift {
    animation: drift 40s ease-in-out infinite alternate;
  }
  @keyframes drift {
    from {
      transform: translateX(-18px);
    }
    to {
      transform: translateX(18px);
    }
  }
  .flock {
    animation: fly 32s linear infinite;
  }
  @keyframes fly {
    from {
      transform: translate(460px, 150px);
    }
    to {
      transform: translate(-80px, 110px);
    }
  }
  .wing {
    transform-box: fill-box;
    transform-origin: right bottom;
    animation: flap 0.9s ease-in-out infinite alternate;
  }
  @keyframes flap {
    from {
      transform: scaleY(1);
    }
    to {
      transform: scaleY(-0.55);
    }
  }
  .fall {
    animation: fall 0.9s linear infinite;
  }
  @keyframes fall {
    to {
      stroke-dashoffset: -32;
    }
  }
  .spray {
    animation: spray 2.2s ease-in-out infinite;
  }
  @keyframes spray {
    0%,
    100% {
      opacity: 0.45;
    }
    50% {
      opacity: 0.8;
    }
  }
  .ripple {
    animation: fall 2.4s linear infinite;
  }
  .mote {
    opacity: 0;
    animation: rise 9s ease-in-out infinite;
  }
  @keyframes rise {
    0% {
      opacity: 0;
      transform: translateY(0);
    }
    25% {
      opacity: 0.9;
    }
    100% {
      opacity: 0;
      transform: translateY(-170px);
    }
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: calc(var(--stars-o) * 0.7);
    }
    50% {
      opacity: var(--stars-o);
    }
  }

  /* Công trình */
  .bld {
    cursor: pointer;
    outline: none;
  }
  .hit {
    fill: transparent;
  }
  .bld:focus-visible .hit {
    stroke: var(--gold);
    stroke-width: 2;
    stroke-dasharray: 4 3;
  }
  .ring {
    fill: rgb(201 161 74 / 0.18);
    stroke: var(--gold);
    stroke-width: 2;
    animation: ring 1.4s ease-in-out infinite;
  }
  @keyframes ring {
    50% {
      stroke-opacity: 0.35;
    }
  }
  .ghost {
    opacity: 0.3;
  }
  .plot {
    fill: rgb(247 249 245 / 0.25);
    stroke: var(--silk);
    stroke-width: 1.4;
    stroke-dasharray: 4 3;
  }
  .fog ellipse {
    fill: var(--cloud);
    stroke: var(--cloud-line);
    stroke-width: 0.8;
  }
  .curl {
    fill: none;
    stroke: var(--cloud-line);
    stroke-width: 1.2;
    stroke-linecap: round;
  }
  .bob {
    animation: bob 5s ease-in-out infinite;
  }
  @keyframes bob {
    50% {
      transform: translateY(-3px);
    }
  }
  .lockTag rect {
    fill: rgb(18 30 38 / 0.78);
    stroke: var(--gold);
    stroke-width: 0.8;
  }
  .lockTag text {
    font: 600 9.5px var(--font);
    fill: #f1ead6;
  }
  .lockIcon {
    color: var(--gold-l);
  }

  .scaffold path {
    stroke: #b08a58;
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .arm {
    transform-box: fill-box;
    transform-origin: left bottom;
    animation: hammer 0.5s ease-in-out infinite alternate;
  }
  @keyframes hammer {
    from {
      transform: rotate(-35deg);
    }
    to {
      transform: rotate(20deg);
    }
  }
  .timer {
    color: var(--gold-l);
  }
  .timer rect:first-child {
    fill: rgb(18 30 38 / 0.82);
    stroke: var(--gold);
    stroke-width: 1;
  }
  .timer .tbg {
    fill: var(--azurite);
  }
  .timer text {
    font: 600 10px var(--font);
    font-variant-numeric: tabular-nums;
    fill: #fff;
  }
  .timer .track {
    fill: rgb(255 255 255 / 0.2);
  }
  .timer .fill {
    fill: var(--spirit);
  }
  .fullTag rect {
    fill: var(--cinnabar);
    stroke: #fff;
    stroke-width: 1;
  }
  .fullTag text {
    font: 700 9px var(--font);
    fill: #fff;
  }
  .pulse {
    opacity: 0;
    animation: pulse 3.4s ease-out infinite;
  }
  @keyframes pulse {
    0% {
      opacity: 0;
      transform: translateY(4px) scale(0.7);
    }
    25% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-16px) scale(1);
    }
  }
  .buildBubble {
    color: var(--ink);
    animation: nudge 1.6s ease-in-out infinite;
  }
  .buildBubble circle {
    fill: var(--gold-l);
    stroke: #fff;
    stroke-width: 2;
  }
  @keyframes nudge {
    50% {
      transform: translateY(-4px);
    }
  }
  .plate rect {
    fill: rgb(18 30 38 / 0.72);
    stroke: rgb(201 161 74 / 0.8);
    stroke-width: 0.7;
  }
  .plate.dim rect {
    fill: rgb(18 30 38 / 0.5);
  }
  .plate .lvb {
    fill: var(--cinnabar);
    stroke: none;
  }
  .plate text {
    font: 600 9px var(--font);
    fill: #f6f1e4;
  }
  .plate .lvn {
    font-size: 8.5px;
    fill: #fff;
  }
  .pointer {
    animation: point 0.9s ease-in-out infinite;
  }
  .pointer path {
    fill: var(--gold-l);
    stroke: var(--gold-d);
    stroke-width: 1.2;
    stroke-linejoin: round;
  }
  @keyframes point {
    50% {
      transform: translateY(-7px);
    }
  }

  .hint circle {
    fill: #fff;
    stroke: var(--gold);
  }
  .kiepvan ellipse {
    fill: #241d3a;
    opacity: 0.92;
    animation: churn 3s ease-in-out infinite alternate;
  }
  @keyframes churn {
    to {
      transform: translateX(6px) scale(1.04);
    }
  }
  .bolt {
    fill: #f3edff;
    stroke: #b9a4ff;
    stroke-width: 1.2;
    opacity: 0;
    filter: drop-shadow(0 0 6px #c8b6ff);
    animation: strike 1.2s ease-out forwards;
  }
  @keyframes strike {
    0%,
    100% {
      opacity: 0;
    }
    6%,
    18% {
      opacity: 1;
    }
    12% {
      opacity: 0.3;
    }
  }

  .still .plate,
  .still .buildBubble,
  .still .lockTag,
  .still .fullTag,
  .still .pulse,
  .still .timer {
    display: none;
  }
  .still .bld {
    pointer-events: none;
  }

  /* Pháo hoa khi lên tầng */
  .shock {
    fill: none;
    stroke: var(--gold-l);
    stroke-width: 3;
    animation: shock 0.9s ease-out forwards;
  }
  @keyframes shock {
    from {
      opacity: 1;
      transform: scale(0.4);
    }
    to {
      opacity: 0;
      transform: scale(5);
    }
  }
  .spark {
    fill: var(--gold-l);
    animation: spark 1.1s ease-out forwards;
  }
  @keyframes spark {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(46px);
    }
  }
  .lvup {
    font: 700 14px var(--font);
    fill: #fff;
    stroke: var(--gold-d);
    stroke-width: 3px;
    paint-order: stroke;
    animation: lvup 1.6s ease-out forwards;
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
      transform: translateY(-22px) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
    .mote,
    .pulse {
      display: none;
    }
  }
</style>
