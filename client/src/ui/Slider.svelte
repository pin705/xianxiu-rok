<script lang="ts">
  // Thanh kéo: rãnh mực, phần đã chọn màu lam khoáng, núm là đồng xu vàng.
  let { value, min = 0, max, label, onchange }: { value: number; min?: number; max: number; label: string; onchange: (n: number) => void } = $props()
</script>

<input
  class="slider"
  type="range"
  {min}
  {max}
  {value}
  aria-label={label}
  style:--p="{max > min ? ((value - min) / (max - min)) * 100 : 0}%"
  oninput={e => onchange(+e.currentTarget.value)}
/>

<style>
  .slider {
    width: 100%;
    height: 28px;
    margin: 0;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }
  .slider::-webkit-slider-runnable-track {
    height: 6px;
    background: linear-gradient(90deg, var(--azurite) var(--p), color-mix(in srgb, var(--ink) 22%, transparent) var(--p));
    border-radius: 3px;
    box-shadow: inset 0 1px 1.5px rgb(0 0 0 / 0.35);
  }
  .slider::-moz-range-track {
    height: 6px;
    background: linear-gradient(90deg, var(--azurite) var(--p), color-mix(in srgb, var(--ink) 22%, transparent) var(--p));
    border-radius: 3px;
  }
  .slider::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
    margin-top: -9px;
    background: radial-gradient(circle at 40% 35%, var(--gold-l), var(--gold) 55%, var(--gold-d));
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px var(--ink2), inset 0 0 0 4px rgb(0 0 0 / 0.12), var(--shadow-1);
    appearance: none;
    -webkit-appearance: none;
  }
  .slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    background: radial-gradient(circle at 40% 35%, var(--gold-l), var(--gold) 55%, var(--gold-d));
    border: 1.5px solid var(--ink2);
    border-radius: 50%;
  }
</style>
