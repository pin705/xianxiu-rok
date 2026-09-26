<script lang="ts">
  // Án sơn son bày lễ vật: mỗi món một đồ vật vẽ tay (ui:<art>), số cần, dòng phụ (đang có). short: thiếu (số tô son).
  // Chi phí nâng cấp, tuyển quân, cung phụng… — không vẽ lại án trong từng màn.
  // onpick: lễ vật thành nút (chạm để dâng — cung phụng đại trận); label/disabled theo từng món.
  import { Icon, artOf, type IconName } from '@rok/art'

  type Gift = {
    key: string
    art?: string
    icon: IconName
    n: string
    sub?: string
    short?: boolean
    label?: string
    disabled?: boolean
  }
  let { items, onpick }: { items: Gift[]; onpick?: (key: string) => void } = $props()
</script>

{#snippet face(it: Gift)}
  {@const src = it.art ? artOf(`ui:${it.art}`)?.src : undefined}
  {#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={it.icon} size={40} />{/if}
  <b class="t-num">{it.n}</b>
  {#if it.sub}<small class="t-num">{it.sub}</small>{/if}
{/snippet}

<div class="altar">
  {#each items as it (it.key)}
    {#if onpick}
      <button
        type="button"
        class="gift pick"
        class:short={it.short}
        disabled={it.disabled}
        aria-label={it.label}
        onclick={() => onpick(it.key)}>{@render face(it)}</button
      >
    {:else}
      <span class="gift" class:short={it.short}>{@render face(it)}</span>
    {/if}
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
      var(--altar-top) left 0 bottom 10px / 100% 12px no-repeat;
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
  .pick {
    padding: 2px 4px 0;
    border-radius: 8px;
    transition: transform var(--dur-1) var(--ease);
  }
  .pick:not(:disabled):active {
    transform: translateY(2px) scale(0.94);
  }
  .pick:not(:disabled):hover {
    background: rgb(255 255 255 / 0.5);
  }
  .pick:disabled {
    filter: grayscale(0.7);
    opacity: 0.6;
  }
  .short b {
    color: var(--cinnabar);
  }
</style>
