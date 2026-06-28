export const dynamic = "force-dynamic";

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
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
    !hasValue(process.env.GOOGLE_CLIENT_SECRET)
  ) {
    return Response.json(
      { error: "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  if (!code) {
    return Response.json({ error: "Missing Google OAuth code." }, { status: 400 });
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

  return Response.json({
    connected: true,
    tokenType: tokenData?.token_type ?? null,
    expiresIn: tokenData?.expires_in ?? null,
    scope: tokenData?.scope ?? null,
    hasAccessToken: hasValue(tokenData?.access_token),
    hasRefreshToken: hasValue(tokenData?.refresh_token),
    nextStep:
      "Persist tokens with server-side encryption after Supabase user session binding is added.",
  });
}
