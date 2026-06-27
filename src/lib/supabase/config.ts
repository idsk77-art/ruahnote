const serverKeys = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

type BrowserSupabaseConfig = {
  url: string;
  publishableKey: string;
};

type ServerSupabaseConfig = BrowserSupabaseConfig & {
  serviceRoleKey: string;
};

function missingEnv(keys: readonly string[]) {
  return keys.filter((key) => !process.env[key]);
}

export function hasBrowserSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getBrowserSupabaseConfig(): BrowserSupabaseConfig {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    process.env.NEXT_PUBLIC_SUPABASE_URL ? null : "NEXT_PUBLIC_SUPABASE_URL",
    publishableKey
      ? null
      : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter((key): key is string => Boolean(key));

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    publishableKey: publishableKey as string,
  };
}

export function getServerSupabaseConfig(): ServerSupabaseConfig {
  const browserConfig = getBrowserSupabaseConfig();
  const missing = missingEnv(serverKeys);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase server environment variables: ${missing.join(", ")}`);
  }

  return {
    ...browserConfig,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}
