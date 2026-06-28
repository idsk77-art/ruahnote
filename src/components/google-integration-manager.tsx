"use client";

import { useState } from "react";

type OAuthUrlResponse = {
  configured?: boolean;
  authUrl?: string;
  redirectUri?: string;
  scopes?: string[];
  error?: string;
};

export default function GoogleIntegrationManager() {
  const [oauthData, setOauthData] = useState<OAuthUrlResponse | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadOAuthUrl() {
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/google/oauth-url");
    const data = (await response.json().catch(() => null)) as OAuthUrlResponse | null;
    setOauthData(data);

    if (!response.ok) {
      setMessage(data?.error ?? "Google OAuth 설정을 확인하세요.");
    }

    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <header className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <p className="text-xs font-bold text-[var(--muted)]">RuahNote</p>
          <h1 className="mt-1 text-2xl font-black text-[var(--text)]">
            Google 연동
          </h1>
          <p className="mt-2 text-sm font-semibold text-[var(--soft-text)]">
            Google OAuth 연결 URL을 생성하고 Calendar, Contacts, Gmail 연동을 준비합니다.
          </p>
        </header>

        <section className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">OAuth</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                Client ID/Secret과 redirect URI가 준비되면 Google 승인 화면으로 이동할 수 있습니다.
              </p>
            </div>
            <button
              className="h-11 rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-4 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="button"
              onClick={loadOAuthUrl}
            >
              {isLoading ? "확인 중" : "연결 URL 생성"}
            </button>
          </div>

          {message ? (
            <p className="mt-4 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
              {message}
            </p>
          ) : null}

          {oauthData?.authUrl ? (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
              <p className="text-sm font-bold text-[var(--text)]">Redirect URI</p>
              <p className="mt-1 break-all text-sm font-semibold text-[var(--muted)]">
                {oauthData.redirectUri}
              </p>
              <a
                className="mt-4 inline-flex h-11 items-center rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)]"
                href={oauthData.authUrl}
              >
                Google 승인 화면 열기
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
                {(oauthData.scopes ?? []).map((scope) => (
                  <span
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--muted)]"
                    key={scope}
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
