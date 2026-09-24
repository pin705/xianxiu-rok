<script lang="ts">
  // Trạng thái kết nối: dải mỏng khi đang nối lại (sau 1,5 giây, nháy mạng ngắn thì không làm phiền),
  // hộp giữa màn khi mất mạng lâu, đang cập nhật bản mới, phiên hết hạn, bị khoá.
  import { Button, Card, Medal } from './ui'
  import { L } from './lib'
  import type { Status } from './net'

  let { status, onretry, onfresh }: { status: Status; onretry: () => void; onfresh: () => void } = $props()

  let late = $state(false)
  $effect(() => {
    late = false
    if (status !== 'reconnecting') return
    const t = setTimeout(() => (late = true), 1500)
    return () => clearTimeout(t)
  })
  const modal = $derived(
    status === 'offline' || status === 'update' || status === 'lost' || status === 'banned' || status === 'deleted',
  )
</script>

{#if status === 'reconnecting' && late}
  <div class="conn" data-conn="reconnecting" role="status">{L.net.reconnecting}</div>
{/if}
{#if modal}
  <div class="veil" data-conn={status} role="alertdialog" aria-live="assertive" aria-label={L.net[status as 'offline']}>
    <Card>
      <div class="stack center" style:--gap="var(--sp-3)">
        <Medal emblem="crest" tone={status === 'update' ? 'gold' : 'red'} size={64} />
        <h2 class="t-title">{L.net[status as 'offline']}</h2>
        <p class="t-lore">{L.net[`${status as 'offline'}Hint`]}</p>
        {#if status === 'offline'}<Button variant="gold" wide onclick={onretry}>{L.net.retry}</Button>{/if}
        {#if status === 'lost'}<Button variant="gold" wide onclick={onfresh}>{L.net.fresh}</Button>{/if}
      </div>
    </Card>
  </div>
{/if}

<style>
  .conn {
    position: fixed;
    top: calc(var(--safe-t) + 6px);
    left: 50%;
    z-index: var(--z-toast);
    translate: -50% 0;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 700;
    color: var(--paper);
    background: color-mix(in srgb, var(--ink) 82%, transparent);
    border-radius: 999px;
    pointer-events: none;
  }
  .veil {
    position: fixed;
    inset: 0;
    z-index: var(--z-toast);
    display: grid;
    place-items: center;
    padding: var(--sp-5);
    background: color-mix(in srgb, var(--ink) 55%, transparent);
  }
  .veil > :global(*) {
    max-width: 360px;
  }
</style>
