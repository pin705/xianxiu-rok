<script lang="ts">
  // Túi tài nguyên/đan dược/vật phẩm: chi phí (có `have` thì tô đỏ chỗ thiếu, ghi "có X") hoặc phần thưởng.
  import { BAG_IDS, PILL_IDS, RESOURCES, bagFamily, type Bag as Res, type ItemId } from '@rok/rules'
  import { L, num } from '../lib'
  import { denom } from '../bag'
  import Tag from './Tag.svelte'

  let {
    res = {},
    items = {},
    exp = 0,
    have,
    size = 'md',
    named = false,
  }: {
    res?: Partial<Res>
    items?: Partial<Record<ItemId, number>>
    exp?: number
    have?: Res
    size?: 'sm' | 'md'
    named?: boolean
  } = $props()
</script>

<ul class="bag">
  {#each RESOURCES as r (r)}
    {#if res[r]}
      {@const short = have && have[r] < (res[r] ?? 0)}
      <li>
        <Tag icon={r} tone={short ? 'bad' : 'plain'} {size}>
          {num(res[r] ?? 0)}{#if short}<small> · {L.panel.have(num(have![r]))}</small>{/if}<span class="sr">
            {L.res[r]}</span
          >
        </Tag>
      </li>
    {/if}
  {/each}
  {#each PILL_IDS as p (p)}
    {#if items[p]}<li><Tag icon={p} tone="gold" {size}>{named ? `${L.pills[p].name} ` : ''}×{items[p]}</Tag></li>{/if}
  {/each}
  {#each BAG_IDS as id (id)}
    {#if items[id]}<li>
        <Tag icon={bagFamily(id)} tone="gold" {size}
          >{named ? `${L.bag.family[bagFamily(id)].name} ` : ''}{denom(id)} ×{items[id]}</Tag
        >
      </li>{/if}
  {/each}
  {#if exp}<li><Tag icon="star" tone="gold" {size}>{L.map.exp(exp)}</Tag></li>{/if}
</ul>

<style>
  .bag {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  small {
    font-weight: 600;
  }
</style>
