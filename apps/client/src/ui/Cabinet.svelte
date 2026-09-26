<script lang="ts">
  // Tủ hàng gỗ (quầy Hương Hỏa Các, kệ chợ): vách gỗ hai bên, ván đầu tủ, lòng giấy sáng; mỗi món là một <li> (tự xếp, ô
  // tối thiểu `min` px) — trong <li>, phần tử `.cab-pic` là chỗ đặt hình, có ván kệ dưới chân (các ô cạnh nhau liền một tấm),
  // bên dưới là tên, lượt còn, nút giá. li.span-all: dòng chữ trải cả tủ (kệ trống).
  import type { Snippet } from 'svelte'

  let { min = 96, children }: { min?: number; children: Snippet } = $props()
</script>

<ul class="cabinet" style:--min="{min}px">{@render children()}</ul>

<style>
  .cabinet {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
    gap: 14px 0;
    padding: 6px 8px 12px;
    list-style: none;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--ochre) 45%, var(--lacquer2)), var(--lacquer2)) left top / 8px 100%
        no-repeat,
      linear-gradient(90deg, var(--lacquer2), color-mix(in srgb, var(--ochre) 45%, var(--lacquer2))) right top / 8px
        100% no-repeat,
      linear-gradient(var(--silk), color-mix(in srgb, var(--paper2) 45%, var(--silk)));
    border-top: 8px solid color-mix(in srgb, var(--ochre) 45%, var(--lacquer2));
    border-radius: 4px 4px 0 0;
    box-shadow: 0 4px 10px rgb(var(--shade) / 0.18);
  }
  .cabinet > :global(li) {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 3px;
    min-width: 0;
    padding: 0 5px;
    text-align: center;
  }
  .cabinet > :global(li.span-all) {
    padding: 12px;
  }
  /* ván kệ dưới món hàng */
  .cabinet :global(.cab-pic) {
    position: relative;
    display: grid;
    justify-items: center;
    width: calc(100% + 10px);
    padding: 4px 0 12px;
    background: linear-gradient(
        transparent calc(100% - 12px),
        var(--ochre) calc(100% - 12px),
        var(--lacquer2) calc(100% - 3px),
        rgb(var(--shade) / 0.14) calc(100% - 3px)
      )
      no-repeat;
  }
</style>
