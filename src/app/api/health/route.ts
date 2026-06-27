export const dynamic = "force-dynamic";

type CheckStatus = "ready" | "missing" | "error" | "skipped";

type CheckResult = {
  status: CheckStatus;
  detail: string;
};

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkSupabaseTable(
  supabaseUrl: string | undefined,
  serviceRoleKey: string | undefined,
  tableName: string,
): Promise<CheckResult> {
  if (!hasValue(supabaseUrl) || !hasValue(serviceRoleKey)) {
    return {
      status: "missing",
      detail: "Supabase URL or service role key is not configured.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/${tableName}?select=id&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey as string,
          authorization: `Bearer ${serviceRoleKey}`,
          "user-agent": "ruahnote-healthcheck/1.0",
        },
      },
    );

    return {
      status: response.ok ? "ready" : "error",
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown Supabase table error",
    };
  }
}

async function checkSupabaseStorage(
  supabaseUrl: string | undefined,
  serviceRoleKey: string | undefined,
): Promise<CheckResult> {
  if (!hasValue(supabaseUrl) || !hasValue(serviceRoleKey)) {
    return {
      status: "missing",
      detail: "Supabase URL or service role key is not configured.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${supabaseUrl}/storage/v1/bucket/note-files`,
      {
        headers: {
          apikey: serviceRoleKey as string,
          authorization: `Bearer ${serviceRoleKey}`,
          "user-agent": "ruahnote-healthcheck/1.0",
        },
      },
    );

    return {
      status: response.ok ? "ready" : "error",
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown Supabase storage error",
    };
  }
}

async function checkOpenAi(openAiApiKey: string | undefined): Promise<CheckResult> {
  if (!hasValue(openAiApiKey)) {
    return {
      status: "missing",
      detail: "OPENAI_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/models", {
      headers: {
        authorization: `Bearer ${openAiApiKey}`,
        "user-agent": "ruahnote-healthcheck/1.0",
      },
    });

    return {
      status: response.ok ? "ready" : "error",
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown OpenAI error",
    };
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl =
    process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  const [notesTable, filesTable, storage, openAi] = await Promise.all([
    checkSupabaseTable(supabaseUrl, serviceRoleKey, "notes"),
    checkSupabaseTable(supabaseUrl, serviceRoleKey, "files"),
    checkSupabaseStorage(supabaseUrl, serviceRoleKey),
    checkOpenAi(openAiApiKey),
  ]);

  const checks = {
    database: notesTable,
    filesTable,
    storage,
    openAi,
  };
  const ok = Object.values(checks).every((check) =>
    ["ready", "missing", "skipped"].includes(check.status),
  );

  return Response.json({
    ok,
    app: "RuahNote",
    version: process.env.npm_package_version ?? "0.1.0",
    checkedAt: new Date().toISOString(),
    deployment: {
      provider: "Render",
      service: process.env.RENDER_SERVICE_NAME ?? "ruahnote",
      commit:
        process.env.RENDER_GIT_COMMIT ??
        process.env.RENDER_EXTERNAL_HOSTNAME ??
        "unknown",
    },
    env: {
      supabaseUrl: hasValue(supabaseUrl),
      supabasePublishableKey: hasValue(supabasePublishableKey),
      supabaseServiceRoleKey: hasValue(serviceRoleKey),
      databaseUrl: hasValue(databaseUrl),
      openAiApiKey: hasValue(openAiApiKey),
    },
    checks,
    usage: {
      openAiRequestsToday: 0,
      sttRequestsToday: 0,
      ocrRequestsToday: 0,
      googleApiCallsToday: 0,
      openAiCostTodayUsd: 0,
      openAiCostMonthUsd: 0,
      openAiBudgetUsd: 10,
    },
  });
}
