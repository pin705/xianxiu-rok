<script lang="ts">
  // Danh sách việc đang chạy (xây, tuyển, luyện đan, hành quân…) và nhà đang rảnh. Desktop: sổ dọc có tiêu đề trong cột
  // trái; điện thoại: dải chip biểu tượng + đồng hồ, chip rảnh viền son nhấp nhô (ink: ẩn — cảnh đã có dấu trên từng nhà).
  import { Icon, type IconName } from '@rok/art'

  type RunItem = {
    key: string
    icon: IconName
    text: string
    time: string // đồng hồ còn lại, hoặc chữ "Rảnh"
    idle?: boolean
    label: string
    go: (e: MouseEvent) => void
  }
  let { title, empty, items, ink = false }: { title: string; empty: string; items: RunItem[]; ink?: boolean } = $props()
</script>

<section class="runs" class:ink aria-label={title}>
  <h3>{title}</h3>
  {#each items as r (r.key)}
    <button class="run" class:idle={r.idle} onclick={r.go} aria-label={r.label}
      ><Icon name={r.icon} size={16} /><span class="grow t-ellipsis">{r.text}</span><b class="t-num">{r.time}</b
      ></button
    >
  {:else}
    <p class="t-small">{empty}</p>
  {/each}
</section>

<style>
  .runs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 100%;
  }
  h3,
  .runs > p {
    display: none;
  }
  .run {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px 3px 6px;
    font-size: var(--fs-2);
    color: var(--text);
    pointer-events: auto;
    background: color-mix(in srgb, var(--paper2) 90%, transparent);
    border: 1px solid var(--paper3);
    border-radius: 999px;
    box-shadow: 0 1px 3px rgb(var(--shade) / 0.18);
  }
  .run span {
    display: none;
  }
  .run b {
    color: var(--gold-d);
  }
  .run.idle {
    border-color: var(--cinnabar);
    animation: nudge 1.8s var(--ease) infinite;
  }
  .run.idle b {
    color: var(--cinnabar);
  }
  /* màn hẹp: nhà rảnh chỉ còn icon viền son (chữ "Rảnh" nằm trong aria-label) — ba viên cùng ghi "Rảnh" đè lên cảnh, rối mắt */
  @media (max-width: 1023px), (max-height: 599px) {
    .run.idle {
      padding: 4px 7px;
    }
    .run.idle b {
      display: none;
    }
    .ink {
      display: none;
    }
  }
  @keyframes nudge {
    0%,
    70%,
    100% {
      transform: none;
    }
    80% {
      transform: translateY(-2px);
    }
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .runs {
      display: grid;
      gap: 2px;
      margin-top: var(--sp-3);
      color: var(--text-soft);
    }
    .run {
      display: flex;
      gap: var(--sp-2);
      min-width: 0;
      padding: 7px var(--sp-2);
      text-align: left;
      background: none;
      border: 0;
      border-radius: 8px;
      box-shadow: none;
    }
    .run span {
      display: block;
    }
    .run:hover {
      background: color-mix(in srgb, var(--azurite-l) 18%, transparent);
    }
  }
</style>
