<script lang="ts" generics="T extends string">
  // Cột thẻ tranh dọc (trung tâm sự kiện, các bảng nhiều mục): thanh gỗ dọc, mỗi mục một tranh + nhãn giấy,
  // mục đang mở phóng to, nhãn tô son. Dính đầu khi cuộn, cuộn riêng. Đặt trong .split (cột trái) cạnh nội dung.
  import { Icon, artOf, type IconName } from '@rok/art'
  import { sfx } from '../lib'
  import Badge from './Badge.svelte'

  type Item = { id: T; label: string; art?: string; icon: IconName; n?: number }
  let { items, value, onchange }: { items: readonly Item[]; value: T | null; onchange: (id: T) => void } = $props()
</script>

<div class="rail" role="tablist">
  {#each items as it (it.id)}
    {@const src = it.art ? artOf(`ui:${it.art}`)?.src : undefined}
    <button
      role="tab"
      class="tag"
      class:on={it.id === value}
      aria-selected={it.id === value}
      onclick={() => {
        if (it.id === value) return
        sfx('tap')
        onchange(it.id)
      }}
    >
      <span class="pic"
        >{#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={it.icon} size={30} />{/if}</span
      >
      <span class="tn">{it.label}</span>
      <Badge n={it.n ?? 0} />
    </button>
  {/each}
</div>

<style>
  .rail {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    align-content: start;
    gap: 10px;
    width: 74px;
    max-height: min(68dvh, 620px);
    padding: 4px 2px 12px;
    overflow-y: auto;
    scrollbar-width: none;
    background: linear-gradient(90deg, transparent 33px, var(--wood) 33px, var(--wood-d) 39px, transparent 39px);
  }
  .tag {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
    color: var(--text-soft);
  }
  .pic {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    filter: saturate(0.75) drop-shadow(0 2px 3px rgb(0 0 0 / 0.2));
    transition:
      transform var(--dur-2) var(--spring),
      filter var(--dur-2) var(--ease);
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .tag :global(.badge) {
    top: -3px;
    right: 1px;
  }
  .tn {
    display: -webkit-box;
    max-width: 74px;
    padding: 1px 4px 2px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    background: var(--paper);
    border-radius: 4px;
  }
  .on .pic {
    transform: scale(1.08) rotate(-2deg);
    filter: drop-shadow(0 3px 6px rgb(0 0 0 / 0.3));
  }
  .on .tn {
    color: var(--pill-fg);
    background: var(--cinnabar);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
  }
  .tag:active .pic {
    transform: scale(0.94);
  }
</style>
