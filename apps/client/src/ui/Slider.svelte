<script lang="ts">
  // Thanh kéo: rãnh mực vẽ tay, phần đã chọn là nét lam khoáng, núm là đĩa vàng vòng mực.
  let {
    value,
    min = 0,
    max,
    label,
    onchange,
  }: { value: number; min?: number; max: number; label: string; onchange: (n: number) => void } = $props()
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
    height: 30px;
    margin: 0;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }
  .slider::-webkit-slider-runnable-track {
    height: 10px;
    background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--azurite) 85%, transparent) var(--p),
        transparent var(--p)
      )
      3px 2px / calc(100% - 6px) 6px no-repeat;
    border: 0 solid transparent;
    border-image: var(--sk-track);
  }
  .slider::-moz-range-track {
    height: 10px;
    background: linear-gradient(
      90deg,
      var(--azurite) var(--p),
      color-mix(in srgb, var(--ivory) 18%, transparent) var(--p)
    );
    border-radius: 5px;
  }
  .slider::-webkit-slider-thumb {
    width: 26px;
    height: 26px;
    margin-top: -8px;
    background: var(--img-disc-gold) center / 100% 100% no-repeat;
    border: 0;
    appearance: none;
    -webkit-appearance: none;
  }
  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--img-disc-gold) center / 100% 100% no-repeat;
    border: 0;
  }
</style>
