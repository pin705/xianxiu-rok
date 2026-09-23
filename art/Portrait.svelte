<script module lang="ts">
  // Chân dung tĩnh vẽ theo tham số (UX: nhân vật là chân dung tĩnh). Mắt khép như đang tĩnh toạ.
  export type Look = {
    robe: string
    trim: string
    hair: string
    style: 'bun' | 'long' | 'bald' | 'crown' | 'tied'
    beard?: 'long' | 'short'
    female?: boolean
    bg?: string
    mark?: string // ấn giữa trán
  }
</script>

<script lang="ts">
  let { look, size = 48, dim = false }: { look: Look; size?: number; dim?: boolean } = $props()
  const id = $props.id()
</script>

<svg class="portrait" class:dim viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
  <defs>
    <radialGradient id="bg{id}" cx=".5" cy=".3">
      <stop offset="0" stop-color="#eef4ef" />
      <stop offset="1" stop-color={look.bg ?? '#7fa9b3'} />
    </radialGradient>
    <clipPath id="c{id}"><circle cx="24" cy="24" r="24" /></clipPath>
  </defs>
  <g clip-path="url(#c{id})">
    <circle cx="24" cy="24" r="24" fill="url(#bg{id})" />
    {#if look.style === 'long' || (look.female && look.style === 'crown')}
      <path d="M14.6 18C13 30 14 38 11 48H37C34 38 35 30 33.4 18Z" fill={look.hair} />
    {/if}
    <path d="M4 48C6 38.5 14.5 34 24 34S42 38.5 44 48Z" fill={look.robe} />
    <path d="M17.6 34.2 24 45 30.4 34.2Z" fill="#f3f1ea" />
    <path d="M24 45 17.6 34.2M24 45 30.4 34.2" stroke={look.trim} stroke-width="1.6" />
    <rect x="21" y="28.5" width="6" height="6.5" fill="#e9cdb1" />
    <ellipse cx="24" cy="22" rx="8" ry="9.5" fill="#f3dcc4" />
    {#if look.style === 'bald'}
      <path d="M15.8 21.5C15.4 18 16 16.6 17 16.2 16.8 18.5 16.9 20 17.4 21.6ZM32.2 21.5C32.6 18 32 16.6 31 16.2 31.2 18.5 31.1 20 30.6 21.6Z" fill={look.hair} />
      <path d="M18 14.5Q24 11.5 30 14.5" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="1.2" />
    {:else}
      <path d="M15.6 22C15 13 19 10 24 10S33 13 32.4 22C31 17 28.2 15.2 24 15.2S17 17 15.6 22Z" fill={look.hair} />
      {#if look.style === 'bun' || look.style === 'tied'}
        <ellipse cx="24" cy="8.6" rx="4.6" ry="3.6" fill={look.hair} />
        <path d="M17.4 8.2H30.6" stroke={look.style === 'tied' ? look.trim : '#e3c16f'} stroke-width="1.4" stroke-linecap="round" />
      {:else if look.style === 'crown'}
        <path d="M18 11.6 19.6 6.4 22 9.4 24 5 26 9.4 28.4 6.4 30 11.6Z" fill="#e3c16f" stroke="#8f6d2a" stroke-width=".7" stroke-linejoin="round" />
        <circle cx="24" cy="9.2" r="1.1" fill={look.trim} />
      {:else if look.style === 'long'}
        <path d="M24 10.2Q19 11 16.4 17.5" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.2" />
        {#if look.female}
          <path d="M29 11.6 33.6 9.2" stroke="#e3c16f" stroke-width="1.3" stroke-linecap="round" />
          <circle cx="33.8" cy="9" r="1.2" fill={look.trim} />
        {/if}
      {/if}
    {/if}
    <!-- lông mày, mắt khép -->
    {#if look.style === 'bald' && look.beard === 'long'}
      <path d="M18.6 19.2q2 -1.8 4 -.4M25.4 18.8q2 -1.4 4 .4" fill="none" stroke={look.hair} stroke-width="1.4" stroke-linecap="round" />
    {:else}
      <path d="M19.3 19.3l3.3 -.7M25.4 18.6l3.3 .7" stroke="#17232a" stroke-width=".9" stroke-linecap="round" />
    {/if}
    <path d="M19.4 22.2q1.8 1.2 3.4 0M25.2 22.2q1.8 1.2 3.4 0" stroke="#17232a" stroke-width=".9" fill="none" stroke-linecap="round" />
    {#if look.female}
      <path d="M22.6 27.4q1.4 .8 2.8 0" stroke="#c2553f" stroke-width="1.1" fill="none" stroke-linecap="round" />
    {/if}
    {#if look.beard === 'long'}
      <path d="M17.6 25.2Q18.5 30 21 33.6 24 40 27 33.6 29.5 30 30.4 25.2 28 28.6 24 28.6 20 28.6 17.6 25.2Z" fill={look.hair} />
      <path d="M21.2 26.8Q24 25.6 26.8 26.8" stroke="#6b5a4a" stroke-width=".8" fill="none" />
    {:else if look.beard === 'short'}
      <path d="M17.4 24.4Q19 30.6 24 30.8 29 30.6 30.6 24.4 28.6 27.8 24 27.8 19.4 27.8 17.4 24.4Z" fill={look.hair} opacity=".85" />
    {/if}
    {#if look.mark}
      <path d="M24 16.4l.9 1.6 -.9 1.1 -.9 -1.1Z" fill={look.mark} />
    {/if}
  </g>
</svg>

<style>
  .portrait {
    display: block;
    flex: none;
    border-radius: 50%;
  }
  .dim {
    filter: grayscale(1) brightness(0.35) contrast(0.8);
  }
</style>
