<script lang="ts">
  // Các bảng nổi mở từ nhiều nơi qua cờ social (App chỉ gắn một lần): khán giả Linh Châu, Trận Pháp, Thí Luyện
  import type { Net } from './net'
  import ArkWatch from './ArkWatch.svelte'
  import Formation from './Formation.svelte'
  import Trials from './Trials.svelte'
  import Campaign from './Campaign.svelte'
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'

  let {
    api,
    onfests,
    onally,
    ally,
    send,
  }: {
    api: Pick<Net, 'ask'> | null
    onfests: () => void
    onally: () => void
    ally: boolean
    send: (a: WorldAction) => Promise<Ack>
  } = $props()
</script>

<ArkWatch {api} />
<Formation />
<Trials {onfests} {onally} {ally} />
<Campaign {send} />
