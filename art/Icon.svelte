<script lang="ts">
  // Icon vẽ tay trong khung 24×24. Dùng được cả trong HTML lẫn lồng trong SVG (x, y).
  type Name = 'linhThach' | 'linhThao' | 'linhKhoang' | 'hammer' | 'lock' | 'check' | 'cross' | 'power' | 'sound' | 'mute' | 'clock' | 'arrow' | 'close'
  let { name, size = 20, x, y }: { name: Name; size?: number; x?: number; y?: number } = $props()
</script>

<svg class="icon" viewBox="0 0 24 24" width={size} height={size} {x} {y} aria-hidden="true">
  {#if name === 'linhThach'}
    <path d="M12 1.8 19.6 8.2 16.2 21.5H7.8L4.4 8.2Z" fill="#4fa9c9" />
    <path d="M12 1.8 15.3 8.2 12 21.5 8.7 8.2Z" fill="#a8e4f2" />
    <path d="M4.4 8.2H19.6M8.7 8.2 12 1.8 15.3 8.2" fill="none" stroke="#e9fbff" stroke-width=".9" stroke-opacity=".8" />
    <path d="M12 1.8 19.6 8.2 16.2 21.5H7.8L4.4 8.2Z" fill="none" stroke="#1c5d77" stroke-width="1.3" stroke-linejoin="round" />
  {:else if name === 'linhThao'}
    <path d="M12 22.5C12.4 17 11.2 12 12.2 6" fill="none" stroke="#2f6b3c" stroke-width="1.7" stroke-linecap="round" />
    <path d="M12 15.2C8 14.8 4.4 12 4 6.8 8.4 7.4 11 9.8 12 12.8Z" fill="#4f9f57" stroke="#2f6b3c" stroke-width=".9" />
    <path d="M12.3 12C15.6 11.2 19.2 8.8 20 4.2 16 4.8 13.4 7.4 12.3 10Z" fill="#78c07a" stroke="#2f6b3c" stroke-width=".9" />
    <circle cx="12.2" cy="4.6" r="2.6" fill="#f4d266" stroke="#b8892f" stroke-width=".8" />
    <circle cx="11.4" cy="3.9" r=".8" fill="#fff8d6" />
  {:else if name === 'linhKhoang'}
    <path d="M2.6 16.8 5.8 8.6 12 5.6 19 7.6 21.4 15.6 15.4 21H7Z" fill="#877d73" stroke="#4d4640" stroke-width="1.2" stroke-linejoin="round" />
    <path d="M5.8 8.6 12 5.6 19 7.6 12.8 11Z" fill="#a89e93" />
    <path d="M9.6 13.2 11.8 8.8 14 13.2 11.8 16.6Z" fill="#9b86e2" stroke="#5a48a8" stroke-width=".7" />
    <path d="M15.2 15.6 16.6 12.4 18 15.6 16.6 17.6Z" fill="#c4b6f5" stroke="#5a48a8" stroke-width=".6" />
  {:else if name === 'hammer'}
    <path d="M13.5 3.2 20.8 10.5 17.9 13.4 10.6 6.1Z" fill="currentColor" />
    <path d="M12.6 9.8 3.6 18.8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
  {:else if name === 'lock'}
    <rect x="5" y="10.5" width="14" height="10.5" rx="2" fill="currentColor" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" fill="none" stroke="currentColor" stroke-width="2.2" />
  {:else if name === 'check'}
    <path d="M4.5 12.5 9.8 17.6 19.5 6.8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  {:else if name === 'cross' || name === 'close'}
    <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" stroke-width={name === 'close' ? 2.4 : 3} stroke-linecap="round" />
  {:else if name === 'power'}
    <path d="M5 19 15.8 8.2M15.8 8.2 20.5 3.5 19.8 7.5 16.4 9Z" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M7.2 13.8 10.2 16.8M3.5 20.5 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
  {:else if name === 'sound' || name === 'mute'}
    <path d="M4 9.2H7.6L12.4 5V19L7.6 14.8H4Z" fill="currentColor" />
    {#if name === 'sound'}
      <path d="M15.4 8.6a4.8 4.8 0 0 1 0 6.8M17.9 6a8.4 8.4 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
    {:else}
      <path d="M15.5 9.5 20.5 14.5M20.5 9.5 15.5 14.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
    {/if}
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M12 7.2V12L15.2 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  {:else if name === 'arrow'}
    <path d="M4.5 12H18.5M13.5 7 18.5 12 13.5 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
  {/if}
</svg>

<style>
  .icon {
    display: inline-block;
    flex: none;
    overflow: visible;
    vertical-align: middle;
  }
</style>
