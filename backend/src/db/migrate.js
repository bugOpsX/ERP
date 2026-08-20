import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

/**
 * Initializes the schema_migrations table if it does not exist.
 * @param {import('pg').PoolClient} client
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Resets the development database by dropping application tables.
 * @param {import('pg').PoolClient} client
 */
async function resetDatabase(client) {
  console.log('[MIGRATE] Resetting database tables...');
  await client.query(`
    DROP TABLE IF EXISTS monthly_worker_summaries CASCADE;
    DROP TABLE IF EXISTS attendance_records CASCADE;
    DROP TABLE IF EXISTS attendance_imports CASCADE;
    DROP TABLE IF EXISTS workers CASCADE;
    DROP TABLE IF EXISTS sites CASCADE;
    DROP TABLE IF EXISTS schema_migrations CASCADE;
  `);
  console.log('[MIGRATE] Database reset complete.');
}

/**
 * Runs pending database migrations.
 */
export async function runMigrations(options = {}) {
  const client = await pool.connect();
  try {
    if (options.reset) {
      await resetDatabase(client);
    }

    await ensureMigrationsTable(client);

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const executedMigrations = new Set(rows.map((r) => r.name));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (!executedMigrations.has(file)) {
        console.log(`[MIGRATE] Applying migration: ${file}...`);
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');

        console.log(`[MIGRATE] Applied: ${file}`);
        count++;
      }
    }

    if (count === 0) {
      console.log('[MIGRATE] Database is up to date. No pending migrations.');
    } else {
      console.log(`[MIGRATE] Successfully applied ${count} migration(s).`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[MIGRATE] Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  const isReset = process.argv.includes('--reset');
  runMigrations({ reset: isReset })
    .then(() => {
      console.log('[MIGRATE] Execution finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATE] Execution failed:', err);
      process.exit(1);
    });
}
