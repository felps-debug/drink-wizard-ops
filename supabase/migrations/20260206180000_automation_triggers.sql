-- 1. LIMPEZA (Opcional - use se quiser recriar do zero)
-- drop table if exists public.automation_triggers cascade;

-- 2. CRIAÇÃO DA TABELA UNIFICADA
create table if not exists public.automation_triggers (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,

  name text not null, -- Ex: "Agradecimento Pós-Checklist"
  description text, 
  active boolean not null default true,

  -- Configuração do Gatilho
  trigger_event text not null, -- Ex: 'checklist_entrada', 'checklist_saida', 'event_created'
  trigger_conditions jsonb default '{}'::jsonb, -- Ex: { "status": "completed" }

  -- Configuração da Ação
  action_type text not null default 'whatsapp', 
  action_config jsonb not null, -- Ex: { "message": "Olá!", "delay_seconds": 0 }

  -- Monitoramento
  last_triggered_at timestamp with time zone,
  trigger_count integer default 0,

  constraint automation_triggers_pkey primary key (id),
  constraint automation_triggers_action_type_check check (action_type in ('whatsapp', 'email'))
);

-- 3. SEGURANÇA (RLS)
alter table public.automation_triggers enable row level security;

-- Política de Leitura
create policy "admins_read" on public.automation_triggers
  for select to authenticated
  using (
    (auth.jwt() ->> 'role') = 'admin' OR 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and 'admin' = any(roles)
    )
  );

-- Política de Inserção
create policy "admins_insert" on public.automation_triggers
  for insert to authenticated
  with check (
    (auth.jwt() ->> 'role') = 'admin' OR 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and 'admin' = any(roles)
    )
  );

-- Política de Atualização
create policy "admins_update" on public.automation_triggers
  for update to authenticated
  using (
    (auth.jwt() ->> 'role') = 'admin' OR 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and 'admin' = any(roles)
    )
  );

-- Política de Exclusão
create policy "admins_delete" on public.automation_triggers
  for delete to authenticated
  using (
    (auth.jwt() ->> 'role') = 'admin' OR 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and 'admin' = any(roles)
    )
  );

-- 4. ÍNDICES PARA PERFORMANCE
create index if not exists automation_triggers_active_idx on public.automation_triggers(active);
create index if not exists automation_triggers_trigger_event_idx on public.automation_triggers(trigger_event);
create index if not exists automation_triggers_created_by_idx on public.automation_triggers(created_by);
create index if not exists automation_triggers_updated_at_idx on public.automation_triggers(updated_at desc);

-- 5. AUTOMAÇÃO DE TIMESTAMP (updated_at)
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

-- 6. AJUSTE NA TABELA DE EVENTOS
-- Adiciona a coluna de telefone se ela não existir
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='events' and column_name='client_phone') then
    alter table public.events add column client_phone text;
  end if;
end $$;

comment on column public.events.client_phone is 'Telefone WhatsApp do cliente para notificações automáticas';