import { access, readFile } from "node:fs/promises";
import process from "node:process";

const requiredFiles = [
  ".env.example",
  "render.yaml",
  "scripts/apply-supabase-migrations.mjs",
  "scripts/render-start.mjs",
  "scripts/check-production-url.mjs",
  "scripts/set-admin-user.mjs",
  "supabase/migrations/0001_initial_schema.sql",
  "supabase/migrations/0002_profiles_and_storage.sql",
  "supabase/migrations/0003_admin_roles.sql",
  "supabase/migrations/0004_note_core_metadata.sql",
  "src/app/api/health/route.ts",
  "src/app/admin/page.tsx",
];

const requiredEnvExampleKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_POOLER_URL",
  "DATABASE_URL",
  "OPENAI_API_KEY",
];

const requiredPackageScripts = [
  "build",
  "lint",
  "db:migrate",
  "admin:set",
  "render:start",
  "deploy:check",
  "setup:check",
];

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missingFiles = [];

  for (const file of requiredFiles) {
    if (!(await fileExists(file))) {
      missingFiles.push(file);
    }
  }

  const envExample = await readFile(".env.example", "utf8");
  const missingEnvKeys = requiredEnvExampleKeys.filter(
    (key) => !envExample.includes(`${key}=`),
  );

  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const missingScripts = requiredPackageScripts.filter(
    (script) => !packageJson.scripts?.[script],
  );

  const renderYaml = await readFile("render.yaml", "utf8");
  const renderChecks = [
    ["buildCommand", "npm ci && npm run build"],
    ["startCommand", "npm run render:start"],
    ["NODE_VERSION", "NODE_VERSION"],
  ].filter(([, expected]) => !renderYaml.includes(expected));

  if (
    missingFiles.length > 0 ||
    missingEnvKeys.length > 0 ||
    missingScripts.length > 0 ||
    renderChecks.length > 0
  ) {
    console.error("Project setup check failed.");
    if (missingFiles.length > 0) {
      console.error(`Missing files: ${missingFiles.join(", ")}`);
    }
    if (missingEnvKeys.length > 0) {
      console.error(`Missing .env.example keys: ${missingEnvKeys.join(", ")}`);
    }
    if (missingScripts.length > 0) {
      console.error(`Missing package scripts: ${missingScripts.join(", ")}`);
    }
    if (renderChecks.length > 0) {
      console.error(
        `Missing render.yaml settings: ${renderChecks
          .map(([label]) => label)
          .join(", ")}`,
      );
    }
    process.exit(1);
  }

  console.log("Project setup check passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
