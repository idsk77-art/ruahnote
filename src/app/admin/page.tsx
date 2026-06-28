"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasBrowserSupabaseConfig } from "@/lib/supabase/config";

const adminPassword = "ruahnote-admin";
const adminStorageKey = "ruahnote.admin.isLoggedIn.v1";

type CheckResult = {
  status: "ready" | "missing" | "error" | "skipped";
  detail: string;
};

type HealthResponse = {
  ok: boolean;
  app: string;
  version: string;
  checkedAt: string;
  deployment: {
    provider: string;
    service: string;
    commit: string;
  };
  env: Record<string, boolean>;
  checks: Record<string, CheckResult>;
  usage: {
    openAiRequestsToday: number;
    sttRequestsToday: number;
    ocrRequestsToday: number;
    googleApiCallsToday: number;
    openAiCostTodayUsd: number;
    openAiCostMonthUsd: number;
    openAiBudgetUsd: number;
  };
};

function verifyAdminPassword(password: string) {
  return password === adminPassword;
}

const summaryItems = [
  { label: "프로젝트명", value: "RuahNote v1.0" },
  { label: "현재 버전", value: "v0.1.0" },
  { label: "배포 상태", value: "Live" },
  { label: "운영 URL", value: "https://ruahnote-bp6m.onrender.com" },
  { label: "GitHub", value: "idsk77-art/ruahnote" },
];

const projectProgress = {
  value: 70,
  done: [
    "Git 설치",
    "GitHub 연결",
    "Render 배포",
    "개발자 Admin 모드",
    "Supabase DB/Auth/Storage 기반",
    "Notes CRUD",
    "파일 첨부",
    "운영 Health API",
  ],
  active: ["Render 환경변수 등록", "브라우저 세션 검증", "첫 admin 지정"],
  planned: ["AI 요약", "OpenAI 사용량 추적", "Google 연동", "OCR/STT"],
};

const commits = [
  "chore: add render start wrapper",
  "docs: record render 404 recovery steps",
  "feat: add supabase auth notes and operations foundation",
  "feat: add developer admin dashboard",
];

const todos = {
  High: [
    "Render 환경변수 등록",
    "Render /api/health env true 확인",
    "첫 admin 사용자 지정",
    "브라우저에서 Notes DB/Storage 검증",
  ],
  Medium: [
    "임시 admin fallback 제거",
    "Render 배포 로그 자동 연동",
    "OpenAI 사용량 실제 추적",
  ],
  Low: ["관리자 차트 추가", "UI 컴포넌트 분리", "다크모드 정리"],
};

