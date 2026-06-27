import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const envPath = path.resolve(".env.local");
const migrationDir = path.resolve("supabase", "migrations");

async function loadLocalEnv() {
  const content = await readFile(envPath, "utf8").catch(() => "");

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    process.env[key.trim()] ??= value.trim();
  }
}

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function appliedVersions(client) {
  const result = await client.query("select version from public.schema_migrations");
  return new Set(result.rows.map((row) => row.version));
}

async function main() {
  await loadLocalEnv();

  const connectionString =
    process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DATABASE_POOLER_URL is missing. Add one to .env.local first.",
    );
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      throw new Error(
        "Could not resolve the Supabase DB host. If DATABASE_URL uses db.<project-ref>.supabase.co, use the Supabase Session Pooler connection string as DATABASE_POOLER_URL.",
      );
    }

    throw error;
  }

  try {
    await ensureMigrationTable(client);
    const applied = await appliedVersions(client);
    const files = (await readdir(migrationDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip ${file}`);
        continue;
      }

      const sql = await readFile(path.join(migrationDir, file), "utf8");

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into public.schema_migrations (version) values ($1)",
          [file],
        );
        await client.query("commit");
        console.log(`applied ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`Failed to apply ${file}: ${error.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
