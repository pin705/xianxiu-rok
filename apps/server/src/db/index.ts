import { join } from 'node:path'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate as runMigrations } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema.ts'

export type Database = PostgresJsDatabase<typeof schema>
export type Db = { db: Database; client: postgres.Sql; schema?: string }

export function createDb(url: string, schemaName?: string, max = 10): Db {
  const client = postgres(url, {
    max,
    idle_timeout: 60,
    connect_timeout: 10,
    onnotice: () => {},
    connection: { application_name: 'rok', ...(schemaName && { search_path: schemaName }) },
  })
  return { db: drizzle(client, { schema, casing: 'snake_case' }), client, schema: schemaName }
}

// Chạy migration của drizzle-kit. Khoá advisory: nhiều node khởi động cùng lúc không chạy chồng.
export async function migrate(d: Db) {
  if (d.schema) await d.client.unsafe(`create schema if not exists "${d.schema}"`)
  const lock = await d.client.reserve()
  try {
    await lock`select pg_advisory_lock(hashtext('rok:migrate'))`
    await runMigrations(d.db, { migrationsFolder: join(import.meta.dirname, '../../drizzle'), migrationsSchema: d.schema ?? 'drizzle' })
  } finally {
    await lock`select pg_advisory_unlock(hashtext('rok:migrate'))`
    lock.release()
  }
}

export { schema }
