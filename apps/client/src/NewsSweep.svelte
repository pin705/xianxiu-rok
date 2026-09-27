<script lang="ts">
  // Tin lớn toàn giới quét ngang trên núi (Newspaper của RoK · doc 8 A16): hỏi server mỗi NEWS_MS; tin mới hơn tin đã thấy (nhớ trên máy)
  // diễn một lần, tối đa một tin mỗi lần hỏi (≈ một phút); tắt được trong Cài đặt (rok.news = '0'); chạm → sang bản đồ giới
  import { chronText } from '@rok/i18n'
  import type { Chron } from '@rok/rules/world'
  import type { Net } from './net'
  import { Sweep } from './ui'
  import { L } from './lib'
  import { read, write } from './storage'

  const NEWS_MS = 60_000
  let { api, onmap }: { api: Pick<Net, 'ask'> | null; onmap: () => void } = $props()
  let item = $state<Chron | null>(null)
  async function poll() {
    if (read('rok.news') === '0') return
    const list = await api?.ask({ k: 'news' })
    const seen = Number(read('rok.newsAt') ?? 0)
    const next = (list ?? []).find(c => c.at > seen)
    if (!next) return
    write('rok.newsAt', String(next.at))
    // lần đầu (máy chưa có mốc): chỉ ghi mốc, không diễn tin cũ
    if (seen) item = next
  }
  $effect(() => {
    void poll()
    const t = setInterval(() => void poll(), NEWS_MS)
    return () => clearInterval(t)
  })
</script>

{#if item}
  {#key item.at}
    <Sweep
      text={chronText(L, item)}
      onclick={() => {
        item = null
        onmap()
      }}
    />
  {/key}
{/if}
