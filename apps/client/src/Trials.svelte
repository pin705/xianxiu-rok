<script lang="ts">
  // Thí Luyện (Campaign Hub của RoK): mọi chế độ PvE một chỗ — tiến độ của mình, điều kiện mở, nút Tới (mở đúng nơi chơi).
  // Mở từ cột phải bản đồ Vùng (social.trials); App đưa lối tới trung tâm sự kiện và trang Tiên minh
  import {
    BEASTS,
    DRILLF,
    DRILL_HALL,
    MYSTIC_HALL,
    PARTY_HALL,
    REALMS,
    TRIAL_GATES,
    VANDU_HALL,
    VC_HALL,
    VC_STAGES,
    dayOf,
    festOpen,
    trialNow,
  } from '@rok/rules'
  import { vcStars } from '@rok/rules/world'
  import { Icon, type IconName } from '@rok/art'
  import { Button, Card, Sheet } from './ui'
  import { L } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let { onfests, onally, ally }: { onfests: () => void; onally: () => void; ally: boolean } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const hall = $derived(game.levels.chuDien)
  const close = () => (social.trials = false)
  const floors = REALMS.reduce((n, r) => n + r.floors.length, 0)
  const bits = (x: number) => (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1)
  type Row = { k: keyof typeof L.trials.names; icon: IconName; text: string; lock: string; go: () => void }
  const rows = $derived<Row[]>([
    { k: 'beast', icon: 'skull', text: L.trials.beast(game.beast, BEASTS.length), lock: '', go: close },
    {
      k: 'realm',
      icon: 'globe',
      text: L.trials.realm(
        game.realms.reduce((a, b) => a + b, 0),
        floors,
      ),
      lock: hall < REALMS[0].hall ? L.trials.locked(REALMS[0].hall) : '',
      go: close,
    },
    { k: 'tower', icon: 'rank', text: L.trials.tower(game.tower), lock: '', go: close },
    {
      k: 'drill',
      icon: 'swords',
      text: game.drill?.day === dayOf(g.now) ? L.trials.drillToday(game.drill.wins) : L.trials.drillNone,
      lock: hall < DRILL_HALL ? L.trials.locked(DRILL_HALL) : '',
      go: () => {
        close()
        social.drill = true
      },
    },
    {
      k: 'trial',
      icon: 'bolt',
      text: festOpen(game, 'yeuHoang', g.now)
        ? L.trials.trialOpen(trialNow(game)?.gate ?? 0, TRIAL_GATES)
        : L.trials.trialShut,
      lock: '',
      go: () => {
        close()
        onfests()
      },
    },
    {
      k: 'form',
      icon: 'flag',
      text: L.trials.form(
        (game.formStars ?? []).reduce((n, x) => n + bits(x), 0),
        DRILLF.length * 3,
      ),
      lock: hall < VANDU_HALL ? L.trials.locked(VANDU_HALL) : '',
      go: () => {
        close()
        social.form = true
      },
    },
    {
      k: 'mystic',
      icon: 'people',
      text: L.trials.mystic(game.mystic?.win ?? 0),
      lock: hall < MYSTIC_HALL ? L.trials.locked(MYSTIC_HALL) : '',
      go: () => {
        close()
        social.arena = true
      },
    },
    {
      k: 'campaign',
      icon: 'star',
      text: L.trials.campaign(vcStars(game), VC_STAGES * 3),
      lock: hall < VC_HALL ? L.trials.locked(VC_HALL) : '',
      go: () => {
        close()
        social.campaign = true
      },
    },
    {
      k: 'party',
      icon: 'shield',
      text: game.partyDay === dayOf(g.now) ? L.trials.partyDone : L.trials.partyReady,
      lock: hall < PARTY_HALL ? L.trials.locked(PARTY_HALL) : ally ? '' : L.trials.noAlly,
      go: () => {
        close()
        onally()
      },
    },
  ])
</script>

<Sheet open={social.trials} onclose={close} title={L.trials.title}>
  <p class="t-small t-soft">{L.trials.hint}</p>
  <ul class="stack plain mt-2" style:--gap="6px">
    {#each rows as r (r.k)}
      <li>
        <Card tone="silk">
          <div class="row between">
            <span class="row" style:--gap="8px">
              <Icon name={r.icon} size={28} />
              <span class="stack" style:--gap="2px">
                <b class="t-small">{L.trials.names[r.k]}</b>
                <small class="t-tiny t-soft">{r.text}</small>
                {#if r.lock}<small class="t-tiny t-bad">{r.lock}</small>{/if}
              </span>
            </span>
            <Button size="sm" variant="ghost" disabled={!!r.lock} onclick={r.go}>{L.trials.go}</Button>
          </div>
        </Card>
      </li>
    {/each}
  </ul>
</Sheet>
