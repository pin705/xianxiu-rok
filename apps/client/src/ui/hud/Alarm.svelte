<script lang="ts">
  // Thẻ báo động dưới thanh HUD: tone foe (đội địch kéo tới, linh hỏa — son nhấp nháy viền), calm (bế quan — lam lục yên),
  // legion (ma triều — chàm sẫm, cả thẻ bấm được qua onclick). actions: nút vàng nhỏ bên phải (bật khiên, dập lửa…).
  import { Icon, type IconName } from '@rok/art'

  let {
    tone = 'foe',
    icon,
    title,
    time,
    hint,
    actions = [],
    onclick,
  }: {
    tone?: 'foe' | 'calm' | 'legion'
    icon: IconName
    title: string
    time?: string // đồng hồ đếm ngược sau tiêu đề
    hint: string
    actions?: { label: string; onclick: () => void; disabled?: boolean }[]
    onclick?: (e: MouseEvent) => void
  } = $props()
</script>

{#snippet body()}
  <Icon name={icon} size={18} />
  <span class="grow"
    ><b>{title}</b>{#if time}
      <span class="t-num">{time}</span>{/if}<br /><small>{hint}</small></span
  >
  {#each actions as a (a.label)}<button class="act" disabled={a.disabled} onclick={a.onclick}>{a.label}</button>{/each}
{/snippet}

{#if onclick}
  <button class="alarm {tone}" {onclick}>{@render body()}</button>
{:else}
  <div class="alarm {tone}" role={tone === 'calm' ? 'status' : 'alert'}>{@render body()}</div>
{/if}

<style>
  .alarm {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 6px 10px;
    font-size: var(--fs-2);
    color: var(--silk);
    pointer-events: auto;
    background: color-mix(in srgb, var(--cinnabar) 88%, var(--ink));
    border: 1.5px solid var(--gold-l);
    border-radius: 10px;
    animation: alarm 1.2s var(--ease) infinite;
  }
  .calm {
    background: color-mix(in srgb, var(--jade) 85%, var(--ink));
    animation: none;
  }
  small {
    opacity: 0.85;
  }
  .legion {
    width: 100%;
    font: inherit;
    font-size: var(--fs-2);
    text-align: left;
    cursor: pointer;
    background: color-mix(in srgb, var(--indigo) 86%, var(--ink));
    animation: none;
  }
  .act {
    flex: none;
    padding: 4px 10px;
    font-weight: 800;
    color: var(--text);
    background: var(--gold-l);
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }
  .act:disabled {
    opacity: 0.5;
  }
  @keyframes alarm {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--cinnabar) 60%, transparent);
    }
    50% {
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--cinnabar) 0%, transparent);
    }
  }
</style>
