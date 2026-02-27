/**
 * SafePlay Database Migration Runner
 *
 * Runs SQL migration files against the Supabase PostgreSQL database.
 * Uses the DATABASE_URL environment variable for connection.
 *
 * All migrations are idempotent (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING)
 * so this is safe to run on every deploy.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/run-migration.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('[Migration] No DATABASE_URL set, skipping migration.');
    return;
  }

  console.log('[Migration] Starting database migration...');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });

  try {
    await client.connect();
    console.log('[Migration] Connected to database.');

    // Read and execute the profanity engine schema
    const migrationFile = join(__dirname, '..', 'supabase-profanity-engine-schema.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    await client.query(sql);
    console.log('[Migration] Profanity engine schema applied successfully.');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('profanity_buckets', 'profanity_variants', 'video_profanity_map', 'user_bucket_preferences')
      ORDER BY table_name;
    `);

    console.log('[Migration] Verified tables:', result.rows.map(r => r.table_name).join(', '));

    // Check seed data counts
    const bucketCount = await client.query('SELECT COUNT(*) FROM public.profanity_buckets');
    const variantCount = await client.query('SELECT COUNT(*) FROM public.profanity_variants');
    console.log(`[Migration] Buckets: ${bucketCount.rows[0].count}, Variants: ${variantCount.rows[0].count}`);

  } catch (error) {
    console.error('[Migration] Migration failed:', error.message);
    // Don't crash the deployment — migration failure shouldn't prevent the app from starting
    // The app can still function without the profanity engine tables
    if (process.env.MIGRATION_STRICT === 'true') {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('[Migration] Done.');
  }
}

runMigration();
