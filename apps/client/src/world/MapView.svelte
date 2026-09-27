<script lang="ts">
  import type { MedalTone } from '@rok/art'
  // Màn bản đồ: cảnh WebGL (map.ts) + mục tiêu là huy hiệu HTML (chạm được, đọc được) + thanh trên và danh sách đội.
  import type { Snippet } from 'svelte'
  import {
    BEASTS,
    MAP_HALL,
    PVP_HALL,
    REALMS,
    SECTS,
    TOWER,
    coolKey,
    marchSlots,
    targetError,
    type Err,
    type Target,
  } from '@rok/rules'
  import { recallable } from '@rok/rules/world'
  import { Portrait, type Emblem } from '@rok/art'
  import { Beacon, Button, Caption, Card, Dock, Medal, Pin, Tag, Tile } from '../ui'
  import { EMBLEM, L, LOOK, clock, marchDoing, marchName } from '../lib'
  import { MAP, MAP_H, MapScene } from './map'
  import View from './View.svelte'
  import { useGame } from '../game'
  import { social } from '../social.svelte'

  let {
    onpick,
    onreports,
    onrivals = () => {},
    onrecall,
    toggle,
  }: {
    onpick: (t: Target) => void
    onreports: () => void
    onrivals?: () => void
    onrecall?: (id: number) => void
    toggle?: Snippet // nút gạt Giới | Vùng (MapTab)
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  let scene = $state.raw<MapScene>()
  type Node = { t: Target; x: number; y: number; emblem: Emblem; lv?: number; name: string }
  const nodes: Node[] = [
    ...BEASTS.map((b, i) => ({
      t: { kind: 'beast', i } as Target,
      x: b.x,
      y: b.y,
      emblem: EMBLEM.beast[i],
      lv: i + 1,
      name: L.beasts[i],
    })),
    ...SECTS.map((d, i) => ({
      t: { kind: 'sect', i } as Target,
      x: d.x,
      y: d.y,
      emblem: EMBLEM.sect[i],
      name: L.sects[i].name,
    })),
    ...REALMS.map((d, i) => ({
      t: { kind: 'realm', i } as Target,
      x: d.x,
      y: d.y,
      emblem: EMBLEM.realm[i],
      name: L.realms[i].name,
    })),
    { t: { kind: 'tower', i: 0 }, x: TOWER.x, y: TOWER.y, emblem: EMBLEM.tower[0], name: L.tower.name },
  ]
  const unread = $derived(game.reports.filter(r => r.id > game.seen).length)
  // chấm trên bản đồ theo lỗi xuất quân tới đó; lỗi khác (thiếu quân…) vẫn là mở
  const STATUS: Partial<Record<Err, 'locked' | 'cool' | 'done' | 'busy'>> = {
    locked: 'locked',
    cooldown: 'cool',
    max_level: 'done',
    busy: 'busy',
  }
  const status = (n: Node) => {
    const e = targetError(game, n.t, now)
    return (e && STATUS[e]) ?? 'open'
  }
  // Mục tiêu nên đánh tiếp: yêu thú cấp cao nhất đang mở
  const next = $derived(game.beast < BEASTS.length ? game.beast : -1)
  $effect(() =>
    scene?.set(
      game,
      game.levels.chuDien >= MAP_HALL ? nodes.filter(n => status(n) !== 'locked').map(n => n.t) : [],
      now,
    ),
  )
</script>

<View make={() => new MapScene()} art={['map']} height={MAP_H} start={1} zoomable bind:scene={scene as never}>
  {#snippet hits(k)}
    {#each nodes as n (n.name + n.t.kind)}
      <button
        class="hit"
        style="left:{(n.x - 24) * k}px;top:{(n.y + MAP.top - 24) * k}px;width:{48 * k}px;height:{56 * k}px"
        aria-label="{n.name}{n.lv ? `, ${L.lv(n.lv)}` : ''}"
        onclick={() => onpick(n.t)}
      ></button>
    {/each}
  {/snippet}
  {#snippet pins(k)}
    {#each nodes as n (n.name + n.t.kind)}
      {@const st = status(n)}
      {@const hot = n.t.kind === 'beast' && n.t.i === next && st === 'open'}
      <!-- nút sát mép: nhãn dài xuống tối đa 2 dòng (rộng 100px) rồi dịch vào trong, khỏi tràn màn và đè nhãn bên cạnh (ước ~7px mỗi chữ) -->
      {@const edge = Math.min(n.x, 400 - n.x) * k < n.name.length * 3.6 + 6}
      {@const half = edge ? Math.min(n.name.length * 3.6, 50) : n.name.length * 3.6}
      {@const dx = Math.max(0, half - n.x * k + 6) - Math.max(0, half - (400 - n.x) * k + 6)}
      <Pin x={n.x * k} y={(n.y + MAP.top) * k}>
        <Beacon
          label={n.name}
          badge={n.lv ??
            (n.t.kind === 'realm'
              ? `${game.realms[n.t.i]}/5`
              : n.t.kind === 'tower' && game.tower
                ? game.tower
                : undefined)}
          mark={st === 'locked' ? 'lock' : st === 'done' ? 'check' : undefined}
          {hot}
          dim={st === 'locked'}
          wrap={edge}
          shift={dx}
          sub={st === 'cool' ? clock((game.cool[coolKey(n.t)] ?? 0) - now) : undefined}
        >
          <Medal emblem={n.emblem} tone={n.t.kind as MedalTone} size={36} dim={st === 'locked' || st === 'cool'} />
        </Beacon>
      </Pin>
    {/each}
    <Pin x={200 * k} y={(MAP.top + 948) * k}><Caption size="lg" tone="red">{game.name}</Caption></Pin>
  {/snippet}
</View>

{#snippet shortcuts(bare: boolean)}
  {@const size = bare ? 40 : 54}
  {#if game.levels.chuDien >= PVP_HALL}<Tile
      art="fx-battle"
      icon="swords"
      label={L.pvp.find}
      {size}
      {bare}
      look="ink"
      onclick={onrivals}
    />{/if}
  <Tile art="ev-report" icon="scroll" label={L.report.title} n={unread} {size} {bare} look="ink" onclick={onreports} />
  <!-- Thí Luyện: gom các chế độ PvE -->
  <Tile
    art="ev-arena"
    icon="star"
    label={L.trials.tile}
    {size}
    {bare}
    look="ink"
    onclick={() => (social.trials = true)}
  />
{/snippet}

<Dock at="top" fade class="row">
  {#if toggle}{@render toggle()}{/if}
  <!-- điện thoại hẹp: chỉ "0/2" (đủ chỗ cho nút gạt + hai nút), chữ đủ đọc bằng trình đọc màn hình -->
  <span class="grow" title={L.map.slots(game.marches.length, marchSlots(game))}
    ><Tag icon="flag"
      ><span class="sr-narrow">{L.map.slots(game.marches.length, marchSlots(game))}</span><span
        class="only-narrow"
        aria-hidden="true">{game.marches.length}/{marchSlots(game)}</span
      ></Tag
    ></span
  >
  <!-- điện thoại: lối tắt là huy hiệu tranh nhỏ trong hàng trên — cột bên phải che mất yêu thú, bí cảnh sát mép phải -->
  <span class="row phone-only" style:--gap="6px">{@render shortcuts(true)}</span>
</Dock>
<!-- desktop: cảnh hẹp hơn vùng bản đồ, cột phải nằm ngoài cảnh — tranh đóng khung, nhãn viên mực như cột biểu tượng của game -->
<Dock at="side" class="desk-only">{@render shortcuts(false)}</Dock>

{#if game.marches.length}
  <Dock at="foot">
    <ul class="stack">
      {#each game.marches as m (m.id)}
        {@const out = now < m.arriveAt}
        {@const back = onrecall && recallable(m, now)}
        <li>
          <Card
            tone="silk"
            onclick={() =>
              m.target.kind === 'pvp'
                ? onrivals()
                : m.target.kind === 'spot' || m.target.kind === 'trib' || m.target.kind === 'flag'
                  ? undefined
                  : onpick(m.target)}
          >
            <span class="row">
              <Portrait look={LOOK[m.elder]} size={30} />
              <span class="grow stack" style:--gap="0"
                ><b class="t-small">{marchName(m)}</b><small class="t-tiny t-soft">{marchDoing(m, now)}</small></span
              >
              {#if !back || out}
                <b class="t-num t-gold"
                  >{clock(
                    (out ? m.arriveAt : m.mine && m.mine.end > now ? m.mine.end : m.returnAt || m.arriveAt) - now,
                  )}</b
                >
              {/if}
              {#if back}
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={e => {
                    e.stopPropagation()
                    onrecall?.(m.id)
                  }}>{L.world.recall}</Button
                >
              {/if}
            </span>
          </Card>
        </li>
      {/each}
    </ul>
  </Dock>
{/if}
