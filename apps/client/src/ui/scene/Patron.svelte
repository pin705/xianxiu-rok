<script lang="ts">
  // Thẻ nhân vật tô màu nhấn (--accent): tranh nửa người trong khung + huy hiệu góc (badge), tên + nhãn lối chơi (way),
  // các chỉ số (chips), chú thích (note); cả thẻ bấm được, "Đổi ›" (swap) góc trên phải — đạo thống đã chọn.
  import type { Snippet } from 'svelte'

  let {
    accent,
    img,
    name,
    way,
    chips,
    swap,
    label,
    badge,
    note,
    onclick,
  }: {
    accent: string
    img: string
    name: string
    way: string
    chips: readonly string[]
    swap: string
    label: string
    badge: Snippet
    note?: Snippet
    onclick: () => void
  } = $props()
</script>

<button type="button" class="patron" style:--accent={accent} {onclick} aria-label={label}>
  <span class="face">
    <img src={img} alt="" draggable="false" />
    <span class="badge">{@render badge()}</span>
  </span>
  <span class="info">
    <span class="head"><b>{name}</b><span class="way">{way}</span></span>
    <span class="chips"
      >{#each chips as f (f)}<i>{f}</i>{/each}</span
    >
    {#if note}{@render note()}{/if}
  </span>
  <span class="swap t-tiny">{swap}</span>
</button>

<style>
  .patron {
    position: relative;
    display: flex;
    align-items: stretch;
    gap: var(--sp-2);
    width: 100%;
    padding: 6px 10px 6px 6px;
    text-align: left;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    border-radius: 12px;
  }
  /* nửa người trong khung, huy hiệu ở góc */
  .face {
    position: relative;
    flex: none;
    width: 72px;
    height: 88px;
    overflow: hidden;
    border-radius: 8px;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 40%, transparent), transparent) center
      30% / 130% 100% no-repeat;
  }
  .face img {
    position: absolute;
    top: -2px;
    left: -30%;
    width: 160%;
  }
  .badge {
    position: absolute;
    right: -2px;
    bottom: -2px;
  }
  .info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    min-width: 0;
  }
  .head {
    padding-right: 44px; /* chừa chỗ "Đổi ›" */
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
  }
  .way {
    padding: 1px 8px 2px;
    font-size: var(--fs-1, 12px);
    font-weight: 700;
    color: var(--silk);
    background: var(--accent);
    border-radius: 999px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .chips i {
    padding: 1px 6px;
    font-size: var(--fs-1, 12px);
    font-style: normal;
    font-weight: 700;
    border-radius: 5px;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
  }
  .swap {
    position: absolute;
    top: 6px;
    right: 10px;
    font-weight: 700;
    opacity: 0.7;
  }
</style>
