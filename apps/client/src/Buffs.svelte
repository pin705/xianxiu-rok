<script lang="ts">
  // Dải tăng ích dưới chân dung (như dải buff của RoK): khiên và các tăng ích còn hạn hiện thành chip icon + giờ còn lại,
  // đọc được trên điện thoại; chạm là mở bảng: từng nguồn (phù, đan, linh mạch, trận tiên minh, sắc phong), hiệu quả, hạn —
  // rồi phù tăng ích / hộ sơn trong túi để dùng ngay.
  import { BAG, BAG_IDS, bagFamily, type BagId, type Buff } from '@rok/rules'
  import { Icon, type IconName } from '@rok/art'
  import { Boosts, Button, Charm, Sheet } from './ui'
  import { denom } from './bag'
  import { L, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  type Row = { key: string; icon: IconName; name: string; fx: string[]; until: number }
  const phuOf = (key: string) => BAG_IDS.find(id => BAG[id].use === 'buff' && (BAG[id] as { key: string }).key === key)
  const SRC: Record<string, [IconName, string]> = {
    ngungThan: ['ngungThan', L.pills.ngungThan.name],
    vein: ['linhThach', L.buffs.src.vein],
    tide: ['bolt', L.buffs.src.tide],
    ally: ['flag', L.buffs.src.ally],
    fort: ['flag', L.buffs.src.fort],
    askill: ['bolt', L.buffs.src.askill],
    rune: ['star', L.buffs.src.rune],
    eve: ['skull', L.buffs.src.eve],
    thoi: ['clock', L.buffs.src.thoi],
    office: ['rank', L.buffs.src.office],
    title: ['rank', L.buffs.src.title],
    bless: ['star', L.buffs.src.bless],
  }
  function head(src: string): [IconName, string] {
    const phu = src.startsWith('phu.') ? phuOf(src.slice(4)) : undefined
    if (phu) return [bagFamily(phu), L.bag.family[bagFamily(phu)].name]
    return SRC[src.replace(/\d+$/, '')] ?? ['star', src]
  }
  // mỗi nguồn một dòng (sắc phong, trận tiên minh có thể tăng nhiều chỉ số); còn hạn trước, thường trực sau
  const rows = $derived.by(() => {
    const by = new Map<string, Buff[]>()
    for (const b of game.buffs) if (!b.until || b.until > now) by.set(b.src, [...(by.get(b.src) ?? []), b])
    const out: Row[] = [...by].map(([src, bs]) => {
      const [icon, name] = head(src)
      return { key: src, icon, name, fx: bs.map(b => L.bonus(b.key, b.v)), until: Math.max(...bs.map(b => b.until)) }
    })
    if (game.shield > now)
      out.push({ key: 'shield', icon: 'hoSon', name: L.buffs.shield, fx: [L.buffs.shieldFx], until: game.shield })
    if ((game.builder2 ?? 0) > now)
      out.push({
        key: 'builder2',
        icon: 'tapDich',
        name: L.bag.family.tapDich.name,
        fx: [L.buffs.builder2],
        until: game.builder2!,
      })
    if ((game.veil ?? 0) > now)
      out.push({ key: 'veil', icon: 'anTung', name: L.bag.family.anTung.name, fx: [L.buffs.veil], until: game.veil! })
    if ((game.mirage ?? 0) > now)
      out.push({
        key: 'mirage',
        icon: 'huyenAnh',
        name: L.bag.family.huyenAnh.name,
        fx: [L.buffs.mirage],
        until: game.mirage!,
      })
    return out.sort((a, b) => (a.until || Infinity) - (b.until || Infinity))
  })
  // vừa bề ngang cụm nút trên HUD điện thoại: tối đa 3 chip, nhiều hơn thì 2 chip + "+N"
  const show = $derived(rows.length > 3 ? 2 : 3)
  const items = $derived(
    BAG_IDS.filter(id => ['buff', 'shield', 'veil', 'mirage'].includes(BAG[id].use) && (game.items[id] ?? 0) > 0),
  )
  let open = $state(false)
  const use = (id: BagId) => g.act({ type: 'use', item: id, n: 1 }, 'reward')
</script>

{#if rows.length}
  <Boosts
    items={rows.slice(0, show).map(r => ({
      key: r.key,
      icon: r.icon,
      text: r.until ? L.buffs.short(r.until - now) : undefined,
      jade: r.key === 'shield',
    }))}
    more={rows.length - show}
    label={L.buffs.open(rows.length)}
    onclick={() => (open = true)}
  />
{/if}

<Sheet {open} onclose={() => (open = false)} center title={L.buffs.title}>
  <!-- mỗi tăng ích một lá bùa treo trên sợi dây: icon, tên, hiệu quả, giờ còn lại trên dải son (thường trực: dải mực) -->
  {#if rows.length}
    <ul class="charm-line mt-2">
      {#each rows as r, i (r.key)}
        <Charm
          tilt={i % 2 ? 1 : -1.2}
          jade={r.key === 'shield'}
          band={r.until ? L.bag.left(clock(r.until - now)) : L.buffs.always}
          always={!r.until}
        >
          <Icon name={r.icon} size={36} />
          <b class="t-small">{r.name}</b>
          {#each r.fx as f (f)}<small class="t-tiny t-soft">{f}</small>{/each}
        </Charm>
      {/each}
    </ul>
  {:else}
    <p class="t-soft">{L.buffs.none}</p>
  {/if}
  {#if items.length}
    <p class="t-small t-strong mt-3">{L.buffs.items}</p>
    <!-- phù trong túi: dòng gọn kẻ mực đứt, dùng ngay -->
    <ul class="ledger">
      {#each items as id (id)}
        <li>
          <Icon name={bagFamily(id)} size={32} />
          <span class="grow"
            ><b class="t-small">{L.bag.family[bagFamily(id)].name} · {denom(id)}</b>
            <small class="t-soft">×{game.items[id]}</small></span
          >
          <Button size="sm" variant="gold" onclick={() => use(id)}>{L.bag.use}</Button>
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>
