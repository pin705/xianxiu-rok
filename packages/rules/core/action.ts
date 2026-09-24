// Khung cho thao tác: mỗi tính năng (sect/*.ts) khai báo kiểu thao tác, cách đọc từ JSON (pick) và luật (run).
import { type Err, type Items, type Result, type State } from './types.ts'
import { bag } from './util.ts'
import { type Bag, type ItemId } from '../data.ts'

export const ok = (state: State): Result => ({ ok: true, state })
export const no = (error: Err): { ok: false; error: Err } => ({ ok: false, error })
// pick: dựng lại thao tác chỉ từ trường đã biết (null: không hợp lệ). run: luật, s đã đưa tới lúc thao tác (t = s.time).
export type Pick<A> = (a: Record<string, unknown>) => A | null
export type Run<A> = (s: State, a: A) => Result
export type Actions<A extends { type: string }> = {
  [K in A['type']]: { pick: Pick<Extract<A, { type: K }>>; run: Run<Extract<A, { type: K }>> }
}

export const pay = (s: State, c: Bag): Bag => bag(r => s.res[r] - c[r])
export const use = (s: State, p: ItemId, n = 1): Items => ({ ...s.items, [p]: (s.items[p] ?? 0) - n })
