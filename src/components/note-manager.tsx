"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Note,
  NoteCategory,
  NoteDraft,
  NoteFile,
  NoteSubject,
} from "@/lib/notes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasBrowserSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

const noteStorageKey = "ruahnote.notes.v1";
const fileStorageKey = "ruahnote.note-files.v1";
const categoryStorageKey = "ruahnote.note-categories.v1";
const subjectStorageKey = "ruahnote.note-subjects.v1";
const storageBucket = "note-files";

type StorageMode = "local" | "supabase";
type SupabaseNoteClient = SupabaseClient<Database>;
type SupabaseNoteRow = Database["public"]["Tables"]["notes"]["Row"];
type SupabaseFileRow = Database["public"]["Tables"]["files"]["Row"];
type SupabaseCategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type SupabaseSubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

const today = new Date().toISOString().slice(0, 10);

const emptyDraft: NoteDraft = {
  subjectId: "",
  title: "",
  contentPlain: "",
  noteDate: today,
  sessionNumber: "",
};

const defaultCategories: NoteCategory[] = [
  {
    id: "general-category",
    title: "General",
    color: "#7F927F",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultSubjects: NoteSubject[] = [
  {
    id: "general-subject",
    categoryId: "general-category",
    title: "Inbox",
    description: "Default note collection",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultNotes: Note[] = [
  {
    id: "welcome-note",
    subjectId: "general-subject",
    title: "RuahNote 노트 MVP",
    contentPlain:
      "로그인된 Supabase 세션이 있으면 노트와 파일을 DB/Storage에 저장하고, 설정 전에는 LocalStorage로 동작합니다.",
    noteDate: today,
    sessionNumber: 1,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}`;
}

function normalizeDraft(draft: NoteDraft): NoteDraft {
  return {
    subjectId: draft.subjectId,
    title: draft.title.trim(),
    contentPlain: draft.contentPlain.trim(),
    noteDate: draft.noteDate || today,
    sessionNumber: draft.sessionNumber.trim(),
  };
}

function mapSupabaseNote(row: SupabaseNoteRow): Note {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    contentPlain: row.content_plain,
    noteDate: row.note_date,
    sessionNumber: row.session_number,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapSupabaseCategory(row: SupabaseCategoryRow): NoteCategory {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapSupabaseSubject(row: SupabaseSubjectRow): NoteSubject {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function normalizeLocalNotes(notes: Note[]) {
  return notes.map((note) => ({
    ...note,
    subjectId: note.subjectId ?? "general-subject",
    sessionNumber: note.sessionNumber ?? null,
    isFavorite: note.isFavorite ?? false,
  }));
}

function mapSupabaseFile(row: SupabaseFileRow): NoteFile {
  return {
    id: row.id,
    noteId: row.note_id ?? "",
    fileName: row.file_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function readLocalNotes() {
  const stored = window.localStorage.getItem(noteStorageKey);

  if (!stored) return defaultNotes;

  try {
    return normalizeLocalNotes(JSON.parse(stored) as Note[]);
  } catch {
    return defaultNotes;
  }
}

function readLocalCategories() {
  const stored = window.localStorage.getItem(categoryStorageKey);

  if (!stored) return defaultCategories;

  try {
    return JSON.parse(stored) as NoteCategory[];
  } catch {
    return defaultCategories;
  }
}

function readLocalSubjects() {
  const stored = window.localStorage.getItem(subjectStorageKey);

  if (!stored) return defaultSubjects;

  try {
    return JSON.parse(stored) as NoteSubject[];
  } catch {
    return defaultSubjects;
  }
}

function readLocalFiles() {
  const stored = window.localStorage.getItem(fileStorageKey);

  if (!stored) return {};

  try {
    return JSON.parse(stored) as Record<string, NoteFile[]>;
  } catch {
    return {};
  }
}

function groupFiles(files: NoteFile[]) {
  return files.reduce<Record<string, NoteFile[]>>((grouped, file) => {
    if (!file.noteId) return grouped;
    grouped[file.noteId] = [...(grouped[file.noteId] ?? []), file];
    return grouped;
  }, {});
}

function readableSize(sizeBytes: number | null) {
  if (!sizeBytes) return "-";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function safeStorageName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseSessionNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function buildAutoTitle(
  draft: NoteDraft,
  subject: NoteSubject | undefined,
) {
  if (draft.title) return draft.title;

  const sessionLabel = draft.sessionNumber ? ` ${draft.sessionNumber}회차` : "";
  return `${subject?.title ?? "노트"}${sessionLabel} - ${draft.noteDate}`;
}

export default function NoteManager() {
  const isSupabaseConfigured = hasBrowserSupabaseConfig();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createBrowserSupabaseClient() : null),
    [isSupabaseConfigured],
  );
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [categories, setCategories] = useState<NoteCategory[]>(defaultCategories);
  const [subjects, setSubjects] = useState<NoteSubject[]>(defaultSubjects);
  const [filesByNote, setFilesByNote] = useState<Record<string, NoteFile[]>>({});
  const [draft, setDraft] = useState<NoteDraft>(emptyDraft);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [subjectDraft, setSubjectDraft] = useState({
    categoryId: "general-category",
    title: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [storageMode, setStorageMode] = useState<StorageMode>("local");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const loadSupabaseData = useCallback(async (client: SupabaseNoteClient) => {
    const [categoriesResult, subjectsResult, notesResult, filesResult] =
      await Promise.all([
        client
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        client
          .from("subjects")
          .select("*")
          .order("created_at", { ascending: true }),
      client
        .from("notes")
        .select("*")
        .order("note_date", { ascending: false })
        .order("updated_at", { ascending: false }),
      client
        .from("files")
        .select("*")
        .order("created_at", { ascending: false }),
      ]);

    const firstError =
      categoriesResult.error ?? subjectsResult.error ?? notesResult.error;

    if (firstError) {
      setMessage(firstError.message);
      setCategories(readLocalCategories());
      setSubjects(readLocalSubjects());
      setNotes(readLocalNotes());
      setFilesByNote(readLocalFiles());
      setStorageMode("local");
      return;
    }

    if (filesResult.error) {
      setMessage(filesResult.error.message);
      setFilesByNote({});
    } else {
      setFilesByNote(groupFiles((filesResult.data ?? []).map(mapSupabaseFile)));
    }

    setCategories((categoriesResult.data ?? []).map(mapSupabaseCategory));
    setSubjects((subjectsResult.data ?? []).map(mapSupabaseSubject));
    setNotes((notesResult.data ?? []).map(mapSupabaseNote));
  }, []);

  const syncSessionAndNotes = useCallback(
    async (client: SupabaseNoteClient) => {
      const { data, error } = await client.auth.getSession();
      const session = data.session;

      if (error) {
        setMessage(error.message);
      }

      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);

      if (session?.user.id) {
        setStorageMode("supabase");
        await loadSupabaseData(client);
      } else {
        setStorageMode("local");
        setCategories(readLocalCategories());
        setSubjects(readLocalSubjects());
        setNotes(readLocalNotes());
        setFilesByNote(readLocalFiles());
      }

      setIsReady(true);
    },
    [loadSupabaseData],
  );

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const timeoutId = window.setTimeout(() => {
      if (!supabase) {
        setCategories(readLocalCategories());
        setSubjects(readLocalSubjects());
        setNotes(readLocalNotes());
        setFilesByNote(readLocalFiles());
        setStorageMode("local");
        setIsReady(true);
        return;
      }

      syncSessionAndNotes(supabase);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const nextUserId = session?.user.id ?? null;
        setUserId(nextUserId);
        setUserEmail(session?.user.email ?? null);

        if (nextUserId) {
          loadSupabaseData(supabase);
          setStorageMode("supabase");
        } else {
          setCategories(readLocalCategories());
          setSubjects(readLocalSubjects());
          setNotes(readLocalNotes());
          setFilesByNote(readLocalFiles());
          setStorageMode("local");
        }
      });

      unsubscribeAuth = () => subscription.unsubscribe();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribeAuth?.();
    };
  }, [loadSupabaseData, supabase, syncSessionAndNotes]);

  useEffect(() => {
    if (!isReady || storageMode !== "local") return;
    window.localStorage.setItem(noteStorageKey, JSON.stringify(notes));
  }, [isReady, notes, storageMode]);

  useEffect(() => {
    if (!isReady || storageMode !== "local") return;
    window.localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
    window.localStorage.setItem(subjectStorageKey, JSON.stringify(subjects));
  }, [categories, isReady, storageMode, subjects]);

  useEffect(() => {
    if (!isReady || storageMode !== "local") return;
    window.localStorage.setItem(fileStorageKey, JSON.stringify(filesByNote));
  }, [filesByNote, isReady, storageMode]);

  const filteredNotes = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return notes;

    return notes.filter((note) =>
      `${note.title} ${note.contentPlain} ${note.noteDate} ${
        subjects.find((subject) => subject.id === note.subjectId)?.title ?? ""
      }`
        .toLowerCase()
        .includes(cleanQuery),
    );
  }, [notes, query, subjects]);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const selectedNote = editingId
    ? notes.find((note) => note.id === editingId) ?? null
    : null;

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDraft = normalizeDraft(draft);
    const nextDraft = {
      ...normalizedDraft,
      title: buildAutoTitle(
        normalizedDraft,
        subjectById.get(normalizedDraft.subjectId),
      ),
    };

    if (!nextDraft.title) {
      setMessage("제목을 입력하세요.");
      return;
    }

    setIsSaving(true);

    if (storageMode === "supabase" && supabase && userId) {
      await saveSupabaseNote(supabase, userId, nextDraft);
    } else {
      saveLocalNote(nextDraft);
    }

    setIsSaving(false);
    resetForm();
  }

  async function saveSupabaseNote(
    client: SupabaseNoteClient,
    currentUserId: string,
    nextDraft: NoteDraft,
  ) {
    if (editingId) {
      const { data, error } = await client
        .from("notes")
        .update({
          subject_id: nextDraft.subjectId || null,
          title: nextDraft.title,
          content_plain: nextDraft.contentPlain,
          content_json: {},
          note_date: nextDraft.noteDate,
          session_number: parseSessionNumber(nextDraft.sessionNumber),
        })
        .eq("id", editingId)
        .eq("user_id", currentUserId)
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingId ? mapSupabaseNote(data) : note,
        ),
      );
      setMessage("Supabase DB에 노트를 수정했습니다.");
      return;
    }

    const { data, error } = await client
      .from("notes")
      .insert({
        user_id: currentUserId,
        subject_id: nextDraft.subjectId || null,
        title: nextDraft.title,
        content_plain: nextDraft.contentPlain,
        content_json: {},
        note_date: nextDraft.noteDate,
        session_number: parseSessionNumber(nextDraft.sessionNumber),
        is_favorite: false,
      })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setNotes((currentNotes) => [mapSupabaseNote(data), ...currentNotes]);
    setMessage("Supabase DB에 노트를 생성했습니다.");
  }

  function saveLocalNote(nextDraft: NoteDraft) {
    const now = new Date().toISOString();

    if (editingId) {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingId
            ? {
                ...note,
                subjectId: nextDraft.subjectId || null,
                title: nextDraft.title,
                contentPlain: nextDraft.contentPlain,
                noteDate: nextDraft.noteDate,
                sessionNumber: parseSessionNumber(nextDraft.sessionNumber),
                updatedAt: now,
              }
            : note,
        ),
      );
      setMessage("LocalStorage에 노트를 수정했습니다.");
      return;
    }

    setNotes((currentNotes) => [
      {
        id: createId(),
        subjectId: nextDraft.subjectId || null,
        title: nextDraft.title,
        contentPlain: nextDraft.contentPlain,
        noteDate: nextDraft.noteDate,
        sessionNumber: parseSessionNumber(nextDraft.sessionNumber),
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      ...currentNotes,
    ]);
    setMessage("LocalStorage에 노트를 생성했습니다.");
  }

  function editNote(note: Note) {
    setEditingId(note.id);
    setDraft({
      subjectId: note.subjectId ?? "",
      title: note.title,
      contentPlain: note.contentPlain,
      noteDate: note.noteDate,
      sessionNumber: note.sessionNumber ? String(note.sessionNumber) : "",
    });
    setMessage("");
  }

  async function createCategory() {
    const title = categoryTitle.trim();

    if (!title) {
      setMessage("Enter a category title.");
      return;
    }

    setIsSaving(true);

    if (storageMode === "supabase" && supabase && userId) {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          title,
          color: "#7F927F",
          sort_order: categories.length,
        })
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      const nextCategory = mapSupabaseCategory(data);
      setCategories((currentCategories) => [...currentCategories, nextCategory]);
      setSubjectDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: nextCategory.id,
      }));
    } else {
      const now = new Date().toISOString();
      const nextCategory: NoteCategory = {
        id: createId(),
        title,
        color: "#7F927F",
        sortOrder: categories.length,
        createdAt: now,
        updatedAt: now,
      };
      setCategories((currentCategories) => [...currentCategories, nextCategory]);
      setSubjectDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: nextCategory.id,
      }));
    }

    setCategoryTitle("");
    setMessage("Category created.");
    setIsSaving(false);
  }

  async function createSubject() {
    const title = subjectDraft.title.trim();
    const categoryId = subjectDraft.categoryId || categories[0]?.id;

    if (!title || !categoryId) {
      setMessage("Enter a subject title and category.");
      return;
    }

    setIsSaving(true);

    if (storageMode === "supabase" && supabase && userId) {
      const { data, error } = await supabase
        .from("subjects")
        .insert({
          user_id: userId,
          category_id: categoryId,
          title,
          description: subjectDraft.description.trim() || null,
        })
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      const nextSubject = mapSupabaseSubject(data);
      setSubjects((currentSubjects) => [...currentSubjects, nextSubject]);
      setDraft((currentDraft) => ({ ...currentDraft, subjectId: nextSubject.id }));
    } else {
      const now = new Date().toISOString();
      const nextSubject: NoteSubject = {
        id: createId(),
        categoryId,
        title,
        description: subjectDraft.description.trim() || null,
        createdAt: now,
        updatedAt: now,
      };
      setSubjects((currentSubjects) => [...currentSubjects, nextSubject]);
      setDraft((currentDraft) => ({ ...currentDraft, subjectId: nextSubject.id }));
    }

    setSubjectDraft({
      categoryId,
      title: "",
      description: "",
    });
    setMessage("Subject created.");
    setIsSaving(false);
  }

  async function deleteNote(noteId: string) {
    setIsSaving(true);

    if (storageMode === "supabase" && supabase && userId) {
      const files = filesByNote[noteId] ?? [];

      if (files.length > 0) {
        await supabase.storage
          .from(storageBucket)
          .remove(files.map((file) => file.filePath));
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", userId);

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      setMessage("Supabase DB에서 노트를 삭제했습니다.");
    } else {
      setMessage("LocalStorage에서 노트를 삭제했습니다.");
    }

    setFilesByNote((currentFiles) => {
      const nextFiles = { ...currentFiles };
      delete nextFiles[noteId];
      return nextFiles;
    });
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));

    if (editingId === noteId) {
      resetForm();
    }

    setIsSaving(false);
  }

  async function toggleFavorite(note: Note) {
    const nextFavorite = !note.isFavorite;

    if (storageMode === "supabase" && supabase && userId) {
      const { data, error } = await supabase
        .from("notes")
        .update({ is_favorite: nextFavorite })
        .eq("id", note.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote.id === note.id ? mapSupabaseNote(data) : currentNote,
        ),
      );
    } else {
      setNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote.id === note.id
            ? { ...currentNote, isFavorite: nextFavorite }
            : currentNote,
        ),
      );
    }
  }

  async function uploadNoteFile(noteId: string, file: File | undefined) {
    if (!file) return;

    setIsSaving(true);

    if (storageMode === "supabase" && supabase && userId) {
      const filePath = `${userId}/${noteId}/${Date.now()}-${safeStorageName(
        file.name,
      )}`;

      const uploadResult = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file, { upsert: false });

      if (uploadResult.error) {
        setMessage(uploadResult.error.message);
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("files")
        .insert({
          user_id: userId,
          note_id: noteId,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      const nextFile = mapSupabaseFile(data);
      setFilesByNote((currentFiles) => ({
        ...currentFiles,
        [noteId]: [nextFile, ...(currentFiles[noteId] ?? [])],
      }));
      setMessage("Supabase Storage에 파일을 업로드했습니다.");
    } else {
      const nextFile: NoteFile = {
        id: createId(),
        noteId,
        fileName: file.name,
        filePath: `local://${noteId}/${file.name}`,
        mimeType: file.type || null,
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
      };

      setFilesByNote((currentFiles) => ({
        ...currentFiles,
        [noteId]: [nextFile, ...(currentFiles[noteId] ?? [])],
      }));
      setMessage("LocalStorage에 파일 메타데이터를 기록했습니다.");
    }

    setIsSaving(false);
  }

  async function openFile(file: NoteFile) {
    if (storageMode !== "supabase" || !supabase) {
      setMessage("로컬 모드에서는 파일 본문을 저장하지 않고 메타데이터만 표시합니다.");
      return;
    }

    const { data, error } = await supabase.storage
      .from(storageBucket)
      .createSignedUrl(file.filePath, 60);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const storageLabel =
    storageMode === "supabase"
      ? `Supabase DB/Storage${userEmail ? ` | ${userEmail}` : ""}`
      : isSupabaseConfigured
        ? "LocalStorage | 로그인하면 DB/Storage 저장"
        : "LocalStorage | Supabase 미설정";

  return (
    <main className="schedule-theme-light min-h-screen bg-[var(--app-bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-lg border border-[var(--header-border)] bg-[var(--header-bg)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">Notes MVP</p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
                RuahNote 노트
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                노트 작성, 수정, 삭제, 검색, 파일 첨부를 지원합니다. Supabase
                세션이 있으면 DB/Storage에 저장하고, 설정 전에는 LocalStorage로
                동작합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <SummaryPill label="Categories" value={`${categories.length}`} />
              <SummaryPill label="Subjects" value={`${subjects.length}`} />
              <SummaryPill label="전체" value={`${notes.length}`} />
              <SummaryPill label="검색 결과" value={`${filteredNotes.length}`} />
            </div>
          </div>
          <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-2 text-sm font-semibold text-[var(--soft-text)]">
            저장소: {storageLabel}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold text-[var(--text)]">Categories</h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-11 min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Category title"
                value={categoryTitle}
                onChange={(event) => setCategoryTitle(event.target.value)}
              />
              <button
                className="h-11 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="button"
                onClick={createCategory}
              >
                Add
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  className="rounded-full border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-1 text-xs font-bold text-[var(--text)]"
                  key={category.id}
                >
                  {category.title}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold text-[var(--text)]">Subjects</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(120px,0.75fr)_minmax(120px,1fr)]">
              <select
                className="h-11 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={subjectDraft.categoryId}
                onChange={(event) =>
                  setSubjectDraft((currentDraft) => ({
                    ...currentDraft,
                    categoryId: event.target.value,
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
              <input
                className="h-11 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Subject title"
                value={subjectDraft.title}
                onChange={(event) =>
                  setSubjectDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-11 min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Description"
                value={subjectDraft.description}
                onChange={(event) =>
                  setSubjectDraft((currentDraft) => ({
                    ...currentDraft,
                    description: event.target.value,
                  }))
                }
              />
              <button
                className="h-11 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="button"
                onClick={createSubject}
              >
                Add
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {subjects.map((subject) => (
                <div
                  className="rounded-md border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-2 text-sm text-[var(--soft-text)]"
                  key={subject.id}
                >
                  <span className="font-bold text-[var(--text)]">{subject.title}</span>
                  <span className="ml-2 text-xs font-semibold text-[var(--muted)]">
                    {categoryById.get(subject.categoryId)?.title ?? "No category"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(320px,0.42fr)_minmax(0,0.58fr)]">
          <form
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text)]">
                {editingId ? "노트 수정" : "새 노트"}
              </h2>
              {selectedNote ? (
                <span className="rounded-full bg-[var(--summary-bg)] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                  {selectedNote.updatedAt.slice(0, 10)}
                </span>
              ) : null}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">
                Subject
              </span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={draft.subjectId}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    subjectId: event.target.value,
                  }))
                }
              >
                <option value="">No subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {categoryById.get(subject.categoryId)?.title ?? "No category"} /{" "}
                    {subject.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">제목</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="노트 제목"
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
              <span className="text-sm font-semibold text-[var(--soft-text)]">날짜</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                type="date"
                value={draft.noteDate}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    noteDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">회차</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                min="1"
                placeholder="예: 1"
                type="number"
                value={draft.sessionNumber}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    sessionNumber: event.target.value,
                  }))
                }
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[var(--soft-text)]">내용</span>
              <textarea
                className="mt-2 min-h-56 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 py-3 text-sm leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="강의 내용, 과제 메모, 정리할 생각을 적어두세요."
                value={draft.contentPlain}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    contentPlain: event.target.value,
                  }))
                }
              />
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
                {isSaving ? "저장 중" : editingId ? "수정 저장" : "노트 생성"}
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
              <h2 className="text-lg font-bold text-[var(--text)]">노트 목록</h2>
              <input
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] sm:w-64"
                placeholder="검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-4 grid gap-3">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <NoteCard
                    category={categoryById.get(
                      subjectById.get(note.subjectId ?? "")?.categoryId ?? "",
                    )}
                    editingId={editingId}
                    files={filesByNote[note.id] ?? []}
                    isSaving={isSaving}
                    key={note.id}
                    note={note}
                    subject={subjectById.get(note.subjectId ?? "")}
                    deleteNote={deleteNote}
                    editNote={editNote}
                    openFile={openFile}
                    toggleFavorite={toggleFavorite}
                    uploadNoteFile={uploadNoteFile}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-6 text-center text-sm font-semibold text-[var(--muted)]">
                  표시할 노트가 없습니다.
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function NoteCard({
  category,
  editingId,
  files,
  isSaving,
  note,
  subject,
  deleteNote,
  editNote,
  openFile,
  toggleFavorite,
  uploadNoteFile,
}: {
  category: NoteCategory | undefined;
  editingId: string | null;
  files: NoteFile[];
  isSaving: boolean;
  note: Note;
  subject: NoteSubject | undefined;
  deleteNote: (noteId: string) => void;
  editNote: (note: Note) => void;
  openFile: (file: NoteFile) => void;
  toggleFavorite: (note: Note) => void;
  uploadNoteFile: (noteId: string, file: File | undefined) => void;
}) {
  return (
    <article
      className={`rounded-lg border p-4 transition ${
        editingId === note.id
          ? "border-[var(--primary)] bg-[var(--summary-bg)]"
          : "border-[var(--border)] bg-[var(--control-bg)] hover:bg-[var(--hover)]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--muted)]">{note.noteDate}</p>
          <p className="mt-1 text-xs font-semibold text-[var(--primary)]">
            {category?.title ?? "No category"} / {subject?.title ?? "No subject"}
            {note.sessionNumber ? ` / ${note.sessionNumber}회차` : ""}
          </p>
          <h3 className="mt-1 break-words text-base font-bold text-[var(--text)]">
            {note.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-9 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            type="button"
            onClick={() => toggleFavorite(note)}
          >
            {note.isFavorite ? "★" : "☆"}
          </button>
          <label className="grid h-9 cursor-pointer place-items-center rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)]">
            첨부
            <input
              className="sr-only"
              disabled={isSaving}
              type="file"
              onChange={(event) => {
                uploadNoteFile(note.id, event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button
            className="h-9 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            type="button"
            onClick={() => editNote(note)}
          >
            수정
          </button>
          <button
            className="h-9 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 text-sm font-bold text-[var(--danger-text)] transition hover:bg-[var(--danger-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="button"
            onClick={() => deleteNote(note.id)}
          >
            삭제
          </button>
        </div>
      </div>
      <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-[var(--soft-text)]">
        {note.contentPlain || "내용 없음"}
      </p>

      {files.length > 0 ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-bold text-[var(--muted)]">첨부 파일</p>
          <div className="mt-2 grid gap-2">
            {files.map((file) => (
              <button
                className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 py-2 text-left transition hover:bg-[var(--hover)]"
                key={file.id}
                type="button"
                onClick={() => openFile(file)}
              >
                <span className="min-w-0 truncate text-sm font-semibold text-[var(--text)]">
                  {file.fileName}
                </span>
                <span className="shrink-0 text-xs font-bold text-[var(--muted)]">
                  {readableSize(file.sizeBytes)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--summary-bg)] px-3 py-2">
      <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
      <p className="text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
