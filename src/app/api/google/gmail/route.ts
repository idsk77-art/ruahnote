export const dynamic = "force-dynamic";

import { decryptGoogleToken, encryptGoogleToken } from "@/lib/google/tokens";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type GoogleAccount = {
  id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
};

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailHeader[];
    parts?: Array<{
      mimeType?: string;
      body?: { data?: string };
    }>;
    body?: { data?: string };
  };
  internalDate?: string;
};

type DraftRequest = {
  to?: string;
  subject?: string;
  body?: string;
};

function accessTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

function headerValue(message: GmailMessage, name: string) {
  return (
    message.payload?.headers?.find(
      (header) => header.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? null
  );
}

function decodeBase64Url(data: string | undefined) {
  if (!data) return "";
  return Buffer.from(data, "base64url").toString("utf8");
}

function textBody(message: GmailMessage) {
  const directText = decodeBase64Url(message.payload?.body?.data);
  if (directText) return directText;

  const textPart = message.payload?.parts?.find((part) =>
    part.mimeType?.startsWith("text/plain"),
  );
  return decodeBase64Url(textPart?.body?.data);
}

function mapMessage(message: GmailMessage) {
  return {
    id: message.id,
    threadId: message.threadId ?? null,
    from: headerValue(message, "From"),
    to: headerValue(message, "To"),
    subject: headerValue(message, "Subject") ?? "(제목 없음)",
    date: headerValue(message, "Date"),
    snippet: message.snippet ?? "",
    labels: message.labelIds ?? [],
    body: textBody(message),
    internalDate: message.internalDate ?? null,
  };
}

function rawDraft({ body, subject, to }: Required<DraftRequest>) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message, "utf8").toString("base64url");
}

function googleErrorPayload(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    return (data as { error?: unknown }).error ?? fallback;
  }

  return data ?? fallback;
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
  init?: RequestInit,
) {
  let response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      authorization: `Bearer ${accessToken}`,
    },
  });
  let nextAccessToken = accessToken;
  let nextExpiresAt: string | null = null;

  if (response.status === 401) {
    const refreshed = await refreshGoogleAccessToken(account);
    if (refreshed) {
      nextAccessToken = refreshed.accessToken;
      nextExpiresAt = refreshed.expiresAt;
      response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          authorization: `Bearer ${nextAccessToken}`,
        },
      });
    }
  }

  return { response, nextAccessToken, nextExpiresAt };
}

async function googleAccount(request: Request) {
  const supabaseToken = accessTokenFromRequest(request);
  if (!supabaseToken) {
    return { error: Response.json({ error: "RuahNote login is required." }, { status: 401 }) };
  }

  const supabase = createServiceSupabaseClient();
  const { data: userData, error: userError } =
    await supabase.auth.getUser(supabaseToken);
  const userId = userData.user?.id;

  if (userError || !userId) {
    return { error: Response.json({ error: "Invalid RuahNote login." }, { status: 401 }) };
  }

  const { data: account, error: accountError } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (accountError) {
    return { error: Response.json({ error: accountError.message }, { status: 500 }) };
  }

  if (!account) {
    return {
      error: Response.json(
        { error: "Google account is not connected." },
        { status: 404 },
      ),
    };
  }

  return { account, supabase };
}

export async function GET(request: Request) {
  const accountResult = await googleAccount(request);
  if (accountResult.error) return accountResult.error;

  const { account, supabase } = accountResult;
  let currentAccessToken = decryptGoogleToken(account.access_token_enc);
  const url = new URL(request.url);
  const messageId = url.searchParams.get("messageId");

  if (messageId) {
    const messageUrl = new URL(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    );
    messageUrl.searchParams.set("format", "full");
    const result = await googleFetch(messageUrl, currentAccessToken, account);
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
      | GmailMessage
      | { error?: unknown }
      | null;

    if (!result.response.ok) {
      return Response.json(
        {
          error: googleErrorPayload(
            data,
            `Gmail message failed with HTTP ${result.response.status}.`,
          ),
        },
        { status: result.response.status },
      );
    }

    return Response.json({ message: mapMessage(data as GmailMessage) });
  }

  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  );
  listUrl.searchParams.set("maxResults", "10");
  const query = url.searchParams.get("q")?.trim();
  if (query) listUrl.searchParams.set("q", query);

  const listResult = await googleFetch(listUrl, currentAccessToken, account);
  currentAccessToken = listResult.nextAccessToken;
  const listData = (await listResult.response.json().catch(() => null)) as
    | { messages?: Array<{ id: string }>; resultSizeEstimate?: number; error?: unknown }
    | null;

  if (!listResult.response.ok) {
    return Response.json(
      {
        error:
          listData?.error ??
          `Gmail list failed with HTTP ${listResult.response.status}.`,
      },
      { status: listResult.response.status },
    );
  }

  const messages = await Promise.all(
    (listData?.messages ?? []).map(async (message) => {
      const messageUrl = new URL(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
      );
      messageUrl.searchParams.set("format", "metadata");
      messageUrl.searchParams.set("metadataHeaders", "From");
      messageUrl.searchParams.append("metadataHeaders", "Subject");
      messageUrl.searchParams.append("metadataHeaders", "Date");
      const result = await googleFetch(messageUrl, currentAccessToken, account);
      if (result.nextAccessToken !== currentAccessToken) {
        currentAccessToken = result.nextAccessToken;
      }
      const data = (await result.response.json().catch(() => null)) as
        | GmailMessage
        | null;

      if (!result.response.ok || !data) return null;

      return mapMessage(data);
    }),
  );

  if (listResult.nextExpiresAt) {
    await supabase
      .from("google_accounts")
      .update({
        access_token_enc: encryptGoogleToken(currentAccessToken),
        expires_at: listResult.nextExpiresAt,
      })
      .eq("id", account.id);
  }

  return Response.json({
    messages: messages.filter((message): message is ReturnType<typeof mapMessage> =>
      Boolean(message),
    ),
    resultSizeEstimate: listData?.resultSizeEstimate ?? 0,
  });
}

export async function POST(request: Request) {
  const accountResult = await googleAccount(request);
  if (accountResult.error) return accountResult.error;

  const body = (await request.json().catch(() => null)) as DraftRequest | null;
  const to = body?.to?.trim();
  const subject = body?.subject?.trim();
  const draftBody = body?.body?.trim();

  if (!to || !subject || !draftBody) {
    return Response.json(
      { error: "to, subject, and body are required." },
      { status: 400 },
    );
  }

  const { account, supabase } = accountResult;
  let currentAccessToken = decryptGoogleToken(account.access_token_enc);
  const draftUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
  );
  const result = await googleFetch(draftUrl, currentAccessToken, account, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        raw: rawDraft({ to, subject, body: draftBody }),
      },
    }),
  });
  currentAccessToken = result.nextAccessToken;
  const data = (await result.response.json().catch(() => null)) as unknown;

  if (result.nextExpiresAt) {
    await supabase
      .from("google_accounts")
      .update({
        access_token_enc: encryptGoogleToken(currentAccessToken),
        expires_at: result.nextExpiresAt,
      })
      .eq("id", account.id);
  }

  if (!result.response.ok) {
    return Response.json(
      {
        error: googleErrorPayload(
          data,
          `Gmail draft failed with HTTP ${result.response.status}.`,
        ),
      },
      { status: result.response.status },
    );
  }

  return Response.json({ draft: data });
}
