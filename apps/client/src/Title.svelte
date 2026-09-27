<script lang="ts">
  // Màn tiêu đề. 'first': tiêu đề → lời dẫn → chọn đạo thống → đặt tên (server lập tông môn). 'splash': người cũ, chạm hoặc chờ 1.6 giây là vào.
  // wait: đã xong màn tiêu đề nhưng server chưa gửi state (mạng chậm) — hiện dòng "đang kết nối".
  import { onMount } from 'svelte'
  import { DAOS, DAO_IDS, type Bonus, type DaoId } from '@rok/rules'
  import { DAO_TONES, artPack, emblemArt, onArtProgress, paintedUrl } from '@rok/art'
  import { Button, Cover, Leaf, Masthead, Medal, Patron, Slam, Splash, TapHint, Verse } from './ui'
  import { L, sfx, suggestNames } from './lib'
  import DaoChoose, { ACCENT } from './DaoChoose.svelte'

  let {
    mode,
    wait = false,
    onstart,
    ondone,
    onlogin,
  }: {
    mode: 'first' | 'splash'
    wait?: boolean
    onstart: (name: string, dao: DaoId) => Promise<string | null>
    ondone: () => void
    onlogin?: (how: { email: string; pass: string } | { code: string }) => Promise<string | null> // vào tông môn đã có (máy khác)
  } = $props()

  let step: 'title' | 'intro' | 'dao' | 'name' | 'stamp' | 'email' | 'code' = $state('title')
  let dao: DaoId = $state(DAO_IDS[0])
  const daoFx = $derived(Object.entries(DAOS[dao]).map(([k, v]) => L.bonus(k as Bonus, v as number)))
  let email = $state('')
  let pass = $state('')
  let code = $state('')
  let line = $state(0)
  const [first, ...rest] = suggestNames(4)
  let name = $state(first)
  let ideas = $state(rest)
  let error = $state('')
  let sending = $state(false)

  // Màn tiêu đề kiêm màn tải: đợi tranh cảnh tông môn (gói home — vào game là thấy ngay), không đợi cả game: đợi hết mọi gói
  // (bản đồ, trận, các tầng công trình) làm lần mở đầu khựng lâu. Gói còn lại tải nền (main.ts artAll); cảnh nào mở trước khi
  // gói của nó về thì tự đợi gói đó (stage.ts mountScene), như màn nạp theo cảnh của engine.
  // Người mới vẫn xem lời dẫn, đặt tên trong lúc tải; tới bước vào game mà chưa xong thì đợi trên vạch tiến độ.
  let loaded = $state(1)
  let ready = $state(false) // gói home đã về thật
  let live = true
  onMount(() => onArtProgress((done, total) => (loaded = total ? done / total : 1)))
  onMount(() => void artPack('home').then(() => (ready = true)))
  onMount(() => () => void (live = false))
  let entered = false
  const go = () => {
    if (!live || entered) return
    entered = true
    ondone()
  }
  const enter = (min: number) => void Promise.all([new Promise(r => setTimeout(r, min)), artPack('home')]).then(go)
  onMount(() => {
    if (mode === 'splash') enter(1600) // người cũ: đủ 1.6 giây và tranh đã về
  })

  function tapTitle() {
    sfx('tap')
    if (mode === 'splash') return void (ready && go()) // đang tải: chạm không bỏ qua được
    step = 'intro'
  }
  function tapIntro() {
    sfx('tap')
    if (line < L.intro.length - 1) line++
    else step = 'dao'
  }
  async function found(e: SubmitEvent) {
    e.preventDefault()
    if (sending) return
    const n = name.trim().replace(/\s+/g, ' ')
    if ([...n].length < 2 || [...n].length > 20) {
      error = L.naming.tooShort
      return
    }
    sending = true
    const err = await onstart(n, dao)
    sending = false
    if (err) {
      error = err === 'name_taken' ? L.naming.taken : err === 'name' ? L.naming.bad : L.err.offline
      return
    }
    step = 'stamp'
    sfx('done')
    enter(1300)
  }
  async function login(e: SubmitEvent) {
    e.preventDefault()
    if (sending || !onlogin) return
    sending = true
    const err = await onlogin(step === 'code' ? { code } : { email, pass })
    sending = false
    if (err)
      return void (error =
        step === 'code' && err === 'wrong' ? L.account.err.code : (L.account.err[err] ?? L.account.err.server))
    sfx('done')
    enter(0)
  }
  const to = (s: typeof step) => () => {
    error = ''
    step = s
  }
</script>

