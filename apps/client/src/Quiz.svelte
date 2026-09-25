<script lang="ts">
  // Vấn Đạo Đài (Peerless Scholar của RoK — luật ở rules/sect/quiz.ts): năm câu mỗi ngày, trả lời lần lượt, báo đúng / sai ngay
  // (sai thì hiện đáp án), xong thì quà theo số câu đúng. Mở từ Tàng Kinh Các.
  import { QUIZ_DAY, QUIZ_GIFTS, QUIZ_HALL, QUIZ_KEY, quizOf, quizToday } from '@rok/rules'
  import { Bag, Button, Card, Section, Sheet, Tag } from './ui'
  import { L } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  const g = useGame()
  const game = $derived(g.game)
  const q = $derived(quizToday(game))
  const list = $derived(quizOf(q.day))
  const cur = $derived(q.n < QUIZ_DAY ? L.quiz.q[list[q.n]] : null)
  // câu vừa trả lời: đúng không, đáp án đúng (để hiện khi sai)
  const prev = $derived(q.n > 0 ? L.quiz.q[list[q.n - 1]] : null)
  const prevKey = $derived(q.n > 0 ? QUIZ_KEY[list[q.n - 1]] : 0)
</script>

<Sheet open={social.quiz} onclose={() => (social.quiz = false)} title={L.quiz.title} lore={L.quiz.lore}>
  {#if game.levels.chuDien < QUIZ_HALL}
    <Tag icon="lock" tone="bad">{L.quiz.locked(QUIZ_HALL)}</Tag>
  {:else}
    {#if prev && q.last !== undefined}
      <p class="t-small" class:t-good={q.last} class:t-bad={!q.last}>
        {q.last ? L.quiz.good : L.quiz.bad(prev[1][prevKey])}
      </p>
    {/if}
    {#if cur}
      <Card tone="silk">
        <div class="stack" style:--gap="8px">
          <small class="t-tiny t-soft">{L.quiz.step(q.n + 1, QUIZ_DAY)}</small>
          <b>{cur[0]}</b>
          {#each cur[1] as opt, i (i)}
            <Button wide variant="ghost" onclick={() => g.act({ type: 'quiz', pick: i }, 'tap')}>{opt}</Button>
          {/each}
        </div>
      </Card>
    {:else}
      <p class="t-small t-lore">{L.quiz.done(q.right, QUIZ_DAY)}</p>
    {/if}
    <Section title={L.quiz.gift}>
      <ul class="stack rows">
        {#each QUIZ_GIFTS as x, i (i)}
          <li class="row" class:t-gold={q.n >= QUIZ_DAY && q.right === i}>
            <b class="t-num n">{i}/{QUIZ_DAY}</b>
            <span class="grow"><Bag items={x.items} size="sm" /></span>
          </li>
        {/each}
      </ul>
    </Section>
  {/if}
</Sheet>

<style>
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .n {
    min-width: 4ch;
  }
</style>
