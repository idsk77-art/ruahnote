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

type GoogleContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  title: string | null;
};

type GmailMessage = {
  id: string;
  threadId: string | null;
  from: string | null;
  to: string | null;
  subject: string;
  date: string | null;
  snippet: string;
  labels: string[];
  body: string;
  internalDate: string | null;
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

function StatusMessage({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success";
  children: string;
}) {
  const className =
    tone === "success"
      ? "mt-4 rounded-md border border-[var(--primary)] bg-[var(--control-bg)] px-3 py-2 text-sm font-semibold text-[var(--text)]"
      : "mt-4 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]";

  return <p className={className}>{children}</p>;
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
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [selectedGmailMessage, setSelectedGmailMessage] =
    useState<GmailMessage | null>(null);
  const [gmailQuery, setGmailQuery] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [message, setMessage] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [gmailMessage, setGmailMessage] = useState("");
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

  async function loadContacts() {
    setIsLoading(true);
    setContactMessage("");

    const { data } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setContactMessage("먼저 RuahNote에 로그인하세요.");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (contactQuery.trim()) params.set("q", contactQuery.trim());

    const response = await fetch(
      `/api/google/contacts${params.size ? `?${params}` : ""}`,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const dataJson = (await response.json().catch(() => null)) as
      | { contacts?: GoogleContact[]; error?: unknown }
      | null;

    if (!response.ok) {
      const errorMessage = readableError(
        dataJson?.error,
        "Google Contacts 조회를 완료하지 못했습니다.",
      );
      setContactMessage(`Google Contacts 오류: ${errorMessage}`);
      setIsLoading(false);
      return;
    }

    setContacts(dataJson?.contacts ?? []);
    setContactMessage("Google Contacts 조회를 완료했습니다.");
    setIsLoading(false);
  }

  async function getRuahNoteAccessToken() {
    const { data } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };

    return data.session?.access_token ?? "";
  }

  async function loadGmailMessages() {
    setIsLoading(true);
    setGmailMessage("");

    const accessToken = await getRuahNoteAccessToken();
    if (!accessToken) {
      setGmailMessage("먼저 RuahNote에 로그인하세요.");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (gmailQuery.trim()) params.set("q", gmailQuery.trim());

    const response = await fetch(
      `/api/google/gmail${params.size ? `?${params}` : ""}`,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const dataJson = (await response.json().catch(() => null)) as
      | { messages?: GmailMessage[]; error?: unknown }
      | null;

    if (!response.ok) {
      const errorMessage = readableError(
        dataJson?.error,
        "Gmail 목록 조회를 완료하지 못했습니다.",
      );
      setGmailMessage(`Gmail 오류: ${errorMessage}`);
      setIsLoading(false);
      return;
    }

    setGmailMessages(dataJson?.messages ?? []);
    setSelectedGmailMessage(null);
    setGmailMessage("Gmail 목록을 조회했습니다.");
    setIsLoading(false);
  }

  async function loadGmailMessage(messageId: string) {
    setIsLoading(true);
    setGmailMessage("");

    const accessToken = await getRuahNoteAccessToken();
    if (!accessToken) {
      setGmailMessage("먼저 RuahNote에 로그인하세요.");
      setIsLoading(false);
      return;
    }

    const response = await fetch(
      `/api/google/gmail?messageId=${encodeURIComponent(messageId)}`,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const dataJson = (await response.json().catch(() => null)) as
      | { message?: GmailMessage; error?: unknown }
      | null;

    if (!response.ok) {
      const errorMessage = readableError(
        dataJson?.error,
        "Gmail 상세 조회를 완료하지 못했습니다.",
      );
      setGmailMessage(`Gmail 오류: ${errorMessage}`);
      setIsLoading(false);
      return;
    }

    setSelectedGmailMessage(dataJson?.message ?? null);
    setGmailMessage("Gmail 상세를 조회했습니다.");
    setIsLoading(false);
  }

  async function createGmailDraft() {
    setIsLoading(true);
    setGmailMessage("");

    const accessToken = await getRuahNoteAccessToken();
    if (!accessToken) {
      setGmailMessage("먼저 RuahNote에 로그인하세요.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/google/gmail", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        to: draftTo,
        subject: draftSubject,
        body: draftBody,
      }),
    });
    const dataJson = (await response.json().catch(() => null)) as
      | { draft?: unknown; error?: unknown }
      | null;

    if (!response.ok) {
      const errorMessage = readableError(
        dataJson?.error,
        "Gmail 초안 생성을 완료하지 못했습니다.",
      );
      setGmailMessage(`Gmail 오류: ${errorMessage}`);
      setIsLoading(false);
      return;
    }

    setGmailMessage("Gmail 초안을 생성했습니다.");
    setDraftTo("");
    setDraftSubject("");
    setDraftBody("");
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
            <StatusMessage>{message}</StatusMessage>
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

          <section className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text)]">
                  연락처 검색
                </h3>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  Google Contacts에서 이름, 이메일, 전화, 소속으로 검색합니다.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto]">
                <input
                  className="h-10 min-w-0 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  placeholder="이름, 이메일, 소속"
                  value={contactQuery}
                  onChange={(event) => setContactQuery(event.target.value)}
                />
                <button
                  className="h-10 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="button"
                  onClick={loadContacts}
                >
                  Contacts 확인
                </button>
              </div>
            </div>

            {contactMessage ? (
              <StatusMessage
                tone={contactMessage.includes("오류") ? "danger" : "success"}
              >
                {contactMessage}
              </StatusMessage>
            ) : null}

            {contacts.length > 0 ? (
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {contacts.map((contact) => (
                  <li
                    className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                    key={contact.id}
                  >
                    <p className="text-sm font-bold text-[var(--text)]">
                      {contact.name}
                    </p>
                    <p className="mt-1 break-words text-xs font-semibold text-[var(--muted)]">
                      {[contact.email, contact.phone].filter(Boolean).join(" / ") ||
                        "연락처 정보 없음"}
                    </p>
                    {[contact.organization, contact.title].filter(Boolean).length >
                    0 ? (
                      <p className="mt-1 break-words text-xs font-semibold text-[var(--primary)]">
                        {[contact.organization, contact.title]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text)]">
                  Gmail
                </h3>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  메일 목록과 상세를 조회하고 Gmail 초안을 생성합니다.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto]">
                <input
                  className="h-10 min-w-0 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  placeholder="from:, subject:, newer_than:7d"
                  value={gmailQuery}
                  onChange={(event) => setGmailQuery(event.target.value)}
                />
                <button
                  className="h-10 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="button"
                  onClick={loadGmailMessages}
                >
                  Gmail 확인
                </button>
              </div>
            </div>

            {gmailMessage ? (
              <StatusMessage
                tone={gmailMessage.includes("오류") ? "danger" : "success"}
              >
                {gmailMessage}
              </StatusMessage>
            ) : null}

            {gmailMessages.length > 0 ? (
              <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                <ul className="grid min-w-0 gap-2">
                  {gmailMessages.map((gmailMessage) => (
                    <li
                      className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                      key={gmailMessage.id}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[var(--text)]">
                            {gmailMessage.subject}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">
                            {gmailMessage.from ?? "보낸 사람 없음"}
                          </p>
                        </div>
                        <button
                          className="h-8 shrink-0 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isLoading}
                          type="button"
                          onClick={() => loadGmailMessage(gmailMessage.id)}
                        >
                          상세
                        </button>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[var(--soft-text)]">
                        {gmailMessage.snippet || "미리보기 없음"}
                      </p>
                      {gmailMessage.date ? (
                        <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
                          {gmailMessage.date}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>

                <article className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                  {selectedGmailMessage ? (
                    <>
                      <p className="text-sm font-black text-[var(--text)]">
                        {selectedGmailMessage.subject}
                      </p>
                      <p className="mt-2 break-words text-xs font-semibold text-[var(--muted)]">
                        From: {selectedGmailMessage.from ?? "-"}
                      </p>
                      <p className="mt-1 break-words text-xs font-semibold text-[var(--muted)]">
                        To: {selectedGmailMessage.to ?? "-"}
                      </p>
                      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--control-bg)] p-3 text-xs leading-5 text-[var(--soft-text)]">
                        {selectedGmailMessage.body ||
                          selectedGmailMessage.snippet ||
                          "본문을 불러올 수 없습니다."}
                      </pre>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      메일 상세를 선택하세요.
                    </p>
                  )}
                </article>
              </div>
            ) : null}

            <form
              className="mt-4 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
              onSubmit={(event) => {
                event.preventDefault();
                createGmailDraft();
              }}
            >
              <h4 className="text-sm font-black text-[var(--text)]">
                Gmail 초안
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                  받는 사람
                  <input
                    className="h-10 min-w-0 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    placeholder="name@example.com"
                    type="email"
                    value={draftTo}
                    onChange={(event) => setDraftTo(event.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                  제목
                  <input
                    className="h-10 min-w-0 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    placeholder="메일 제목"
                    value={draftSubject}
                    onChange={(event) => setDraftSubject(event.target.value)}
                  />
                </label>
              </div>
              <textarea
                className="min-h-32 resize-y rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="메일 본문"
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
              />
              <button
                className="h-10 w-full rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-3 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
                disabled={isLoading}
                type="submit"
              >
                초안 생성
              </button>
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}