<Splash progress={ready ? undefined : loaded}>
  {#if step === 'title'}
    <Cover onclick={tapTitle} label={L.tapToStart}>
      <Masthead title={L.game} tagline={L.tagline}
        >{#snippet emblem()}<Medal emblem="crest" tone="gold" size={104} />{/snippet}</Masthead
      >
      <TapHint>{wait ? L.net.connecting : L.tapToStart}</TapHint>
    </Cover>
  {:else if step === 'intro'}
    <Cover veil onclick={tapIntro}>
      <Verse lines={L.intro.slice(0, line + 1)} />
      <TapHint>{L.tapToContinue}</TapHint>
      {#snippet corner()}<Button variant="ghost" size="sm" onclick={() => (step = 'dao')}>{L.skip}</Button>{/snippet}
    </Cover>
  {:else if step === 'dao'}
    <Cover veil pick heading={L.dao.pick} hint={L.dao.pickHint}>
      <DaoChoose bind:value={dao} note={L.dao.note} onpick={() => (step = 'name')} />
    </Cover>
  {:else if step === 'email' || step === 'code'}
    <Cover veil>
      <Leaf onsubmit={login}>
        <h2 class="t-title">{step === 'code' ? L.account.enterCode : L.account.login}</h2>
        {#if step === 'code'}
          <input
            class="inkline"
            bind:value={code}
            maxlength="12"
            autocomplete="one-time-code"
            autocapitalize="characters"
            aria-label={L.account.codeLabel}
            placeholder={L.account.codeLabel}
            oninput={() => (error = '')}
          />
        {:else}
          <input
            class="inkline"
            type="email"
            bind:value={email}
            autocomplete="email"
            aria-label={L.account.email}
            placeholder={L.account.email}
            oninput={() => (error = '')}
          />
          <input
            class="inkline"
            type="password"
            bind:value={pass}
            autocomplete="current-password"
            aria-label={L.account.pass}
            placeholder={L.account.pass}
            oninput={() => (error = '')}
          />
        {/if}
        {#if error}<p class="t-small t-bad">{error}</p>{/if}
        <Button
          variant="gold"
          size="lg"
          wide
          type="submit"
          silent
          disabled={sending ||
            (step === 'code' ? code.replace(/[^0-9a-z]/gi, '').length !== 8 : !email.includes('@') || pass.length < 8)}
          >{sending ? L.net.connecting : L.account.go}</Button
        >
        <Button variant="quiet" size="sm" onclick={to('name')}>{L.account.back}</Button>
      </Leaf>
    </Cover>
  {:else}
    <Cover veil>
      <Leaf gone={step === 'stamp'} onsubmit={found}>
        <!-- đạo thống đã chọn: tổ sư, huy hiệu, lối chơi, ba tiềm năng, đệ tử đặc trưng — chạm để chọn lại -->
        <Patron
          accent={ACCENT[dao]}
          img={paintedUrl(`fig:${dao}`, () => emblemArt(dao), 160)}
          name={L.dao.names[dao].name}
          way={L.dao.names[dao].style}
          chips={daoFx}
          swap="{L.dao.swap} ›"
          label={L.dao.pick}
          onclick={to('dao')}
        >
          {#snippet badge()}<Medal emblem={dao} tone={DAO_TONES[dao]} size={30} />{/snippet}
          {#snippet note()}<small class="t-tiny t-soft">{L.dao.uniTitle}: <b>{L.dao.names[dao].unit}</b></small
            >{/snippet}
        </Patron>
        <h2 class="t-title">{L.naming.title}</h2>
        <p class="t-small t-lore">{L.naming.hint}</p>
        <input
          class="inkline"
          bind:value={name}
          maxlength="20"
          aria-label={L.naming.title}
          oninput={() => (error = '')}
        />
        <div class="row wrap center">
          {#each ideas as idea (idea)}
            <Button variant="ghost" size="sm" onclick={() => (name = idea)}>{idea}</Button>
          {/each}
          <Button variant="quiet" size="sm" onclick={() => (ideas = suggestNames(3))}>{L.naming.reroll}</Button>
        </div>
        {#if error}<p class="t-small t-bad">{error}</p>{/if}
        <Button variant="gold" size="lg" wide type="submit" silent disabled={sending}
          >{sending ? L.net.connecting : L.naming.found}</Button
        >
        {#if onlogin}
          <div class="row wrap center">
            <Button variant="quiet" size="sm" onclick={to('email')}>{L.account.have} {L.account.login}</Button>
            <Button variant="quiet" size="sm" onclick={to('code')}>{L.account.enterCode}</Button>
          </div>
        {/if}
      </Leaf>
      {#if step === 'stamp'}
        <Slam name={name.trim()}>
          <Medal emblem={dao} tone={DAO_TONES[dao]} size={136} />
          {#snippet after()}{#if wait}<TapHint>{L.net.connecting}</TapHint>{/if}{/snippet}
        </Slam>
      {/if}
    </Cover>
  {/if}
</Splash>
