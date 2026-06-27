export type Note = {
  id: string;
  title: string;
  contentPlain: string;
  noteDate: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteDraft = {
  title: string;
  contentPlain: string;
  noteDate: string;
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
