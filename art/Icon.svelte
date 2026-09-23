<script module lang="ts">
  export type Name =
    | 'linhThach' | 'linhThao' | 'linhKhoang' | 'hammer' | 'lock' | 'check' | 'cross' | 'power' | 'sound' | 'mute' | 'music' | 'clock'
    | 'arrow' | 'close' | 'scroll' | 'cauldron' | 'flag' | 'gear' | 'heal' | 'bolt' | 'star' | 'people' | 'swords' | 'skull'
    | 'tuKhi' | 'boiNguyen' | 'doKiep' | 'download' | 'upload' | 'back' | 'plus' | 'minus'
</script>

<script lang="ts">
  // Icon trong khung 24×24. Vật phẩm (tài nguyên, đan dược) là ảnh vẽ tay bằng bút lông (icons.ts);
  // biểu tượng thao tác (búa, khoá, đồng hồ…) là nét vector cho sắc ở cỡ nhỏ.
  import { paintedUrl } from './img'
  import { isItem, itemIcon } from './icons'

  let { name, size = 20 }: { name: Name; size?: number } = $props()
</script>

{#if isItem(name)}
  <img class="icon" src={paintedUrl(`icon:${name}`, () => itemIcon(name), size)} width={size} height={size} alt="" aria-hidden="true" draggable="false" />
{:else}
<svg class="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
  {#if name === 'hammer'}
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
  {:else if name === 'music'}
    <path d="M9 17.5V5.2L19 3V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
    <ellipse cx="6.6" cy="17.6" rx="3" ry="2.4" fill="currentColor" transform="rotate(-18 6.6 17.6)" />
    <ellipse cx="16.6" cy="15.2" rx="3" ry="2.4" fill="currentColor" transform="rotate(-18 16.6 15.2)" />
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
{/if}

<style>
  .icon {
    display: inline-block;
    flex: none;
    overflow: visible;
    vertical-align: middle;
  }
</style>
