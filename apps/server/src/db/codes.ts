// Mã quà tặng (Redeem Code của RoK): admin tạo; mỗi tài khoản đổi một lần mỗi mã, có thể giới hạn tổng lượt và hạn dùng.
import { and, eq, sql } from 'drizzle-orm'
import type { Reward } from '@rok/rules'
import type { Database } from './index.ts'
import { giftCodes, giftRedeems } from './schema.ts'

// Chuẩn hoá mã người chơi gõ: chữ hoa, bỏ khoảng trắng và gạch nối
export const cleanGiftCode = (raw: string) => raw.normalize('NFC').toUpperCase().replace(/[\s-]/g, '')

// Tạo mã: false nếu mã đã có
export async function addGiftCode(db: Database, c: { code: string; gift: Reward; max?: number; until?: Date }) {
  const r = await db
    .insert(giftCodes)
    .values({ code: c.code, gift: c.gift, max: c.max ?? null, until: c.until ?? null })
    .onConflictDoNothing()
    .returning({ code: giftCodes.code })
  return r.length > 0
}

// Đổi mã: quà, hoặc lý do — 'code': không có / hết hạn · 'used': tài khoản này đổi rồi · 'gone': hết lượt.
// Khoá hàng mã trong transaction: nhiều người đổi cùng lúc không vượt max.
export async function redeemGiftCode(
  db: Database,
  code: string,
  account: number,
): Promise<{ gift: Reward } | { error: 'code' | 'used' | 'gone' }> {
  return db.transaction(async tx => {
    const [c] = await tx.select().from(giftCodes).where(eq(giftCodes.code, code)).for('update')
    if (!c || (c.until && c.until.getTime() < Date.now())) return { error: 'code' as const }
    const mine = await tx
      .select({ at: giftRedeems.at })
      .from(giftRedeems)
      .where(and(eq(giftRedeems.code, code), eq(giftRedeems.accountId, account)))
    if (mine.length) return { error: 'used' as const }
    if (c.max !== null && c.uses >= c.max) return { error: 'gone' as const }
    const got = await tx
      .insert(giftRedeems)
      .values({ code, accountId: account })
      .onConflictDoNothing()
      .returning({ code: giftRedeems.code })
    if (!got.length) return { error: 'used' as const }
    await tx
      .update(giftCodes)
      .set({ uses: sql`${giftCodes.uses} + 1` })
      .where(eq(giftCodes.code, code))
    return { gift: c.gift as Reward }
  })
}
