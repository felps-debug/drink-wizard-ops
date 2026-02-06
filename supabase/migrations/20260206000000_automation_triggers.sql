-- Create unified automation_triggers table
-- This replaces the dual system of 'automations' + 'magodosdrinks_triggers'

create table if not exists public.automation_triggers (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,

  name text not null, -- "Agradecimento Pós-Checklist"
  description text, -- Optional description
  active boolean not null default true,

  -- Trigger Configuration
  trigger_event text not null, -- 'checklist_entrada', 'checklist_saida', 'event_created', etc.
  trigger_conditions jsonb, -- e.g., { "status": "completed", "event_id": "xyz" }

  -- Action Configuration
  action_type text not null default 'whatsapp', -- 'whatsapp', 'email' (future)
  action_config jsonb not null, -- { "message": "...", "delay_seconds": 0 }

  -- Execution Tracking (optional, for monitoring)
  last_triggered_at timestamp with time zone,
  trigger_count integer default 0,

  constraint automation_triggers_pkey primary key (id),
  constraint automation_triggers_action_type_check check (action_type in ('whatsapp', 'email'))
);

-- Enable RLS
alter table public.automation_triggers enable row level security;

-- RLS Policies: Admin-only access
create policy "admins_read" on public.automation_triggers
  for select to authenticated
  using (
    (auth.jwt() ->> 'role'::text) = 'admin'::text OR
    (select role from public.profiles where id = auth.uid()) = 'admin'::user_role
  );

create policy "admins_insert" on public.automation_triggers
  for insert to authenticated
  with check (
    (auth.jwt() ->> 'role'::text) = 'admin'::text OR
    (select role from public.profiles where id = auth.uid()) = 'admin'::user_role
  );

create policy "admins_update" on public.automation_triggers
  for update to authenticated
  using (
    (auth.jwt() ->> 'role'::text) = 'admin'::text OR
    (select role from public.profiles where id = auth.uid()) = 'admin'::user_role
  );

create policy "admins_delete" on public.automation_triggers
  for delete to authenticated
  using (
    (auth.jwt() ->> 'role'::text) = 'admin'::text OR
    (select role from public.profiles where id = auth.uid()) = 'admin'::user_role
  );

-- Indexes for performance
create index automation_triggers_active_idx on public.automation_triggers(active);
create index automation_triggers_trigger_event_idx on public.automation_triggers(trigger_event);
create index automation_triggers_created_by_idx on public.automation_triggers(created_by);
create index automation_triggers_updated_at_idx on public.automation_triggers(updated_at desc);

-- Add trigger to update the updated_at timestamp
create or replace function public.update_automation_triggers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger automation_triggers_updated_at_trigger
before update on public.automation_triggers
for each row
execute function public.update_automation_triggers_updated_at();

-- Verify client_phone column exists in events table
-- This column is used for sending WhatsApp messages
alter table public.events
add column if not exists client_phone text;

comment on column public.events.client_phone is 'Client WhatsApp phone number for automated notifications';
