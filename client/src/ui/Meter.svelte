<script lang="ts">
  // Thanh tiến độ: rãnh mực lõm, dải màu khoáng đầu vát. value 0..1
  let { value, tone = 'spirit', size = 'md', label }: { value: number; tone?: 'spirit' | 'gold' | 'good' | 'bad' | 'azure'; size?: 'xs' | 'sm' | 'md' | 'lg'; label?: string } =
    $props()
</script>

<span class="meter {tone} {size}" role={label ? 'progressbar' : undefined} aria-label={label} aria-valuenow={label ? Math.round(value * 100) : undefined}>
  <i style:width="{Math.max(0, Math.min(1, value)) * 100}%"></i>
</span>

<style>
  .meter {
    --h: 7px;
    --c: var(--spirit);
    display: block;
    height: var(--h);
    overflow: hidden;
    background: color-mix(in srgb, var(--ink) 22%, transparent);
    box-shadow: inset 0 1px 1.5px rgb(0 0 0 / 0.35);
    clip-path: polygon(2px 0, calc(100% - 2px) 0, 100% 50%, calc(100% - 2px) 100%, 2px 100%, 0 50%);
  }
  .meter i {
    display: block;
    height: 100%;
    background: linear-gradient(rgb(255 255 255 / 0.35), transparent 60%), var(--c);
    transition: width 0.3s var(--ease);
  }
  .xs {
    --h: 3px;
  }
  .sm {
    --h: 5px;
  }
  .lg {
    --h: 10px;
  }
  .gold {
    --c: var(--gold);
  }
  .good {
    --c: var(--malachite);
  }
  .bad {
    --c: var(--cinnabar);
  }
  .azure {
    --c: var(--azurite-l);
  }
</style>
