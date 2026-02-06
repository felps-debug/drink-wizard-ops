# Automation Feature Implementation Plan
## Drink Wizard - WhatsApp Trigger-Based Automation System

**Project**: Drink Wizard (Event Management & Staff Allocation)
**Feature**: User-Configurable Automation Triggers with WhatsApp Notifications
**Status**: Planning Phase
**Last Updated**: 2026-02-06

---

## Executive Summary

This plan consolidates the dual automation systems (`automations` table + `magodosdrinks_triggers`) into a single, production-ready system. The feature enables users to:

1. Select system events (e.g., "Entry Checklist Completed")
2. Define custom message templates with variable substitution
3. Automatically send WhatsApp messages when events trigger

**Key Improvements**:
- Eliminates database schema duplication
- Implements proper database webhooks (not manual polling)
- Creates missing `whatsapp-notify` Edge Function
- Adds comprehensive variable substitution engine
- Follows neo-brutalism UI style (existing project aesthetic)

---

## 1. UI/UX Design

### 1.1 Design Philosophy
- **Style**: Neo-brutalism (matches project history from git commits)
- **Aesthetic**: Bold borders, high contrast, black/white with colored accents
- **Components**: Thick borders (2-3px), hard shadows, stark typography
- **Interaction**: Instant feedback, no smooth transitions, playful but functional

Reference existing Automacoes.tsx styling:
- `border-2 border-white/10`, `bg-black/40`, `font-display` (large headings)
- `rounded-none` (no rounded corners)
- Bold shadow effects: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`

### 1.2 User Flow

```
Start: Automacoes Page
  ↓
[+ Criar Gatilho Button] → Opens Dialog
  ↓
Step 1: Name Automation
  Input: "Agradecimento Pós-Checklist"

Step 2: Select Trigger Event
  Dropdown showing:
  - Entrada checklist completed
  - Saida checklist completed
  - Event scheduled
  - [Future: Event status changed, Staff assigned, etc]

Step 3: Compose Message Template
  Textarea with:
  - Placeholder: "Olá {cliente}, seu checklist foi concluído!"
  - Available variables section (below)
  - Character count (optional, for SMS relevance)

Step 4: Test & Confirm
  - Preview message with sample data
  - [Optional] Send test message to admin's number
  - Toggle active/inactive

Step 5: Save
  - Success toast notification
  - Card appears in main list
  - Can be toggled on/off with switch
  - Can be edited/deleted (future enhancement)
