import { join } from 'node:path'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate as runMigrations } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema.ts'

export type Database = PostgresJsDatabase<typeof schema>
export type Db = { db: Database; client: postgres.Sql }

export function createDb(url: string, max = 10): Db {
  const client = postgres(url, {
    max,
    idle_timeout: 60,
    connect_timeout: 10,
    onnotice: () => {},
    connection: { application_name: 'rok' },
  })
  return { db: drizzle(client, { schema, casing: 'snake_case' }), client }
}

// Chạy migration của drizzle-kit. Khoá advisory: nhiều node khởi động cùng lúc không chạy chồng.
export async function migrate(d: Db) {
  const lock = await d.client.reserve()
  try {
    await lock`select pg_advisory_lock(hashtext('rok:migrate'))`
    await runMigrations(d.db, { migrationsFolder: join(import.meta.dirname, '../../drizzle') })
  } finally {
    await lock`select pg_advisory_unlock(hashtext('rok:migrate'))`
    lock.release()
  }
}

export { schema }
