<script lang="ts">
  // Ẩn Sĩ Động Phủ (Bastions của RoK) trong bảng Công Huân mùa: năm ẩn sĩ — cấp hảo cảm, tâm pháp truyền khi tột cấp, việc vặt đang nhờ
  // (nhận / tiến độ / nộp), số lần nộp còn hôm nay
  import {
    HERMITS,
    HERMIT_DAILY,
    HERMIT_FAVOR,
    HERMIT_HALL,
    HERMIT_IDS,
    HERMIT_TASKS,
    hermitDone,
    hermitLeft,
    hermitLv,
    hermitTask,
    type Bonus,
    type HermitId,
  } from '@rok/rules'
  import { Icon, type IconName } from '@rok/art'
  import { Button, Card, Meter, Section, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  const ICON: Record<HermitId, IconName> = {
    thanhHu: 'swords',
    lacHa: 'bolt',
    thietSon: 'shield',
    vanDu: 'globe',
    duocVuong: 'heal',
  }
  const TOP = HERMIT_FAVOR.length + 1
  const g = useGame()
  const game = $derived(g.game)
  const open = $derived(game.seasonAt !== undefined && game.levels.chuDien >= HERMIT_HALL)
  const fx = (h: HermitId) =>
    Object.entries(HERMITS[h])
      .map(([k, v]) => L.bonus(k as Bonus, v))
      .join(' · ')
</script>

<Section title={L.hermit.title}>
  <p class="t-tiny t-soft">{L.hermit.hint(HERMIT_DAILY)}</p>
  {#if open}<small class="t-tiny t-gold">{L.hermit.left(hermitLeft(game), HERMIT_DAILY)}</small>{:else}<small
      class="t-tiny t-bad">{L.hermit.locked(HERMIT_HALL)}</small
    >{/if}
  <ul class="stack plain" style:--gap="6px">
    {#each HERMIT_IDS as h (h)}
      {@const lv = hermitLv(game, h)}
      {@const job = game.hermit?.jobs[h]}
      {@const task = HERMIT_TASKS[job ? job.t : hermitTask(game, h)]}
      {@const done = hermitDone(game, h)}
      <li>
        <Card>
          <div class="stack" style:--gap="4px">
            <div class="row between">
              <span class="row" style:--gap="6px"
                ><Icon name={ICON[h]} size={26} /><b class="t-small">{L.hermit.names[h]}</b></span
              >
              <Tag tone={lv >= TOP ? 'gold' : 'plain'} size="sm">{L.hermit.lv(lv, TOP)}</Tag>
            </div>
            <small class="t-tiny {lv >= TOP ? 't-good' : 't-soft'}">{lv >= TOP ? L.hermit.taught : ''} {fx(h)}</small>
            {#if lv < TOP}
              <div class="row between">
                <small class="t-tiny">{L.hermit.tasks[task.m](num(task.n))}</small>
                {#if job}
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={done < task.n || hermitLeft(game) <= 0}
                    onclick={() => g.act({ type: 'hermitHand', h }, 'reward')}>{L.hermit.hand}</Button
                  >
                {:else}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!open}
                    onclick={() => g.act({ type: 'hermitTake', h }, 'tap')}>{L.hermit.take}</Button
                  >
                {/if}
              </div>
              {#if job}<Meter
                  value={Math.min(1, done / task.n)}
                  tone="gold"
                  size="sm"
                  label="{num(Math.min(done, task.n))} / {num(task.n)}"
                />{/if}
            {/if}
          </div>
        </Card>
      </li>
    {/each}
  </ul>
</Section>
