// Ranh giới monorepo: mỗi package chỉ được import những package @rok/* ghi dưới đây, không import tương đối ra ngoài thư mục mình.
// apps/* dùng packages/*, không bao giờ ngược lại. rules là lõi thuần: không phụ thuộc gì — server chạy lại đúng luật này.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ALLOWED: Record<string, string[]> = {
  'packages/rules': [],
  'packages/art': [],
  'packages/i18n': ['rules'],
  'packages/protocol': ['rules'],
  'apps/client': ['rules', 'art', 'i18n', 'protocol'],
  'apps/server': ['rules', 'protocol', 'i18n'], // i18n: chữ của Web Push (app đang đóng, client không dựng được)
}
const root = import.meta.dirname
const importsOf = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map(m => m[1])

test('mỗi package chỉ import đúng các package được phép, không với ra ngoài thư mục mình', () => {
  const bad: string[] = []
  const dirs = ['packages', 'apps'].flatMap(g => readdirSync(join(root, g)).map(d => `${g}/${d}`))
  for (const dir of dirs) {
    const allowed = ALLOWED[dir]
    if (!allowed) {
      bad.push(`${dir}: package mới — thêm vào ALLOWED trong architecture.test.ts`)
      continue
    }
    const files = readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' }).filter(
      f => /\.(ts|svelte|mjs)$/.test(f) && !/(^|\/)(node_modules|dist)\//.test(f),
    )
    for (const f of files) {
      for (const spec of importsOf(join(root, dir, f))) {
        const pkg = spec.match(/^@rok\/([\w-]+)/)?.[1]
        if (pkg && !allowed.includes(pkg)) bad.push(`${dir}/${f}: không được import @rok/${pkg}`)
        if (
          spec.startsWith('.') &&
          relative(join(root, dir), resolve(dirname(join(root, dir, f)), spec)).startsWith('..')
        )
          bad.push(`${dir}/${f}: import '${spec}' ra ngoài package — dùng @rok/*`)
      }
    }
  }
  assert.deepEqual(bad, [])
})

// Bên trong rules chỉ import xuống: core ← sect ← world. File tính năng (sect/<tên>, world/<tên>) chỉ dùng tầng dưới và
// phần dùng chung của tầng mình, không import tính năng khác. Chỉ file điều phối gộp các tính năng lại.
// Thêm tính năng không phải sửa tính năng khác.
const LOW = ['data.ts', 'combat.ts', 'atlas.ts']
const LAYERS: Record<string, { below: string[]; shared: string[]; gather: string[] }> = {
  core: { below: [], shared: ['*'], gather: [] },
  sect: { below: ['core/'], shared: [], gather: ['apply.ts'] },
  world: {
    below: ['core/', 'sect/'],
    shared: ['base.ts', 'fight.ts', 'points.ts'],
    gather: ['act.ts', 'advance.ts', 'season.ts'],
  },
}
test('rules: chỉ import xuống (core ← sect ← world), tính năng không import tính năng khác', () => {
  const rules = join(root, 'packages/rules')
  const bad: string[] = []
  for (const [layer, { below, shared, gather }] of Object.entries(LAYERS))
    for (const f of readdirSync(join(rules, layer)).filter(f => f.endsWith('.ts'))) {
      for (const spec of importsOf(join(rules, layer, f)).filter(s => s.startsWith('.'))) {
        const to = relative(rules, resolve(rules, layer, spec))
        const own = to.startsWith(`${layer}/`) && to.slice(layer.length + 1)
        const ok =
          LOW.includes(to) ||
          below.some(b => to.startsWith(b)) ||
          (own && (shared.includes('*') || shared.includes(own) || gather.includes(f)))
        if (!ok) bad.push(`rules/${layer}/${f}: không được import ${to}`)
      }
    }
  assert.deepEqual(bad, [])
})

