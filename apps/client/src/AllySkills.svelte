<script lang="ts">
  // Minh trận thần thông (Alliance Skills của RoK): trưởng lão / minh chủ bật bằng Minh khố — cả minh có tăng ích vài giờ; đang bật
  // thì hiện giờ còn, hết hiệu lực thì chờ hồi mới bật lại được
  import { ALLY_SKILL_COOL, ALLY_SKILL_IDS, ALLY_SKILLS, type AllySkillId, type Bonus } from '@rok/rules'
  import type { AllyInfo, WorldAction } from '@rok/rules/world'
  import { Icon, type IconName } from '@rok/art'
  import { Button, Section } from './ui'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let {
    ally,
    officer,
    go,
  }: {
    ally: AllyInfo
    officer: boolean
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
  } = $props()
  const g = useGame()
  const ICON: Record<AllySkillId, IconName> = {
    tuLinh: 'tuLinh',
    loBan: 'loBan',
    luyenBinh: 'luyenBinh',
    thanHanh: 'thanHanh',
    kiemTran: 'chienY',
    hoSon: 'kimCuong',
  }
  const fund = $derived(ally.fund ?? 0)
</script>

<Section title={L.askill.title}>
  {#snippet aside()}<small class="t-tiny t-soft">{L.guild.fund}</small> <b class="t-num">{num(fund)}</b>{/snippet}
  <p class="t-tiny t-soft">{L.askill.hint(ALLY_SKILL_COOL / 3_600_000)}</p>
  <!-- sổ thần thông: mỗi trận một dòng kẻ mực đứt (đĩa hình, tên, tăng ích · giờ); đang bật: dòng tô son + giờ còn -->
  <ul class="skills">
    {#each ALLY_SKILL_IDS as id (id)}
      {@const d = ALLY_SKILLS[id]}
      {@const until = ally.skills?.[id] ?? 0}
      {@const on = until > g.now}
      {@const cool = until + ALLY_SKILL_COOL - g.now}
      <li class="row" class:on>
        <span class="disc"><Icon name={ICON[id]} size={26} /></span>
        <span class="grow stack" style:--gap="1px"
          ><b class="t-small">{L.askill.names[id]}</b><small class="t-tiny t-soft"
            >{L.bonus(d.key as Bonus, d.v)} · {L.askill.hours(d.hours)}</small
          ></span
        >
        {#if on}<small class="t-tiny t-good">{L.askill.on(clock(until - g.now))}</small>
        {:else if cool > 0}<small class="t-tiny t-soft">{L.askill.cool(clock(cool))}</small>
        {:else if officer}<Button
            size="sm"
            variant="gold"
            disabled={fund < d.cost}
            onclick={() => go({ type: 'allySkill', id }, 'reward')}>{L.askill.use(num(d.cost))}</Button
          >
        {:else}<small class="t-tiny t-soft">{L.askill.cost(num(d.cost))}</small>{/if}
      </li>
    {/each}
  </ul>
</Section>

<style>
  .skills li {
    padding: 6px 2px;
    border-bottom: 1px dashed var(--paper3);
  }
  .skills li.on {
    background: color-mix(in srgb, var(--malachite) 10%, transparent);
  }
  .disc {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    background: var(--img-disc-paper) center / 100% 100% no-repeat;
  }
</style>
