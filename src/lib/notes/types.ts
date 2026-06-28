export type Note = {
  id: string;
  subjectId: string | null;
  title: string;
  contentPlain: string;
  noteDate: string;
  sessionNumber: number | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteDraft = {
  subjectId: string;
  title: string;
  contentPlain: string;
  noteDate: string;
  sessionNumber: string;
};

export type NoteCategory = {
  id: string;
  title: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NoteSubject = {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteFile = {
  id: string;
  noteId: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};
