export const dynamic = "force-dynamic";

import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { decryptGoogleToken, encryptGoogleToken } from "@/lib/google/tokens";

type GoogleAccount = {
  id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
};

type CalendarListItem = {
  id: string;
  summary?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  selected?: boolean;
  accessRole?: string;
};

type CalendarEvent = {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function accessTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

async function refreshGoogleAccessToken(account: GoogleAccount) {
  if (!account.refresh_token_enc) return null;

  const refreshToken = decryptGoogleToken(account.refresh_token_enc);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: unknown }
    | null;

  if (!response.ok || !data?.access_token) return null;

  return {
    accessToken: data.access_token,
    expiresAt:
      typeof data.expires_in === "number"
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
  };
}

async function googleFetch(
  url: URL,
  accessToken: string,
  account: GoogleAccount,
) {
  let response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  let nextAccessToken = accessToken;
  let nextExpiresAt: string | null = null;

  if (response.status === 401) {
    const refreshed = await refreshGoogleAccessToken(account);
    if (refreshed) {
      nextAccessToken = refreshed.accessToken;
      nextExpiresAt = refreshed.expiresAt;
      response = await fetch(url, {
        headers: { authorization: `Bearer ${nextAccessToken}` },
      });
    }
  }

  return { response, nextAccessToken, nextExpiresAt };
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
  let currentAccessToken = googleAccessToken;
  const requestedCalendarIds = new URL(request.url).searchParams
    .get("calendarIds")
    ?.split(",")
    .map((calendarId) => calendarId.trim())
    .filter(Boolean);

  const calendarListUrl = new URL(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
  );
  calendarListUrl.searchParams.set("showHidden", "false");
  calendarListUrl.searchParams.set("minAccessRole", "reader");
  const calendarListResult = await googleFetch(
    calendarListUrl,
    currentAccessToken,
    account,
  );
  currentAccessToken = calendarListResult.nextAccessToken;

  if (calendarListResult.nextExpiresAt) {
    await supabase
      .from("google_accounts")
      .update({
        access_token_enc: encryptGoogleToken(currentAccessToken),
        expires_at: calendarListResult.nextExpiresAt,
      })
      .eq("id", account.id);
  }

  const calendarListData = (await calendarListResult.response
    .json()
    .catch(() => null)) as { items?: CalendarListItem[]; error?: unknown } | null;

  if (!calendarListResult.response.ok) {
    return Response.json(
      {
        error:
          calendarListData?.error ??
          `Google Calendar list failed with HTTP ${calendarListResult.response.status}.`,
      },
      { status: calendarListResult.response.status },
    );
  }

  const calendars = calendarListData?.items ?? [];
  const selectedCalendarIds =
    requestedCalendarIds && requestedCalendarIds.length > 0
      ? requestedCalendarIds
      : calendars.map((calendar) => calendar.id);
  const now = new Date();
  const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const eventResults = await Promise.all(
    selectedCalendarIds.map(async (calendarId) => {
      const calendarUrl = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId,
        )}/events`,
      );
      calendarUrl.searchParams.set("singleEvents", "true");
      calendarUrl.searchParams.set("orderBy", "startTime");
      calendarUrl.searchParams.set("maxResults", "50");
      calendarUrl.searchParams.set("timeMin", now.toISOString());
      calendarUrl.searchParams.set("timeMax", timeMax.toISOString());

      const result = await googleFetch(calendarUrl, currentAccessToken, account);
      const data = (await result.response.json().catch(() => null)) as
        | { items?: CalendarEvent[]; error?: unknown }
        | null;

      return {
        calendarId,
        ok: result.response.ok,
        status: result.response.status,
        error: data?.error,
        items: (data?.items ?? []).map((event) => ({
          ...event,
          calendarId,
          calendarSummary:
            calendars.find((calendar) => calendar.id === calendarId)?.summary ??
            calendarId,
        })),
      };
    }),
  );

  const firstError = eventResults.find((result) => !result.ok);
  if (firstError) {
    return Response.json(
      {
        error:
          firstError.error ??
          `Google Calendar ${firstError.calendarId} failed with HTTP ${firstError.status}.`,
      },
      { status: firstError.status },
    );
  }

  const items = eventResults
    .flatMap((result) => result.items)
    .sort((left, right) => {
      const leftStart = left.start?.dateTime ?? left.start?.date ?? "";
      const rightStart = right.start?.dateTime ?? right.start?.date ?? "";
      return leftStart.localeCompare(rightStart);
    });

  return Response.json({
    calendars,
    selectedCalendarIds,
    items,
  });
}
