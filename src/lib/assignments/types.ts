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
