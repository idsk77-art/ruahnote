import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseConfig } from "./config";
import type { Database } from "./types";

export function createServiceSupabaseClient() {
  const { serviceRoleKey, url } = getServerSupabaseConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
