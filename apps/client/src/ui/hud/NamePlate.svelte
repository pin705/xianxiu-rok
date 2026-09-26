<script lang="ts">
  // Biển tên cạnh chân dung: tên tông môn, cảnh giới (hoa sen mực; ink: chữ trắng trên dải lụa son),
  // nhãn Hương Hỏa nhỏ bấm được (dot: chấm son — lễ vật hôm nay chưa nhận).
  import Badge from '../Badge.svelte'

  let {
    name,
    realm,
    lotus,
    vip,
    vipLabel,
    dot = false,
    ink = false,
    onvip,
  }: {
    name: string
    realm: string
    lotus: string // tranh hoa sen trước cảnh giới (chế độ cũ)
    vip: string
    vipLabel: string
    dot?: boolean
    ink?: boolean
    onvip: () => void
  } = $props()
</script>

<div class="plate" class:ink>
  <b class="t-ellipsis">{name}</b>
  <span class="realm"><img src={lotus} width="18" height="18" alt="" draggable="false" />{realm}</span>
  <button class="vip" onclick={onvip} aria-label={vipLabel}
    >{vip}{#if dot}<Badge dot />{/if}</button
  >
</div>

<style>
  .plate {
    display: grid;
    min-width: 0;
    line-height: 1.2;
  }
  b {
    font-size: var(--fs-4);
    font-weight: 800;
  }
  .realm {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--cinnabar);
  }
  /* Hương Hỏa: nhãn vàng nhỏ dưới cảnh giới, như huy hiệu VIP cạnh chân dung của RoK */
  .vip {
    position: relative;
    justify-self: start;
    width: max-content;
    min-height: 22px;
    margin-top: 2px;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--gold-d);
    background: color-mix(in srgb, var(--paper) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--rim, var(--ink3)) 80%, transparent);
    border-radius: 999px;
    cursor: pointer;
  }
  .vip :global(.badge) {
    position: absolute;
    top: -4px;
    right: -6px;
  }
  .ink b {
    font-size: var(--fs-5);
    text-shadow:
      0 0 3px var(--pill-fg),
      0 0 6px var(--pill-fg);
  }
  /* cảnh giới trên dải lụa đỏ */
  .ink .realm {
    justify-self: start;
    padding: 1px 16px 3px;
    font-size: var(--fs-1);
    font-weight: 800;
    white-space: nowrap;
    color: var(--pill-fg);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.35);
    background: var(--ui-ribbon-img) center / 100% 100% no-repeat;
  }
  .ink .realm img {
    display: none;
  }
</style>
