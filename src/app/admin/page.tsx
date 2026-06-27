"use client";

import { FormEvent, useEffect, useState } from "react";

const adminPassword = "ruahnote-admin";
const adminStorageKey = "ruahnote.admin.isLoggedIn.v1";

// Temporary development-only client-side auth.
// Replace this boundary with Supabase Auth and an admin role check before production use.
function verifyAdminPassword(password: string) {
  return password === adminPassword;
}

const summaryItems = [
  { label: "Project", value: "RuahNote v1.0" },
  { label: "Version", value: "v0.1.0" },
  { label: "Deploy", value: "Live" },
  { label: "URL", value: "https://ruahnote.onrender.com" },
  { label: "GitHub", value: "idsk77-art/ruahnote" },
];

const projectProgress = {
  value: 35,
  done: [
    "Git installed",
    "GitHub connected",
    "Render deployed",
    "Basic dashboard deployed",
    "Docs project management system configured",
  ],
  active: ["Developer Admin mode", "Supabase preparation"],
  planned: ["Login/Auth", "Notes CRUD", "File upload", "AI summary", "Google integration"],
};

const deployStatus = [
  ["Provider", "Render"],
  ["Service", "ruahnote"],
  ["Branch", "main"],
  ["Status", "Live"],
  ["Last Deploy", "2026-06-27 16:20 KST"],
  ["Build", "Success"],
];

const commits = [
  "docs project management system configured",
  "resolve gitignore conflict",
  "first commit",
];

const todos = {
  High: ["Connect Supabase", "Implement Auth", "Persist notes to DB"],
  Medium: [
    "Wire real Admin API",
    "Connect Render deploy logs",
    "Track OpenAI usage",
  ],
  Low: ["Refine admin screen design", "Add charts"],
};

const apiUsage = [
  ["OpenAI Requests Today", "0"],
  ["STT Requests Today", "0"],
  ["OCR Requests Today", "0"],
  ["Google API Calls Today", "0"],
];

const openAiCost = [
  ["Today", "$0.00"],
  ["This Month", "$0.00"],
  ["Budget", "$10.00"],
  ["Usage Rate", "0%"],
];

const renderStatus = [
  ["Service", "Live"],
  ["Instance", "Free"],
  ["Region", "Virginia"],
  ["Cold Start Warning", "Free instance may spin down with inactivity"],
];

export default function AdminPage() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoggedIn(window.localStorage.getItem(adminStorageKey) === "true");
    setIsReady(true);
  }, []);

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
  error,
  password,
  setError,
  setPassword,
  onSubmit,
}: {
  error: string;
  password: string;
  setError: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-md items-center">
      <form
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
        onSubmit={onSubmit}
      >
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">RuahNote Admin</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--text)]">관리자 로그인</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            개발자 운영 대시보드 접근을 위해 임시 관리자 비밀번호를 입력하세요.
          </p>
        </div>

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
        <KeyValueCard title="배포 상태" items={deployStatus} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <ListCard title="최근 Commit" items={commits} />
        <TodoCard />
        <KeyValueCard title="API 사용량" items={apiUsage} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <KeyValueCard title="OpenAI 비용" items={openAiCost} />
        <KeyValueCard title="Render 상태" items={renderStatus} />
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
