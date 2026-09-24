// @rok/rules/world — luật giữa các tông môn trong một giới: cướp, tiên minh, bản đồ giới (điểm, kết trận, mùa), chợ.
// Thuần như @rok/rules (không I/O, giờ truyền vào). Giải trận cần state của cả hai bên và mầm thật nên chỉ server gọi
// (actor của giới, tuần tự: cướp là nguyên tử); client dùng defense / scout / raidError… để vẽ và ước lượng.
export * from './atlas.ts'
export * from './world/base.ts'
export * from './world/fight.ts'
export * from './world/points.ts'
export * from './world/raid.ts'
export * from './world/alliance.ts'
export * from './world/guild.ts'
export * from './world/mob.ts'
export * from './world/arena.ts'
export * from './world/spots.ts'
export * from './world/arrive.ts'
export * from './world/season.ts'
export * from './world/market.ts'
export * from './world/map.ts'
export * from './world/advance.ts'
export * from './world/act.ts'
