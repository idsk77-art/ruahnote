"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Assignment,
  AssignmentCandidate,
  AssignmentCandidateDraft,
  AssignmentDraft,
  AssignmentPriority,
  AssignmentStatus,
} from "@/lib/assignments/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasBrowserSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

const assignmentStorageKey = "ruahnote.assignments.v1";
const candidateStorageKey = "ruahnote.assignment-candidates.v1";

type StorageMode = "local" | "supabase";
type SupabaseAssignmentClient = SupabaseClient<Database>;
type SupabaseTaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type SupabaseLinkedNoteRow = Pick<
  Database["public"]["Tables"]["notes"]["Row"],
  "id" | "title" | "note_date"
>;

type LinkedNote = {
  id: string;
  title: string;
  noteDate: string;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const emptyDraft: AssignmentDraft = {
  noteId: "",
  title: "",
  dueDate: "",
  status: "todo",
  priority: "medium",
};

const emptyCandidateDraft: AssignmentCandidateDraft = {
  title: "",
  dueDate: "",
  priority: "medium",
  source: "",
};

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

const statusLabels: Record<AssignmentStatus, string> = {
  todo: "예정",
  doing: "진행중",
  done: "완료 보관",
};

const priorityLabels: Record<AssignmentPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `assignment-${Date.now()}`;
}

function normalizeDraft(draft: AssignmentDraft): AssignmentDraft {
  return {
    noteId: draft.noteId,
    title: draft.title.trim(),
    dueDate: draft.dueDate,
    status: draft.status,
    priority: draft.priority,
  };
}

