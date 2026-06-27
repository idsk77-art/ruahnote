"use client";

import { createClient } from "@supabase/supabase-js";

import { getBrowserSupabaseConfig } from "./config";
import type { Database } from "./types";

export function createBrowserSupabaseClient() {
  const { publishableKey, url } = getBrowserSupabaseConfig();

  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
