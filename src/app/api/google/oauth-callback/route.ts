export const dynamic = "force-dynamic";

import { createCipheriv, createHmac, randomBytes } from "node:crypto";

import { createServiceSupabaseClient } from "@/lib/supabase/server";

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function stateSecret() {
  return process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? process.env.GOOGLE_CLIENT_SECRET;
}

function encryptionKey() {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!hasValue(secret)) return null;

  return createHmac("sha256", "ruahnote-google-token")
    .update(secret as string)
    .digest();
}

function signState(payload: string) {
  return createHmac("sha256", stateSecret() as string)
    .update(payload)
    .digest("base64url");
}

function parseState(state: string | null) {
  if (!state || !hasValue(stateSecret())) return null;

  const [payloadBase64, signature] = state.split(".");
  if (!payloadBase64 || !signature) return null;

  const payload = Buffer.from(payloadBase64, "base64url").toString("utf8");
  if (signState(payload) !== signature) return null;

  const parsed = JSON.parse(payload) as { userId?: unknown; exp?: unknown };
  if (typeof parsed.userId !== "string") return null;
  if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;

  return { userId: parsed.userId };
}

function encryptToken(token: string) {
  const key = encryptionKey();
  if (!key) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function redirectUri(request: Request) {
  if (hasValue(process.env.GOOGLE_REDIRECT_URI)) {
    return process.env.GOOGLE_REDIRECT_URI as string;
  }

  return new URL("/api/google/oauth-callback", request.url).toString();
}

export async function GET(request: Request) {
  if (
    !hasValue(process.env.GOOGLE_CLIENT_ID) ||
    !hasValue(process.env.GOOGLE_CLIENT_SECRET) ||
    !hasValue(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY)
  ) {
    return Response.json(
      {
        error:
          "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = parseState(url.searchParams.get("state"));
  const error = url.searchParams.get("error");

  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  if (!code) {
    return Response.json({ error: "Missing Google OAuth code." }, { status: 400 });
  }

  if (!state) {
    return Response.json(
      { error: "Missing, invalid, or expired Google OAuth state." },
      { status: 400 },
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: redirectUri(request),
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenResponse.json().catch(() => null)) as
    | {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
        error?: unknown;
      }
    | null;

  if (!tokenResponse.ok) {
    return Response.json(
      {
        error:
          tokenData && typeof tokenData === "object" && "error" in tokenData
            ? tokenData
            : `Google token exchange failed with HTTP ${tokenResponse.status}.`,
      },
      { status: tokenResponse.status },
    );
  }

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        authorization: `Bearer ${tokenData?.access_token}`,
      },
    },
  );
  const profileData = (await profileResponse.json().catch(() => null)) as
    | { sub?: string; email?: string }
    | null;

  const expiresAt =
    typeof tokenData?.expires_in === "number"
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;
  const supabase = createServiceSupabaseClient();

  const { error: upsertError } = await supabase
    .from("google_accounts")
    .upsert(
      {
        user_id: state.userId,
        google_sub: profileData?.sub ?? null,
        email: profileData?.email ?? null,
        scope: tokenData?.scope ?? null,
        token_type: tokenData?.token_type ?? null,
        access_token_enc: encryptToken(tokenData?.access_token ?? ""),
        refresh_token_enc: tokenData?.refresh_token
          ? encryptToken(tokenData.refresh_token)
          : null,
        expires_at: expiresAt,
      },
      { onConflict: "user_id,google_sub" },
    );

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  return Response.json({
    connected: true,
    email: profileData?.email ?? null,
    tokenType: tokenData?.token_type ?? null,
    expiresIn: tokenData?.expires_in ?? null,
    scope: tokenData?.scope ?? null,
    hasAccessToken: hasValue(tokenData?.access_token),
    hasRefreshToken: hasValue(tokenData?.refresh_token),
    persisted: true,
  });
}
