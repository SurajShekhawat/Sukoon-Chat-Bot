-- Migration: 20261029190000_subscriptions_and_entitlements.sql
-- Description: Phase 10 Subscriptions, User Entitlements, Voice Sessions, and Idempotent Webhook Events

-- 1. Add voice_consent to profiles if not present
alter table public.profiles
  add column if not exists voice_consent boolean not null default false;

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('razorpay', 'stripe', 'apple', 'google')),
  provider_subscription_id text not null unique,
  provider_customer_id text,
  plan_tier text not null check (plan_tier in ('free', 'supporter', 'pro')),
  status text not null check (status in ('active', 'past_due', 'cancelled', 'halted', 'pending')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

alter table public.subscriptions enable row level security;

-- Users can only read their own subscription records
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Mutation is restricted to backend service-role only (Default Deny for client mutations)

-- ============================================================================
-- 3. USER ENTITLEMENTS TABLE
-- ============================================================================
create table if not exists public.user_entitlements (
  user_id uuid references auth.users(id) on delete cascade primary key,
  tier text not null default 'free' check (tier in ('free', 'supporter', 'pro')),
  voice_minutes_total int not null default 5, -- 5 minutes initial free preview
  voice_minutes_used int not null default 0,
  quota_reset_at timestamptz not null default (now() + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

-- Users can only view their own entitlements
create policy "Users can view own entitlements"
  on public.user_entitlements for select
  using (auth.uid() = user_id);

-- Mutation is restricted to backend service-role only

-- ============================================================================
-- 4. IDEMPOTENT PAYMENT WEBHOOK EVENTS TABLE
-- ============================================================================
create table if not exists public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null check (provider in ('razorpay', 'stripe', 'apple', 'google')),
  event_id text not null unique, -- Prevents duplicate processing / replay attacks
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload_hash text not null
);

create index if not exists idx_payment_events_event_id on public.payment_events(event_id);

alter table public.payment_events enable row level security;
-- No client access policy needed: strictly internal for backend webhook verification

-- ============================================================================
-- 5. VOICE SESSIONS TABLE (Zero Raw Audio: Metadata & Quota Tracking Only)
-- ============================================================================
create table if not exists public.voice_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  duration_seconds int not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'interrupted', 'crisis_halted')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_voice_sessions_user_id on public.voice_sessions(user_id);

alter table public.voice_sessions enable row level security;

create policy "Users can view own voice sessions"
  on public.voice_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own voice sessions"
  on public.voice_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own voice sessions"
  on public.voice_sessions for update
  using (auth.uid() = user_id);

