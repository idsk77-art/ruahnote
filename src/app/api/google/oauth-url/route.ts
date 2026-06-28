export const dynamic = "force-dynamic";

import { createHmac } from "node:crypto";

import { createServiceSupabaseClient } from "@/lib/supabase/server";

const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function stateSecret() {
  return process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? process.env.GOOGLE_CLIENT_SECRET;
}

function base64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function signState(payload: string) {
  return createHmac("sha256", stateSecret() as string)
    .update(payload)
    .digest("base64url");
}

function redirectUri(request: Request) {
  if (hasValue(process.env.GOOGLE_REDIRECT_URI)) {
    return process.env.GOOGLE_REDIRECT_URI as string;
  }

  return new URL("/api/google/oauth-callback", request.url).toString();
}

export async function GET(request: Request) {
  if (!hasValue(process.env.GOOGLE_CLIENT_ID) || !hasValue(stateSecret())) {
    return Response.json(
      {
        configured: false,
        error:
          "GOOGLE_CLIENT_ID or GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return Response.json(
      { configured: true, error: "RuahNote login session is required." },
      { status: 401 },
    );
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  const userId = data.user?.id;

  if (error || !userId) {
    return Response.json(
      { configured: true, error: "Invalid RuahNote login session." },
      { status: 401 },
    );
  }

  const statePayload = JSON.stringify({
    userId,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 10 * 60 * 1000,
  });
  const state = `${base64Url(statePayload)}.${signState(statePayload)}`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID as string);
  authUrl.searchParams.set("redirect_uri", redirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("scope", googleScopes.join(" "));
  authUrl.searchParams.set("state", state);

  return Response.json({
    configured: true,
    authUrl: authUrl.toString(),
    redirectUri: redirectUri(request),
    state,
    scopes: googleScopes,
  });
}
