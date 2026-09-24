// Ngữ cảnh chung của mọi màn trong game: state đang chơi, giờ (đồng bộ server), thao tác, đang chờ server.
// App.svelte đặt một lần (provideGame); component lấy bằng useGame() — không truyền game / now / act qua từng tầng props.
//   const g = useGame(); const game = $derived(g.game); const now = $derived(g.now)
import { getContext, setContext } from 'svelte'
import type { Action, State } from '@rok/rules'

// Thao tác tất định: đoán trước ngay, server xác nhận sau; null khi luật từ chối (net đã báo lỗi)
export type Act = (a: Action) => State | null
export type GameCtx = { readonly game: State; readonly now: number; readonly busy: boolean; act: Act }

export const GAME = 'rok.game' // khoá context (chuỗi: test SSR và lab dựng được context mà không cần import)
export const provideGame = (c: GameCtx) => setContext(GAME, c)
export const useGame = () => getContext<GameCtx>(GAME)
