"use client";

import { useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasBrowserSupabaseConfig } from "@/lib/supabase/config";

type OAuthUrlResponse = {
  configured?: boolean;
  authUrl?: string;
  redirectUri?: string;
  scopes?: string[];
  error?: string;
};

type CalendarEvent = {
  id?: string;
  summary?: string;
  calendarId?: string;
  calendarSummary?: string;
  start?: { dateTime?: string; date?: string };
};

type CalendarListItem = {
  id: string;
  summary?: string;
  backgroundColor?: string;
  primary?: boolean;
  selected?: boolean;
};

function readableError(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;

  const candidate = error as {
    error?: unknown;
    message?: unknown;
    error_description?: unknown;
  };

  if (typeof candidate.message === "string") return candidate.message;
  if (typeof candidate.error_description === "string") {
    return candidate.error_description;
  }
  if (candidate.error && candidate.error !== error) {
    return readableError(candidate.error, fallback);
  }

  return JSON.stringify(error);
}

export default function GoogleIntegrationManager() {
  const isSupabaseConfigured = hasBrowserSupabaseConfig();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createBrowserSupabaseClient() : null),
    [isSupabaseConfigured],
  );
  const [oauthData, setOauthData] = useState<OAuthUrlResponse | null>(null);
  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadOAuthUrl() {
    setIsLoading(true);
    setMessage("");

    const { data: sessionData } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("먼저 RuahNote에 로그인한 뒤 Google 연동을 시작하세요.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/google/oauth-url", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const oauthResponse = (await response.json().catch(() => null)) as
      | OAuthUrlResponse
      | null;
    setOauthData(oauthResponse);

    if (!response.ok) {
      setMessage(oauthResponse?.error ?? "Google OAuth 설정을 확인하세요.");
    }

    setIsLoading(false);
  }

  async function loadCalendar() {
    setIsLoading(true);
    setMessage("");

    const { data } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setMessage("먼저 RuahNote에 로그인하세요.");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (selectedCalendarIds.length > 0) {
      params.set("calendarIds", selectedCalendarIds.join(","));
    }
    const response = await fetch(
      `/api/google/calendar${params.size ? `?${params}` : ""}`,
      {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      },
    );
    const dataJson = (await response.json().catch(() => null)) as
      | {
          calendars?: CalendarListItem[];
          selectedCalendarIds?: string[];
          items?: CalendarEvent[];
          error?: unknown;
        }
      | null;

    if (!response.ok) {
      const errorMessage = readableError(
        dataJson?.error,
        "Google Calendar 조회를 완료하지 못했습니다.",
      );
      setMessage(`Google Calendar 오류: ${errorMessage}`);
      setIsLoading(false);
      return;
    }

    const nextCalendars = dataJson?.calendars ?? [];
    setCalendars(nextCalendars);
    setSelectedCalendarIds(
      dataJson?.selectedCalendarIds ??
        selectedCalendarIds ??
        nextCalendars.map((calendar) => calendar.id),
    );
    setCalendarEvents(dataJson?.items ?? []);
    setIsLoading(false);
  }

  function toggleCalendar(calendarId: string) {
    setSelectedCalendarIds((currentIds) =>
      currentIds.includes(calendarId)
        ? currentIds.filter((id) => id !== calendarId)
        : [...currentIds, calendarId],
    );
  }

  function selectAllCalendars() {
    setSelectedCalendarIds(calendars.map((calendar) => calendar.id));
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
                RuahNote 로그인 세션과 Google OAuth 설정이 준비되면 승인 화면으로 이동할 수 있습니다.
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
            <button
              className="h-11 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="button"
              onClick={loadCalendar}
            >
              Calendar 확인
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

          {calendars.length > 0 ? (
            <section className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-black text-[var(--text)]">
                  캘린더 선택
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="h-9 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)]"
                    type="button"
                    onClick={selectAllCalendars}
                  >
                    전체 선택
                  </button>
                  <button
                    className="h-9 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)]"
                    type="button"
                    onClick={loadCalendar}
                  >
                    선택 조회
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {calendars.map((calendar) => (
                  <label
                    className="flex min-w-0 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                    key={calendar.id}
                  >
                    <input
                      checked={selectedCalendarIds.includes(calendar.id)}
                      type="checkbox"
                      onChange={() => toggleCalendar(calendar.id)}
                    />
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: calendar.backgroundColor ?? "#7F927F",
                      }}
                    />
                    <span className="min-w-0 truncate text-sm font-bold text-[var(--text)]">
                      {calendar.summary ?? calendar.id}
                      {calendar.primary ? " / 기본" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {calendarEvents.length > 0 ? (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
              <h3 className="text-sm font-black text-[var(--text)]">
                다음 7일 일정
              </h3>
              <ul className="mt-3 grid gap-2">
                {calendarEvents.map((event) => (
                  <li
                    className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                    key={event.id ?? `${event.summary}-${event.start?.dateTime}`}
                  >
                    <p className="text-sm font-bold text-[var(--text)]">
                      {event.summary ?? "제목 없음"}
                    </p>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      {event.start?.dateTime ?? event.start?.date ?? "-"} /{" "}
                      {event.calendarSummary ?? event.calendarId ?? "Calendar"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