// Màn không có CSS riêng: mọi giao diện là component / lớp / biến trong apps/client/src/ui (bộ giao diện dùng lại).
// Màn chỉ ghép: không khối <style>, không `style:` tự đặt kiểu — trừ biến tham số (style:--gap, --cols…) và vị trí tính từ
// dữ liệu (left/top/width/height/translate/rotate: ghim nhãn trên cảnh, thanh theo tỉ lệ). Cần kiểu mới → thêm vào ui/.
// PENDING: các màn còn CSS cũ đang chờ chuyển sang ui/ — chỉ được bớt, không được thêm (chuyển xong thì xoá khỏi danh sách).
const GEOM = new Set(['left', 'top', 'right', 'bottom', 'width', 'height', 'translate', 'rotate', 'transform'])
const PENDING = new Set<string>([
  'Account.svelte',
  'Achievements.svelte',
  'Advisor.svelte',
  'Alchemy.svelte',
  'Alliance.svelte',
  'AllyMob.svelte',
  'AllyPlans.svelte',
  'AllyQuiz.svelte',
  'AllyShop.svelte',
  'AllySkills.svelte',
  'AllyTech.svelte',
  'App.svelte',
  'Arena.svelte',
  'ArkCard.svelte',
  'Army.svelte',
  'AwaySummary.svelte',
  'Buffs.svelte',
  'Chat.svelte',
  'Conn.svelte',
  'Daily.svelte',
  'DaoChoose.svelte',
  'DaoPick.svelte',
  'Delve.svelte',
  'Dice.svelte',
  'Disciples.svelte',
  'Drill.svelte',
  'Egg.svelte',
  'ElderReveal.svelte',
  'ElderStory.svelte',
  'Events.svelte',
  'Forge.svelte',
  'GiftStrip.svelte',
  'Guard.svelte',
  'Help.svelte',
  'Honor.svelte',
  'Hud.svelte',
  'ItemCell.svelte',
  'Items.svelte',
  'JobRow.svelte',
  'Library.svelte',
  'Market.svelte',
  'Maze.svelte',
  'Merchant.svelte',
  'Panel.svelte',
  'Pass.svelte',
  'PowerSheet.svelte',
  'Profile.svelte',
  'Quiz.svelte',
  'Ranks.svelte',
  'Refill.svelte',
  'Replay.svelte',
  'Reports.svelte',
  'ResSheet.svelte',
  'Rescue.svelte',
  'Result.svelte',
  'Rivals.svelte',
  'SeasonCal.svelte',
  'Settings.svelte',
  'SpeedUp.svelte',
  'Supply.svelte',
  'Target.svelte',
  'Tavern.svelte',
  'Thief.svelte',
  'TileSheet.svelte',
  'Title.svelte',
  'Trade.svelte',
  'Train.svelte',
  'Trial.svelte',
  'Unlocks.svelte',
  'Vault.svelte',
  'VipSheet.svelte',
  'Wheel.svelte',
  'Wish.svelte',
  'world/Holdings.svelte',
  'world/Home.svelte',
  'world/MapView.svelte',
  'world/Minimap.svelte',
  'world/View.svelte',
  'world/WorldView.svelte',
])
function screenStyle(src: string): string[] {
  const out: string[] = []
  if (/<style[\s>]/.test(src)) out.push('<style>')
  for (const m of src.matchAll(/\bstyle:([a-z-]+)/g))
    if (!m[1].startsWith('--') && !GEOM.has(m[1])) out.push(`style:${m[1]}`)
  for (const m of src.matchAll(/\bstyle="([^"{]*)"/g)) if (/(^|;)\s*[a-z]/.test(m[1])) out.push(`style="${m[1]}"`)
  return out
}
test('màn không tự viết CSS: mọi kiểu nằm trong apps/client/src/ui', () => {
  const dir = join(root, 'apps/client/src')
  const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
    f => f.endsWith('.svelte') && !f.startsWith('ui/'),
  )
  const bad: string[] = []
  const done: string[] = []
  for (const f of files) {
    const hits = screenStyle(readFileSync(join(dir, f), 'utf8'))
    if (hits.length && !PENDING.has(f))
      bad.push(`${f}: ${[...new Set(hits)].join(', ')} — dùng component/lớp trong ui/`)
    if (!hits.length && PENDING.has(f)) done.push(`${f}: đã sạch — xoá khỏi PENDING trong architecture.test.ts`)
  }
  assert.deepEqual([...bad, ...done], [])
})
