export type AssignmentStatus = "todo" | "doing" | "done";
export type AssignmentPriority = "high" | "medium" | "low";

export type Assignment = {
  id: string;
  noteId: string | null;
  title: string;
  dueDate: string | null;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentDraft = {
  noteId: string;
  title: string;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
};

export type AssignmentCandidate = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: AssignmentPriority;
  source: string;
  createdAt: string;
};

export type AssignmentCandidateDraft = {
  title: string;
  dueDate: string;
  priority: AssignmentPriority;
  source: string;
};
