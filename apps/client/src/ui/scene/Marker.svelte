<script lang="ts">
  // Dấu cắm trên bản đồ giới, đáy ở điểm (x, y px): cờ + lời ghi, bấm được. tone red: dấu của minh (nền son viền vàng) ·
  // gold: ghi nhớ của mình (nền vàng chữ mực).
  import { Icon, type IconName } from '@rok/art'

  let {
    x,
    y,
    icon,
    text,
    tone = 'red',
    onclick,
  }: { x: number; y: number; icon: IconName; text: string; tone?: 'red' | 'gold'; onclick: () => void } = $props()
</script>

<button class="marker {tone}" style:left="{x}px" style:top="{y}px" {onclick}
  ><Icon name={icon} size={tone === 'gold' ? 14 : 16} /><span>{text}</span></button
>

<style>
  .marker {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 1px 6px 1px 2px;
    font: inherit;
    font-size: var(--fs-1);
    font-weight: 700;
    color: var(--silk);
    white-space: nowrap;
    background: color-mix(in srgb, var(--cinnabar) 82%, var(--ink));
    border: 1px solid var(--gold-l);
    border-radius: 8px;
    translate: -50% -100%;
    pointer-events: auto;
    cursor: pointer;
  }
  .gold {
    color: var(--text);
    background: color-mix(in srgb, var(--gold-l) 90%, transparent);
    border-color: var(--gold-d);
  }
</style>
