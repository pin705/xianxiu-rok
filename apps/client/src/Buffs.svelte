<script lang="ts">
  // Dải tăng ích dưới chân dung (như dải buff của RoK): khiên và các tăng ích còn hạn hiện thành chip icon + giờ còn lại,
  // đọc được trên điện thoại; chạm là mở bảng: từng nguồn (phù, đan, linh mạch, trận tiên minh, sắc phong), hiệu quả, hạn —
  // rồi phù tăng ích / hộ sơn trong túi để dùng ngay.
  import { BAG, BAG_IDS, bagFamily, type BagId, type Buff } from '@rok/rules'
  import { Icon, type IconName } from '@rok/art'
  import { Button, Sheet } from './ui'
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
    return out.sort((a, b) => (a.until || Infinity) - (b.until || Infinity))
  })
  // vừa bề ngang cụm nút trên HUD điện thoại: tối đa 3 chip, nhiều hơn thì 2 chip + "+N"
  const show = $derived(rows.length > 3 ? 2 : 3)
  const items = $derived(
    BAG_IDS.filter(id => (BAG[id].use === 'buff' || BAG[id].use === 'shield') && (game.items[id] ?? 0) > 0),
  )
  let open = $state(false)
  const use = (id: BagId) => g.act({ type: 'use', item: id, n: 1 }, 'reward')
</script>

{#if rows.length}
  <button class="buffs" onclick={() => (open = true)} aria-label={L.buffs.open(rows.length)}>
    {#each rows.slice(0, show) as r (r.key)}
      <span class="chip" class:shield={r.key === 'shield'}
        ><Icon name={r.icon} size={16} />{#if r.until}<b class="t-num">{L.buffs.short(r.until - now)}</b>{/if}</span
      >
    {/each}
    {#if rows.length > show}<span class="chip more">+{rows.length - show}</span>{/if}
  </button>
{/if}

<Sheet {open} onclose={() => (open = false)} center title={L.buffs.title}>
  <div class="stack">
    {#if rows.length}
      <ul class="stack rows">
        {#each rows as r (r.key)}
          <li class="row">
            <Icon name={r.icon} size={32} />
            <span class="grow stack" style:--gap="2px">
              <b>{r.name}</b>
              {#each r.fx as f (f)}<small class="t-soft">{f}</small>{/each}
            </span>
            <small class="t-num t-strong">{r.until ? L.bag.left(clock(r.until - now)) : L.buffs.always}</small>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="t-soft">{L.buffs.none}</p>
    {/if}
    {#if items.length}
      <p class="t-small t-strong">{L.buffs.items}</p>
      <ul class="stack rows">
        {#each items as id (id)}
          <li class="row">
            <Icon name={bagFamily(id)} size={32} />
            <span class="grow"
              ><b>{L.bag.family[bagFamily(id)].name} · {denom(id)}</b> <small>×{game.items[id]}</small></span
            >
            <Button size="sm" onclick={() => use(id)}>{L.bag.use}</Button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Sheet>

<style>
  .buffs {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    padding: 6px 0; /* vùng chạm cao hơn chip, không đẩy bố cục */
    margin: -6px 0;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .chip {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    height: 22px;
    padding: 0 6px 0 3px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text);
    background: color-mix(in srgb, var(--paper2) 88%, transparent);
    border: 1px solid color-mix(in srgb, var(--gold) 70%, transparent);
    border-radius: 11px;
  }
  .shield {
    border-color: var(--malachite);
  }
  .more {
    padding: 0 7px;
  }
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
