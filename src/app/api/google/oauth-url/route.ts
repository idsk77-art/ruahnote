export const dynamic = "force-dynamic";

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

function redirectUri(request: Request) {
  if (hasValue(process.env.GOOGLE_REDIRECT_URI)) {
    return process.env.GOOGLE_REDIRECT_URI as string;
  }

  return new URL("/api/google/oauth-callback", request.url).toString();
}

export async function GET(request: Request) {
  if (!hasValue(process.env.GOOGLE_CLIENT_ID)) {
    return Response.json(
      { configured: false, error: "GOOGLE_CLIENT_ID is not configured." },
      { status: 503 },
    );
  }

  const state = crypto.randomUUID();
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
