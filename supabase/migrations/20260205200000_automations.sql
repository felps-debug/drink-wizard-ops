-- Create automations table
create table public.automations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  trigger_event text not null, -- 'event_created', 'event_updated', 'status_changed'
  trigger_conditions jsonb null, -- e.g. { "status": "finalizado" }
  action_type text not null default 'whatsapp_message',
  action_config jsonb not null, -- e.g. { "message": "Olá {client_name}...", "delay": 0 }
  active boolean not null default true,
  constraint automations_pkey primary key (id)
);

-- RLS Policies
alter table public.automations enable row level security;

create policy "Enable read access for admins" on public.automations
  for select
  to authenticated
  using (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((select role from public.profiles where id = auth.uid()) = 'admin'::user_role));

create policy "Enable insert access for admins" on public.automations
  for insert
  to authenticated
  with check (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((select role from public.profiles where id = auth.uid()) = 'admin'::user_role));

create policy "Enable update access for admins" on public.automations
  for update
  to authenticated
  using (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((select role from public.profiles where id = auth.uid()) = 'admin'::user_role));

create policy "Enable delete access for admins" on public.automations
  for delete
  to authenticated
  using (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((select role from public.profiles where id = auth.uid()) = 'admin'::user_role));
