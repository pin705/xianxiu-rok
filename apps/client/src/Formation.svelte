<script lang="ts">
  // Trận Pháp (Formations · Armaments · State Forum của RoK), ba thẻ: Bày trận — bảy lệnh bài trận (chạm để xem), trận đang xem: tăng ích
  // gốc, nút bày / thu, 4 ô trận khí (đeo, đổi, gỡ); Trận khí — túi lọc theo trận, đeo, luyện hoá; Vân Du Đường — hành lực, vân du ×1 / ×5,
  // Hiền Sĩ Lệnh, đổi rương. Mở từ Diễn võ trường và bảng chọn đội (social.form)
  import {
    ARM_BAG,
    DRILLF,
    DRILLF_KEEP,
    ARM_MELT,
    ARM_SHOP,
    ARM_SLOTS,
    FORMS,
    FORM_IDS,
    INS_SPECIAL,
    VANDU_AP,
    VANDU_DAILY,
    VANDU_HALL,
    apOf,
    drillRun,
    armWorn,
    formOpen,
    insOf,
    vanduUsed,
    type Arm,
    type Bonus,
    type FormId,
  } from '@rok/rules'
  import { Icon, type IconName } from '@rok/art'
  import { Button, Card, Sheet, Tabs, Tag, Token } from './ui'
  import { L } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  const ICON: Record<FormId, IconName> = {
    phongThi: 'arrow',
    phuongVien: 'shield',
    nhanHanh: 'bolt',
    yenNguyet: 'heal',
    hacDuc: 'swords',
    truongXa: 'people',
    tamTai: 'star',
  }
  const SLOT_ICON: IconName[] = ['flag', 'scroll', 'shield', 'sound']
  const TONE = ['plain', 'good', 'gold', 'red'] as const
  type Tab = 'form' | 'arms' | 'travel' | 'drill'
  const TABS: { id: Tab; icon: IconName; label: string }[] = [
    { id: 'form', icon: 'flag', label: L.form.tabs.form },
    { id: 'arms', icon: 'shield', label: L.form.tabs.arms },
    { id: 'travel', icon: 'globe', label: L.form.tabs.travel },
    { id: 'drill', icon: 'swords', label: L.form.tabs.drill },
  ]
  const g = useGame()
  const game = $derived(g.game)
  let tab = $state<Tab>('form')
  let pick = $state<FormId | null>(null)
  let slotPick = $state<number | null>(null) // ô đang mở danh sách trận khí để đeo
  let filter = $state<FormId | 'all'>('all')
  let before = $state<{ arms: number; coin: number } | null>(null) // trước lần vân du / đổi rương gần nhất (hiện phần vừa nhận)
  const view = $derived(pick ?? game.form ?? 'phongThi')
  // Diễn luyện: trận chọn cho từng màn, kết quả lượt vừa diễn (tất định — client tính ngay, chỉ gửi khi có mục tiêu mới)
  let drillPick = $state<(FormId | null)[]>(DRILLF.map(() => null))
  let drillRes = $state<(ReturnType<typeof drillRun> | null)[]>(DRILLF.map(() => null))
  function drill(k: number) {
    const r = drillRun(k, drillPick[k])
    drillRes[k] = r
    if (r.bits & ~(game.formStars?.[k] ?? 0)) g.act({ type: 'formDrill', k, form: drillPick[k] }, 'reward')
  }
  const arms = $derived(game.arms ?? [])
  const coin = $derived(game.armCoin ?? 0)
  const on = $derived(game.armOn?.[view] ?? ARM_SLOTS.map(() => null))
  const ap = $derived(apOf(game, g.now))
  const used = $derived(vanduUsed(game, g.now))
  const locked = $derived(game.levels.chuDien < VANDU_HALL)
  const byQ = (xs: Arm[]) => [...xs].sort((x, y) => y.q - x.q || x.id - y.id)
  const shown = $derived(byQ(arms.filter(a => filter === 'all' || a.f === filter)))
  const junk = $derived(arms.filter(a => a.q === 0 && !armWorn(game, a.id)))
  const fx = (b: Partial<Record<Bonus, number>>) =>
    Object.entries(b)
      .map(([k, v]) => L.bonus(k as Bonus, v ?? 0))
      .join(' · ')
  // chỉ số ô, rồi trận văn gộp theo khoá (hai dòng "máu +1 %" thành "máu +2 %"), dòng đặc biệt ghi tên
  const lines = (a: Arm) => {
    const sum = new Map<Bonus, number>()
    for (const i of a.ins.filter(i => i !== INS_SPECIAL))
      sum.set(insOf(a, i).key, (sum.get(insOf(a, i).key) ?? 0) + insOf(a, i).v)
    const sp = a.ins.includes(INS_SPECIAL)
      ? [`${L.form.special[a.f]}: ${L.bonus(insOf(a, INS_SPECIAL).key, insOf(a, INS_SPECIAL).v)}`]
      : []
    return [
      L.bonus(ARM_SLOTS[a.slot].key, ARM_SLOTS[a.slot].v[a.q]),
      ...[...sum].map(([k, v]) => L.bonus(k, v)),
      ...sp,
    ].join(' · ')
  }
  const gain = (act: Parameters<typeof g.act>[0]) => {
    before = { arms: arms.length, coin }
    g.act(act, 'reward')
  }
  const equip = (id: number) => {
    g.act({ type: 'armEquip', id }, 'reward')
    slotPick = null
  }
