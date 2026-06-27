export const dynamic = "force-dynamic";

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Response.json({
    ok: true,
    app: "RuahNote",
    version: process.env.npm_package_version ?? "0.1.0",
    checkedAt: new Date().toISOString(),
    env: {
      supabaseUrl: hasValue(supabaseUrl),
      supabasePublishableKey: hasValue(supabasePublishableKey),
      supabaseServiceRoleKey: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
      databaseUrl: hasValue(process.env.DATABASE_URL),
      openAiApiKey: hasValue(process.env.OPENAI_API_KEY),
    },
  });
}
