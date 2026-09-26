<script lang="ts">
  // Nút "?" tròn nhỏ viền son cạnh tiêu đề mục: mở lời giải thích tại chỗ (Cẩm nang theo ngữ cảnh).
  let { label, onclick }: { label: string; onclick: () => void } = $props()
</script>

<button type="button" class="help" aria-label={label} {onclick}>?</button>

<style>
  .help {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    font-weight: 800;
    font-size: var(--fs-2);
    color: var(--cinnabar);
    background: var(--paper);
    border: 1.5px solid currentColor;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(var(--shade) / 0.2);
  }
</style>
