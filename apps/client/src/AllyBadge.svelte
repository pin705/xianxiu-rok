<script lang="ts">
  // Cờ minh (flag của RoK): trưởng lão / minh chủ chọn linh thú và màu đĩa cho huy hiệu minh — hiện trên cờ sảnh minh và bảng
  // tiên minh của cả giới. Xem trước trên lá cờ, chọn xong thì lưu (lệnh allyBadge).
  import type { AllyInfo, WorldAction } from '@rok/rules/world'
  import { BADGE_EMBLEMS, BADGE_TONES, Button, Medal, Pennant, Sheet } from './ui'
  import { L } from './lib'

  let {
    open,
    onclose,
    ally,
    go,
  }: {
    open: boolean
    onclose: () => void
    ally: AllyInfo
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
  } = $props()
  let pick = $state<[number, number] | null>(null) // null: đang là cờ hiện tại
  const cur = $derived<[number, number]>(pick ?? ally.badge ?? [0, 0])
  async function save() {
    if (await go({ type: 'allyBadge', e: cur[0], c: cur[1] }, 'reward')) {
      pick = null
      onclose()
    }
  }
</script>

<Sheet {open} {onclose} center title={L.guild.badge}>
  <div class="row center mb-2"><Pennant tag={ally.tag} badge={cur} /></div>
  <small class="t-tiny t-soft">{L.guild.badgeBeast}</small>
  <div class="grid" style:--cols="5" style:--gap="4px">
    {#each BADGE_EMBLEMS as em, k (em)}
      <Button size="sm" variant={cur[0] === k ? 'gold' : 'quiet'} onclick={() => (pick = [k, cur[1]])}
        ><Medal emblem={em} tone={BADGE_TONES[cur[1]]} size={34} /></Button
      >
    {/each}
  </div>
  <small class="t-tiny t-soft mt-2">{L.guild.badgeTone}</small>
  <div class="grid" style:--cols="4" style:--gap="4px">
    {#each BADGE_TONES as tn, k (tn)}
      <Button size="sm" variant={cur[1] === k ? 'gold' : 'quiet'} onclick={() => (pick = [cur[0], k])}
        ><Medal emblem={BADGE_EMBLEMS[cur[0]]} tone={tn} size={30} /></Button
      >
    {/each}
  </div>
  <div class="mt-3"><Button variant="gold" wide icon="flag" onclick={save}>{L.guild.badgeSave}</Button></div>
</Sheet>
