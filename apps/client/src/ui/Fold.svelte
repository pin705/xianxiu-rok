<script lang="ts">
  // Mục gập trong bảng (cẩm nang, hỏi đáp): chạm tiêu đề mở lời bên dưới, mũi tên son xoay; các mục ngăn bằng kẻ chấm.
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'

  let { title, children }: { title: string; children: Snippet } = $props()
</script>

<details class="fold">
  <summary class="row t-strong"><span class="chev"><Icon name="arrow" size={14} /></span>{title}</summary>
  <div class="body">{@render children()}</div>
</details>

<style>
  .fold {
    padding: 8px 2px;
    background: var(--img-dots) left bottom / 12px 6px repeat-x;
  }
  .fold:last-child {
    background: none;
  }
  .body {
    padding: 6px 0 2px 20px;
  }
  summary {
    --gap: 6px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .chev {
    display: grid;
    color: var(--cinnabar);
    transition: rotate var(--dur-2) var(--ease);
  }
  details[open] .chev {
    rotate: 90deg;
  }
</style>
