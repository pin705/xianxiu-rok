<script lang="ts">
  // Hàng dấu lượt: mỗi lượt một biểu tượng son, lượt đã dùng mờ mực (lượt đấu hôm nay).
  import { Icon, type IconName } from '@rok/art'

  let { total, left, icon = 'swords' }: { total: number; left: number; icon?: IconName } = $props()
</script>

<span class="pips" aria-hidden="true"
  >{#each { length: Math.max(total, left) } as _, i (i)}<span class:used={i >= left}
      ><Icon name={icon} size={15} /></span
    >{/each}</span
>

<style>
  .pips {
    display: flex;
    gap: 1px;
    color: var(--cinnabar);
  }
  .used {
    opacity: 0.22;
    color: var(--text);
  }
</style>
