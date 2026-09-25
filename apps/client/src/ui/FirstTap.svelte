<script lang="ts">
  // Lần đầu (file 8 F2): mũi tên vàng chỉ vào nút chính của một bảng cho tới khi người chơi bấm nó lần đầu — nhớ theo máy
  // (rok.tip.<key>). Không làm tối màn, chỉ chỉ.
  import type { Snippet } from 'svelte'
  import Pointer from './Pointer.svelte'
  import { read, write } from '../storage'

  let { key, children }: { key: string; children: Snippet } = $props()
  let tapped = $state(false)
  const seen = $derived(tapped || read(`rok.tip.${key}`) === '1')
  const done = () => {
    if (seen) return
    tapped = true
    write(`rok.tip.${key}`, '1')
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (bắt lần bấm của nút con) -->
<span class="tap" onclickcapture={done}>
  {@render children()}
  {#if !seen}<span class="pin" aria-hidden="true"><Pointer /></span>{/if}
</span>

<style>
  .tap {
    position: relative;
    display: block;
  }
  /* mép phải nút: phía trên nút thường là chip chi phí (xếp từ trái) */
  .pin {
    position: absolute;
    right: 22px;
    top: -30px;
    pointer-events: none;
  }
</style>
