<script lang="ts">
  // Chi phí: thiếu thì tô đỏ và ghi "có X" (UX: không làm được thì nói vì sao).
  import { RESOURCES, type Bag } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { L, num } from './lib'

  let { have, cost, small = false }: { have: Bag; cost: Bag; small?: boolean } = $props()
</script>

<ul class="cost" class:small>
  {#each RESOURCES as r (r)}
    {#if cost[r]}
      <li class:bad={have[r] < cost[r]}>
        <Icon name={r} size={small ? 15 : 18} />
        <b>{num(cost[r])}</b>
        {#if have[r] < cost[r]}<small>{L.panel.have(num(have[r]))}</small>{/if}
        <span class="sr">{L.res[r]}</span>
      </li>
    {/if}
  {/each}
</ul>

<style>
  .cost {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0;
    list-style: none;
  }
  li {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    font-size: 13px;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(201 161 74 / 0.35);
    border-radius: 10px;
  }
  .small li {
    padding: 3px 7px;
    font-size: 12px;
    border-radius: 8px;
  }
  b {
    font-weight: 600;
  }
  li.bad {
    color: #ffb4a4;
    background: rgb(194 59 34 / 0.18);
    border-color: rgb(194 59 34 / 0.6);
  }
  small {
    font-size: 11px;
  }
</style>
