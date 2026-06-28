"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "planned" | "active" | "blocked" | "done";
type TaskPriority = "high" | "normal" | "watch";
type ThemeMode = "light" | "dark";

type Participant = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

type Project = {
  id: string;
  title: string;
  description: string;
  color: string;
};

type ProjectTask = {
  id: string;
  projectId: string;
  taskName: string;
  schedule: string;
  details: string;
  doneCriteria: string;
  milestone: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeIds: string[];
  note: string;
};

const taskStorageKey = "ruahnote.project-tasks.v4";
const legacyProjectTaskStorageKeys = [
  "ruahnote.project-tasks.v3",
  "ruahnote.project-tasks.v2",
  "ruahnote.project-tasks.v1",
];
const legacyTaskStorageKey = "ruahnote.schedule.v2";
const participantStorageKey = "ruahnote.participants.v2";
const legacyParticipantStorageKey = "ruahnote.participants.v1";
const themeStorageKey = "ruahnote.schedule.theme.v1";
const openProjectStorageKey = "ruahnote.project.open-projects.v3";
const defaultOwner = "KingAaron";
const WORK_HOURS_PER_DAY = 8;

const statusRank: Record<TaskStatus, number> = {
  planned: 0,
  blocked: 1,
  active: 2,
  done: 3,
};

const statusLabels: Record<TaskStatus, string> = {
  planned: "예정",
  active: "진행중",
  blocked: "보류",
  done: "완료",
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "중요",
  normal: "보통",
  watch: "주의",
};

const projects: Project[] = [
  {
    id: "foundation",
    title: "RuahNote 기반 구축",
    description: "개발 환경, 공통 레이아웃, DB/Auth/Storage 기반",
    color: "#7F927F",
  },
  {
    id: "note-core",
    title: "노트 코어",
    description: "카테고리, 과목/프로젝트, 날짜별 노트, 에디터",
    color: "#4DBAC6",
  },
  {
    id: "materials",
    title: "자료 처리 시스템",
    description: "첨부파일, 카메라, OCR, 스캔센터, PDF 변환",
    color: "#9C7AE2",
  },
  {
    id: "automation",
    title: "과제·AI 자동화",
    description: "과제 관리, 녹음, STT, AI 강의노트, 후보 추출",
    color: "#D45A50",
  },
  {
    id: "google",
    title: "Google 연동",
    description: "OAuth, Calendar, Contacts, Gmail 다중 계정",
    color: "#6478C7",
  },
  {
    id: "release",
    title: "출시·운영",
    description: "통합 대시보드, QA, 배포, 운영 문서",
    color: "#D1A24C",
  },
];

const defaultParticipants: Participant[] = [
  {
    id: "kingaaron",
    name: defaultOwner,
    email: "kingaaron@example.com",
    avatarUrl: "",
  },
];

