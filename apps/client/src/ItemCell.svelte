<script lang="ts">
  // Một ô vật phẩm trong túi đồ: hình họ vật phẩm, mệnh giá góc trên, số lượng góc dưới (như ô đồ của RoK).
  import { bagFamily, type BagId } from '@rok/rules'
  import { Goods } from './ui'
  import { denom, itemName } from './bag'
  import { num } from './lib'

  let {
    id,
    n,
    selected = false,
    onclick,
  }: { id: BagId; n: number; selected?: boolean; onclick?: () => void } = $props()
</script>

<Goods icon={bagFamily(id)} tag={denom(id)} n={num(n)} on={selected} label="{itemName(id)} ×{n}" {onclick} />
