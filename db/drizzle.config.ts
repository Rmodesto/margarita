// drizzle.config.ts
import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'
dotenv.config()

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'postgresql' as const, // Changed from 'pg' to 'postgresql'
  dbCredentials: {
    host: 'db.sxulxztcslmnjscrdrlc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD!,
    database: 'postgres',
    ssl: true
  },
  verbose: true,
  strict: true
} satisfies Config