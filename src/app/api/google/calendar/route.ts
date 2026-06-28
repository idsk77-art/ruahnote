export const dynamic = "force-dynamic";

import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { decryptGoogleToken } from "@/lib/google/tokens";

function accessTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

export async function GET(request: Request) {
  const supabaseToken = accessTokenFromRequest(request);
  if (!supabaseToken) {
    return Response.json({ error: "RuahNote login is required." }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const { data: userData, error: userError } =
    await supabase.auth.getUser(supabaseToken);
  const userId = userData.user?.id;

  if (userError || !userId) {
    return Response.json({ error: "Invalid RuahNote login." }, { status: 401 });
  }

  const { data: account, error: accountError } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (accountError) {
    return Response.json({ error: accountError.message }, { status: 500 });
  }

  if (!account) {
    return Response.json(
      { error: "Google account is not connected." },
      { status: 404 },
    );
  }

  const googleAccessToken = decryptGoogleToken(account.access_token_enc);
  const now = new Date();
  const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const calendarUrl = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  calendarUrl.searchParams.set("singleEvents", "true");
  calendarUrl.searchParams.set("orderBy", "startTime");
  calendarUrl.searchParams.set("maxResults", "20");
  calendarUrl.searchParams.set("timeMin", now.toISOString());
  calendarUrl.searchParams.set("timeMax", timeMax.toISOString());

  const response = await fetch(calendarUrl, {
    headers: {
      authorization: `Bearer ${googleAccessToken}`,
    },
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    return Response.json(
      { error: data ?? `Google Calendar failed with HTTP ${response.status}.` },
      { status: response.status },
    );
  }

  return Response.json(data);
}
