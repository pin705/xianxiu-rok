<script lang="ts">
  // Mũi tên nét mực vẽ tay: "bây giờ → sau khi nâng", "đổi đi → nhận về".
  let { width = 52 }: { width?: number } = $props()
</script>

<svg class="arrow" viewBox="0 0 60 24" style:width="{width}px" aria-hidden="true"
  ><path d="M4 14 C 18 4, 30 22, 46 11" /><path d="M40 5 L 52 10 L 42 18" /></svg
>

<style>
  .arrow {
    flex: none;
    fill: none;
    stroke: var(--text);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