function mapSupabaseTask(row: SupabaseTaskRow): Assignment {
  return {
    id: row.id,
    noteId: row.note_id,
    title: row.title,
    dueDate: row.due_date,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapSupabaseNote(row: SupabaseLinkedNoteRow): LinkedNote {
  return {
    id: row.id,
    title: row.title,
    noteDate: row.note_date,
  };
}

function readLocalAssignments() {
  const stored = window.localStorage.getItem(assignmentStorageKey);
  if (!stored) return defaultAssignments;

  try {
    return (JSON.parse(stored) as Assignment[]).map((assignment) => ({
      ...assignment,
      noteId: assignment.noteId ?? null,
    }));
  } catch {
    return defaultAssignments;
  }
}

function readLocalCandidates() {
  const stored = window.localStorage.getItem(candidateStorageKey);
  if (!stored) return defaultCandidates;

  try {
    return (JSON.parse(stored) as AssignmentCandidate[]).map((candidate) => ({
      ...candidate,
      dueDate: candidate.dueDate ?? null,
      source: candidate.source ?? "",
    }));
  } catch {
    return defaultCandidates;
  }
}

function readLocalNotes(): LinkedNote[] {
  const stored = window.localStorage.getItem("ruahnote.notes.v1");
  if (!stored) return [];

  try {
    return (JSON.parse(stored) as Array<{ id: string; title: string; noteDate: string }>).map(
      (note) => ({
        id: note.id,
        title: note.title,
        noteDate: note.noteDate,
      }),
    );
  } catch {
    return [];
  }
}

function isOverdue(assignment: Assignment) {
  return (
    assignment.status !== "done" &&
    Boolean(assignment.dueDate) &&
    String(assignment.dueDate) < getToday()
  );
}

function dueSoon(assignment: Assignment) {
  if (!assignment.dueDate || assignment.status === "done") return false;
  const dueTime = new Date(`${assignment.dueDate}T00:00:00`).getTime();
  const todayTime = new Date(`${getToday()}T00:00:00`).getTime();
  const daysLeft = Math.round((dueTime - todayTime) / 86400000);
  return daysLeft >= 0 && daysLeft <= 3;
}

function sortAssignments(assignments: Assignment[]) {
  return [...assignments].sort((left, right) => {
    const leftDate = left.dueDate ?? "9999-12-31";
    const rightDate = right.dueDate ?? "9999-12-31";
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function sortCandidates(candidates: AssignmentCandidate[]) {
  return [...candidates].sort((left, right) => {
    const leftDate = left.dueDate ?? "9999-12-31";
    const rightDate = right.dueDate ?? "9999-12-31";
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function normalizeCandidateTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[\s()[\]{}.,:;!?'"`~_-]+/g, "")
    .trim();
}

function normalizeCandidateDraft(
  draft: AssignmentCandidateDraft,
): AssignmentCandidateDraft {
  return {
    title: draft.title.trim(),
    dueDate: draft.dueDate,
    priority: draft.priority,
    source: draft.source.trim(),
  };
}

export default function AssignmentManager() {
  const isSupabaseConfigured = hasBrowserSupabaseConfig();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createBrowserSupabaseClient() : null),
    [isSupabaseConfigured],
  );
  const [assignments, setAssignments] = useState<Assignment[]>(defaultAssignments);
  const [candidates, setCandidates] =
    useState<AssignmentCandidate[]>(defaultCandidates);
  const [notes, setNotes] = useState<LinkedNote[]>([]);
  const [draft, setDraft] = useState<AssignmentDraft>(emptyDraft);
  const [candidateDraft, setCandidateDraft] =
    useState<AssignmentCandidateDraft>(emptyCandidateDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storageMode, setStorageMode] = useState<StorageMode>("local");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const loadSupabaseData = useCallback(async (client: SupabaseAssignmentClient) => {
    const [tasksResult, notesResult] = await Promise.all([
      client
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false }),
      client
        .from("notes")
        .select("id,title,note_date")
        .order("note_date", { ascending: false })
        .limit(100),
    ]);

    if (tasksResult.error) {
      setMessage(tasksResult.error.message);
      setAssignments(readLocalAssignments());
      setCandidates(readLocalCandidates());
      setNotes(readLocalNotes());
      setStorageMode("local");
      return;
    }

    if (notesResult.error) {
      setMessage(notesResult.error.message);
      setNotes([]);
    } else {
      setNotes((notesResult.data ?? []).map(mapSupabaseNote));
    }

    setAssignments((tasksResult.data ?? []).map(mapSupabaseTask));
  }, []);

  const syncSessionAndAssignments = useCallback(
    async (client: SupabaseAssignmentClient) => {
      const { data, error } = await client.auth.getSession();
      const session = data.session;

      if (error) setMessage(error.message);

      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);

      if (session?.user.id) {
        setStorageMode("supabase");
        await loadSupabaseData(client);
      } else {
        setStorageMode("local");
        setAssignments(readLocalAssignments());
        setNotes(readLocalNotes());
      }

      setIsReady(true);
    },
    [loadSupabaseData],
  );

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const timeoutId = window.setTimeout(() => {
      if (!supabase) {
        setAssignments(readLocalAssignments());
        setCandidates(readLocalCandidates());
        setNotes(readLocalNotes());
        setStorageMode("local");
        setIsReady(true);
        return;
      }

      syncSessionAndAssignments(supabase);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const nextUserId = session?.user.id ?? null;
        setUserId(nextUserId);
        setUserEmail(session?.user.email ?? null);

        if (nextUserId) {
          setStorageMode("supabase");
          loadSupabaseData(supabase);
        } else {
          setStorageMode("local");
          setAssignments(readLocalAssignments());
          setCandidates(readLocalCandidates());
          setNotes(readLocalNotes());
        }
      });

      unsubscribeAuth = () => subscription.unsubscribe();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribeAuth?.();
    };
  }, [loadSupabaseData, supabase, syncSessionAndAssignments]);

  useEffect(() => {
    if (!isReady || storageMode !== "local") return;
    window.localStorage.setItem(assignmentStorageKey, JSON.stringify(assignments));
  }, [assignments, isReady, storageMode]);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(candidateStorageKey, JSON.stringify(candidates));
  }, [candidates, isReady]);

  const noteById = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes],
  );

  const filteredAssignments = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const sorted = sortAssignments(assignments);
    if (!cleanQuery) return sorted;

    return sorted.filter((assignment) => {
      const noteTitle = noteById.get(assignment.noteId ?? "")?.title ?? "";
      return `${assignment.title} ${assignment.dueDate ?? ""} ${statusLabels[assignment.status]} ${
        priorityLabels[assignment.priority]
      } ${noteTitle}`
        .toLowerCase()
        .includes(cleanQuery);
    });
  }, [assignments, noteById, query]);

  const summary = useMemo(
    () => ({
      total: assignments.length,
      todo: assignments.filter((assignment) => assignment.status === "todo").length,
      doing: assignments.filter((assignment) => assignment.status === "doing").length,
      done: assignments.filter((assignment) => assignment.status === "done").length,
      overdue: assignments.filter(isOverdue).length,
      dueSoon: assignments.filter(dueSoon).length,
      candidates: candidates.length,
    }),
    [assignments, candidates],
  );

  const urgentAssignments = useMemo(
    () => sortAssignments(assignments).filter((assignment) => isOverdue(assignment) || dueSoon(assignment)),
    [assignments],
  );

  const duplicateGroups = useMemo(() => {
    const groups = candidates.reduce<Record<string, AssignmentCandidate[]>>(
      (grouped, candidate) => {
        const key = normalizeCandidateTitle(candidate.title);
        if (!key) return grouped;
        grouped[key] = [...(grouped[key] ?? []), candidate];
        return grouped;
      },
      {},
    );

    return Object.values(groups).filter((group) => group.length > 1);
  }, [candidates]);

  const selectedAssignment = editingId
    ? assignments.find((assignment) => assignment.id === editingId) ?? null
    : null;

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  function resetCandidateForm() {
    setCandidateDraft(emptyCandidateDraft);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDraft = normalizeDraft(draft);

    if (!nextDraft.title) {
      setMessage("과제 제목을 입력하세요.");
      return;
    }

    setIsSaving(true);

    if (storageMode === "supabase" && supabase && userId) {
      await saveSupabaseAssignment(supabase, userId, nextDraft);
    } else {
      saveLocalAssignment(nextDraft);
    }

    setIsSaving(false);
    resetForm();
  }

  function handleCandidateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDraft = normalizeCandidateDraft(candidateDraft);

    if (!nextDraft.title) {
      setMessage("과제 후보 제목을 입력하세요.");
      return;
    }

    const now = new Date().toISOString();
    setCandidates((currentCandidates) =>
      sortCandidates([
        {
          id: createId(),
          title: nextDraft.title,
          dueDate: nextDraft.dueDate || null,
          priority: nextDraft.priority,
          source: nextDraft.source,
          createdAt: now,
        },
        ...currentCandidates,
      ]),
    );
    resetCandidateForm();
    setMessage("과제 후보를 후보함에 추가했습니다.");
  }

  async function saveSupabaseAssignment(
    client: SupabaseAssignmentClient,
    currentUserId: string,
    nextDraft: AssignmentDraft,
  ) {
    if (editingId) {
      const { data, error } = await client
        .from("tasks")
        .update({
          note_id: nextDraft.noteId || null,
          title: nextDraft.title,
          due_date: nextDraft.dueDate || null,
          status: nextDraft.status,
          priority: nextDraft.priority,
        })
        .eq("id", editingId)
        .eq("user_id", currentUserId)
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setAssignments((currentAssignments) =>
        currentAssignments.map((assignment) =>
          assignment.id === editingId ? mapSupabaseTask(data) : assignment,
        ),
      );
      setMessage("Supabase DB에 과제를 수정했습니다.");
      return;
    }

    const { data, error } = await client
      .from("tasks")
      .insert({
        user_id: currentUserId,
        note_id: nextDraft.noteId || null,
        title: nextDraft.title,
        due_date: nextDraft.dueDate || null,
        status: nextDraft.status,
        priority: nextDraft.priority,
      })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setAssignments((currentAssignments) =>
      sortAssignments([mapSupabaseTask(data), ...currentAssignments]),
    );
    setMessage("Supabase DB에 과제를 생성했습니다.");
  }

  async function createSupabaseAssignment(
    client: SupabaseAssignmentClient,
    currentUserId: string,
    nextDraft: AssignmentDraft,
  ) {
    const { data, error } = await client
      .from("tasks")
      .insert({
        user_id: currentUserId,
        note_id: nextDraft.noteId || null,
        title: nextDraft.title,
        due_date: nextDraft.dueDate || null,
        status: nextDraft.status,
        priority: nextDraft.priority,
      })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      return false;
    }

    setAssignments((currentAssignments) =>
      sortAssignments([mapSupabaseTask(data), ...currentAssignments]),
    );
    return true;
  }

  function saveLocalAssignment(nextDraft: AssignmentDraft) {
    const now = new Date().toISOString();

    if (editingId) {
      setAssignments((currentAssignments) =>
        sortAssignments(
          currentAssignments.map((assignment) =>
            assignment.id === editingId
              ? {
                  ...assignment,
                  noteId: nextDraft.noteId || null,
                  title: nextDraft.title,
                  dueDate: nextDraft.dueDate || null,
                  status: nextDraft.status,
                  priority: nextDraft.priority,
                  updatedAt: now,
                }
              : assignment,
          ),
        ),
      );
      setMessage("LocalStorage에 과제를 수정했습니다.");
      return;
    }

    setAssignments((currentAssignments) =>
      sortAssignments([
        {
          id: createId(),
          noteId: nextDraft.noteId || null,
          title: nextDraft.title,
          dueDate: nextDraft.dueDate || null,
          status: nextDraft.status,
          priority: nextDraft.priority,
          createdAt: now,
          updatedAt: now,
        },
        ...currentAssignments,
      ]),
    );
    setMessage("LocalStorage에 과제를 생성했습니다.");
  }

  function createLocalAssignment(nextDraft: AssignmentDraft) {
    const now = new Date().toISOString();

    setAssignments((currentAssignments) =>
      sortAssignments([
        {
          id: createId(),
          noteId: nextDraft.noteId || null,
          title: nextDraft.title,
          dueDate: nextDraft.dueDate || null,
          status: nextDraft.status,
          priority: nextDraft.priority,
          createdAt: now,
          updatedAt: now,
        },
        ...currentAssignments,
      ]),
    );
  }

  function editAssignment(assignment: Assignment) {
    setEditingId(assignment.id);
    setDraft({
      noteId: assignment.noteId ?? "",
      title: assignment.title,
      dueDate: assignment.dueDate ?? getToday(),
      status: assignment.status,
      priority: assignment.priority,
    });
    setMessage("");
  }

  async function updateAssignmentStatus(
    assignment: Assignment,
    status: AssignmentStatus,
  ) {
    if (storageMode === "supabase" && supabase && userId) {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", assignment.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setAssignments((currentAssignments) =>
        currentAssignments.map((currentAssignment) =>
          currentAssignment.id === assignment.id
            ? mapSupabaseTask(data)
            : currentAssignment,
        ),
      );
      return;
    }

    const now = new Date().toISOString();
    setAssignments((currentAssignments) =>
      currentAssignments.map((currentAssignment) =>
        currentAssignment.id === assignment.id
          ? { ...currentAssignment, status, updatedAt: now }
          : currentAssignment,
      ),
    );
  }

  async function deleteAssignment(assignmentId: string) {
    if (storageMode === "supabase" && supabase && userId) {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (error) {
        setMessage(error.message);
        return;
      }
    }

    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.id !== assignmentId),
    );
    setMessage("과제를 삭제했습니다.");
  }

  async function promoteCandidate(candidate: AssignmentCandidate) {
    const nextDraft: AssignmentDraft = {
      noteId: "",
      title: candidate.title,
      dueDate: candidate.dueDate ?? "",
      status: "todo",
      priority: candidate.priority,
    };

    setIsSaving(true);
    let promoted = true;
    if (storageMode === "supabase" && supabase && userId) {
      promoted = await createSupabaseAssignment(supabase, userId, nextDraft);
    } else {
      createLocalAssignment(nextDraft);
    }
    setIsSaving(false);
    if (promoted) {
      deleteCandidate(candidate.id);
      setMessage("과제 후보를 확정 과제로 전환했습니다.");
    }
  }

  function deleteCandidate(candidateId: string) {
    setCandidates((currentCandidates) =>
      currentCandidates.filter((candidate) => candidate.id !== candidateId),
    );
  }

  function mergeCandidateGroup(group: AssignmentCandidate[]) {
    const sortedGroup = sortCandidates(group);
    const representative = sortedGroup[0];
    const mergedSources = sortedGroup
      .map((candidate) => candidate.source)
      .filter(Boolean)
      .join(" / ");
    const groupIds = new Set(group.map((candidate) => candidate.id));

    setCandidates((currentCandidates) =>
      sortCandidates([
        {
          ...representative,
          id: createId(),
          source: mergedSources || "중복 후보 병합",
          createdAt: new Date().toISOString(),
        },
        ...currentCandidates.filter((candidate) => !groupIds.has(candidate.id)),
      ]),
    );
    setMessage("중복 후보를 하나로 병합했습니다.");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--muted)]">RuahNote</p>
              <h1 className="mt-1 text-2xl font-black text-[var(--text)]">
                과제 관리
              </h1>
              <p className="mt-2 text-sm font-semibold text-[var(--soft-text)]">
                과제 등록, 마감일, 중요도, 상태, 관련 노트를 한 화면에서 관리합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
              <SummaryPill label="전체" value={String(summary.total)} />
              <SummaryPill label="예정" value={String(summary.todo)} />
              <SummaryPill label="진행" value={String(summary.doing)} />
              <SummaryPill label="완료" value={String(summary.done)} />
              <SummaryPill label="임박" value={String(summary.dueSoon)} />
              <SummaryPill label="초과" value={String(summary.overdue)} tone="danger" />
              <SummaryPill label="후보" value={String(summary.candidates)} />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[var(--muted)]">
            저장소: {storageMode === "supabase" ? `Supabase (${userEmail})` : "LocalStorage"}
          </p>
        </div>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(320px,0.38fr)_minmax(0,0.62fr)]">
          <form
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
            onSubmit={handleCandidateSubmit}
          >
            <h2 className="text-lg font-bold text-[var(--text)]">과제 후보</h2>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">
                후보 제목
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="예: 발표 자료 정리"
                value={candidateDraft.title}
                onChange={(event) =>
                  setCandidateDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--soft-text)]">
                  예상 마감일
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  type="date"
                  value={candidateDraft.dueDate}
                  onChange={(event) =>
                    setCandidateDraft((currentDraft) => ({
                      ...currentDraft,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[var(--soft-text)]">
                  중요도
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={candidateDraft.priority}
                  onChange={(event) =>
                    setCandidateDraft((currentDraft) => ({
                      ...currentDraft,
                      priority: event.target.value as AssignmentPriority,
                    }))
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">
                출처
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="예: 2회차 노트, 강의 녹음 메모"
                value={candidateDraft.source}
                onChange={(event) =>
                  setCandidateDraft((currentDraft) => ({
                    ...currentDraft,
                    source: event.target.value,
                  }))
                }
              />
            </label>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                className="h-11 rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-4 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                type="submit"
              >
                후보 추가
              </button>
              <button
                className="h-11 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                type="button"
                onClick={resetCandidateForm}
              >
                초기화
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black text-[var(--text)]">
                    후보함
                  </h2>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                    {candidates.length}
                  </span>
                </div>
                <div className="mt-3 grid gap-3">
                  {sortCandidates(candidates).map((candidate) => (
                    <CandidateCard
                      candidate={candidate}
                      isSaving={isSaving}
                      key={candidate.id}
                      deleteCandidate={deleteCandidate}
                      promoteCandidate={promoteCandidate}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black text-[var(--text)]">
                    중복 후보
                  </h2>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                    {duplicateGroups.length}
                  </span>
                </div>
                <div className="mt-3 grid gap-3">
                  {duplicateGroups.length > 0 ? (
                    duplicateGroups.map((group) => (
                      <div
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
                        key={group.map((candidate) => candidate.id).join("-")}
                      >
                        <p className="text-sm font-black text-[var(--text)]">
                          {group[0].title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                          {group.length}개 후보
                        </p>
                        <button
                          className="mt-3 h-9 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)]"
                          type="button"
                          onClick={() => mergeCandidateGroup(group)}
                        >
                          하나로 병합
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--muted)]">
                      중복 후보가 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-[var(--text)]">
                  마감 대시보드
                </h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                  {urgentAssignments.length}
                </span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {urgentAssignments.length > 0 ? (
                  urgentAssignments.map((assignment) => (
                    <div
                      className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                      key={assignment.id}
                    >
                      <p className="break-words text-sm font-black text-[var(--text)]">
                        {assignment.title}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                        {isOverdue(assignment) ? "기한 초과" : "마감 임박"} /{" "}
                        {assignment.dueDate ?? "-"} / {priorityLabels[assignment.priority]}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--muted)]">
                    마감 임박 또는 초과 과제가 없습니다.
                  </p>
                )}
              </div>
            </section>
          </section>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(320px,0.36fr)_minmax(0,0.64fr)]">
          <form
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text)]">
                {editingId ? "과제 수정" : "새 과제"}
              </h2>
              {selectedAssignment ? (
                <span className="rounded-full bg-[var(--summary-bg)] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                  {selectedAssignment.updatedAt.slice(0, 10)}
                </span>
              ) : null}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">
                제목
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="예: 3주차 과제 제출"
                value={draft.title}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">
                관련 노트
              </span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={draft.noteId}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    noteId: event.target.value,
                  }))
                }
              >
                <option value="">연결 안 함</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.noteDate} / {note.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--soft-text)]">
                  마감일
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[var(--soft-text)]">
                  중요도
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      priority: event.target.value as AssignmentPriority,
                    }))
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">
                상태
              </span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={draft.status}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    status: event.target.value as AssignmentStatus,
                  }))
                }
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {message ? (
              <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-2 text-sm font-semibold text-[var(--soft-text)]">
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                className="h-11 rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-4 text-sm font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "저장 중" : editingId ? "수정 저장" : "과제 생성"}
              </button>
              <button
                className="h-11 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                type="button"
                onClick={resetForm}
              >
                초기화
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">과제 보드</h2>
              <input
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] sm:w-64"
                placeholder="검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {(["todo", "doing", "done"] as AssignmentStatus[]).map((status) => {
                const statusAssignments = filteredAssignments.filter(
                  (assignment) => assignment.status === status,
                );

                return (
                  <section
                    className="min-h-60 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3"
                    key={status}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-[var(--text)]">
                        {statusLabels[status]}
                      </h3>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                        {statusAssignments.length}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3">
                      {statusAssignments.length > 0 ? (
                        statusAssignments.map((assignment) => (
                          <AssignmentCard
                            assignment={assignment}
                            key={assignment.id}
                            linkedNote={noteById.get(assignment.noteId ?? "")}
                            deleteAssignment={deleteAssignment}
                            editAssignment={editAssignment}
                            updateAssignmentStatus={updateAssignmentStatus}
                          />
                        ))
                      ) : (
                        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--muted)]">
                          표시할 과제가 없습니다.
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function AssignmentCard({
  assignment,
  linkedNote,
  deleteAssignment,
  editAssignment,
  updateAssignmentStatus,
}: {
  assignment: Assignment;
  linkedNote: LinkedNote | undefined;
  deleteAssignment: (assignmentId: string) => void;
  editAssignment: (assignment: Assignment) => void;
  updateAssignmentStatus: (
    assignment: Assignment,
    status: AssignmentStatus,
  ) => void;
}) {
  const overdue = isOverdue(assignment);
  const soon = dueSoon(assignment);

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-black ${
                overdue
                  ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                  : soon
                    ? "border border-[var(--primary)] bg-[var(--summary-bg)] text-[var(--text)]"
                    : "bg-[var(--summary-bg)] text-[var(--muted)]"
              }`}
            >
              {overdue ? "기한 초과" : soon ? "마감 임박" : assignment.dueDate ?? "마감 없음"}
            </span>
            <span className="rounded-full bg-[var(--summary-bg)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
              {priorityLabels[assignment.priority]}
            </span>
          </div>
          <h4 className="mt-2 break-words text-base font-black text-[var(--text)]">
            {assignment.title}
          </h4>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[var(--soft-text)]">
        마감일: {assignment.dueDate ?? "-"}
      </p>
      {linkedNote ? (
        <p className="mt-1 break-words text-xs font-bold text-[var(--primary)]">
          노트: {linkedNote.noteDate} / {linkedNote.title}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <select
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-2 text-xs font-bold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          value={assignment.status}
          onChange={(event) =>
            updateAssignmentStatus(
              assignment,
              event.target.value as AssignmentStatus,
            )
          }
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="h-9 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-xs font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          type="button"
          onClick={() => editAssignment(assignment)}
        >
          수정
        </button>
        <button
          className="h-9 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 text-xs font-bold text-[var(--danger-text)] transition hover:bg-[var(--danger-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          type="button"
          onClick={() => deleteAssignment(assignment.id)}
        >
          삭제
        </button>
      </div>
    </article>
  );
}

function CandidateCard({
  candidate,
  isSaving,
  deleteCandidate,
  promoteCandidate,
}: {
  candidate: AssignmentCandidate;
  isSaving: boolean;
  deleteCandidate: (candidateId: string) => void;
  promoteCandidate: (candidate: AssignmentCandidate) => void;
}) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--summary-bg)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
          후보
        </span>
        <span className="rounded-full bg-[var(--summary-bg)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
          {priorityLabels[candidate.priority]}
        </span>
      </div>
      <h3 className="mt-2 break-words text-base font-black text-[var(--text)]">
        {candidate.title}
      </h3>
      <p className="mt-2 text-sm font-semibold text-[var(--soft-text)]">
        예상 마감일: {candidate.dueDate ?? "-"}
      </p>
      {candidate.source ? (
        <p className="mt-1 break-words text-xs font-bold text-[var(--primary)]">
          출처: {candidate.source}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          className="h-9 rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-3 text-xs font-bold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="button"
          onClick={() => promoteCandidate(candidate)}
        >
          과제로 전환
        </button>
        <button
          className="h-9 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 text-xs font-bold text-[var(--danger-text)] transition hover:bg-[var(--danger-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          type="button"
          onClick={() => deleteCandidate(candidate.id)}
        >
          삭제
        </button>
      </div>
    </article>
  );
}

function SummaryPill({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "danger";
  value: string;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        tone === "danger"
          ? "border-[var(--danger-border)] bg-[var(--danger-bg)]"
          : "border-[var(--border)] bg-[var(--summary-bg)]"
      }`}
    >
      <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
      <p className="text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
