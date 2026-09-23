<script lang="ts">
  // Bảng trượt từ dưới lên, dùng <dialog> gốc: có sẵn bẫy focus, Esc để đóng, lớp trên cùng.
  import type { Snippet } from 'svelte'

  let { open, onclose, label, cls = '', children }: { open: boolean; onclose: () => void; label: string; cls?: string; children: Snippet } =
    $props()

  let dlg = $state<HTMLDialogElement>()
  $effect(() => {
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  })
</script>

<dialog bind:this={dlg} class="sheet {cls}" aria-label={label} {onclose} onclick={e => e.target === dlg && dlg?.close()}>
  {#if open}{@render children()}{/if}
</dialog>
