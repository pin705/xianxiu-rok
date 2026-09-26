<script lang="ts">
  // Án sơn son bày lễ vật: mỗi món một đồ vật vẽ tay (ui:<art>), số cần, dòng phụ (đang có). short: thiếu (số tô son).
  // Chi phí nâng cấp, tuyển quân, cung phụng… — không vẽ lại án trong từng màn.
  import { Icon, artOf, type IconName } from '@rok/art'

  type Gift = { key: string; art?: string; icon: IconName; n: string; sub?: string; short?: boolean }
  let { items }: { items: Gift[] } = $props()
</script>

<div class="altar">
  {#each items as it (it.key)}
    {@const src = it.art ? artOf(`ui:${it.art}`)?.src : undefined}
    <span class="gift" class:short={it.short}>
      {#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={it.icon} size={40} />{/if}
      <b class="t-num">{it.n}</b>
      {#if it.sub}<small class="t-num">{it.sub}</small>{/if}
    </span>
  {/each}
</div>

<style>
  .altar {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 18px;
    width: 100%;
    padding: 4px 20px 26px;
    background:
      linear-gradient(var(--gilt), var(--gilt)) left 8px bottom 18px / calc(100% - 16px) 2px no-repeat,
      var(--lacquer) left 0 bottom 10px / 100% 12px no-repeat;
  }
  .altar::before,
  .altar::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 12px;
    height: 12px;
    background: linear-gradient(var(--cinnabar), var(--wood-d));
    border-radius: 0 0 3px 3px;
  }
  .altar::before {
    left: 26px;
  }
  .altar::after {
    right: 26px;
  }
  .gift {
    display: grid;
    justify-items: center;
    min-width: 64px;
  }
  .gift img {
    width: 52px;
    height: 52px;
    filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.25));
  }
  .gift b {
    font-size: var(--fs-4);
    font-weight: 900;
  }
  .gift small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
  .short b {
    color: var(--cinnabar);
  }
</style>
