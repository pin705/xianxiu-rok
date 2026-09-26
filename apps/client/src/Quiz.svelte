<script lang="ts">
  // Vấn Đạo Đài (Peerless Scholar của RoK — luật ở rules/sect/quiz.ts): năm câu mỗi ngày, trả lời lần lượt, báo đúng / sai ngay
  // (sai thì hiện đáp án), xong thì quà theo số câu đúng. Mở từ Tàng Kinh Các.
  // Bố cục: bí kíp mở (tranh vẽ tay) đầu bảng, câu hỏi trên thẻ lụa, bốn đáp án lưới 2×2; quà là đường mốc theo số câu đúng.
  import { QUIZ_DAY, QUIZ_GIFTS, QUIZ_HALL, QUIZ_KEY, quizOf, quizToday } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
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
  const book = artOf('ui:fx-scroll')?.src
</script>

<Sheet open={social.quiz} onclose={() => (social.quiz = false)} title={L.quiz.title} lore={L.quiz.lore}>
  {#snippet art()}{#if book}<img src={book} alt="" width="64" height="64" draggable="false" />{:else}<Icon
        name="scroll"
        size={40}
      />{/if}{/snippet}
  {#if game.levels.chuDien < QUIZ_HALL}
    <Tag icon="lock" tone="bad">{L.quiz.locked(QUIZ_HALL)}</Tag>
  {:else}
    {#if prev && q.last !== undefined}
      <p class="t-small t-strong" class:t-good={q.last} class:t-bad={!q.last}>
        {q.last ? L.quiz.good : L.quiz.bad(prev[1][prevKey])}
      </p>
    {/if}
    {#if cur}
      <Card tone="silk">
        <div class="stack" style:--gap="10px">
          <small class="t-tiny t-soft">{L.quiz.step(q.n + 1, QUIZ_DAY)}</small>
          <b class="t-head">{cur[0]}</b>
          <div class="grid" style:--gap="6px">
            {#each cur[1] as opt, i (i)}
              <Button wide variant="ghost" onclick={() => g.act({ type: 'quiz', pick: i }, 'tap')}>{opt}</Button>
            {/each}
          </div>
        </div>
      </Card>
    {:else}
      <p class="t-small t-lore">{L.quiz.done(q.right, QUIZ_DAY)}</p>
    {/if}
    <Section title={L.quiz.gift}>
      <ol class="path">
        {#each QUIZ_GIFTS as x, i (i)}
          <li class="row" class:hit={q.n >= QUIZ_DAY && q.right >= i} class:t-gold={q.n >= QUIZ_DAY && q.right === i}>
            <b class="t-num">{i}/{QUIZ_DAY}</b>
            <span class="grow"><Bag items={x.items} size="sm" /></span>
          </li>
        {/each}
      </ol>
    </Section>
  {/if}
</Sheet>

<style>
  /* hạt mốc của .path canh giữa dòng quà (hạt đặt theo thẻ cao, dòng này thấp) */
  .path > li {
    padding-top: 7px;
  }
</style>