```

### 1.3 Screen Layout

#### Main Page (Automacoes)
```
┌─────────────────────────────────────────┐
│ AUTOMAÇÕES                    [+ CRIAR] │ (neo-brutalism header)
│ Logística & Notificações Inteligentes   │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Agradecimento Pós-Checklist   [ON] │ │ (Card 1)
│ │ Gatilho: ENTRADA CHECKLIST CONCLUÍDO│ │
│ ├─────────────────────────────────────┤ │
│ │ "Olá {cliente}, seu checklist foi   │ │
│ │ concluído! Chegamos em {local} às   │ │
│ │ {data}. Tudo pronto!"              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Confirmação Agendamento       [OFF]│ │ (Card 2)
│ │ Gatilho: NOVO EVENTO AGENDADO      │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Dialog: Create New Automation
```
┌─────────────────────────────────────────┐
│ × NOVA AUTOMAÇÃO           [────────────]│
├─────────────────────────────────────────┤
│                                         │
│ NOME DA REGRA                           │
│ ┌───────────────────────────────────┐   │
│ │ EX: Agradecimento Pós-Checklist   │   │
│ └───────────────────────────────────┘   │
│                                         │
│ QUANDO DISPARAR? (GATILHO)              │
│ ┌───────────────────────────────────┐   │
│ │ SELECIONE O EVENTO...           ▼ │   │
│ └───────────────────────────────────┘   │
│                                         │
│ MENSAGEM WHATSAPP (TEMPLATE)            │
│ ┌───────────────────────────────────┐   │
│ │ Olá {cliente}, seu checklist foi  │   │
│ │ concluído!                        │   │
│ │                                   │   │
│ │                                   │   │
│ └───────────────────────────────────┘   │
│ Dica: use {cliente}, {data}, {local}    │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │     ATIVAR AUTOMAÇÃO              │   │
│ └───────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 1.4 Variable Insertion Component (Optional Enhancement)

```
Available Variables Quick Insert:
┌─ CLIENT VARIABLES ───────────┐
│ {cliente} / {client_name}    │ [Copy]
│ {email} / {phone}            │ [Copy]
├──────────────────────────────┤
│ EVENT VARIABLES              │
│ {data} / {date}              │ [Copy]
│ {local} / {location}         │ [Copy]
│ {event_name}                 │ [Copy]
├──────────────────────────────┤
│ STAFF VARIABLES              │
│ {nome} / {nome_staff}        │ [Copy]
│ {staff_role}                 │ [Copy]
└──────────────────────────────┘
```

### 1.5 Form Validation & Error States

| Field | Validation | Error Message |
|-------|-----------|----------------|
| Name | 3-100 chars, unique | "NOME JÁ EXISTE" / "MÍNIMO 3 CARACTERES" |
| Trigger | Must select one | "SELECIONE UM GATILHO" |
| Message | 5-500 chars, min 1 variable | "MENSAGEM VAZIA" / "MÁXIMO 500 CARACTERES" |
| Message | Must contain valid variables | "VARIÁVEL INVÁLIDA: {xyz}" |

### 1.6 Success/Error States

- **Save Success**: Toast "AUTOMAÇÃO CRIADA!" (green/success color)
- **Save Error**: Toast "ERRO AO CRIAR: [reason]" (red/error color)
- **Toggle Success**: Silent update with visual feedback (switch animation)
- **Test Message**: Toast "MENSAGEM ENVIADA" or "FALHA AO ENVIAR"

---

## 2. Database Schema

### 2.1 Current State Analysis

**Problem**: Two separate tables with overlapping functionality
- `automations` - Well-structured, uses JSONB for config
- `magodosdrinks_triggers` - Current UI table, flattened structure

### 2.2 Unified Schema

Replace both with a single, production-ready table:

```sql
-- Single source of truth for all automation triggers
create table public.automation_triggers (
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
```

### 2.3 Automation Trigger Schema Details

#### action_config JSONB Structure
```json
{
  "message": "Olá {cliente}, seu checklist foi concluído!",
  "phone_source": "event.client_phone",
  "delay_seconds": 0,
  "max_retries": 3,
  "enabled": true,
  "test_mode": false
}
```

#### trigger_conditions JSONB Structure (Optional)
```json
{
  "event_id": "abc-123",
  "status": "completed",
  "staff_role": "manager",
  "time_window": {
    "start_hour": 18,
    "end_hour": 22
  }
}
```

### 2.4 Migration Strategy

**Phase 1: Create New Table**
- Create `automation_triggers` with identical data from `magodosdrinks_triggers`
- Map existing fields to new schema

**Phase 2: Update Application**
- Update hooks (`useAutomations.ts`) to use new table
- Deploy UI changes

**Phase 3: Deprecate Old Tables**
- Keep old tables for 30 days (backup)
- Update documentation
- Archive old tables

**Phase 4: Cleanup**
- Drop old tables after validation period

### 2.5 Data Migration SQL

```sql
-- 1. Create new table (see 2.2 above)

-- 2. Migrate data from magodosdrinks_triggers
insert into public.automation_triggers (
  id, created_at, updated_at, created_by, name, active,
  trigger_event, action_type, action_config
)
select
  id,
  created_at,
  coalesce(updated_at, created_at),
  auth.uid(), -- Use current user; will need to be updated per-user
  name,
  active,
  event_type,
  'whatsapp',
  jsonb_build_object(
    'message', template_message,
    'phone_source', 'event.client_phone',
    'delay_seconds', 0,
    'max_retries', 3
  )
from public.magodosdrinks_triggers
on conflict do nothing;

-- 3. Keep automations table for reference
-- (Don't drop yet - validate data first)
```

---

## 3. Backend Implementation

### 3.1 Missing Edge Function: `whatsapp-notify`

**Purpose**: Send WhatsApp messages via UAZapi
**Trigger**: Called from `handle-automation` function
**Location**: `/supabase/functions/whatsapp-notify/index.ts`

```typescript
// /supabase/functions/whatsapp-notify/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const UAZAPI_INSTANCE = Deno.env.get("UAZAPI_INSTANCE");
const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN");

interface WhatsAppRequest {
  phone: string;
  message: string;
  test_mode?: boolean;
}

interface WhatsAppResponse {
  messageId?: string;
  status: "success" | "error" | "test";
  message: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { phone, message, test_mode } = await req.json() as WhatsAppRequest;

    // Validation
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing phone or message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Test mode: return mock response
    if (test_mode) {
      return new Response(
        JSON.stringify({
          status: "test",
          message: `[TEST MODE] Would send to ${phone}: ${message}`,
          messageId: "test-" + Date.now(),
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate phone format (basic)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid phone number" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[WhatsApp] Sending to ${phone}: ${message.substring(0, 50)}...`);

    // Call UAZapi
    const response = await fetch(
      `https://api.z-api.io/instances/${UAZAPI_INSTANCE}/token/${UAZAPI_TOKEN}/send-text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          message: message
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      return new Response(
        JSON.stringify({
          status: "success",
          messageId: data.messageId || data.key?.id || "sent",
          message: "Message sent successfully",
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.error("[WhatsApp Error]", data);
      return new Response(
        JSON.stringify({
          status: "error",
          message: data.message || "Failed to send message",
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[WhatsApp Exception]", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### 3.2 Updated Edge Function: `handle-automation`

**Purpose**: Listen for webhook events and execute matching automations
**Triggers**: Database changes (via Supabase webhooks)
**Location**: Update `/supabase/functions/handle-automation/index.ts`

```typescript
// /supabase/functions/handle-automation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  record: Record<string, any>;
  old_record?: Record<string, any>;
}

// Variable substitution engine
function substituteVariables(
  template: string,
  data: Record<string, any>
): string {
  let result = template;

  // Client variables
  result = result.replace(/{cliente}/g, data.client_name || "");
  result = result.replace(/{client_name}/g, data.client_name || "");
  result = result.replace(/{email}/g, data.client_email || "");
  result = result.replace(/{phone}/g, data.client_phone || "");

  // Event variables
  result = result.replace(/{data}/g, data.event_date ? new Date(data.event_date).toLocaleDateString("pt-BR") : "");
  result = result.replace(/{date}/g, data.event_date ? new Date(data.event_date).toLocaleDateString("pt-BR") : "");
  result = result.replace(/{local}/g, data.event_location || "");
  result = result.replace(/{location}/g, data.event_location || "");
  result = result.replace(/{event_name}/g, data.event_name || "");

  // Staff variables
  result = result.replace(/{nome}/g, data.staff_name || "");
  result = result.replace(/{nome_staff}/g, data.staff_name || "");
  result = result.replace(/{staff_role}/g, data.staff_role || "");

  // Custom variables
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" || typeof value === "number") {
      result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
    }
  }

  return result;
}

serve(async (req) => {
  try {
    const payload = await req.json() as WebhookPayload;
    console.log("Webhook:", payload.table, payload.type);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const record = payload.record;
    if (!record) return new Response("No record", { status: 200 });

    // Map trigger events
    let triggerEvent = "";
    if (payload.table === "event_checklists") {
      if (record.type === "entrada" && record.status === "completed") {
        triggerEvent = "checklist_entrada";
      } else if (record.type === "saida" && record.status === "completed") {
        triggerEvent = "checklist_saida";
      }
    } else if (payload.table === "events" && payload.type === "INSERT") {
      triggerEvent = "event_created";
    }

    if (!triggerEvent) {
      return new Response("No matching trigger", { status: 200 });
    }

    // Fetch matching automations
    const { data: automations, error } = await supabase
      .from("automation_triggers")
      .select("*")
      .eq("active", true)
      .eq("trigger_event", triggerEvent);

    if (error) throw error;
    if (!automations || automations.length === 0) {
      console.log("No matching automations for:", triggerEvent);
      return new Response("No matching automations", { status: 200 });
    }

    // Execute each automation
    const results = [];
    for (const automation of automations) {
      try {
        const messageTemplate = automation.action_config.message;

        // Fetch additional data (client, event details) for substitution
        let substitutionData = { ...record };

        if (record.event_id) {
          const { data: event } = await supabase
            .from("events")
            .select("client_name, client_phone, date, location")
            .eq("id", record.event_id)
            .single();

          if (event) {
            substitutionData = {
              ...substitutionData,
              client_name: event.client_name,
              client_phone: event.client_phone,
              event_date: event.date,
              event_location: event.location
            };
          }
        }

        const message = substituteVariables(messageTemplate, substitutionData);
        const phone = substitutionData.client_phone || substitutionData.phone;

        if (!phone) {
          console.warn("No phone number for automation:", automation.id);
          results.push({
            automation_id: automation.id,
            status: "error",
            reason: "No phone number"
          });
          continue;
        }

        // Call whatsapp-notify Edge Function
        const whatsappResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-notify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
            },
            body: JSON.stringify({
              phone,
              message,
              test_mode: automation.action_config.test_mode || false
            })
          }
        );

        const whatsappData = await whatsappResponse.json();

        // Update trigger_count
        await supabase
          .from("automation_triggers")
          .update({
            trigger_count: (automation.trigger_count || 0) + 1,
            last_triggered_at: new Date().toISOString()
          })
          .eq("id", automation.id);

        results.push({
          automation_id: automation.id,
          status: whatsappData.status,
          messageId: whatsappData.messageId
        });

      } catch (error) {
        console.error("Automation error:", error);
        results.push({
          automation_id: automation.id,
          status: "error",
          reason: error.message
        });
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
```

### 3.3 Database Webhooks Configuration

**Goal**: Trigger Edge Functions automatically on database events

**Steps**:
1. In Supabase Dashboard → Database → Webhooks
2. Create webhook for `event_checklists` table:
   - Event: INSERT, UPDATE
   - Function: `handle-automation`
   - Filter: `status = 'completed'` (if possible via dashboard)

3. Create webhook for `events` table:
   - Event: INSERT
   - Function: `handle-automation`

**SQL Alternative** (if webhooks not available):
```sql
-- Create trigger function
create or replace function public.notify_automation_trigger()
returns trigger as $$
begin
  -- Call Edge Function via pg_net (if available)
  -- OR insert into a queue table that's polled by a cron job
  perform pg_notify('automation_trigger', json_build_object(
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'record', row_to_json(NEW)
  )::text);
  return NEW;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger automation_trigger_on_checklist_update
after update on public.event_checklists
for each row
execute function public.notify_automation_trigger();

create trigger automation_trigger_on_event_create
after insert on public.events
for each row
execute function public.notify_automation_trigger();
```

---

## 4. Frontend Implementation

### 4.1 Component Structure

```
src/pages/
├── Automacoes.tsx (main page)
│
src/components/automations/
├── AutomationList.tsx (list display)
├── AutomationCard.tsx (single card)
├── AutomationDialog.tsx (create/edit dialog)
├── AutomationForm.tsx (form logic)
├── VariablePicker.tsx (optional - variable insertion helper)
└── AutomationPreview.tsx (optional - preview rendered message)

src/hooks/
├── useAutomations.ts (updated)
├── useAutomationForm.ts (new - form validation)
└── useVariableSubstitution.ts (new - variable engine)

src/services/
└── automationService.ts (new - API calls)
```

### 4.2 Updated `useAutomations.ts` Hook

```typescript
// src/hooks/useAutomations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AutomationTrigger {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger_event: string;
  trigger_conditions?: Record<string, any>;
  action_type: string;
  action_config: {
    message: string;
    phone_source?: string;
    delay_seconds?: number;
    max_retries?: number;
  };
  last_triggered_at?: string;
  trigger_count?: number;
  created_at?: string;
  updated_at?: string;
}

export const useAutomations = () => {
  const queryClient = useQueryClient();

  // Fetch all automations
  const { data: automations = [], isLoading, error } = useQuery({
    queryKey: ["automation_triggers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_triggers")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as AutomationTrigger[];
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Create new automation
  const createAutomation = useMutation({
    mutationFn: async (newAuto: Omit<AutomationTrigger, "id" | "created_at" | "updated_at" | "trigger_count" | "last_triggered_at">) => {
      const { data, error } = await supabase
        .from("automation_triggers")
        .insert([newAuto])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_triggers"] });
      toast.success("AUTOMAÇÃO CRIADA!");
    },
    onError: (err: any) => {
      toast.error(`ERRO: ${err.message}`);
    }
  });

  // Update automation
  const updateAutomation = useMutation({
    mutationFn: async (automation: AutomationTrigger) => {
      const { error } = await supabase
        .from("automation_triggers")
        .update(automation)
        .eq("id", automation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_triggers"] });
      toast.success("AUTOMAÇÃO ATUALIZADA!");
    },
    onError: (err: any) => {
      toast.error(`ERRO: ${err.message}`);
    }
  });

  // Toggle active status
  const toggleAutomation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("automation_triggers")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_triggers"] });
    }
  });

  // Delete automation
  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_triggers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_triggers"] });
      toast.success("AUTOMAÇÃO DELETADA!");
    },
    onError: (err: any) => {
      toast.error(`ERRO: ${err.message}`);
    }
  });

  return {
    automations,
    isLoading,
    error,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation
  };
};
```

### 4.3 Refactored `Automacoes.tsx`

```typescript
// src/pages/Automacoes.tsx
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAutomations } from "@/hooks/useAutomations";
import { AutomationDialog } from "@/components/automations/AutomationDialog";
import { AutomationCard } from "@/components/automations/AutomationCard";
import { Zap, Plus } from "lucide-react";
import { useState } from "react";

export default function Automacoes() {
  const { automations, isLoading, toggleAutomation, deleteAutomation } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AppLayout title="Automações">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-foreground pb-4">
          <div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-primary">
              Automações
            </h1>
            <p className="font-mono text-xs uppercase text-muted-foreground">
              Logística & Notificações Inteligentes
            </p>
          </div>
          <Button
            className="rounded-none border-2 border-primary bg-primary font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Gatilho
          </Button>
        </div>

        {/* Create Dialog */}
        <AutomationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        {/* Automation Cards Grid */}
        <div className="grid gap-4">
          {automations.map((auto) => (
            <AutomationCard
              key={auto.id}
              automation={auto}
              onToggle={(active) => toggleAutomation.mutate({ id: auto.id, active })}
              onDelete={() => deleteAutomation.mutate(auto.id)}
            />
          ))}

          {/* Empty State */}
          {automations.length === 0 && !isLoading && (
            <div className="border-2 border-dashed border-white/10 py-20 text-center">
              <Zap className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
              <p className="font-mono text-sm uppercase text-muted-foreground">
                O sistema ainda não está operando no automático
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
```

### 4.4 New Components

#### `AutomationCard.tsx`
```typescript
// Shows individual automation trigger with toggle and actions
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BellRing, Trash2 } from "lucide-react";
import { AutomationTrigger } from "@/hooks/useAutomations";

interface Props {
  automation: AutomationTrigger;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

export function AutomationCard({ automation, onToggle, onDelete }: Props) {
  const triggerLabel = automation.trigger_event
    .replace(/_/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <Card className="rounded-none border-2 border-white/10 bg-black/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="font-display text-xl font-black uppercase">
            {automation.name}
          </CardTitle>
          <CardDescription className="font-mono text-[10px] font-bold uppercase text-primary">
            Gatilho: {triggerLabel}
          </CardDescription>
          {automation.trigger_count && (
            <p className="font-mono text-[9px] text-muted-foreground">
              Disparada {automation.trigger_count}x
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Switch
            checked={automation.active}
            onCheckedChange={onToggle}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 rounded-none border border-white/5 bg-white/5 p-3">
          <BellRing className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p className="font-mono text-xs italic leading-relaxed text-muted-foreground">
            "{automation.action_config.message}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### `AutomationDialog.tsx` & `AutomationForm.tsx`
(See full code in implementation files - focuses on form state, validation, submission)

### 4.5 Variable Substitution Hook

```typescript
// src/hooks/useVariableSubstitution.ts
export const AVAILABLE_VARIABLES = {
  client: [
    { key: "cliente", label: "Nome do Cliente", alias: "client_name" },
    { key: "email", label: "Email do Cliente", alias: "client_email" },
    { key: "phone", label: "Telefone do Cliente", alias: "client_phone" }
  ],
  event: [
    { key: "data", label: "Data do Evento", alias: "date" },
    { key: "local", label: "Local do Evento", alias: "location" },
    { key: "event_name", label: "Nome do Evento", alias: "event_name" }
  ],
  staff: [
    { key: "nome", label: "Nome do Funcionário", alias: "staff_name" },
    { key: "staff_role", label: "Cargo do Funcionário", alias: "staff_role" }
  ]
};

export function substituteVariables(
  template: string,
  data: Record<string, any>
): string {
  let result = template;

  // Client variables
  result = result
    .replace(/{cliente}/g, data.client_name || "")
    .replace(/{client_name}/g, data.client_name || "")
    .replace(/{email}/g, data.client_email || "")
    .replace(/{phone}/g, data.client_phone || "");

  // Event variables
  const formattedDate = data.event_date
    ? new Date(data.event_date).toLocaleDateString("pt-BR")
    : "";
  result = result
    .replace(/{data}/g, formattedDate)
    .replace(/{date}/g, formattedDate)
    .replace(/{local}/g, data.event_location || "")
    .replace(/{location}/g, data.event_location || "");

  // Staff variables
  result = result
    .replace(/{nome}/g, data.staff_name || "")
    .replace(/{nome_staff}/g, data.staff_name || "")
    .replace(/{staff_role}/g, data.staff_role || "");

  return result;
}

export function validateVariables(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const regex = /{(\w+)}/g;
  const matches = template.matchAll(regex);

  const validKeys = Object.values(AVAILABLE_VARIABLES)
    .flatMap(group => [...group.map(v => v.key), ...group.map(v => v.alias)])

  for (const match of matches) {
    const variable = match[1];
    if (!validKeys.includes(variable)) {
      errors.push(`Variável inválida: {${variable}}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 5. Integration Points

### 5.1 Event System Integration

**Checklist Completion Event**:
```
Database Event: UPDATE event_checklists SET status = 'completed'
  ↓
Webhook triggers → handle-automation Edge Function
  ↓
Query automation_triggers WHERE trigger_event = 'checklist_entrada'
  ↓
For each matching trigger:
  - Fetch event details (client_name, client_phone, event_date, location)
  - Substitute variables in message template
  - Call whatsapp-notify function
  - Update automation trigger_count
```

### 5.2 Phone Number Resolution

**Strategy**: Store `client_phone` in events table

**Fallback Chain**:
1. `events.client_phone` (primary)
2. `contacts.phone` (if exists via foreign key)
3. Environment variable `DEFAULT_ADMIN_PHONE` (testing only)

**SQL to add column** (if not exists):
```sql
alter table public.events
add column if not exists client_phone text;

comment on column public.events.client_phone is 'Client WhatsApp phone number';
```

### 5.3 Data Flow Diagram

```
┌─ Events Table ───────┐
│ id, client_name      │
│ client_phone         │
│ date, location       │
└──────────┬───────────┘
           │
           ↓
    [Event Update]
           │
           ↓
    ┌──────────────┐
    │ Webhook Hook │
    └──────┬───────┘
           │
           ↓
┌─ automation_triggers ┐
│ WHERE active = true  │
│ WHERE trigger_event  │
│   = 'checklist_...'  │
└──────────┬───────────┘
           │
           ↓
┌─ handle-automation ─┐
│ Edge Function       │
│ - Fetch event data  │
│ - Substitute vars   │
│ - Call whatsapp-..  │
└──────────┬──────────┘
           │
           ↓
┌─ whatsapp-notify ───┐
│ - Validate phone    │
│ - Call UAZapi       │
│ - Return status     │
└─────────────────────┘
```

---

## 6. Deployment Strategy

### 6.1 Deployment Phases

#### Phase 1: Database (Day 1)
- [ ] Create `automation_triggers` table
- [ ] Migrate data from `magodosdrinks_triggers`
- [ ] Add `client_phone` column to `events` (if needed)
- [ ] Test RLS policies
- [ ] Create indexes

#### Phase 2: Edge Functions (Day 1)
- [ ] Deploy `whatsapp-notify` function
- [ ] Deploy updated `handle-automation` function
- [ ] Test functions locally with Deno
- [ ] Configure environment variables:
  - `UAZAPI_INSTANCE`
  - `UAZAPI_TOKEN`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### Phase 3: Database Webhooks (Day 2)
- [ ] Create webhook for `event_checklists` updates
- [ ] Create webhook for `events` inserts
- [ ] Test webhook execution
- [ ] Monitor logs

#### Phase 4: Frontend (Day 2)
- [ ] Deploy updated components
- [ ] Deploy updated hooks
- [ ] Test UI in staging
- [ ] Validate form submission

#### Phase 5: Integration Testing (Day 3)
- [ ] End-to-end testing
- [ ] Test with real WhatsApp numbers (staged)
- [ ] Verify variable substitution
- [ ] Check error handling

### 6.2 Deployment Checklist

```bash
# 1. Database Migrations
supabase db push  # applies migrations

# 2. Environment Variables (set in Supabase Dashboard)
# Functions → Configuration → Environment Variables
UAZAPI_INSTANCE="your-instance"
UAZAPI_TOKEN="your-token"

# 3. Deploy Edge Functions
supabase functions deploy whatsapp-notify
supabase functions deploy handle-automation

# 4. Setup Webhooks (via Dashboard)
# Database → Webhooks
# Create for: event_checklists, events

# 5. Deploy Frontend
npm run build
npm run deploy  # or your deployment command

# 6. Test
curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{
    "phone": "5511999999999",
    "message": "Test message",
    "test_mode": true
  }'

# 7. Monitor
# Supabase Dashboard → Edge Functions → Logs
# Check whatsapp-notify and handle-automation functions
```

### 6.3 Rollback Strategy

**If issues occur**:
1. Disable webhooks (Supabase Dashboard)
2. Set all automations to `active = false`
3. Revert Edge Functions to previous versions
4. Fix issue
5. Re-deploy

**Keep old tables for 30 days**:
```sql
-- Don't drop old tables immediately
-- Keep as backup:
-- - automations
-- - magodosdrinks_triggers
```

### 6.4 Environment Variables

```bash
# Supabase Functions need these env vars:
UAZAPI_INSTANCE=<from UAZapi dashboard>
UAZAPI_TOKEN=<from UAZapi dashboard>
SUPABASE_URL=<auto-provided>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase settings>

# Optional (for testing):
DEFAULT_ADMIN_PHONE=<admin's phone for test messages>
TEST_MODE=false  # Set true to only log, don't send
```

---

## 7. Testing & Validation

### 7.1 Unit Tests

#### Test Variable Substitution
```typescript
// src/__tests__/substituteVariables.test.ts
import { substituteVariables, validateVariables } from "@/hooks/useVariableSubstitution";

describe("substituteVariables", () => {
  it("should replace {cliente} with client name", () => {
    const template = "Olá {cliente}!";
    const data = { client_name: "João" };
    expect(substituteVariables(template, data)).toBe("Olá João!");
  });

  it("should handle multiple variables", () => {
    const template = "Olá {cliente}, bem-vindo a {local}!";
    const data = { client_name: "Maria", event_location: "Copacabana" };
    expect(substituteVariables(template, data)).toBe(
      "Olá Maria, bem-vindo a Copacabana!"
    );
  });

  it("should format dates to pt-BR", () => {
    const template = "Data: {data}";
    const data = { event_date: "2026-02-15T10:00:00" };
    expect(substituteVariables(template, data)).toMatch(/Data: 15\/02\/2026/);
  });
});

describe("validateVariables", () => {
  it("should accept valid variables", () => {
    const result = validateVariables("Olá {cliente}, data {data}");
    expect(result.valid).toBe(true);
  });

  it("should reject invalid variables", () => {
    const result = validateVariables("Olá {cliente}, {xyz}");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Variável inválida: {xyz}");
  });
});
```

#### Test Edge Function Logic
```typescript
// Test handle-automation event matching
// Test whatsapp-notify phone validation and UAZapi call
// Test error handling for missing phone numbers
```

### 7.2 Integration Tests

**Scenario 1: Checklist Completion Trigger**
```
1. Create event with client_phone = "5511999999999"
2. Create automation trigger for "checklist_entrada"
3. Update event_checklist status = "completed"
4. Verify webhook called
5. Verify WhatsApp message sent
6. Verify automation trigger_count incremented
```

**Scenario 2: Variable Substitution**
```
1. Create automation with message template:
   "Olá {cliente}, seu evento em {local} está confirmado para {data}"
2. Trigger event with client_name="Ana", location="Praia", date="2026-02-20"
3. Verify message rendered:
   "Olá Ana, seu evento em Praia está confirmado para 20/02/2026"
```

**Scenario 3: Error Handling**
```
1. Create automation with invalid variable {xyz}
2. Save should fail with validation error
3. Create automation without message
4. Save should fail
5. Create automation with phone source but no phone data
6. Trigger should fail gracefully, log error, not crash
```

### 7.3 Manual Testing Checklist

```
UI/UX Tests:
- [ ] Create new automation (fill form, save, appears in list)
- [ ] Toggle automation on/off (switch works, persists)
- [ ] Delete automation (confirmation, removed from list)
- [ ] Variable hints display correctly
- [ ] Form validation shows errors (empty name, invalid variables)
- [ ] Success/error toasts appear
- [ ] UI looks correct on mobile/tablet

Integration Tests (with test phone number):
- [ ] Checklist completed → WhatsApp sent
- [ ] Variables substituted correctly
- [ ] Error in message template doesn't crash system
- [ ] Missing phone number handled gracefully
- [ ] Multiple automations trigger for same event

Test Mode:
- [ ] whatsapp-notify with test_mode=true returns mock response
- [ ] No actual messages sent in test mode
- [ ] Edge Function logs show test mode messages
```

### 7.4 Staging vs Production Testing

**Staging**:
- Use test phone number
- Enable `test_mode` in whatsapp-notify
- Full integration testing
- Performance testing with multiple automations

**Production**:
- Start with 1-2 real automations
- Use real client phone numbers
- Monitor for 24 hours
- Scale up gradually

---

## 8. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|-----------|
| Phone number missing | Message not sent | Medium | Validate phone before trigger, log error, default fallback |
| Invalid variables in template | Message malformed | Low | Validate template on save, show error |
| Webhook fails | Automation never triggers | Low | Webhook retry policy, manual trigger option, monitoring |
| UAZapi quota exceeded | Messages fail | Low | Rate limiting, usage monitoring, fallback number |
| Database schema conflict | Data loss | Very Low | Backup old tables, gradual migration, rollback plan |
| RLS policy blocks access | Can't manage automations | Low | Test RLS policies in staging, verify admin role |
| Edge Function timeout | Large delays | Low | Async processing, queue-based system (future) |

**Mitigation Strategies**:
1. **Data Validation**: Strict validation on both client and server
2. **Error Logging**: Comprehensive logging in Edge Functions
3. **Monitoring**: Dashboard alerts for failed triggers
4. **Fallbacks**: Default phone numbers for testing
5. **Rate Limiting**: Prevent message spam
6. **Backup**: Keep old tables as backup for 30 days

---

## 9. Performance Considerations

### 9.1 Query Optimization
- Index `automation_triggers` on `(active, trigger_event)`
- Index `automation_triggers` on `(created_by)` for filtering
- Paginate automation list if >100 items
- Cache variable list in frontend (rarely changes)

### 9.2 Edge Function Performance
- Keep substitution logic simple (no external API calls)
- Parallel processing for multiple automations
- Timeout: 60 seconds (Supabase limit)
- Retry failed triggers (implement in v2)

### 9.3 Database Performance
- Webhook triggers are async (non-blocking)
- Update `trigger_count` in background (non-blocking)
- Audit log for compliance (future enhancement)

### 9.4 Scalability

**Current limitations**:
- UAZapi rate limits (check docs)
- Supabase Edge Function concurrent execution limits

**Future improvements**:
- Queue system (Bull, RabbitMQ) for high-volume triggers
- Batch WhatsApp sending
- Scheduled triggers (not just event-based)

---

## 10. Future Enhancements

### Phase 2 (v1.1)
- [ ] Scheduled automations (e.g., "send reminder 1 hour before event")
- [ ] Multiple recipients (send to staff + client)
- [ ] Email support in addition to WhatsApp
- [ ] Automation templates library
- [ ] A/B testing for message variants

### Phase 3 (v1.2)
- [ ] Conditional triggers (e.g., "only if event cost > R$5000")
- [ ] Time-based delays (e.g., "send 2 hours after trigger")
- [ ] Webhook audit log (view all executions)
- [ ] Export/import automations
- [ ] Collaboration (share automations across users)

### Phase 4 (v2.0)
- [ ] Queue-based system for high-volume
- [ ] AI-powered message suggestions
- [ ] Campaign analytics (click-through, conversion tracking)
- [ ] Integration with other platforms (Telegram, SMS)
- [ ] Advanced scheduling and batching

---

## 11. Documentation

### User Documentation
- How to create an automation
- Available variables reference
- Example templates
- Troubleshooting guide
- Best practices (message length, variable usage)

### Developer Documentation
- Edge Function API docs
- Variable substitution algorithm
- Database schema documentation
- Webhook configuration guide
- Error codes and troubleshooting

### Operations Documentation
- Deployment runbook
- Rollback procedure
- Monitoring and alerting
- Troubleshooting guide
- Performance tuning

---

## 12. File Summary

### New Files to Create
```
/supabase/functions/whatsapp-notify/index.ts
/supabase/migrations/20260206_automation_triggers.sql
/src/components/automations/AutomationCard.tsx
/src/components/automations/AutomationDialog.tsx
/src/components/automations/AutomationForm.tsx
/src/components/automations/VariablePicker.tsx (optional)
/src/hooks/useAutomationForm.ts
/src/hooks/useVariableSubstitution.ts
/src/services/automationService.ts
/src/__tests__/substituteVariables.test.ts
```

### Files to Update
```
/supabase/functions/handle-automation/index.ts
/src/pages/Automacoes.tsx
/src/hooks/useAutomations.ts
/src/lib/supabase.ts (if needed for new queries)
```

### Files to Keep/Deprecate
```
Keep (backup):
- /supabase/migrations/20260205200000_automations.sql
- automations table (for 30 days)
- magodosdrinks_triggers table (for 30 days)

Deprecate:
- src/services/whatsapp.ts (can consolidate if only used here)
```

---

## 13. Success Criteria

### Functional Requirements
- [ ] User can create automation with trigger + message
- [ ] Variables are correctly substituted in messages
- [ ] WhatsApp messages sent when triggers fire
- [ ] Automation can be toggled on/off
- [ ] Automation can be deleted
- [ ] Multiple automations can exist for same trigger

### Non-Functional Requirements
- [ ] All queries < 1 second
- [ ] Edge Functions respond < 5 seconds
- [ ] 99.9% message delivery (UAZapi dependent)
- [ ] Zero data loss on deployment
- [ ] Proper error logging and monitoring
- [ ] Full test coverage > 80%

### User Experience
- [ ] Neo-brutalism design consistent with app
- [ ] Form validation clear and helpful
- [ ] Success/error feedback immediate
- [ ] Variable picker easy to understand
- [ ] Mobile-friendly interface

---

## 14. Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Planning | 1 day | Requirements, design review (DONE) |
| Database | 1 day | Schema, migrations, data migration |
| Edge Functions | 2 days | whatsapp-notify, handle-automation, testing |
| Frontend | 2 days | Components, hooks, integration |
| Integration | 2 days | End-to-end testing, staging |
| **Total** | **~8 days** | Ready for production |

---

## Appendix: Variable Reference

### Client Variables
- `{cliente}` / `{client_name}` - Event client name
- `{email}` / `{client_email}` - Client email
- `{phone}` / `{client_phone}` - Client phone

### Event Variables
- `{data}` / `{date}` - Event date (formatted pt-BR: DD/MM/YYYY)
- `{local}` / `{location}` - Event location
- `{event_name}` - Event name

### Staff Variables
- `{nome}` / `{nome_staff}` - Staff member name
- `{staff_role}` - Staff member role/position

### Custom Variables (future)
- Any column from events/contacts can be substituted
- Format: `{column_name}`

### Date Formatting
- All dates automatically formatted to Portuguese (pt-BR)
- Example: "2026-02-15" → "15/02/2026"

---

**Plan Version**: 1.0
**Created**: 2026-02-06
**Status**: Ready for Implementation
**Next Step**: Create migration file and Edge Functions
