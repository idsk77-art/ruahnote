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
  { label: "현재 단계", value: "통합 QA / 운영 검증" },
  { label: "전체 진행률", value: "78%" },
  { label: "운영 URL", value: "https://ruahnote-bp6m.onrender.com" },
];

const stageProgress = {
  value: 78,
  stages: [
    {
      title: "1. 개발 환경/배포 기반",
      status: "done",
      progress: 100,
      items: ["Next.js 프로젝트", "GitHub 연결", "Render 기본 배포", "운영 점검 API"],
      next: "운영 env true 확인만 유지 점검",
    },
    {
      title: "2. Supabase/Auth/Admin",
      status: "active",
      progress: 82,
      items: ["DB/Auth/Storage 코드", "migrations 0001-0005", "admin role 스크립트"],
      next: "회원가입 후 첫 admin 지정 및 브라우저 권한 검증",
    },
    {
      title: "3. 노트 코어",
      status: "active",
      progress: 88,
      items: ["카테고리/과목", "날짜별 노트 CRUD", "에디터/체크리스트", "첨부 검색"],
      next: "실제 브라우저 DB CRUD와 파일 업로드 검증",
    },
    {
      title: "4. 자료 처리",
      status: "active",
      progress: 76,
      items: ["카메라 입력", "OCR route", "스캔 이미지 PDF export"],
      next: "브라우저 권한, OpenAI key 등록 후 OCR 실사용 검증",
    },
    {
      title: "5. 과제 관리",
      status: "active",
      progress: 86,
      items: ["과제 CRUD", "상태 칸반", "후보 등록/중복 병합", "노트 연결"],
      next: "과제 생성부터 완료 보관까지 실사용 QA",
    },
    {
      title: "6. 녹음/STT/AI 강의노트",
      status: "active",
      progress: 72,
      items: ["오디오 첨부/재생", "타임라인 메모", "STT route", "AI 강의노트 route"],
      next: "OpenAI key 등록 후 STT/AI 결과 저장 검증",
    },
    {
      title: "7. Google 연동",
      status: "active",
      progress: 68,
      items: ["OAuth scaffold", "Calendar", "Contacts", "Gmail 목록/상세/초안"],
      next: "Google Client/Secret, redirect URI, token key 등록 후 운영 검증",
    },
    {
      title: "8. v1.0 릴리즈",
      status: "planned",
      progress: 35,
      items: ["통합 Dashboard", "운영 문서", "배포 URL 확인"],
      next: "통합 QA 체크리스트 완료, 릴리즈 노트, v1.0 태그",
    },
  ],
};

const commits = [
  "feat: add integrated operations dashboard",
  "chore: move project schedule out of primary flow",
  "chore: add render start wrapper",
  "docs: record render 404 recovery steps",
  "feat: add google integrations and gmail workspace",
];

const todos = {
  High: [
    "Render 환경변수 등록",
    "Render /api/health env true 확인",
    "첫 admin 사용자 지정",
    "브라우저에서 Notes DB/Storage 검증",
    "Google OAuth 운영 검증",
  ],
  Medium: [
    "OpenAI OCR/STT/AI 실사용 검증",
    "과제/후보/녹음 흐름 QA",
    "운영 매뉴얼 보강",
  ],
  Low: ["UI 컴포넌트 분리", "공통 타입/파일 정리", "모바일 UI 보완"],
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
        <h2 className="text-lg font-bold text-[var(--text)]">전체 작업 단계</h2>
        <span className="rounded-full bg-[var(--summary-bg)] px-3 py-1 text-sm font-bold text-[var(--primary)]">
          {stageProgress.value}%
        </span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all"
          style={{ width: `${stageProgress.value}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {stageProgress.stages.map((stage) => (
          <StageCard key={stage.title} stage={stage} />
        ))}
      </div>
    </article>
  );
}

function StageCard({
  stage,
}: {
  stage: (typeof stageProgress.stages)[number];
}) {
  const toneClass = {
    done: "bg-emerald-100 text-emerald-900 ring-emerald-300",
    active: "bg-sky-100 text-sky-900 ring-sky-300",
    planned: "bg-[var(--summary-bg)] text-[var(--muted)] ring-[var(--border)]",
  }[stage.status];
  const statusLabel = {
    done: "완료",
    active: "검증 중",
    planned: "예정",
  }[stage.status];

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-black text-[var(--text)]">{stage.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className="h-full rounded-full bg-[var(--primary)]"
          style={{ width: `${stage.progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs font-bold text-[var(--primary)]">
        {stage.progress}% / 다음: {stage.next}
      </p>
      <ul className="mt-3 grid gap-2">
        {stage.items.map((item) => (
          <li
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--soft-text)]"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </article>
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
