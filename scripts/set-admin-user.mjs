import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

async function loadLocalEnv() {
  const content = await readFile(".env.local", "utf8").catch(() => "");

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1].trim()] ??= match[2].trim();
  }
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: npm run admin:set -- user@example.com");
  }

  await loadLocalEnv();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "User-Agent": "ruahnote-admin-tools/1.0" } },
    },
  );

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("email", email)
    .select("id,email,role")
    .single();

  if (error) {
    throw new Error(
      `Could not set admin role. Make sure the user signed up first. ${error.message}`,
    );
  }

  console.log(`admin role set for ${data.email}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
