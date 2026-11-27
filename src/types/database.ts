/**
 * Supabase PostgreSQL Database types matching the schema in DATABASE.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LanguageCode = "hi" | "hinglish" | "en";
export type UserTheme = "warm-light" | "warm-dark" | "system";
export type MessageRole = "user" | "assistant" | "system";
export type MemoryCategory = "personal" | "career" | "relationship" | "goal" | "preference" | "general";
export type GoalStatus = "in_progress" | "completed" | "paused" | "abandoned";
export type SubscriptionProvider = "razorpay" | "stripe" | "apple" | "google";
export type SubscriptionTier = "free" | "supporter" | "pro";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "halted" | "pending";
export type VoiceSessionStatus = "active" | "completed" | "interrupted" | "crisis_halted";

export interface GenericRelationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          preferred_language: LanguageCode;
          memory_consent: boolean;
          voice_consent: boolean;
          theme: UserTheme;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          preferred_language?: LanguageCode;
          memory_consent?: boolean;
          voice_consent?: boolean;
          theme?: UserTheme;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          preferred_language?: LanguageCode;
          memory_consent?: boolean;
          voice_consent?: boolean;
          theme?: UserTheme;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          language: LanguageCode;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string;
          language?: LanguageCode;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          language?: LanguageCode;
          is_archived?: boolean;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id?: string;
          role: MessageRole;
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: MessageRole;
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          category: MemoryCategory;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          content: string;
          category?: MemoryCategory;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          category?: MemoryCategory;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          primary_emotion: string;
          notes: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          score: number;
          primary_emotion: string;
          notes?: string | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number;
          primary_emotion?: string;
          notes?: string | null;
          recorded_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: GoalStatus;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description?: string | null;
          status?: GoalStatus;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: GoalStatus;
          target_date?: string | null;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: SubscriptionProvider;
          provider_subscription_id: string;
          provider_customer_id: string | null;
          plan_tier: SubscriptionTier;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: SubscriptionProvider;
          provider_subscription_id: string;
          provider_customer_id?: string | null;
          plan_tier: SubscriptionTier;
          status: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: SubscriptionProvider;
          provider_subscription_id?: string;
          provider_customer_id?: string | null;
          plan_tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      user_entitlements: {
        Row: {
          user_id: string;
          tier: SubscriptionTier;
          voice_minutes_total: number;
          voice_minutes_used: number;
          quota_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          tier?: SubscriptionTier;
          voice_minutes_total?: number;
          voice_minutes_used?: number;
          quota_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          tier?: SubscriptionTier;
          voice_minutes_total?: number;
          voice_minutes_used?: number;
          quota_reset_at?: string;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      payment_events: {
        Row: {
          id: string;
          provider: SubscriptionProvider;
          event_id: string;
          event_type: string;
          processed_at: string;
          payload_hash: string;
        };
        Insert: {
          id?: string;
          provider: SubscriptionProvider;
          event_id: string;
          event_type: string;
          processed_at?: string;
          payload_hash: string;
        };
        Update: {
          id?: string;
          provider?: SubscriptionProvider;
          event_id?: string;
          event_type?: string;
          processed_at?: string;
          payload_hash?: string;
        };
        Relationships: GenericRelationship[];
      };
      voice_sessions: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          duration_seconds: number;
          status: VoiceSessionStatus;
          created_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          conversation_id?: string | null;
          duration_seconds?: number;
          status?: VoiceSessionStatus;
          created_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string | null;
          duration_seconds?: number;
          status?: VoiceSessionStatus;
          ended_at?: string | null;
        };
        Relationships: GenericRelationship[];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
