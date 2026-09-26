<script lang="ts">
  // Số liệu chính của bảng (thế lực…): tranh đồ vật vẽ tay (ui:<art>, lùi về icon), nhãn nhỏ trên số rất to, gạch son dưới.
  import type { IconName } from '@rok/art'
  import Art from './Art.svelte'

  let { art, icon, label, value }: { art: string; icon: IconName; label: string; value: string | number } = $props()
</script>

<div class="big-stat">
  <span class="pic"><Art {art} {icon} size={54} /></span>
  <span class="stack" style:--gap="0"><small>{label}</small><b class="t-num">{value}</b></span>
</div>

<style>
  .big-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 12px 4px 4px;
    border-bottom: 2px solid var(--cinnabar);
  }
  .pic {
    display: grid;
    margin: -6px 0;
  }
  small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  b {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
</style>
