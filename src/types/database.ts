// Types Supabase pour NdongoLink
// Ces types correspondent au schéma SQL dans supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          headline: string | null;
          bio: string | null;
          university: string | null;
          field_of_study: string | null;
          degree_level: string | null;
          graduation_year: number | null;
          location: string | null;
          phone: string | null;
          website: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          github_url: string | null;
          skills: string[] | null;
          interests: string[] | null;
          is_looking_for_internship: boolean | null;
          is_open_to_work: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          headline?: string | null;
          bio?: string | null;
          university?: string | null;
          field_of_study?: string | null;
          degree_level?: string | null;
          graduation_year?: number | null;
          location?: string | null;
          phone?: string | null;
          website?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          github_url?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          is_looking_for_internship?: boolean | null;
          is_open_to_work?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      experiences: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          organization: string;
          type: string | null; // 'internship' | 'job' | 'project' | 'volunteer' | 'education'
          start_date: string | null;
          end_date: string | null;
          is_current: boolean | null;
          description: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          organization: string;
          type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean | null;
          description?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["experiences"]["Insert"]>;
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string; // 'pending' | 'accepted' | 'declined' | 'blocked'
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["connections"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          image_url: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_likes"]["Insert"]>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversation_participants"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          type: string; // 'connection_request' | 'connection_accepted' | 'post_like' | 'comment' | 'message'
          entity_id: string | null;
          content: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id?: string | null;
          type: string;
          entity_id?: string | null;
          content?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      endorsements: {
        Row: {
          id: string;
          skill: string;
          endorsed_id: string;
          endorser_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill: string;
          endorsed_id: string;
          endorser_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["endorsements"]["Insert"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Experience = Database["public"]["Tables"]["experiences"]["Row"];
export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