</script>

{#snippet arm(a: Arm)}
  <span class="stack" style:--gap="2px">
    <b class="t-small"
      ><Tag tone={TONE[a.q]} size="sm">{L.form.q[a.q]}</Tag> {L.form.slots[a.slot]} · {L.form.names[a.f]}</b
    >
    <small class="t-tiny t-good">{lines(a)}</small>
  </span>
{/snippet}

<Sheet open={social.form} onclose={() => (social.form = false)} title={L.form.title}>
  <div class="stack">
    <Tabs look="chips" fit items={TABS} value={tab} onchange={t => (tab = t)} />
    {#if tab === 'form'}
      <p class="t-tiny t-soft t-lore">{L.form.hint}</p>
      <small class="t-small t-gold">{game.form ? L.form.now(L.form.names[game.form]) : L.form.none}</small>
      <div class="rack">
        {#each FORM_IDS as f (f)}
          {@const open = formOpen(game, f)}
          <Token
            icon={ICON[f]}
            title={L.form.names[f]}
            fx={fx(FORMS[f].bonus)}
            text={open ? L.form.lore[f] : L.form.locked(FORMS[f].hall)}
            on={view === f}
            off={!open}
            stamp={game.form === f ? L.form.active : undefined}
            onclick={() => {
              pick = f
              slotPick = null
            }}
          />
        {/each}
      </div>
      <!-- trận đang xem: bày / thu, 4 ô trận khí -->
      <Card tone="silk">
        <div class="stack" style:--gap="8px">
          <p class="row between">
            <b>{L.form.names[view]}</b><small class="t-tiny t-good">{fx(FORMS[view].bonus)}</small>
          </p>
          {#if game.form === view}
            <Button size="sm" variant="ghost" onclick={() => g.act({ type: 'form', id: null }, 'tap')}
              >{L.form.off}</Button
            >
          {:else}
            <Button
              size="sm"
              variant="gold"
              disabled={!formOpen(game, view)}
              onclick={() => g.act({ type: 'form', id: view }, 'reward')}
              >{formOpen(game, view) ? L.form.set : L.form.locked(FORMS[view].hall)}</Button
            >
          {/if}
          {#each ARM_SLOTS as _, slot (slot)}
            {@const worn = arms.find(a => a.id === on[slot])}
            {@const fits = byQ(arms.filter(a => a.f === view && a.slot === slot && a.id !== on[slot]))}
            <div class="row between">
              <span class="row" style:--gap="8px">
                <Icon name={SLOT_ICON[slot]} size={24} />
                {#if worn}{@render arm(worn)}{:else}
                  <span class="stack" style:--gap="2px"
                    ><b class="t-small">{L.form.slots[slot]}</b><small class="t-tiny t-soft"
                      >{fits.length ? L.form.fits(fits.length) : L.form.empty}</small
                    ></span
                  >
                {/if}
              </span>
              <span class="row" style:--gap="4px">
                {#if worn}<Button
                    size="sm"
                    variant="ghost"
                    onclick={() => g.act({ type: 'armOff', f: view, slot }, 'tap')}>{L.form.unwear}</Button
                  >{/if}
                {#if fits.length}<Button
                    size="sm"
                    variant={slotPick === slot ? 'ghost' : 'gold'}
                    onclick={() => (slotPick = slotPick === slot ? null : slot)}>{L.form.wear}</Button
                  >{/if}
              </span>
            </div>
            {#if slotPick === slot}
              <ul class="stack plain" style:--gap="4px">
                {#each fits as a (a.id)}
                  <li class="row between">
                    {@render arm(a)}<Button size="sm" variant="gold" onclick={() => equip(a.id)}>{L.form.wear}</Button>
                  </li>
                {/each}
              </ul>
            {/if}
          {/each}
          {#if !arms.some(a => a.f === view)}<small class="t-tiny t-soft">{L.form.nofit}</small>{/if}
        </div>
      </Card>
    {:else if tab === 'arms'}
      <p class="row between t-small">
        <b>{L.form.bag(arms.length, ARM_BAG)}</b><span class="t-gold">{L.form.coin(coin)}</span>
      </p>
      <div class="row wrap" style:--gap="4px">
        {#each ['all', ...FORM_IDS] as const as f (f)}
          <Button size="sm" variant={filter === f ? 'gold' : 'ghost'} onclick={() => (filter = f)}
            >{f === 'all' ? L.form.all : L.form.names[f]}</Button
          >
        {/each}
      </div>
      {#if junk.length}
        <Button size="sm" variant="ghost" onclick={() => g.act({ type: 'armMelt', ids: junk.map(a => a.id) }, 'reward')}
          >{L.form.meltAll(junk.length, junk.length * ARM_MELT[0])}</Button
        >
      {/if}
      {#if !shown.length}<p class="t-small t-soft">{L.form.nofit}</p>{/if}
      <ul class="stack plain" style:--gap="6px">
        {#each shown as a (a.id)}
          <li>
            <Card>
              <div class="stack" style:--gap="6px">
                {@render arm(a)}
                <div class="row wrap" style:--gap="6px">
                  {#if armWorn(game, a.id)}<Tag tone="gold" size="sm">{L.form.worn}</Tag>{:else}
                    <Button size="sm" variant="gold" onclick={() => equip(a.id)}>{L.form.wear}</Button>
                    <Button size="sm" variant="ghost" onclick={() => g.act({ type: 'armMelt', ids: [a.id] }, 'reward')}
                      >{L.form.melt(ARM_MELT[a.q])}</Button
                    >
                  {/if}
                </div>
              </div>
            </Card>
          </li>
        {/each}
      </ul>
    {:else if tab === 'drill'}
      <p class="t-tiny t-soft t-lore">{L.form.drill.hint}</p>
      <ul class="stack plain" style:--gap="8px">
        {#each DRILLF as d, k (k)}
          {@const got = game.formStars?.[k] ?? 0}
          {@const res = drillRes[k]}
          <li>
            <Card tone="silk">
              <div class="stack" style:--gap="6px">
                <p class="row between">
                  <b class="t-small">{k + 1}. {L.form.drill.names[k]}</b>
                  <span class="t-gold t-num"
                    >{'★'.repeat((got & 1) + ((got >> 1) & 1) + ((got >> 2) & 1)).padEnd(3, '☆')}</span
                  >
                </p>
                <small class="t-tiny t-soft">{L.form.drill.lore[k]}</small>
                <ul class="stack plain" style:--gap="2px">
                  {#each L.form.drill.goals(Math.round(DRILLF_KEEP * 100), L.form.names[d.form]) as goal, i (i)}
                    <li class="t-tiny {got & (1 << i) ? 't-good' : 't-soft'}">{got & (1 << i) ? '✓' : '○'} {goal}</li>
                  {/each}
                </ul>
                <div class="row wrap" style:--gap="4px">
                  {#each [null, ...FORM_IDS] as f (f ?? 'none')}
                    <Button size="sm" variant={drillPick[k] === f ? 'gold' : 'ghost'} onclick={() => (drillPick[k] = f)}
                      >{f ? L.form.names[f] : L.form.drill.none}</Button
                    >
                  {/each}
                </div>
                <div class="row between">
                  <small class="t-tiny {res?.win ? 't-good' : 't-bad'}"
                    >{res ? L.form.drill.result(res.win, Math.round(res.left * 100)) : ''}</small
                  >
                  <Button variant="gold" icon="swords" disabled={locked} onclick={() => drill(k)}
                    >{L.form.drill.go}</Button
                  >
                </div>
              </div>
            </Card>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="t-tiny t-soft t-lore">{L.form.travelHint}</p>
      <Card tone="silk">
        <div class="stack" style:--gap="6px">
          <p class="row between t-small"><b>{L.form.ap(ap)}</b><span class="t-gold">{L.form.coin(coin)}</span></p>
          <small class="t-tiny t-soft"
            >{L.form.left(VANDU_DAILY - used, VANDU_DAILY)} · {L.form.bag(arms.length, ARM_BAG)}</small
          >
          {#if before}<small class="t-tiny t-good"
              >{L.form.got(Math.max(0, arms.length - before.arms), Math.max(0, coin - before.coin))}</small
            >{/if}
          {#if locked}<small class="t-tiny t-bad">{L.form.locked(VANDU_HALL)}</small>{/if}
          <div class="row wrap" style:--gap="6px">
            {#each [1, 5] as n (n)}
              <Button
                variant="gold"
                icon="globe"
                disabled={locked || used + n > VANDU_DAILY || ap < n * VANDU_AP || arms.length + n > ARM_BAG}
                onclick={() => gain({ type: 'vandu', n })}>{L.form.travel(n)}</Button
              >
            {/each}
          </div>
        </div>
      </Card>
      <b class="t-small">{L.form.shop}</b>
      {#each ARM_SHOP as it, k (k)}
        <div class="row between">
          <Tag tone={TONE[it.q]}>{L.form.chest(L.form.q[it.q])}</Tag>
          <Button
            size="sm"
            variant="gold"
            disabled={locked || coin < it.price || arms.length >= ARM_BAG}
            onclick={() => gain({ type: 'armBuy', k })}>{L.form.price(it.price)}</Button
          >
        </div>
      {/each}
    {/if}
  </div>
</Sheet>
