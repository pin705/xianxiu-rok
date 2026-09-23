<script lang="ts">
  // Nhiệm vụ ngày: 4 việc quen tay mỗi phiên, xong cả 4 thì mở rương. Làm mới lúc 0h giờ VN.
  import { DAILY, DAILY_BONUS, PILL_IDS, RESOURCES, dailyDone, dailyReward, nextDay, type Action, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Sheet from './Sheet.svelte'
  import { L, clock, num, sfx } from './lib'

  let { game, now, open, onclose, act }: { game: State; now: number; open: boolean; onclose: () => void; act: (a: Action) => State | null } =
    $props()

  const all = $derived(game.daily.got.every(Boolean))
</script>

<Sheet {open} {onclose} label={L.daily.title}>
  <div class="head">
    <h2><Icon name="scroll" size={22} />{L.daily.title}</h2>
    <p class="muted">{L.daily.reset(clock(nextDay(now) - now))}</p>
    <button class="sheet-x" onclick={onclose} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
  </div>
  <ul>
    {#each DAILY as d, i (d.id)}
      {@const n = Math.min(game.daily.n[d.id], d.n)}
      {@const done = dailyDone(game, i)}
      {@const got = game.daily.got[i]}
      <li class:got>
        <div class="body">
          <b>{L.daily.task[d.id](d.n)}</b>
          <span class="bar"><i style:width="{(n / d.n) * 100}%"></i></span>
          <small>
            {num(n)}/{num(d.n)} ·
            {#each RESOURCES as r (r)}<Icon name={r} size={13} />{num(dailyReward(game))} {/each}
          </small>
        </div>
        {#if got}
          <span class="ok"><Icon name="check" size={18} /></span>
        {:else}
          <button class="btn small gold" disabled={!done} onclick={() => act({ type: 'daily', i }) && sfx('reward')}>{L.quest.claim}</button>
        {/if}
      </li>
    {/each}
  </ul>
  <div class="chest" class:ready={all && !game.daily.bonus}>
    <span class="lid"><Icon name="star" size={26} /></span>
    <div>
      <b>{L.daily.bonus}</b>
      <small>{#each PILL_IDS as p (p)}{#if DAILY_BONUS[p]}<Icon name={p} size={16} />{L.pills[p].name} ×{DAILY_BONUS[p]} {/if}{/each}</small>
    </div>
    {#if game.daily.bonus}
      <span class="ok"><Icon name="check" size={18} /></span>
    {:else}
      <button class="btn small gold" disabled={!all} onclick={() => act({ type: 'dailyBonus' }) && sfx('win')}>{L.daily.open}</button>
    {/if}
  </div>
</Sheet>

<style>
  .head {
    position: relative;
    padding: 18px 0 6px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 19px;
    color: var(--gold-l);
  }
  .head p {
    margin-top: 2px;
    font-size: 12.5px;
  }
  .head .sheet-x {
    top: 14px;
    right: 0;
  }
  ul {
    display: grid;
    gap: 8px;
    margin-top: 10px;
    padding: 0;
    list-style: none;
  }
  li,
  .chest {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(201 161 74 / 0.35);
    border-radius: 12px;
  }
  li.got {
    opacity: 0.65;
  }
  .body {
    display: grid;
    flex: 1;
    gap: 5px;
  }
  .body b {
    font-size: 14px;
  }
  .body small,
  .chest small {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: #b9c6ca;
  }
  .ok {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    color: #9be3a5;
  }
  .chest {
    margin-top: 12px;
    border-style: dashed;
  }
  .chest.ready {
    border-style: solid;
    border-color: var(--gold-l);
    box-shadow: 0 0 16px rgb(248 227 160 / 0.25);
  }
  .chest > div {
    display: grid;
    flex: 1;
    gap: 3px;
  }
  .lid {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    background: radial-gradient(circle at 50% 35%, #7a5a2a, #3b2a14);
    border-radius: 10px;
    box-shadow: inset 0 0 0 2px var(--gold-l);
  }
</style>
