export const dynamic = "force-dynamic";

import { decryptGoogleToken, encryptGoogleToken } from "@/lib/google/tokens";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type GoogleAccount = {
  id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
};

type GooglePerson = {
  resourceName?: string;
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
};

function accessTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

function mapPerson(person: GooglePerson) {
  const organization = person.organizations?.[0];

  return {
    id: person.resourceName ?? crypto.randomUUID(),
    name: person.names?.[0]?.displayName ?? "이름 없음",
    email: person.emailAddresses?.[0]?.value ?? null,
    phone: person.phoneNumbers?.[0]?.value ?? null,
    organization: organization?.name ?? null,
    title: organization?.title ?? null,
  };
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
    | { access_token?: string; expires_in?: number }
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

  let currentAccessToken = decryptGoogleToken(account.access_token_enc);
  const contactsUrl = new URL(
    "https://people.googleapis.com/v1/people/me/connections",
  );
  contactsUrl.searchParams.set(
    "personFields",
    "names,emailAddresses,phoneNumbers,organizations",
  );
  contactsUrl.searchParams.set("pageSize", "500");
  contactsUrl.searchParams.set("sortOrder", "LAST_MODIFIED_DESCENDING");

  const result = await googleFetch(contactsUrl, currentAccessToken, account);
  currentAccessToken = result.nextAccessToken;

  if (result.nextExpiresAt) {
    await supabase
      .from("google_accounts")
      .update({
        access_token_enc: encryptGoogleToken(currentAccessToken),
        expires_at: result.nextExpiresAt,
      })
      .eq("id", account.id);
  }

  const data = (await result.response.json().catch(() => null)) as
    | { connections?: GooglePerson[]; error?: unknown }
    | null;

  if (!result.response.ok) {
    return Response.json(
      {
        error:
          data?.error ??
          `Google Contacts failed with HTTP ${result.response.status}.`,
      },
      { status: result.response.status },
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.toLowerCase().trim();
  const contacts = (data?.connections ?? []).map(mapPerson);
  const filteredContacts = query
    ? contacts.filter((contact) =>
        [
          contact.name,
          contact.email,
          contact.phone,
          contact.organization,
          contact.title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : contacts;

  return Response.json({
    contacts: filteredContacts,
    total: contacts.length,
  });
}
