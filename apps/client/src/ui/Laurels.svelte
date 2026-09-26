<script lang="ts">
  // Bục vinh danh ba hạng đầu: hạng 2 · hạng 1 (cúp vẽ tay, bậc cao nhất viền son) · hạng 3 trên nền núi mờ; mỗi người tên,
  // số, đồng tiền hạng trên bậc giấy. mine: tên tô son. Có onclick thì chạm được (mở hồ sơ).
  import Art from './Art.svelte'

  type Row = { key: string | number; rank: number; name: string; v: string; mine?: boolean; onclick?: () => void }
  let { rows }: { rows: Row[] } = $props()
</script>

<ol class="laurels">
  {#each [1, 0, 2] as k (k)}
    {@const r = rows[k]}
    {#if r}
      <li class="p{k + 1}" class:mine={r.mine}>
        <button type="button" disabled={!r.onclick} aria-label={r.name} onclick={() => r.onclick?.()}>
          {#if k === 0}<span class="cup"><Art art="rank-cup" icon="rank" size={64} /></span>{/if}
          <b class="nm">{r.name}</b>
          <small class="t-num t-gold">{r.v}</small>
          <span class="step"><i class="rank-no coin r{r.rank}">{r.rank}</i></span>
        </button>
      </li>
    {/if}
  {/each}
</ol>

<style>
  .laurels {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    gap: 6px;
    margin: var(--sp-4) 0 0;
    padding: 0 4px;
    list-style: none;
    background: var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 260% auto no-repeat;
  }
  button {
    display: grid;
    justify-items: center;
    gap: 1px;
    width: 100%;
    text-align: center;
  }
  .cup {
    display: grid;
    filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.25));
  }
  .nm {
    display: -webkit-box;
    max-width: 100%;
    overflow: hidden;
    font-size: var(--fs-2);
    line-height: 1.15;
    overflow-wrap: anywhere;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  small {
    font-size: var(--fs-1);
    line-height: 1.2;
  }
  /* bậc bục: khối giấy dày viền mực, hạng nhất cao nhất */
  .step {
    display: grid;
    place-items: start center;
    width: 100%;
    margin-top: 4px;
    padding-top: 8px;
    background: linear-gradient(var(--paper), var(--paper2));
    border: 1.5px solid var(--rim, var(--ink3));
    border-bottom: 0;
    border-radius: 4px 4px 0 0;
    box-shadow: inset 0 3px 0 rgb(255 255 255 / 0.7);
  }
  .p1 .step {
    height: 64px;
    border-top: 3px solid var(--cinnabar);
  }
  .p2 .step {
    height: 46px;
  }
  .p3 .step {
    height: 34px;
  }
  .coin {
    min-width: 30px;
    height: 30px;
  }
  .mine .nm {
    color: var(--cinnabar);
  }
</style>
