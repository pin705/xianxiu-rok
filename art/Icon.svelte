<script module lang="ts">
  export type Name =
    | 'linhThach' | 'linhThao' | 'linhKhoang' | 'hammer' | 'lock' | 'check' | 'cross' | 'power' | 'sound' | 'mute' | 'clock'
    | 'arrow' | 'close' | 'scroll' | 'cauldron' | 'flag' | 'gear' | 'heal' | 'bolt' | 'star' | 'people' | 'swords' | 'skull'
    | 'tuKhi' | 'boiNguyen' | 'doKiep' | 'download' | 'upload' | 'back' | 'plus' | 'minus'
</script>

<script lang="ts">
  // Icon vẽ tay trong khung 24×24. Dùng được cả trong HTML lẫn lồng trong SVG (x, y).
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
  {:else if name === 'arrow' || name === 'back'}
    <path
      d="M4.5 12H18.5M13.5 7 18.5 12 13.5 17"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      transform={name === 'back' ? 'rotate(180 12 12)' : undefined}
    />
  {:else if name === 'plus' || name === 'minus'}
    <path d={name === 'plus' ? 'M12 5V19M5 12H19' : 'M5 12H19'} stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
  {:else if name === 'scroll'}
    <rect x="6" y="4" width="12" height="16" rx="1.5" fill="#efe4c4" stroke="#8f6d2a" stroke-width="1.1" />
    <rect x="4" y="3" width="16" height="3.2" rx="1.6" fill="#8a5a2b" />
    <rect x="4" y="17.8" width="16" height="3.2" rx="1.6" fill="#8a5a2b" />
    <path d="M9 9H15M9 12H15M9 15H13" stroke="#5b4a2e" stroke-width="1.1" stroke-linecap="round" />
  {:else if name === 'cauldron'}
    <path d="M6.5 20 5.5 22.5M17.5 20 18.5 22.5M12 20.5V22.5" stroke="#5f4524" stroke-width="1.6" stroke-linecap="round" />
    <path d="M3.5 10Q3 20.5 12 20.5Q21 20.5 20.5 10Z" fill="#9a7440" stroke="#5f4524" stroke-width="1.1" />
    <rect x="2.5" y="8.4" width="19" height="2.6" rx="1.2" fill="#5f4524" />
    <path d="M7 8.4V6M17 8.4V6" stroke="#5f4524" stroke-width="1.6" stroke-linecap="round" />
    <path d="M9 4.8C10 3.4 9 2.4 10 1.4M13.5 5C14.5 3.6 13.5 2.6 14.5 1.6" fill="none" stroke="#9fd8dd" stroke-width="1.2" stroke-linecap="round" />
  {:else if name === 'flag'}
    <path d="M5 22V2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    <path d="M6 3.5H19L16 8 19 12.5H6Z" fill="#c23b22" stroke="#7e2413" stroke-width=".8" stroke-linejoin="round" />
  {:else if name === 'gear'}
    <path
      d="M10.3 2.5h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8Z"
      fill="currentColor"
    />
    <circle cx="12" cy="12" r="3.4" fill="#13232c" />
  {:else if name === 'heal'}
    <rect x="3" y="3" width="18" height="18" rx="5" fill="#c23b22" />
    <path d="M12 7.5V16.5M7.5 12H16.5" stroke="#fff" stroke-width="2.8" stroke-linecap="round" />
  {:else if name === 'bolt'}
    <path d="M13.8 1.8 4.8 13.4H11L9.6 22.2 19.2 10.2H12.9Z" fill="#f5d34f" stroke="#8a6a12" stroke-width="1" stroke-linejoin="round" />
  {:else if name === 'star'}
    <path d="M12 2.4 14.8 8.6 21.4 9.2 16.4 13.6 17.9 20.2 12 16.7 6.1 20.2 7.6 13.6 2.6 9.2 9.2 8.6Z" fill="#f1d98f" stroke="#8f6d2a" stroke-width="1" stroke-linejoin="round" />
  {:else if name === 'people'}
    <circle cx="8.5" cy="8" r="3.4" fill="currentColor" />
    <circle cx="16" cy="7" r="3" fill="currentColor" opacity=".7" />
    <path d="M2.5 20.5C2.8 15.4 5.4 13 8.5 13S14.2 15.4 14.5 20.5Z" fill="currentColor" />
    <path d="M13.6 12.6C14.3 12.2 15.1 12 16 12 19 12 21.2 14.2 21.5 19H15.6" fill="currentColor" opacity=".7" />
  {:else if name === 'swords'}
    <path d="M4 4 15 15M20 4 9 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
    <path d="M13.5 17.5 17.5 13.5M10.5 17.5 6.5 13.5M16.2 16.2 19.8 19.8M7.8 16.2 4.2 19.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
  {:else if name === 'skull'}
    <path d="M12 3C7.3 3 4.5 6.2 4.5 10.2 4.5 12.8 5.8 14.5 7.5 15.5V19H16.5V15.5C18.2 14.5 19.5 12.8 19.5 10.2 19.5 6.2 16.7 3 12 3Z" fill="currentColor" />
    <circle cx="9" cy="11" r="2" fill="#13232c" />
    <circle cx="15" cy="11" r="2" fill="#13232c" />
    <path d="M10 19V21M14 19V21M12 19V21" stroke="currentColor" stroke-width="1.6" />
  {:else if name === 'tuKhi' || name === 'boiNguyen' || name === 'doKiep'}
    {@const c = { tuKhi: ['#7fe0e6', '#1f8a93'], boiNguyen: ['#f7d774', '#a8741c'], doKiep: ['#c7a3f5', '#5b3aa0'] }[name]}
    <circle cx="12" cy="12" r="10.4" fill={c[0]} opacity=".22" />
    <circle cx="12" cy="12.6" r="7" fill={c[0]} stroke={c[1]} stroke-width="1.3" />
    <path d="M8.4 10.2Q10.4 7.4 13.8 8" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85" />
    {#if name === 'doKiep'}
      <path d="M12.8 9.2 10.2 13H12.4L11.4 16.4 14.2 12.2H12Z" fill={c[1]} />
    {:else if name === 'boiNguyen'}
      <circle cx="12" cy="13" r="2.2" fill="none" stroke={c[1]} stroke-width="1.1" />
    {/if}
  {:else if name === 'download' || name === 'upload'}
    <path d="M4 16V20H20V16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path
      d={name === 'download' ? 'M12 3V14M7.5 9.5 12 14 16.5 9.5' : 'M12 14V3M7.5 7.5 12 3 16.5 7.5'}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
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
