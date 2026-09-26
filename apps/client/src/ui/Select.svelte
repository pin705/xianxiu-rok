<script lang="ts" generics="T extends string">
  // Hàng chọn một mục trong bảng (như hàng Toggle): biểu tượng đầu dòng, ô chọn nền giấy gạch chân mực vẽ tay, kẻ chấm dưới.
  import { Icon, type IconName } from '@rok/art'

  let {
    icon,
    label,
    value,
    options,
    onchange,
  }: {
    icon?: IconName
    label: string
    value: T
    options: readonly { id: T; label: string }[]
    onchange: (id: T) => void
  } = $props()
</script>

<label class="select row">
  {#if icon}<Icon name={icon} size={20} />{/if}
  <select aria-label={label} {value} onchange={e => onchange(e.currentTarget.value as T)}>
    {#each options as o (o.id)}<option value={o.id}>{o.label}</option>{/each}
  </select>
</label>

<style>
  .select {
    min-height: 50px;
    padding: 0 var(--sp-1);
    background: var(--img-dots) left bottom / 12px 6px repeat-x;
  }
  select {
    flex: 1;
    min-height: 40px;
    padding: 0 10px 4px;
    font: inherit;
    font-weight: 700;
    color: inherit;
    background: transparent;
    border: 0 solid transparent;
    border-image: var(--sk-field);
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }
</style>