export default function AdminPage() {
  const isSupabaseConfigured = hasBrowserSupabaseConfig();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createBrowserSupabaseClient() : null),
    [isSupabaseConfigured],
  );
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authStatus, setAuthStatus] = useState("Supabase admin role not checked.");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function checkAdminAccess() {
        if (window.localStorage.getItem(adminStorageKey) === "true") {
          setIsLoggedIn(true);
          setAuthStatus("임시 관리자 세션이 활성화되어 있습니다.");
          setIsReady(true);
          return;
        }

        if (!supabase) {
          setAuthStatus("Supabase 설정이 없어서 임시 관리자 비밀번호를 사용합니다.");
          setIsReady(true);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;

        if (!userId) {
          setAuthStatus("Supabase admin 계정으로 로그인하거나 임시 비밀번호를 사용하세요.");
          setIsReady(true);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profileError) {
          setAuthStatus(profileError.message);
          setIsReady(true);
          return;
        }

        if (profile?.role === "admin") {
          setIsLoggedIn(true);
          setAuthStatus("Supabase admin role verified.");
        } else {
          setAuthStatus("Supabase 세션은 있지만 admin 권한이 없습니다.");
        }

        setIsReady(true);
      }

      checkAdminAccess();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [supabase]);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!verifyAdminPassword(password)) {
      setError("관리자 비밀번호가 올바르지 않습니다.");
      return;
    }

    window.localStorage.setItem(adminStorageKey, "true");
    setIsLoggedIn(true);
    setPassword("");
    setError("");
  }

  function handleLogout() {
    window.localStorage.removeItem(adminStorageKey);
    setIsLoggedIn(false);
    setPassword("");
    setError("");
  }

  if (!isReady) {
    return (
      <main className="schedule-theme-light min-h-screen bg-[var(--app-bg)] px-4 py-8 text-[var(--text)]">
        <div className="mx-auto max-w-6xl">
          <div className="h-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="schedule-theme-light min-h-screen bg-[var(--app-bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      {isLoggedIn ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <LoginCard
          authStatus={authStatus}
          error={error}
          password={password}
          setError={setError}
          setPassword={setPassword}
          onSubmit={handleLogin}
        />
      )}
    </main>
  );
}

function LoginCard({
  authStatus,
  error,
  password,
  setError,
  setPassword,
  onSubmit,
}: {
  authStatus: string;
  error: string;
  password: string;
  setError: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-md items-center">
      <form
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
        onSubmit={onSubmit}
      >
        <p className="text-sm font-semibold text-[var(--primary)]">RuahNote Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text)]">관리자 로그인</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Supabase admin role 또는 임시 관리자 비밀번호로 접근합니다.
        </p>
        <p className="mt-3 rounded-md border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
          {authStatus}
        </p>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-[var(--soft-text)]">비밀번호</span>
          <input
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            placeholder="관리자 비밀번호"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError("");
            }}
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
            {error}
          </p>
        ) : null}

        <button
          className="mt-5 h-11 w-full rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-4 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          type="submit"
        >
          로그인
        </button>
      </form>
    </section>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    fetch("/api/health", { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setHealthError(error.message);
        }
      });

    return () => abortController.abort();
  }, []);

  const healthItems = useMemo(() => {
    if (!health) return [["Status", "Loading"]];

    return Object.entries(health.checks).map(([key, value]) => [
      key,
      `${value.status} (${value.detail})`,
    ]);
  }, [health]);

  const envItems = useMemo(() => {
    if (!health) return [["Status", "Loading"]];

    return Object.entries(health.env).map(([key, value]) => [
      key,
      value ? "Ready" : "Missing",
    ]);
  }, [health]);

  const usageItems = [
    ["OpenAI Requests Today", `${health?.usage.openAiRequestsToday ?? 0}`],
    ["STT Requests Today", `${health?.usage.sttRequestsToday ?? 0}`],
    ["OCR Requests Today", `${health?.usage.ocrRequestsToday ?? 0}`],
    ["Google API Calls Today", `${health?.usage.googleApiCallsToday ?? 0}`],
  ];

  const costItems = [
    ["Today", `$${(health?.usage.openAiCostTodayUsd ?? 0).toFixed(2)}`],
    ["This Month", `$${(health?.usage.openAiCostMonthUsd ?? 0).toFixed(2)}`],
    ["Budget", `$${(health?.usage.openAiBudgetUsd ?? 10).toFixed(2)}`],
    ["Usage Rate", "0%"],
  ];

  const renderItems = [
    ["Provider", health?.deployment.provider ?? "Render"],
    ["Service", health?.deployment.service ?? "ruahnote"],
    ["Branch", "main"],
    ["Status", health?.ok ? "Live" : healthError || "Checking"],
    ["Commit", health?.deployment.commit ?? "unknown"],
  ];

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="rounded-lg border border-[var(--header-border)] bg-[var(--header-bg)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">Developer Admin</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
              RuahNote 운영 대시보드
            </h1>
          </div>
          <button
            className="h-10 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] md:self-start"
            type="button"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryItems.map((item) => (
          <InfoCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <ProgressCard />
        <KeyValueCard title="배포 상태" items={renderItems} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <ListCard title="최근 Commit" items={commits} />
        <TodoCard />
        <KeyValueCard title="API 사용량" items={usageItems} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <KeyValueCard title="OpenAI 비용" items={costItems} />
        <KeyValueCard title="Render 상태" items={renderItems} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <KeyValueCard title="Health 상세" items={healthItems} />
        <KeyValueCard title="환경변수 상태" items={envItems} />
      </section>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-bold text-[var(--text)]">
        {value}
      </p>
    </article>
  );
}

function ProgressCard() {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-[var(--text)]">프로젝트 진행률</h2>
        <span className="rounded-full bg-[var(--summary-bg)] px-3 py-1 text-sm font-bold text-[var(--primary)]">
          {projectProgress.value}%
        </span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all"
          style={{ width: `${projectProgress.value}%` }}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <ProgressList title="완료" tone="done" items={projectProgress.done} />
        <ProgressList title="진행 중" tone="active" items={projectProgress.active} />
        <ProgressList title="예정" tone="planned" items={projectProgress.planned} />
      </div>
    </article>
  );
}

function ProgressList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "done" | "active" | "planned";
  items: string[];
}) {
  const toneClass = {
    done: "bg-emerald-100 text-emerald-900 ring-emerald-300",
    active: "bg-sky-100 text-sky-900 ring-sky-300",
    planned: "bg-[var(--summary-bg)] text-[var(--muted)] ring-[var(--border)]",
  }[tone];

  return (
    <div>
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>
        {title}
      </span>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li className="text-sm leading-5 text-[var(--soft-text)]" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyValueCard({
  title,
  items,
}: {
  title: string;
  items: string[][];
}) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
      <dl className="mt-4 divide-y divide-[var(--border)]">
        {items.map(([label, value]) => (
          <div
            className="grid gap-1 py-3 sm:grid-cols-[minmax(130px,0.8fr)_minmax(0,1.2fr)]"
            key={label}
          >
            <dt className="text-sm font-semibold text-[var(--muted)]">{label}</dt>
            <dd className="break-words text-sm font-bold text-[var(--text)]">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
      <ol className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li className="flex gap-3 text-sm leading-5 text-[var(--soft-text)]" key={item}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--summary-bg)] text-xs font-bold text-[var(--muted)]">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function TodoCard() {
  const toneClass: Record<string, string> = {
    High: "bg-[#E8B8B0]/55 text-[#763F36]",
    Medium: "bg-[#F3D9A4]/70 text-[#6E4F13]",
    Low: "bg-[#D9E5EA] text-[#365665]",
  };

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-[var(--text)]">TODO</h2>
      <div className="mt-4 space-y-4">
        {Object.entries(todos).map(([priority, items]) => (
          <div key={priority}>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass[priority]}`}>
              {priority}
            </span>
            <ul className="mt-2 space-y-2">
              {items.map((item) => (
                <li className="text-sm leading-5 text-[var(--soft-text)]" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
