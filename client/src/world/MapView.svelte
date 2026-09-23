<script lang="ts">
  // Màn bản đồ: cảnh WebGL (map.ts) + mục tiêu là huy hiệu HTML (chạm được, đọc được) + thanh trên và danh sách đội.
  import { BEASTS, MAP_HALL, REALMS, SECTS, coolKey, marchSlots, targetError, type State, type Target } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Badge, Button, Card, Medal, Tag } from '../ui'
  import { GLYPH, L, LOOK, SEAL, clock } from '../lib'
  import { MAP, MAP_H, MapScene } from './map'
  import View from './View.svelte'

  let { game, now, onpick, onreports }: { game: State; now: number; onpick: (t: Target) => void; onreports: () => void } = $props()

  let scene = $state.raw<MapScene>()
  type Node = { t: Target; x: number; y: number; glyph: string; lv?: number; name: string }
  const nodes: Node[] = [
    ...BEASTS.map((b, i) => ({ t: { kind: 'beast', i } as Target, x: b.x, y: b.y, glyph: GLYPH.beast[i], lv: i + 1, name: L.beasts[i] })),
    ...SECTS.map((d, i) => ({ t: { kind: 'sect', i } as Target, x: d.x, y: d.y, glyph: GLYPH.sect[i], name: L.sects[i].name })),
    ...REALMS.map((d, i) => ({ t: { kind: 'realm', i } as Target, x: d.x, y: d.y, glyph: GLYPH.realm[i], name: L.realms[i].name })),
  ]
  const unread = $derived(game.reports.filter(r => r.id > game.seen).length)
  const status = (n: Node) => {
    const e = targetError(game, n.t, now)
    return e === 'locked' ? 'locked' : e === 'cooldown' ? 'cool' : e === 'max_level' ? 'done' : e === 'busy' ? 'busy' : 'open'
  }
  // Mục tiêu nên đánh tiếp: yêu thú cấp cao nhất đang mở
  const next = $derived(game.beast < BEASTS.length ? game.beast : -1)
  $effect(() => scene?.set(game, game.levels.chuDien >= MAP_HALL ? nodes.filter(n => status(n) !== 'locked').map(n => n.t) : [], now))
</script>

<View make={() => new MapScene(SEAL.chuDien)} height={MAP_H} start={1} bind:scene={scene as never}>
  {#snippet hits(k)}
    {#each nodes as n (n.name + n.t.kind)}
      <button class="hit" style="left:{(n.x - 24) * k}px;top:{(n.y + MAP.top - 24) * k}px;width:{48 * k}px;height:{56 * k}px" aria-label="{n.name}{n.lv ? `, ${L.lv(n.lv)}` : ''}" onclick={() => onpick(n.t)}></button>
    {/each}
  {/snippet}
  {#snippet pins(k)}
    {#each nodes as n (n.name + n.t.kind)}
      {@const st = status(n)}
      {@const hot = n.t.kind === 'beast' && n.t.i === next && st === 'open'}
      <!-- nút sát mép: dịch nhãn dài vào trong cho khỏi tràn khỏi màn (ước ~7px mỗi chữ) -->
      {@const half = n.name.length * 3.6}
      {@const dx = Math.max(0, half - n.x * k + 6) - Math.max(0, half - (400 - n.x) * k + 6)}
      <span class="pin node {st}" class:hot style="left:{n.x * k}px;top:{(n.y + MAP.top) * k}px">
        <span class="disc">
          <Medal glyph={n.glyph} tone={n.t.kind} size={36} dim={st === 'locked' || st === 'cool'} />
          {#if n.lv}<b class="lv">{n.lv}</b>{/if}
          {#if n.t.kind === 'realm'}<b class="lv">{game.realms[n.t.i]}/5</b>{/if}
          {#if st === 'locked'}<span class="mark"><Icon name="lock" size={12} /></span>{:else if st === 'done'}<span class="mark ok"><Icon name="check" size={13} /></span>{/if}
        </span>
        <span class="label" style:translate="{dx}px 0">{n.name}</span>
        {#if st === 'cool'}<span class="label t-num" style:translate="{dx}px 0">{clock((game.cool[coolKey(n.t)] ?? 0) - now)}</span>{/if}
      </span>
    {/each}
    <span class="pin" style="left:{200 * k}px;top:{(MAP.top + 948) * k}px"><span class="label home">{game.name}</span></span>
  {/snippet}
</View>

<div class="top row">
  <span class="grow"><Tag icon="flag">{L.map.slots(game.marches.length, marchSlots(game))}</Tag></span>
  <span class="rep"><Button size="sm" icon="scroll" onclick={onreports}>{L.report.title}</Button><Badge n={unread} fresh={unread === 1} /></span>
</div>

{#if game.marches.length}
  <ul class="marches stack">
    {#each game.marches as m (m.id)}
      {@const out = now < m.arriveAt}
      <li>
        <Card tone="lacquer" onclick={() => onpick(m.target)}>
          <span class="row on-dark">
            <Portrait look={LOOK[m.elder]} size={30} />
            <span class="grow stack" style:--gap="0"><b class="t-small">{L.target(m.target)}</b><small class="t-tiny t-soft">{out ? L.map.out : L.map.back}</small></span>
            <b class="t-num t-gold">{clock((out ? m.arriveAt : m.returnAt) - now)}</b>
          </span>
        </Card>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .node {
    display: grid;
    justify-items: center;
    gap: 2px;
  }
  .disc {
    position: relative;
    display: grid;
  }
  .hot .disc::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--gold);
    animation: halo 1.6s var(--ease) infinite;
  }
  @keyframes halo {
    from {
      opacity: 0.9;
      transform: scale(0.8);
    }
    to {
      opacity: 0;
      transform: scale(1.4);
    }
  }
  .lv {
    position: absolute;
    top: -6px;
    right: -10px;
    min-width: 18px;
    padding: 0 4px;
    font-size: 10px;
    line-height: 16px;
    text-align: center;
    color: var(--silk);
    background: var(--cinnabar);
    box-shadow: 0 0 0 1.5px var(--paper);
  }
  .mark {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--silk);
  }
  .ok {
    color: var(--malachite-l);
  }
  .label {
    font-size: var(--fs-2);
    font-weight: 800;
    color: var(--ink);
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
  }
  .locked .label {
    opacity: 0.6;
  }
  .home {
    font-size: var(--fs-3);
    color: var(--cinnabar);
  }
  .top {
    position: fixed;
    top: calc(142px + var(--safe-t));
    left: 50%;
    z-index: var(--z-page);
    width: min(100%, var(--col));
    padding: 0 var(--sp-3);
    translate: -50% 0;
    pointer-events: none;
  }
  .top > * {
    pointer-events: auto;
  }
  .rep {
    position: relative;
  }
  .marches {
    position: fixed;
    bottom: calc(100px + var(--safe-b));
    left: 50%;
    z-index: var(--z-page);
    width: min(100% - 24px, 456px);
    translate: -50% 0;
  }
</style>
