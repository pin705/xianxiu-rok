<script lang="ts" generics="T extends string">
  // Thẻ chuyển trong bảng: thẻ kẹp sách bằng giấy dựng trên mép trang (đường mực đôi); thẻ đang mở trắng hơn,
  // cao hơn, liền vào trang, đầu thẻ một vệt son và chấm ấn trước chữ.
  import { sfx } from '../lib'

  let { items, value, onchange }: { items: readonly { id: T; label: string }[]; value: T; onchange: (id: T) => void } =
    $props()
</script>

<div class="tabs" role="tablist">
  {#each items as it (it.id)}
    <button
      role="tab"
      aria-selected={it.id === value}
      class:on={it.id === value}
      onclick={() => {
        if (it.id === value) return
        sfx('tap')
        onchange(it.id)
      }}><span>{it.label}</span></button
    >
  {/each}
</div>

<style>
  .tabs {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    align-items: end;
    gap: 4px;
    margin-top: var(--sp-3);
    padding: 0 4px;
    /* mép trang: nét mực đậm, dưới là nét mảnh (khung đôi như thẻ) */
    background:
      linear-gradient(var(--rim, var(--ink3)), var(--rim, var(--ink3))) left calc(100% - 3px) / 100% 1.5px no-repeat,
      linear-gradient(var(--paper3), var(--paper3)) left bottom / 100% 1px no-repeat;
  }
  button {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 38px;
    margin-bottom: 4px;
    padding: 2px 6px 3px;
    overflow: hidden;
    font-size: var(--fs-2);
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 700;
    line-height: 1.15;
    color: var(--text-faint);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-bottom: 0;
    border-radius: 9px 9px 0 0 / 7px 7px 0 0;
    transition:
      color var(--dur-2) var(--ease),
      min-height var(--dur-2) var(--ease);
  }
  button:active:not(.on) {
    transform: translateY(1px);
  }
  .on {
    z-index: 1;
    min-height: 46px;
    margin-bottom: 2px;
    color: var(--text);
    background: var(--paper);
    border-color: var(--rim, var(--ink3));
    border-width: 1.5px;
    box-shadow: 0 -2px 6px rgb(0 0 0 / 0.08);
  }
  /* vệt son đầu thẻ + chân thẻ liền trang (che mép mực) */
  .on::before {
    content: '';
    position: absolute;
    inset: 3px 8px auto;
    height: 3px;
    border-radius: 2px;
    background: var(--cinnabar);
  }
  .on::after {
    content: '';
    position: absolute;
    inset: auto -1.5px -4px;
    height: 5px;
    background: var(--paper);
    border-inline: 1.5px solid var(--rim, var(--ink3));
  }
  .on span::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    margin: 0 5px 2px 0;
    vertical-align: middle;
    border-radius: 1px;
    background: var(--cinnabar);
    transform: rotate(45deg);
  }
</style>