const defaultTasks: ProjectTask[] = [
  {
    id: "foundation-setup",
    projectId: "foundation",
    taskName: "프로젝트 준비",
    schedule: "D1 | 4H",
    details:
      "GitHub 저장소 연결, 브랜치 규칙 정리, .env.example 작성, 필수 패키지 설치, 기본 폴더 구조 생성",
    doneCriteria: "lint/build 통과, 기본 폴더 구조 생성",
    milestone: "M1 준비",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "foundation-layout",
    projectId: "foundation",
    taskName: "UI 골격",
    schedule: "D1 → D2 | 10H",
    details:
      "좌측 사이드바, 상단바, 3단 레이아웃, 기본 카드/버튼/배지 컴포넌트, 색상 토큰 적용",
    doneCriteria: "주요 메뉴 이동과 기본 레이아웃 표시",
    milestone: "M1. 기본 앱 골격",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "foundation-db-1",
    projectId: "foundation",
    taskName: "Supabase/Prisma 모델",
    schedule: "D2 → D3 | 8H",
    details:
      "Supabase 프로젝트 연결, Prisma 설치, User/Category/Subject/Note/File 기본 모델 작성",
    doneCriteria: "로컬 migration 생성 및 DB 반영",
    milestone: "M2 준비",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "foundation-db-2",
    projectId: "foundation",
    taskName: "Auth/Storage/RLS",
    schedule: "D3 → D4 | 9H",
    details:
      "Auth 구조, Storage bucket, RLS 정책 초안, 서버 전용 Supabase/Prisma 클라이언트 구성",
    doneCriteria: "로그인 사용자 기준 데이터 분리 가능",
    milestone: "M2 준비",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "note-category",
    projectId: "note-core",
    taskName: "카테고리/과목 CRUD",
    schedule: "D4 → D5 | 9H",
    details:
      "큰 카테고리 생성/수정/보관, 과목/프로젝트 생성/수정/보관, 색상/아이콘/정렬",
    doneCriteria: "카테고리 > 과목/프로젝트 계층 생성 가능",
    milestone: "M2. 데이터 기반 노트 MVP",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "note-crud",
    projectId: "note-core",
    taskName: "날짜별 노트 CRUD",
    schedule: "D5 → D6 | 10H",
    details:
      "날짜별 노트 생성, 자동 제목, 회차, 목록/상세, 최근 노트, 즐겨찾기",
    doneCriteria: "과목 하위 노트 작성 흐름 완성",
    milestone: "M2. 데이터 기반 노트 MVP",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "note-editor",
    projectId: "note-core",
    taskName: "노트 에디터",
    schedule: "D6 → D8 | 14H",
    details:
      "문서형 에디터, 제목/본문/체크리스트, 저장, content_json/content_plain 동기화",
    doneCriteria: "노트 본문 작성/수정/저장 가능",
    milestone: "M3 준비",
    priority: "high",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "material-upload",
    projectId: "materials",
    taskName: "첨부/검색",
    schedule: "D8 → D9 | 8H",
    details:
      "이미지/파일 업로드, 노트 첨부 카드, 파일 메타데이터, 태그, 노트/파일 검색 초안",
    doneCriteria: "노트에 파일을 붙이고 다시 조회 가능",
    milestone: "M3. 자료 첨부형 노트",
    priority: "normal",
    status: "done",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "material-camera-ocr",
    projectId: "materials",
    taskName: "카메라/OCR",
    schedule: "D9 → D10 | 9H",
    details:
      "MediaDevices 카메라 촬영, 이미지 압축, OCR 실행 모달, OCR 결과 저장/삽입",
    doneCriteria: "촬영 이미지에서 텍스트 추출 가능",
    milestone: "M4 준비",
    priority: "normal",
    status: "active",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "material-scan-pdf",
    projectId: "materials",
    taskName: "스캔센터/PDF",
    schedule: "D10 → D12 | 12H",
    details:
      "스캔 폴더, 이미지 넘버링, 썸네일 선택, OCR 상태, PDF 변환, 파일함 연결",
    doneCriteria: "여러 이미지를 PDF로 묶어 저장 가능",
    milestone: "M4. OCR/PDF 자료 처리",
    priority: "normal",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "automation-assignment",
    projectId: "automation",
    taskName: "과제 관리",
    schedule: "D12 → D13 | 10H",
    details:
      "과제 등록, 마감일/중요도/상태, 칸반/리스트, 완료 보관, 관련 노트/파일 연결",
    doneCriteria: "과제 생성부터 완료 보관까지 가능",
    milestone: "M5 준비",
    priority: "high",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "automation-assignment-ai",
    projectId: "automation",
    taskName: "과제 후보/중복 통합",
    schedule: "D13 → D14 | 7H",
    details: "과제 후보 수동 등록, 중복 후보 통합 UI, 대시보드 마감 임박 표시",
    doneCriteria: "마감 임박/기한 초과가 대시보드에 반영",
    milestone: "M5. 과제 운영",
    priority: "normal",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "automation-recording",
    projectId: "automation",
    taskName: "녹음 기반",
    schedule: "D14 → D15 | 8H",
    details: "녹음 업로드, Recording/File 연결, 재생 UI, 타임라인 메모 수동 추가",
    doneCriteria: "노트와 녹음파일 연결 가능",
    milestone: "M6 준비",
    priority: "normal",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "automation-stt-ai",
    projectId: "automation",
    taskName: "STT/AI 강의노트",
    schedule: "D15 → D17 | 14H",
    details:
      "OpenAI API 연결, STT 변환, AI 강의노트 생성, 키워드/요약/과제 후보 저장",
    doneCriteria: "녹음에서 강의노트와 과제 후보 생성",
    milestone: "M6. AI 강의노트",
    priority: "normal",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "google-oauth",
    projectId: "google",
    taskName: "Google OAuth",
    schedule: "D17 → D18 | 8H",
    details: "Google Cloud 설정, OAuth callback, 계정 연결/해제, 토큰 암호화 저장",
    doneCriteria: "Google 계정 1개 이상 연결 가능",
    milestone: "M7 준비",
    priority: "watch",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "google-calendar-contacts",
    projectId: "google",
    taskName: "Calendar/Contacts",
    schedule: "D18 → D19 | 8H",
    details: "캘린더 목록/오늘/주간 조회, 연락처 검색, 과목별 연락처 연결",
    doneCriteria: "일정과 연락처를 앱에서 조회 가능",
    milestone: "M7 준비",
    priority: "watch",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "google-gmail",
    projectId: "google",
    taskName: "Gmail",
    schedule: "D19 → D21 | 14H",
    details:
      "다중 Gmail 계정, 계정별 메일 목록, 메일 상세, 검색, 연락처 기반 메일 작성",
    doneCriteria: "2개 이상 Gmail 계정 읽기 및 메일 작성 가능",
    milestone: "M7. Google 연동",
    priority: "watch",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
  {
    id: "release-qa",
    projectId: "release",
    taskName: "통합/QA/배포",
    schedule: "D21 → D23 | 15H",
    details:
      "통합 대시보드, 전체 사용자 흐름 QA, 에러 처리, 로딩/빈 상태, Vercel 배포, 문서 정리",
    doneCriteria: "배포 URL에서 핵심 시나리오 통과",
    milestone: "M8. 1차 완성 배포",
    priority: "high",
    status: "planned",
    assigneeIds: ["kingaaron"],
    note: "",
  },
];

function statusProgress(status: TaskStatus) {
  if (status === "done") return 100;
  if (status === "active") return 55;
  if (status === "blocked") return 25;
  return 0;
}

function progressColor(progress: number) {
  if (progress >= 85) return "#42A66B";
  if (progress >= 55) return "#7F927F";
  if (progress >= 25) return "#D1A24C";
  return "#C65C54";
}

function getStatusClass(status: TaskStatus) {
  if (status === "done") return "bg-emerald-100 text-emerald-900 ring-emerald-300";
  if (status === "active") return "bg-sky-100 text-sky-900 ring-sky-300";
  if (status === "blocked") return "bg-rose-100 text-rose-900 ring-rose-300";
  return "bg-[var(--control-bg)] text-[var(--muted)] ring-[var(--border)]";
}

function getPriorityClass(priority: TaskPriority) {
  if (priority === "high") return "bg-[#E8B8B0]/55 text-[#763F36]";
  if (priority === "watch") return "bg-[#F3D9A4]/70 text-[#6E4F13]";
  return "bg-[#D9E5EA] text-[#365665]";
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function isLegacySchedule(schedule: string | undefined) {
  return Boolean(
      schedule?.includes("주차") ||
      schedule?.includes("(") ||
      schedule?.includes("·") ||
      schedule?.includes("-") ||
      (schedule ? /[0-9]h/.test(schedule) : false),
  );
}

function scheduleHours(schedule: string) {
  const match = schedule.match(/(\d+(?:\.\d+)?)h/i);
  return match ? Number(match[1]) : 0;
}

function formatScheduleRange(startHour: number, hours: number) {
  const safeHours = Math.max(0, Math.round(hours));
  const startDay = Math.floor(startHour / WORK_HOURS_PER_DAY) + 1;
  const endDay =
    safeHours === 0
      ? startDay
      : Math.max(
          startDay,
          Math.ceil((startHour + safeHours) / WORK_HOURS_PER_DAY),
        );
  const range = startDay === endDay ? `D${startDay}` : `D${startDay} → D${endDay}`;

  return `${range} | ${safeHours}H`;
}

function recomputeTaskSchedules(
  tasks: ProjectTask[],
  changedTaskId?: string,
  changedHours?: number,
) {
  let elapsedHours = 0;

  return tasks.map((task) => {
    const hours =
      task.id === changedTaskId && changedHours !== undefined
        ? changedHours
        : scheduleHours(task.schedule);
    const schedule = formatScheduleRange(elapsedHours, hours);

    elapsedHours += Math.max(0, Math.round(hours));

    return {
      ...task,
      schedule,
    };
  });
}

function formatWorkDuration(hours: number) {
  const workDays = Math.floor(hours / WORK_HOURS_PER_DAY);
  const remainingHours = hours % WORK_HOURS_PER_DAY;

  if (workDays === 0) return `${remainingHours}H`;
  if (remainingHours === 0) return `${workDays}D`;
  return `${workDays}D ${remainingHours}H`;
}

function participantId(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, "-");
}

function initials(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return "?";
  const words = cleanName.split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return cleanName.slice(0, 1).toUpperCase();
}

function readAvatarFile(
  file: File | undefined,
  onLoad: (avatarUrl: string) => void,
) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      onLoad(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

function normalizeParticipants(stored: Array<Partial<Participant>>) {
  const normalized = stored
    .map((participant) => ({
      id:
        participant.id ??
        `${participantId(participant.name ?? "member")}-${Date.now()}`,
      name: participant.name?.trim() || defaultOwner,
      email: participant.email ?? "",
      avatarUrl: participant.avatarUrl ?? "",
    }))
    .filter((participant) => participant.name);

  if (!normalized.some((participant) => participant.id === "kingaaron")) {
    normalized.unshift(defaultParticipants[0]);
  }

  return normalized.length > 0 ? normalized : defaultParticipants;
}

function mergeStoredTasks(
  storedTasks: Array<
    Partial<ProjectTask> & {
      owner?: string;
      categoryId?: string;
      ownerIds?: string[];
    }
  >,
  participantList: Participant[],
) {
  const mergedTasks = defaultTasks.map((task) => {
    const stored = storedTasks.find((item) => item.id === task.id);
    const legacyOwner = stored?.owner;
    const legacyOwnerParticipant = participantList.find(
      (participant) => participant.name === legacyOwner,
    );
    const schedule =
      stored?.schedule && !isLegacySchedule(stored.schedule)
        ? stored.schedule
        : task.schedule;

    return {
      ...task,
      ...stored,
      status:
        stored?.status && statusRank[stored.status] > statusRank[task.status]
          ? stored.status
          : task.status,
      projectId: stored?.projectId ?? stored?.categoryId ?? task.projectId,
      schedule,
      assigneeIds:
        stored?.assigneeIds ??
        stored?.ownerIds ??
        (legacyOwnerParticipant ? [legacyOwnerParticipant.id] : task.assigneeIds),
    };
  });

  return recomputeTaskSchedules(mergedTasks);
}

export default function ScheduleManager() {
  const [tasks, setTasks] = useState(defaultTasks);
  const [participants, setParticipants] = useState(defaultParticipants);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isReady, setIsReady] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [newParticipantAvatarUrl, setNewParticipantAvatarUrl] = useState("");
  const [activeAssigneeTaskId, setActiveAssigneeTaskId] = useState<string | null>(
    null,
  );
  const [activeDurationTaskId, setActiveDurationTaskId] = useState<string | null>(
    null,
  );
  const [durationDraft, setDurationDraft] = useState("");
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [openProjectIds, setOpenProjectIds] = useState<string[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedParticipants =
        window.localStorage.getItem(participantStorageKey) ??
        window.localStorage.getItem(legacyParticipantStorageKey);
      const storedTasks =
        window.localStorage.getItem(taskStorageKey) ??
        legacyProjectTaskStorageKeys
          .map((storageKey) => window.localStorage.getItem(storageKey))
          .find((storedValue) => storedValue) ??
        window.localStorage.getItem(legacyTaskStorageKey);
      const storedTheme = window.localStorage.getItem(themeStorageKey);
      const storedOpenProjects = window.localStorage.getItem(openProjectStorageKey);

      let nextParticipants = defaultParticipants;

      if (storedParticipants) {
        try {
          nextParticipants = normalizeParticipants(JSON.parse(storedParticipants));
          setParticipants(nextParticipants);
        } catch {
          nextParticipants = defaultParticipants;
          setParticipants(defaultParticipants);
        }
      }

      if (storedTasks) {
        try {
          setTasks(mergeStoredTasks(JSON.parse(storedTasks), nextParticipants));
        } catch {
          setTasks(defaultTasks);
        }
      }

      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }

      if (storedOpenProjects) {
        try {
          setOpenProjectIds(JSON.parse(storedOpenProjects) as string[]);
        } catch {
          setOpenProjectIds([]);
        }
      }

      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setIsHeaderCompact(window.scrollY > 80);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
      window.localStorage.setItem(
        participantStorageKey,
        JSON.stringify(participants),
      );
      window.localStorage.setItem(themeStorageKey, theme);
      window.localStorage.setItem(
        openProjectStorageKey,
        JSON.stringify(openProjectIds),
      );
    }
  }, [isReady, openProjectIds, participants, tasks, theme]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const assigneeText = task.assigneeIds
        .map((id) => participants.find((participant) => participant.id === id))
        .filter(Boolean)
        .map((participant) => `${participant?.name} ${participant?.email}`)
        .join(" ");
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          task.schedule,
          task.taskName,
          task.details,
          task.doneCriteria,
          task.milestone,
          task.note,
          assigneeText,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesPriority && matchesQuery;
    });
  }, [participants, priorityFilter, query, statusFilter, tasks]);

  const activeCount = tasks.filter((task) => task.status === "active").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const totalProgress = Math.round(
    tasks.reduce((sum, task) => sum + statusProgress(task.status), 0) /
      tasks.length,
  );
  const estimatedHours = tasks.reduce(
    (sum, task) => sum + scheduleHours(task.schedule),
    0,
  );
  const estimatedDuration = formatWorkDuration(estimatedHours);
  const utilityButtonClass =
    "h-10 rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 text-sm font-semibold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";
  const fileButtonClass = `${utilityButtonClass} grid cursor-pointer place-items-center`;
  const iconButtonClass =
    "grid h-10 w-10 place-items-center rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";
  const primaryButtonClass =
    "h-10 rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-3 text-sm font-semibold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";
  const dangerButtonClass =
    "h-10 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 text-sm font-semibold text-[var(--danger-text)] transition hover:bg-[var(--danger-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";

  function updateTask(id: string, updates: Partial<ProjectTask>) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    );
  }

  function updateParticipant(id: string, updates: Partial<Participant>) {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === id ? { ...participant, ...updates } : participant,
      ),
    );
  }

  function createParticipant(name: string, email: string, avatarUrl = "") {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return null;

    const existing = participants.find(
      (participant) =>
        participant.email.toLowerCase() === trimmedEmail.toLowerCase() ||
        participant.name === trimmedName,
    );
    if (existing) return existing;

    const participant = {
      id: `${participantId(trimmedName)}-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      avatarUrl: avatarUrl.trim(),
    };
    setParticipants((current) => [...current, participant]);
    return participant;
  }

  function addParticipant() {
    const participant = createParticipant(
      newParticipantName,
      newParticipantEmail,
      newParticipantAvatarUrl,
    );
    if (!participant) return;

    setNewParticipantName("");
    setNewParticipantEmail("");
    setNewParticipantAvatarUrl("");
  }

  function removeParticipant(id: string) {
    setParticipants((current) => {
      const nextParticipants = current.filter((participant) => participant.id !== id);
      return nextParticipants.length > 0 ? nextParticipants : defaultParticipants;
    });
    setTasks((current) =>
      current.map((task) => ({
        ...task,
        assigneeIds: task.assigneeIds.filter((assigneeId) => assigneeId !== id),
      })),
    );
  }

  function toggleAssignee(taskId: string, participantIdValue: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const alreadyAssigned = task.assigneeIds.includes(participantIdValue);

        return {
          ...task,
          assigneeIds: alreadyAssigned
            ? task.assigneeIds.filter((id) => id !== participantIdValue)
            : [...task.assigneeIds, participantIdValue],
        };
      }),
    );
  }

  function openDurationEditor(task: ProjectTask) {
    setActiveAssigneeTaskId(null);
    setActiveDurationTaskId(task.id);
    setDurationDraft(`${scheduleHours(task.schedule)}`);
  }

  function saveDuration(task: ProjectTask) {
    const nextHours = Number(durationDraft);
    if (!Number.isFinite(nextHours)) return;

    setTasks((current) => recomputeTaskSchedules(current, task.id, nextHours));
    setActiveDurationTaskId(null);
    setDurationDraft("");
  }

  function toggleProject(projectId: string) {
    setOpenProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  }

  function resetSchedule() {
    setTasks(defaultTasks);
    setParticipants(defaultParticipants);
    setOpenProjectIds([]);
    window.localStorage.removeItem(taskStorageKey);
    window.localStorage.removeItem(participantStorageKey);
    window.localStorage.removeItem(openProjectStorageKey);
  }

  function exportCsv() {
    const headers = [
      "프로젝트",
      "작업명",
      "작업 기간(D/H)",
      "세부 작업",
      "완료 기준",
      "마일스톤",
      "중요도",
      "상태",
      "담당자",
      "메모",
    ];
    const rows = tasks.map((task) => [
      projects.find((project) => project.id === task.projectId)?.title ?? "",
      task.taskName,
      task.schedule,
      task.details,
      task.doneCriteria,
      task.milestone,
      priorityLabels[task.priority],
      statusLabels[task.status],
      task.assigneeIds
        .map((id) => participants.find((participant) => participant.id === id)?.name)
        .filter(Boolean)
        .join(", "),
      task.note,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "RuahNote_프로젝트_작업리스트.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main
      className={`schedule-theme-${theme} min-h-screen bg-[var(--app-bg)] text-[var(--text)]`}
    >
      {isHeaderCompact ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--header-border)] bg-[var(--header-bg)] px-3 py-2 shadow-md print-hidden sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <h2 className="shrink-0 text-sm font-bold text-[var(--text)]">
              프로젝트별 작업 리스트
            </h2>
            <div className="flex min-w-0 items-center justify-end gap-1.5 overflow-x-auto">
              <SummaryCard compact label="프로젝트" value={`${projects.length}`} />
              <SummaryCard compact label="작업" value={`${tasks.length}`} />
              <SummaryCard compact label="보류" value={`${blockedCount}`} />
              <SummaryCard compact label="진행도" value={`${totalProgress}%`} />
              <SummaryCard compact label="예상" value={estimatedDuration} />
            </div>
          </div>
        </div>
      ) : null}
      <section
        className="flex w-full min-w-0 flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6 print-page"
      >
        <header
          className="rounded-lg border border-[var(--header-border)] bg-[var(--header-bg)] p-3 shadow-sm sm:p-4 print-section"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--primary)]">
                RuahNote
              </p>
              <h1 className="mt-1 text-lg font-bold tracking-normal text-[var(--text)] sm:text-xl">
                프로젝트별 작업 리스트
              </h1>
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 xl:w-auto xl:max-w-[760px] xl:justify-end">
              <SummaryCard
                label="프로젝트"
                value={`${projects.length}`}
              />
              <SummaryCard
                label="작업"
                value={`${tasks.length}`}
              />
              <SummaryCard
                label="보류"
                value={`${blockedCount}`}
              />
              <SummaryCard
                label="진행도"
                value={`${totalProgress}%`}
              />
              <SummaryCard
                label="예상"
                value={estimatedDuration}
              />
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--track)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${totalProgress}%`,
                background: `linear-gradient(90deg, #C65C54 0%, #D1A24C 42%, ${progressColor(
                  totalProgress,
                )} 100%)`,
              }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
            진행중 {activeCount}개 | 전체 평균 {totalProgress}%
          </p>
        </header>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm sm:p-4 print-hidden">
          <div className="flex flex-wrap items-end gap-2">
            <button
              className={utilityButtonClass}
              type="button"
              onClick={() => setIsSearchOpen((value) => !value)}
            >
              {isSearchOpen ? "검색 닫기" : "검색/필터"}
            </button>
            <button
              className={utilityButtonClass}
              type="button"
              onClick={() => setIsSettingsOpen((value) => !value)}
            >
              {isSettingsOpen ? "환경설정 닫기" : "환경설정"}
            </button>
            <button
              aria-label={theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경"}
              className={`${iconButtonClass} ml-auto`}
              title={theme === "dark" ? "라이트 모드" : "다크 모드"}
              type="button"
              onClick={() =>
                setTheme((current) => (current === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className={primaryButtonClass}
              type="button"
              onClick={() => window.print()}
            >
              인쇄
            </button>
            <button
              className={utilityButtonClass}
              type="button"
              onClick={exportCsv}
            >
              CSV
            </button>
            <button
              className={dangerButtonClass}
              type="button"
              onClick={resetSchedule}
            >
              초기화
            </button>
          </div>

          {isSearchOpen ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="block min-w-0">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  검색
                </span>
                <input
                  className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="프로젝트, 작업, 담당자, 이메일, 메모 검색"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  상태
                </span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as TaskStatus | "all")
                  }
                >
                  <option value="all">전체</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  중요도
                </span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as TaskPriority | "all")
                  }
                >
                  <option value="all">전체</option>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {isSettingsOpen ? (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--summary-bg)] p-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(140px,1fr)_minmax(180px,1fr)_minmax(160px,1fr)_140px_auto] xl:items-end">
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    참여자 이름
                  </span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    value={newParticipantName}
                    onChange={(event) => setNewParticipantName(event.target.value)}
                    placeholder="이름"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    이메일
                  </span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    value={newParticipantEmail}
                    onChange={(event) => setNewParticipantEmail(event.target.value)}
                    placeholder="이메일"
                    type="email"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    이미지 URL
                  </span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    value={newParticipantAvatarUrl}
                    onChange={(event) =>
                      setNewParticipantAvatarUrl(event.target.value)
                    }
                    placeholder="URL 또는 파일 선택"
                  />
                </label>
                <label className={fileButtonClass}>
                  이미지 선택
                  <input
                    accept="image/*"
                    className="sr-only"
                    type="file"
                    onChange={(event) => {
                      readAvatarFile(event.currentTarget.files?.[0], (avatarUrl) =>
                        setNewParticipantAvatarUrl(avatarUrl),
                      );
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  className={primaryButtonClass}
                  type="button"
                  onClick={addParticipant}
                >
                  추가
                </button>
              </div>

              <div className="mt-4 grid gap-3 2xl:grid-cols-2">
                {participants.map((participant) => (
                  <div
                    className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_128px_auto]"
                    key={participant.id}
                  >
                    <Avatar participant={participant} />
                    <input
                      className="h-10 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none"
                      value={participant.name}
                      onChange={(event) =>
                        updateParticipant(participant.id, {
                          name: event.target.value,
                        })
                      }
                      aria-label="참여자 이름"
                    />
                    <input
                      className="h-10 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none"
                      value={participant.email}
                      onChange={(event) =>
                        updateParticipant(participant.id, {
                          email: event.target.value,
                        })
                      }
                      placeholder="이메일"
                      aria-label="참여자 이메일"
                    />
                    <input
                      className="h-10 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] outline-none"
                      value={participant.avatarUrl}
                      onChange={(event) =>
                        updateParticipant(participant.id, {
                          avatarUrl: event.target.value,
                        })
                      }
                      placeholder="이미지 URL"
                      aria-label="참여자 이미지 URL"
                    />
                    <label className={fileButtonClass}>
                      이미지 선택
                      <input
                        accept="image/*"
                        className="sr-only"
                        type="file"
                        onChange={(event) => {
                          readAvatarFile(
                            event.currentTarget.files?.[0],
                            (avatarUrl) =>
                              updateParticipant(participant.id, { avatarUrl }),
                          );
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <button
                      className={dangerButtonClass}
                      type="button"
                      onClick={() => removeParticipant(participant.id)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="flex min-w-0 flex-col gap-3 print-section">
          {projects.map((project) => {
            const projectTasks = filteredTasks.filter(
              (task) => task.projectId === project.id,
            );
            if (projectTasks.length === 0) return null;

            const allProjectTasks = tasks.filter(
              (task) => task.projectId === project.id,
            );
            const progress = Math.round(
              allProjectTasks.reduce(
                (sum, task) => sum + statusProgress(task.status),
                0,
              ) / allProjectTasks.length,
            );
            const isOpen = openProjectIds.includes(project.id);
            const assigneeIds = Array.from(
              new Set(allProjectTasks.flatMap((task) => task.assigneeIds)),
            );
            const projectHours = allProjectTasks.reduce(
              (sum, task) => sum + scheduleHours(task.schedule),
              0,
            );
            const projectDuration = formatWorkDuration(projectHours);

            return (
              <article
                className="overflow-visible rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm"
                key={project.id}
              >
                <button
                  className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[var(--hover)] md:grid-cols-[minmax(220px,1fr)_minmax(260px,520px)_auto]"
                  type="button"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-lg font-bold text-white"
                      style={{ backgroundColor: project.color }}
                    >
                      {isOpen ? "-" : "+"}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-[var(--text)]">
                        {project.title}
                      </h2>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 self-center">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--muted)]">
                      <span>프로젝트 진행도</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-2 h-4 overflow-hidden rounded-full bg-[var(--track)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${project.color}, ${progressColor(
                            progress,
                          )})`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-2 md:justify-end">
                    <AvatarStack
                      participantIds={assigneeIds}
                      participants={participants}
                    />
                    <span className="rounded-full bg-[var(--summary-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      {allProjectTasks.length}개 작업
                    </span>
                    <span className="rounded-full bg-[var(--summary-bg)] px-3 py-1 text-xs font-bold text-[var(--text)]">
                      모듈 기간 {projectDuration}
                    </span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="w-full min-w-0 overflow-x-auto border-t border-[var(--border)]">
                    <div className="min-w-[920px] xl:min-w-full">
                      {projectTasks.map((task) => (
                        <TaskRow
                          activeAssigneeTaskId={activeAssigneeTaskId}
                          activeDurationTaskId={activeDurationTaskId}
                          durationDraft={durationDraft}
                          key={task.id}
                          openDurationEditor={openDurationEditor}
                          participants={participants}
                          projectColor={project.color}
                          projectTitle={project.title}
                          saveDuration={saveDuration}
                          setActiveAssigneeTaskId={setActiveAssigneeTaskId}
                          setActiveDurationTaskId={setActiveDurationTaskId}
                          setDurationDraft={setDurationDraft}
                          task={task}
                          toggleAssignee={toggleAssignee}
                          updateTask={updateTask}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}

function TaskRow({
  activeAssigneeTaskId,
  activeDurationTaskId,
  durationDraft,
  openDurationEditor,
  participants,
  projectColor,
  projectTitle,
  saveDuration,
  setActiveAssigneeTaskId,
  setActiveDurationTaskId,
  setDurationDraft,
  task,
  toggleAssignee,
  updateTask,
}: {
  activeAssigneeTaskId: string | null;
  activeDurationTaskId: string | null;
  durationDraft: string;
  openDurationEditor: (task: ProjectTask) => void;
  participants: Participant[];
  projectColor: string;
  projectTitle: string;
  saveDuration: (task: ProjectTask) => void;
  setActiveAssigneeTaskId: (taskId: string | null) => void;
  setActiveDurationTaskId: (taskId: string | null) => void;
  setDurationDraft: (value: string) => void;
  task: ProjectTask;
  toggleAssignee: (taskId: string, participantIdValue: string) => void;
  updateTask: (id: string, updates: Partial<ProjectTask>) => void;
}) {
  const progress = statusProgress(task.status);
  const assignedParticipants = task.assigneeIds
    .map((id) => participants.find((participant) => participant.id === id))
    .filter((participant): participant is Participant => Boolean(participant));
  const isPopoverOpen = activeAssigneeTaskId === task.id;
  const isDurationOpen = activeDurationTaskId === task.id;

  return (
    <div className="grid grid-cols-[minmax(180px,0.8fr)_minmax(84px,0.32fr)_minmax(260px,1.25fr)_minmax(150px,0.65fr)_minmax(96px,0.42fr)_minmax(140px,0.55fr)] border-b border-[var(--border)] last:border-b-0">
      <div className="px-3 py-4">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: projectColor }}
          />
          <span className="truncate text-xs font-semibold text-[var(--muted)]">
            {projectTitle}
          </span>
        </div>
        <div className="font-semibold text-[var(--text)]">{task.taskName}</div>
        <div
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityClass(
            task.priority,
          )}`}
        >
          {priorityLabels[task.priority]}
        </div>
      </div>
      <div className="px-3 py-4">
        <div className="text-[11px] font-semibold text-[var(--muted)]">
          작업 기간
        </div>
        <div className="relative mt-1">
          <button
            className="rounded-md px-1 text-left text-sm font-bold leading-5 text-[var(--text)] outline-none transition hover:bg-[var(--hover)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            type="button"
            onClick={() => openDurationEditor(task)}
          >
            {task.schedule}
          </button>

          {isDurationOpen ? (
            <>
              <button
                aria-label="소요시간 편집 닫기"
                className="fixed inset-0 z-10 cursor-default"
                type="button"
                onClick={() => setActiveDurationTaskId(null)}
              />
              <form
                className="absolute left-0 z-20 mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveDuration(task);
                }}
              >
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    필요 시간
                  </span>
                  <input
                    autoFocus
                    className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    min="0"
                    onChange={(event) => setDurationDraft(event.target.value)}
                    step="1"
                    type="number"
                    value={durationDraft}
                  />
                </label>
                <button
                  className="mt-3 h-9 w-full rounded-md border border-[var(--primary-button-border)] bg-[var(--primary-button-bg)] px-3 text-sm font-semibold text-[var(--primary-button-text)] transition hover:bg-[var(--primary-button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  type="submit"
                >
                  저장
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
      <div className="px-3 py-4">
        <p className="leading-6 text-[var(--soft-text)]">{task.details}</p>
        <p className="mt-2 text-xs font-semibold text-[var(--primary)]">
          {task.milestone}
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--track)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: progressColor(progress),
            }}
          />
        </div>
      </div>
      <div className="px-3 py-4 text-sm leading-6 text-[var(--muted)]">
        {task.doneCriteria}
      </div>
      <div className="px-3 py-4">
        <select
          className={`h-9 w-full rounded-md px-2 text-xs font-semibold ring-1 outline-none ${getStatusClass(
            task.status,
          )}`}
          value={task.status}
          onChange={(event) =>
            updateTask(task.id, {
              status: event.target.value as TaskStatus,
            })
          }
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="relative mt-3">
          <button
            aria-label={`${task.taskName} 담당자 변경`}
            className="flex w-fit max-w-full items-center rounded-full border border-[var(--border)] bg-[var(--control-bg)] p-1 text-left text-sm text-[var(--text)] transition hover:bg-[var(--hover)]"
            type="button"
            onClick={() => {
              setActiveDurationTaskId(null);
              setActiveAssigneeTaskId(isPopoverOpen ? null : task.id);
            }}
          >
            <AvatarStack
              participantIds={task.assigneeIds}
              participants={participants}
            />
          </button>

          {isPopoverOpen ? (
            <>
              <button
                aria-label="담당자 선택 닫기"
                className="fixed inset-0 z-10 cursor-default"
                type="button"
                onClick={() => setActiveAssigneeTaskId(null)}
              />
              <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--text)]">담당자</p>
                  <button
                    className="text-xs font-semibold text-[var(--muted)]"
                    type="button"
                    onClick={() => setActiveAssigneeTaskId(null)}
                  >
                    닫기
                  </button>
                </div>

                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {participants.map((participant) => (
                    <label
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-2 py-2"
                      key={participant.id}
                    >
                      <input
                        checked={task.assigneeIds.includes(participant.id)}
                        onChange={() => toggleAssignee(task.id, participant.id)}
                        type="checkbox"
                      />
                      <Avatar participant={participant} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--text)]">
                          {participant.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--muted)]">
                          {participant.email}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--muted)]">
                  새 담당자는 환경설정에서 추가할 수 있습니다.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="px-3 py-4">
        <textarea
          className="min-h-24 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--control-bg)] px-2 py-2 text-sm leading-5 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          value={task.note}
          onChange={(event) => updateTask(task.id, { note: event.target.value })}
          placeholder={
            assignedParticipants.length > 1
              ? "협업 메모"
              : "메모"
          }
        />
      </div>
    </div>
  );
}

function Avatar({
  participant,
  fallbackName,
}: {
  participant?: Participant;
  fallbackName?: string;
}) {
  const name = participant?.name ?? fallbackName ?? defaultOwner;

  if (participant?.avatarUrl) {
    return (
      <span
        aria-label={name}
        className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url(${participant.avatarUrl})` }}
      />
    );
  }

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--summary-bg)] text-xs font-bold text-[var(--text)]">
      {initials(name)}
    </span>
  );
}

function AvatarStack({
  participantIds,
  participants,
}: {
  participantIds: string[];
  participants: Participant[];
}) {
  const visibleParticipants = participantIds
    .map((id) => participants.find((participant) => participant.id === id))
    .filter((participant): participant is Participant => Boolean(participant))
    .slice(0, 3);
  const restCount = Math.max(participantIds.length - visibleParticipants.length, 0);

  if (visibleParticipants.length === 0) {
    return (
      <span className="text-xs font-semibold text-[var(--muted)]">미지정</span>
    );
  }

  return (
    <div className="flex items-center">
      {visibleParticipants.map((participant, index) => (
        <div className={index > 0 ? "-ml-2" : ""} key={participant.id}>
          <Avatar participant={participant} />
        </div>
      ))}
      {restCount > 0 ? (
        <span className="-ml-2 grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--summary-bg)] text-xs font-bold text-[var(--text)]">
          +{restCount}
        </span>
      ) : null}
    </div>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M20.99 12.33A8.5 8.5 0 1 1 11.67 3a6.5 6.5 0 0 0 9.32 9.33Z" />
    </svg>
  );
}

function SummaryCard({
  compact = false,
  label,
  value,
}: {
  compact?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`shrink-0 rounded-md border border-[var(--border)] bg-[var(--summary-bg)] ${
        compact
          ? "flex h-7 items-center gap-1.5 px-2"
          : "flex min-h-12 items-center gap-2 px-3 py-2"
      }`}
    >
      <div className="text-[11px] font-semibold text-[var(--muted)]">
        {label}
      </div>
      <div
        className={`font-bold text-[var(--text)] ${
          compact ? "text-sm" : "text-xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
