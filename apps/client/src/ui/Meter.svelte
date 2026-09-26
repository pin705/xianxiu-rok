<script lang="ts">
  // Thanh tiến độ: rãnh mực vẽ tay, nét bút màu khoáng chạy dài, đầu nét khô tước sợi. value 0..1
  // marks: hạt mốc trên thanh (at 0..1; tới mốc thì hạt son) — mốc quà điểm minh, mốc sự kiện.
  let {
    value,
    tone = 'spirit',
    size = 'md',
    label,
    marks = [],
  }: {
    value: number
    tone?: 'spirit' | 'gold' | 'good' | 'bad' | 'azure'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    label?: string
    marks?: readonly { at: number; label?: string }[]
  } = $props()
  const v = $derived(Math.max(0, Math.min(1, value)))
</script>

<span
  class="meter {tone} {size}"
  role={label ? 'progressbar' : undefined}
  aria-label={label}
  aria-valuenow={label ? Math.round(v * 100) : undefined}
>
  {#if v > 0}<i style:width="max(calc(var(--h) * 1.6), {v * 100}%)"></i>{/if}
  {#each marks as m, k (k)}<b class="bead" class:hit={v >= m.at} style:left="{m.at * 100}%" title={m.label}></b>{/each}
</span>

<style>
  .meter {
    --h: 9px;
    --fill: var(--sk-fill);
    position: relative;
    display: block;
    height: var(--h);
    border: 0 solid transparent;
    border-image: var(--sk-track);
  }
  .meter i {
    position: absolute;
    inset: 0 auto 0 0;
    border: 0 solid transparent;
    border-image: var(--fill);
    transition: width 0.3s var(--ease);
  }
  .bead {
    position: absolute;
    top: 50%;
    width: 13px;
    height: 13px;
    translate: -50% -50%;
    background: var(--paper);
    border: 2px solid var(--rim, var(--ink3));
    border-radius: 50%;
  }
  .bead.hit {
    background: var(--cinnabar);
    border-color: var(--paper);
    box-shadow: 0 0 0 2px var(--cinnabar);
  }
  .xs {
    --h: 4px;
  }
  .sm {
    --h: 6px;
  }
  .lg {
    --h: 12px;
  }
  .gold {
    --fill: var(--sk-fill-gold);
  }
  .good {
    --fill: var(--sk-fill-good);
  }
  .bad {
    --fill: var(--sk-fill-bad);
  }
  .azure {
    --fill: var(--sk-fill-azure);
  }
</style>
