export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RowTimestamps = {
  created_at: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: RowTimestamps & {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: RowTimestamps & {
          id: string;
          user_id: string;
          title: string;
          color: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          color?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: RowTimestamps & {
          id: string;
          user_id: string;
          category_id: string;
          title: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          title?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: RowTimestamps & {
          id: string;
          user_id: string;
          subject_id: string | null;
          title: string;
          content_json: Json;
          content_plain: string;
          note_date: string;
          session_number: number | null;
          is_favorite: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          title: string;
          content_json?: Json;
          content_plain?: string;
          note_date?: string;
          session_number?: number | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subject_id?: string | null;
          title?: string;
          content_json?: Json;
          content_plain?: string;
          note_date?: string;
          session_number?: number | null;
          is_favorite?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      files: {
        Row: RowTimestamps & {
          id: string;
          user_id: string;
          note_id: string | null;
          file_name: string;
          file_path: string;
          mime_type: string | null;
          size_bytes: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          file_name: string;
          file_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          note_id?: string | null;
          file_name?: string;
          file_path?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: RowTimestamps & {
          id: string;
          user_id: string;
          note_id: string | null;
          title: string;
          due_date: string | null;
          status: "todo" | "doing" | "done";
          priority: "high" | "medium" | "low";
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          title: string;
          due_date?: string | null;
          status?: "todo" | "doing" | "done";
          priority?: "high" | "medium" | "low";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          note_id?: string | null;
          title?: string;
          due_date?: string | null;
          status?: "todo" | "doing" | "done";
          priority?: "high" | "medium" | "low";
          updated_at?: string;
        };
        Relationships: [];
      };
      google_accounts: {
        Row: RowTimestamps & {
          id: string;
          user_id: string;
          google_sub: string | null;
          email: string | null;
          scope: string | null;
          token_type: string | null;
          access_token_enc: string;
          refresh_token_enc: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_sub?: string | null;
          email?: string | null;
          scope?: string | null;
          token_type?: string | null;
          access_token_enc: string;
          refresh_token_enc?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          google_sub?: string | null;
          email?: string | null;
          scope?: string | null;
          token_type?: string | null;
          access_token_enc?: string;
          refresh_token_enc?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
