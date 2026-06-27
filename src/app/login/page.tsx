"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { hasBrowserSupabaseConfig } from "@/lib/supabase/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "signup" | "magic";
type AuthStatus = "idle" | "loading" | "success" | "error";

const modeLabels: Record<AuthMode, string> = {
  login: "로그인",
  signup: "회원가입",
  magic: "매직링크",
};

export default function LoginPage() {
  const isConfigured = hasBrowserSupabaseConfig();
  const supabase = useMemo(
    () => (isConfigured ? createBrowserSupabaseClient() : null),
    [isConfigured],
  );
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSessionEmail(data.session?.user.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase 환경변수가 아직 설정되지 않았습니다.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const redirectTo =
      typeof window === "undefined" ? undefined : `${window.location.origin}/login`;
    const authResult =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: redirectTo },
            })
          : await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: redirectTo },
            });

    if (authResult.error) {
      setStatus("error");
      setMessage(authResult.error.message);
      return;
    }

    setStatus("success");
    setPassword("");
    setMessage(
      mode === "magic"
        ? "이메일로 로그인 링크를 보냈습니다."
        : mode === "signup"
          ? "회원가입 요청이 완료되었습니다. 이메일 확인이 필요할 수 있습니다."
          : "로그인되었습니다.",
    );
  }

  async function handleLogout() {
    if (!supabase) return;

    setStatus("loading");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("로그아웃되었습니다.");
  }

  return (
    <main className="schedule-theme-light min-h-screen bg-[var(--app-bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-md items-center">
        <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">RuahNote Auth</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--text)]">
              계정 로그인
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Supabase Auth 기반 사용자 로그인 준비 화면입니다.
            </p>
          </div>

          {!isConfigured ? (
            <div className="mt-6 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-3 text-sm leading-6 text-[var(--danger-text)]">
              Supabase 환경변수가 아직 없습니다. `.env.local`과 Render에
              `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를
              등록하면 로그인 기능이 활성화됩니다.
            </div>
          ) : null}

          {sessionEmail ? (
            <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--summary-bg)] p-3">
              <p className="text-sm font-semibold text-[var(--muted)]">현재 로그인</p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text)]">
                {sessionEmail}
              </p>
              <button
                className="mt-3 h-10 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                disabled={status === "loading"}
                type="button"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-md border border-[var(--border)] bg-[var(--summary-bg)] p-1">
            {(Object.keys(modeLabels) as AuthMode[]).map((item) => (
              <button
                className={`h-9 rounded-sm text-sm font-bold transition ${
                  mode === item
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                    : "text-[var(--muted)] hover:bg-[var(--hover)]"
                }`}
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setMessage("");
                  setStatus("idle");
                }}
              >
                {modeLabels[item]}
              </button>
            ))}
          </div>

          <form className="mt-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">이메일</span>
              <input
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="name@example.com"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {mode !== "magic" ? (
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-[var(--soft-text)]">
                  비밀번호
                </span>
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  minLength={6}
                  placeholder="6자 이상"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            ) : null}

            {message ? (
              <p
                className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
                  status === "error"
                    ? "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    : "border-[var(--border)] bg-[var(--summary-bg)] text-[var(--soft-text)]"
                }`}
              >
                {message}
              </p>
            ) : null}

            <button
              className="mt-5 h-11 w-full rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-4 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isConfigured || status === "loading"}
              type="submit"
            >
              {status === "loading" ? "처리 중" : modeLabels[mode]}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
