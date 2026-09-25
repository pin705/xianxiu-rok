// Tiện ích lưu trong state (máy nào cũng thấy): ghi nhớ chỗ trên bản đồ giới (Bookmarks của RoK — bấm lại cùng ô thì bỏ),
// trận đồ (march presets: trưởng lão + đệ tử, 3 ô).
import { MAP_W } from '../atlas.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { cleanText, int, isElder, pickArmy } from '../core/parse.ts'
import type { Army } from '../core/types.ts'
import type { ElderId } from '../data.ts'
import { PINS_MAX } from '../data.ts'

export const PRESETS = 3
export type PinAction =
  { type: 'pin'; x: number; y: number; text: string } | { type: 'preset'; i: number; elder: ElderId; army: Army }
const isXY = int(0, MAP_W - 1)

export const pinActions: Actions<PinAction> = {
  pin: {
    pick: a => {
      const text = cleanText(a.text)
      return isXY(a.x) && isXY(a.y) && [...text].length <= 24 ? { type: 'pin', x: a.x, y: a.y, text } : null
    },
    run: (s, a) => {
      const pins = s.pins ?? []
      const rest = pins.filter(p => p.x !== a.x || p.y !== a.y)
      if (rest.length < pins.length) return ok({ ...s, pins: rest })
      if (pins.length >= PINS_MAX) return no('full')
      return ok({ ...s, pins: [...pins, { x: a.x, y: a.y, text: a.text }] })
    },
  },
  preset: {
    pick: a => {
      const army = pickArmy(a.army)
      return int(0, PRESETS - 1)(a.i) && isElder(a.elder) && army
        ? { type: 'preset', i: a.i, elder: a.elder, army }
        : null
    },
    run: (s, a) => {
      const presets = Array.from({ length: PRESETS }, (_, k) =>
        k === a.i ? { elder: a.elder, army: a.army } : (s.presets?.[k] ?? null),
      )
      return ok({ ...s, presets })
    },
  },
}
