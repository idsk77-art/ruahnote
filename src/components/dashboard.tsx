"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Assignment, AssignmentCandidate } from "@/lib/assignments/types";
import type { Note, NoteCategory, NoteFile, NoteSubject } from "@/lib/notes/types";

type HealthResponse = {
  ok?: boolean;
  env?: Record<string, boolean>;
  checks?: Record<
    string,
    {
      status?: "ready" | "missing" | "error" | "skipped";
      detail?: string;
    }
  >;
};

const noteStorageKey = "ruahnote.notes.v1";
const fileStorageKey = "ruahnote.note-files.v1";
const categoryStorageKey = "ruahnote.note-categories.v1";
const subjectStorageKey = "ruahnote.note-subjects.v1";
const assignmentStorageKey = "ruahnote.assignments.v1";
const candidateStorageKey = "ruahnote.assignment-candidates.v1";

const today = new Date().toISOString().slice(0, 10);

const defaultNotes: Note[] = [
  {
    id: "welcome-note",
    subjectId: "general-subject",
    title: "RuahNote 노트 MVP",
    contentPlain:
      "로그인된 Supabase 세션이 있으면 노트와 파일을 DB/Storage에 저장하고, 설정 전에는 LocalStorage로 동작합니다.",
    checklistItems: [
      {
        id: "welcome-checklist-1",
        text: "Create a category and subject",
        checked: false,
      },
    ],
    recordingMemos: [],
    noteDate: today,
    sessionNumber: 1,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultAssignments: Assignment[] = [
  {
    id: "sample-assignment",
    noteId: null,
    title: "첫 과제 등록",
    dueDate: null,
    status: "todo",
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultCandidates: AssignmentCandidate[] = [
  {
    id: "sample-candidate-1",
    title: "첫 과제 등록",
    dueDate: null,
    priority: "medium",
    source: "노트/강의 중 발견한 과제 후보",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-candidate-2",
    title: "첫 과제 등록",
    dueDate: null,
    priority: "medium",
    source: "중복 후보 통합 예시",
    createdAt: new Date().toISOString(),
  },
];

const launchCards = [
  {
    href: "/notes",
    title: "노트 코어",
    value: "작성",
    detail: "과목, 날짜별 노트, 첨부, OCR, STT",
  },
  {
    href: "/assignments",
    title: "과제 관리",
    value: "정리",
    detail: "마감, 상태 칸반, 후보 병합",
  },
  {
    href: "/integrations",
    title: "Google 연동",
    value: "연결",
    detail: "Calendar, Contacts, Gmail",
  },
  {
    href: "/admin",
    title: "운영 관리",
    value: "점검",
    detail: "프로필, 관리자 권한, 상태 확인",
  },
];

function readJson<T>(key: string, fallback: T): T {
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function isOverdue(assignment: Assignment) {
  return (
    assignment.status !== "done" &&
    Boolean(assignment.dueDate) &&
    String(assignment.dueDate) < today
  );
}

function isDueSoon(assignment: Assignment) {
  if (!assignment.dueDate || assignment.status === "done") return false;
  const dueTime = new Date(`${assignment.dueDate}T00:00:00`).getTime();
  const todayTime = new Date(`${today}T00:00:00`).getTime();
  const daysLeft = Math.round((dueTime - todayTime) / 86400000);
  return daysLeft >= 0 && daysLeft <= 3;
}

function sortRecentNotes(notes: Note[]) {
  return [...notes].sort((left, right) =>
    `${right.noteDate} ${right.updatedAt}`.localeCompare(
      `${left.noteDate} ${left.updatedAt}`,
    ),
  );
}

function sortActionAssignments(assignments: Assignment[]) {
  return [...assignments]
    .filter((assignment) => assignment.status !== "done")
    .sort((left, right) => {
      const leftDue = left.dueDate ?? "9999-12-31";
      const rightDue = right.dueDate ?? "9999-12-31";
      if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);
      return right.priority.localeCompare(left.priority);
    });
}

function countHealthyFlags(data: HealthResponse | null) {
  if (!data) return { ready: 0, total: 0 };

  const flags = [
    ...Object.values(data.env ?? {}),
    ...Object.values(data.checks ?? {}).map((check) =>
      ["ready", "skipped"].includes(check.status ?? ""),
    ),
  ];

  return {
    ready: flags.filter(Boolean).length,
    total: flags.length,
  };
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [filesByNote, setFilesByNote] = useState<Record<string, NoteFile[]>>({});
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [assignments, setAssignments] =
    useState<Assignment[]>(defaultAssignments);
  const [candidates, setCandidates] =
    useState<AssignmentCandidate[]>(defaultCandidates);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthMessage, setHealthMessage] = useState("점검 중");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNotes(readJson(noteStorageKey, defaultNotes));
      setFilesByNote(readJson(fileStorageKey, {}));
      setCategories(readJson(categoryStorageKey, []));
      setSubjects(readJson(subjectStorageKey, []));
      setAssignments(readJson(assignmentStorageKey, defaultAssignments));
      setCandidates(readJson(candidateStorageKey, defaultCandidates));
      setIsReady(true);

      fetch("/api/health")
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as
            | HealthResponse
            | null;
          setHealth(payload);
          setHealthMessage(response.ok ? "정상 응답" : "확인 필요");
        })
        .catch(() => {
          setHealthMessage("확인 실패");
        });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const summary = useMemo(() => {
    const files = Object.values(filesByNote).flat();
    const checklistItems = notes.flatMap((note) => note.checklistItems);
    const doneChecklistItems = checklistItems.filter((item) => item.checked);
    const activeAssignments = assignments.filter(
      (assignment) => assignment.status !== "done",
    );

    return {
      notes: notes.length,
      favorites: notes.filter((note) => note.isFavorite).length,
      files: files.length,
      categories: categories.length,
      subjects: subjects.length,
      checklistProgress:
        checklistItems.length === 0
          ? 0
          : Math.round((doneChecklistItems.length / checklistItems.length) * 100),
      activeAssignments: activeAssignments.length,
      urgentAssignments: activeAssignments.filter(
        (assignment) => isOverdue(assignment) || isDueSoon(assignment),
      ).length,
      candidates: candidates.length,
    };
  }, [assignments, candidates, categories, filesByNote, notes, subjects]);

  const recentNotes = useMemo(() => sortRecentNotes(notes).slice(0, 4), [notes]);
  const actionAssignments = useMemo(
    () => sortActionAssignments(assignments).slice(0, 5),
    [assignments],
  );
  const healthCounts = countHealthyFlags(health);
  const healthPercent =
    healthCounts.total === 0
      ? 0
      : Math.round((healthCounts.ready / healthCounts.total) * 100);

  return (
    <main className="schedule-theme-light min-h-screen bg-[var(--app-bg)] px-4 py-5 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                v1.0 QA
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                {today}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-[var(--text)] sm:text-4xl">
              RuahNote 운영 대시보드
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--soft-text)] sm:text-base">
              노트, 과제, 자료 처리, AI, Google 연동의 현재 상태를 한 화면에서
              보고 v1.0 배포 전 검증 흐름으로 바로 이동합니다.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-4 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" href="/notes">
                새 노트 작성
              </Link>
              <Link className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" href="/assignments">
                과제 보드 열기
              </Link>
              <Link className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" href="/integrations">
                연동 확인
              </Link>
            </div>
          </div>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--text)]">
                  운영 환경 상태
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  /api/health {healthMessage}
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                {healthCounts.ready}/{healthCounts.total || "-"}
              </span>
            </div>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-[var(--track)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <HealthPill
                label="Supabase"
                ready={Boolean(
                  health?.env?.supabaseUrl &&
                    health?.env?.supabasePublishableKey &&
                    health?.env?.supabaseServiceRoleKey,
                )}
              />
              <HealthPill
                label="Database"
                ready={health?.checks?.database?.status === "ready"}
              />
              <HealthPill
                label="Storage"
                ready={health?.checks?.storage?.status === "ready"}
              />
              <HealthPill
                label="OpenAI"
                ready={health?.checks?.openAi?.status === "ready"}
              />
            </div>
          </section>
        </header>

        <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard detail={`${summary.categories}개 카테고리 / ${summary.subjects}개 과목`} label="노트" value={`${summary.notes}`} />
          <MetricCard detail={`즐겨찾기 ${summary.favorites}개 / 첨부 ${summary.files}개`} label="자료" value={`${summary.files}`} />
          <MetricCard detail={`마감 임박·초과 ${summary.urgentAssignments}개`} label="진행 과제" tone={summary.urgentAssignments > 0 ? "danger" : "default"} value={`${summary.activeAssignments}`} />
          <MetricCard detail={`체크리스트 완료율 ${summary.checklistProgress}%`} label="과제 후보" value={`${summary.candidates}`} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)]">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[var(--text)]">
                  오늘 먼저 볼 항목
                </h2>
                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                  마감이 가까운 과제와 최근 노트를 같이 봅니다.
                </p>
              </div>
              <Link className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)]" href="/assignments">
                전체 과제
              </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3">
                <h3 className="text-sm font-black text-[var(--text)]">
                  액션 과제
                </h3>
                <div className="mt-3 grid gap-2">
                  {actionAssignments.length > 0 ? (
                    actionAssignments.map((assignment) => (
                      <article
                        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                        key={assignment.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="break-words text-sm font-black text-[var(--text)]">
                            {assignment.title}
                          </p>
                          <span className="shrink-0 rounded-full bg-[var(--summary-bg)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                            {assignment.status === "doing" ? "진행" : "예정"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                          {assignment.dueDate ?? "마감 없음"} / {assignment.priority}
                        </p>
                      </article>
                    ))
                  ) : (
                    <EmptyLine text="진행 중인 과제가 없습니다." />
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3">
                <h3 className="text-sm font-black text-[var(--text)]">
                  최근 노트
                </h3>
                <div className="mt-3 grid gap-2">
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note) => (
                      <article
                        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                        key={note.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="break-words text-sm font-black text-[var(--text)]">
                            {note.title}
                          </p>
                          {note.isFavorite ? (
                            <span className="shrink-0 rounded-full bg-[var(--summary-bg)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                              즐겨찾기
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--muted)]">
                          {note.noteDate} / {note.contentPlain || "본문 없음"}
                        </p>
                      </article>
                    ))
                  ) : (
                    <EmptyLine text="최근 노트가 없습니다." />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-black text-[var(--text)]">빠른 실행</h2>
            <div className="mt-4 grid gap-3">
              {launchCards.map((card) => (
                <Link
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3 transition hover:bg-[var(--hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  href={card.href}
                  key={card.href}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-md bg-[var(--surface)] text-base font-black text-[var(--primary)]">
                    {card.value}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-[var(--text)]">
                      {card.title}
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--muted)]">
                      {card.detail}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[var(--text)]">
                v1.0 검증 레일
              </h2>
              <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                문서상 다음 작업을 실제 화면 검증 순서로 정리했습니다.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-1 text-xs font-black text-[var(--muted)]">
              {isReady ? "Local data loaded" : "Loading"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <RailCard title="1. 환경변수" items={["Render env 등록", "/api/health true 확인", "OpenAI/Google 키 확인"]} />
            <RailCard title="2. 계정/Auth" items={["회원가입", "admin:set 실행", "/admin 입장 확인"]} />
            <RailCard title="3. 노트 실사용" items={["카테고리 > 과목 > 노트", "파일 업로드", "OCR/PDF/STT 버튼 검증"]} />
            <RailCard title="4. 통합 연동" items={["과제 흐름", "Google OAuth", "Calendar/Contacts/Gmail 조회"]} />
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  detail,
  label,
  tone = "default",
  value,
}: {
  detail: string;
  label: string;
  tone?: "default" | "danger";
  value: string;
}) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-sm ${
        tone === "danger"
          ? "border-[var(--danger-border)] bg-[var(--danger-bg)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--text)]">{value}</p>
      <p className="mt-2 text-xs font-semibold text-[var(--soft-text)]">
        {detail}
      </p>
    </article>
  );
}

function HealthPill({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        ready
          ? "border-[var(--border)] bg-[var(--summary-bg)]"
          : "border-[var(--danger-border)] bg-[var(--danger-bg)]"
      }`}
    >
      <p className="text-xs font-black text-[var(--text)]">{label}</p>
      <p className="mt-1 text-xs font-bold text-[var(--muted)]">
        {ready ? "ready" : "missing"}
      </p>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--muted)]">
      {text}
    </p>
  );
}

function RailCard({ items, title }: { items: string[]; title: string }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-4">
      <h3 className="text-sm font-black text-[var(--text)]">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--soft-text)]"
            key={item}
          >
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}
