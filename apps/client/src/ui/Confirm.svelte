<!-- Hỏi lại trước việc không quay lại được (luân hồi, rời tiên minh…): bấm nút mở (trigger) → hiện lời cảnh báo, Đóng / nút đỏ -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import { L } from '../lib'
  import Button from './Button.svelte'

  let {
    warn,
    label,
    disabled = false,
    onconfirm,
    trigger,
  }: {
    warn: string
    label: string
    disabled?: boolean
    onconfirm: () => void
    trigger: Snippet<[() => void]>
  } = $props()
  let sure = $state(false)
</script>

{#if sure}
  <p class="t-small t-bad t-strong">{warn}</p>
  <div class="grid">
    <Button variant="ghost" onclick={() => (sure = false)}>{L.panel.close}</Button>
    <Button
      variant="danger"
      {disabled}
      onclick={() => {
        sure = false
        onconfirm()
      }}>{label}</Button
    >
  </div>
{:else}
  {@render trigger(() => (sure = true))}
{/if}
