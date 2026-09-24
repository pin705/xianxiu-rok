<script lang="ts">
  // Tab Bản đồ: nút gạt Giới (bản đồ giới chung) | Vùng (bản đồ PvE riêng). Nhớ lựa chọn trên máy. Chỉ theo dõi bản đồ giới
  // (server đẩy ảnh chụp khi đổi) lúc đang xem.
  import type { State, Target } from '@rok/rules'
  import { atlas, type MapSnap, type WorldAction } from '@rok/rules/world'
  import type { Ack, WorldInfo } from '@rok/protocol'
  import TileSheet from '../TileSheet.svelte'
  import { Tabs } from '../ui'
  import { L } from '../lib'
  import MapView from './MapView.svelte'
  import WorldView from './WorldView.svelte'
  import type { Pick } from './worldmap'

  let {
    game,
    now,
    info,
    me,
    allies = [],
    busy = false,
    watch,
    onpick,
    onreports,
    onrivals,
    onraid,
    send,
  }: {
    game: State
    now: number
    info: WorldInfo | null
    me: number | null
    allies?: number[]
    busy?: boolean
    watch: (on: (m: MapSnap) => void) => () => void
    onpick: (t: Target) => void
    onreports: () => void
    onrivals: () => void
    onraid: (pid: number) => void
    send: (a: WorldAction) => Promise<Ack>
  } = $props()

  const KEY = 'rok.map'
  const saved = () => {
    try {
      return localStorage.getItem(KEY) === 'world' ? 'world' : 'region'
    } catch {
      return 'region'
    }
  }
  let mode = $state<'world' | 'region'>(typeof localStorage === 'undefined' ? 'region' : saved())
  function choose(m: string) {
    mode = m === 'world' ? 'world' : 'region'
    try {
      localStorage.setItem(KEY, mode)
    } catch {}
  }
  let snap = $state.raw<MapSnap | null>(null)
  let pick = $state<Pick | null>(null)
  $effect(() => {
    if (mode !== 'world' || !info) return
    return watch(m => (snap = m))
  })
  const world = $derived(info ? atlas(info.map) : null)
</script>

{#snippet toggle()}
  <Tabs items={[{ id: 'world', label: L.world.toggle.world }, { id: 'region', label: L.world.toggle.region }]} value={mode} onchange={choose} />
{/snippet}

{#if mode === 'world' && info && world}
  <WorldView {game} {now} {info} {me} {snap} {allies} onpick={p => (pick = p)} {toggle} />
  <TileSheet {game} {now} {info} atlas={world} {me} {snap} {pick} {busy} onclose={() => (pick = null)} onraid={pid => ((pick = null), onraid(pid))} {send} />
{:else}
  <MapView {game} {now} {onpick} {onreports} {onrivals} onrecall={id => send({ type: 'recall', id })} toggle={info ? toggle : undefined} />
{/if}
