# Automation System - Architecture & Data Flows

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DRINK WIZARD AUTOMATION SYSTEM                    │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          DATABASE TIER (Supabase)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │     events          │  │ event_checklists │  │ automation_       │    │
│  │                     │  │                  │  │ triggers          │    │
│  ├─────────────────────┤  ├──────────────────┤  ├──────────────────┤    │
│  │ id (PK)             │  │ id (PK)          │  │ id (PK)          │    │
│  │ client_name         │  │ event_id (FK)    │  │ created_by       │    │
│  │ client_phone    ◄───┼──┤ type             │  │ name             │    │
│  │ client_email        │  │ status           │  │ active           │    │
│  │ date                │  │ checked_by       │  │ trigger_event    │    │
│  │ location            │  │ created_at       │  │ action_type      │    │
│  │ created_at          │  │ updated_at       │  │ action_config    │    │
│  └─────────────────────┘  └──────────────────┘  │ trigger_count    │    │
│                                                  │ last_triggered   │    │
│                                                  └──────────────────┘    │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
         ▲                              ▲                         ▲
         │ triggers on INSERT/UPDATE    │                         │
         │                              │                   reads & updates
         │                              │                         │
┌────────┴─────────────────────────────┴─────────────────────────┴────────┐
│                      DATABASE WEBHOOKS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  on-event-created                    on-checklist-completed              │
│  Table: events                       Table: event_checklists             │
│  Events: INSERT                      Events: UPDATE                       │
│  → handle-automation                 → handle-automation                  │
│                                                                            │
└────────┬─────────────────────────────────────────────────────────────────┘
         │ invokes
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          EDGE FUNCTIONS (Serverless Compute - Deno Runtime)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │         handle-automation (main orchestrator)                  │       │
│  ├───────────────────────────────────────────────────────────────┤       │
│  │ Input: Webhook Payload (INSERT/UPDATE on events/checklists)   │       │
│  │                                                                 │       │
│  │ 1. Parse webhook payload                                       │       │
│  │ 2. Map table + event type → trigger_event                     │       │
│  │    - checklist + entrada + completed → checklist_entrada      │       │
│  │    - checklist + saida + completed → checklist_saida          │       │
│  │    - events + INSERT → event_created                          │       │
│  │                                                                 │       │
│  │ 3. Query automation_triggers WHERE active=true AND            │       │
│  │    trigger_event = matched                                    │       │
│  │                                                                 │       │
│  │ 4. For each matching automation:                              │       │
│  │    a. Extract action_config.message template                  │       │
│  │    b. Fetch event data (client_name, phone, etc.)             │       │
│  │    c. Merge context data                                      │       │
│  │    d. Call substituteVariables()                              │       │
│  │    e. Validate phone number                                   │       │
│  │    f. Call whatsapp-notify Edge Function                      │       │
│  │    g. Handle response                                         │       │
│  │    h. Update trigger_count + last_triggered_at                │       │
│  │    i. Collect result                                          │       │
│  │                                                                 │       │
│  │ Output: Array of results { automation_id, status, messageId } │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                     │                                      │
│                                     │ calls                                │
│                                     ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │           whatsapp-notify (message delivery)                   │       │
│  ├───────────────────────────────────────────────────────────────┤       │
│  │ Input: { phone, message, test_mode }                           │       │
│  │                                                                 │       │
│  │ 1. Validate inputs (non-empty phone & message)                │       │
│  │ 2. Validate phone format                                       │       │
│  │    - Clean: remove non-numeric chars                          │       │
│  │    - Check: minimum 10 digits                                 │       │
│  │    - Normalize: add 55 if needed (Brazil)                     │       │
│  │                                                                 │       │
│  │ 3. If test_mode = true:                                       │       │
│  │    - Return mock response                                      │       │
│  │    - Do NOT send actual message                               │       │
│  │                                                                 │       │
│  │ 4. If test_mode = false:                                      │       │
│  │    - Call Z-API endpoint with credentials                     │       │
│  │    - POST to /send-text with phone & message                  │       │
│  │    - Handle response                                          │       │
│  │                                                                 │       │
│  │ Output: { status, messageId, message, timestamp }             │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                     │                                      │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      │
                                      │ HTTP POST (production only)
                                      ▼
                          ┌────────────────────────┐
                          │   Z-API (UAZapi)       │
                          │  WhatsApp Integration  │
                          ├────────────────────────┤
                          │ Instance: UAZAPI_...   │
                          │ Token: UAZAPI_TOKEN    │
                          │                        │
                          │ Endpoint:              │
                          │ /send-text             │
                          └────────────────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │      WhatsApp          │
                          │    Client's Phone      │
                          └────────────────────────┘
```

## Trigger Event Flow (Detailed)

### Flow 1: Checklist Entrada (Entry Checklist) Completion

```
User updates event_checklists.status = 'completed'
                        │
                        ▼
    Database Webhook (on-checklist-completed)
    triggered for event_checklists UPDATE
                        │
                        ▼
    handle-automation receives webhook:
    {
      type: "UPDATE",
      table: "event_checklists",
      record: {
        id: "uuid",
        event_id: "parent-event-uuid",
        type: "entrada",      ◄─ TYPE
        status: "completed",   ◄─ STATUS
        checked_by: "staff-id"
      }
    }
                        │
                        ▼
    Trigger Event Mapping:
    table = "event_checklists" +
    type = "entrada" +
    status = "completed"
    ──────────────────────────→ trigger_event = "checklist_entrada"
                        │
                        ▼
    Query: SELECT * FROM automation_triggers
           WHERE active = true
           AND trigger_event = 'checklist_entrada'
                        │
    ┌───────────────────┴───────────────────┐
    │ Found matching automations             │
    │ (could be 0 or more)                  │
    ▼
    For each automation:
    1. Get message template:
       "Olá {cliente}, seu checklist foi concluído em {local}!"

    2. Fetch event data:
       SELECT client_name, client_phone, date, location
       FROM events WHERE id = "parent-event-uuid"
       Result: {
         client_name: "João Silva",
         client_phone: "5511987654321",
         date: "2026-02-15T19:00:00Z",
         location: "Bar do João"
       }

    3. Merge contexts:
       {
         client_name: "João Silva",
         client_phone: "5511987654321",
         event_date: "2026-02-15T19:00:00Z",
         event_location: "Bar do João"
       }

    4. Variable substitution:
       Input:    "Olá {cliente}, seu checklist foi concluído em {local}!"
       Mapping:  {cliente} → client_name → "João Silva"
                 {local} → event_location → "Bar do João"
       Output:   "Olá João Silva, seu checklist foi concluído em Bar do João!"

    5. Call whatsapp-notify:
       POST /functions/v1/whatsapp-notify {
         phone: "5511987654321",
         message: "Olá João Silva, seu checklist foi concluído em Bar do João!",
         test_mode: false
       }

    6. Response handling:
       {
         status: "success",
         messageId: "abc123",
         message: "Message sent successfully",
         timestamp: "2026-02-06T17:43:37Z"
       }

    7. Update automation stats:
       UPDATE automation_triggers
       SET trigger_count = trigger_count + 1,
           last_triggered_at = NOW()
       WHERE id = "automation-uuid"

    8. Collect result:
       {
         automation_id: "automation-uuid",
         automation_name: "Agradecimento Pós-Checklist",
         status: "success",
         messageId: "abc123"
       }
                        │
                        ▼
    Return results array with all executions
```

### Flow 2: Event Created (New Event Scheduled)

```
User creates new event (INSERT into events table)
                        │
                        ▼
    Database Webhook (on-event-created)
    triggered for events INSERT
                        │
                        ▼
    handle-automation receives webhook:
    {
      type: "INSERT",
      table: "events",
      record: {
        id: "new-event-uuid",
        client_name: "Maria Santos",
        client_phone: "5521987654321",
        date: "2026-02-20T20:00:00Z",
        location: "Rooftop Copacabana"
      }
    }
                        │
                        ▼
    Trigger Event Mapping:
    table = "events" +
    type = "INSERT"
    ──────────────────→ trigger_event = "event_created"
                        │
                        ▼
    Query: SELECT * FROM automation_triggers
           WHERE active = true
           AND trigger_event = 'event_created'
                        │
    ┌───────────────────┴───────────────────┐
    │ Found matching automations             │
    │ (could be 0 or more)                  │
    ▼
    For each automation:
    1. Get message template:
       "Novo evento agendado: {cliente} em {local} no dia {data}"

    2. Event data already in record (no extra fetch needed)

    3. Build context from record:
       {
         client_name: "Maria Santos",
         client_phone: "5521987654321",
         event_date: "2026-02-20T20:00:00Z",
         event_location: "Rooftop Copacabana"
       }

    4. Variable substitution:
       Input:    "Novo evento agendado: {cliente} em {local} no dia {data}"
       Mapping:  {cliente} → "Maria Santos"
                 {local} → "Rooftop Copacabana"
                 {data} → formatted "20/02/2026"
       Output:   "Novo evento agendado: Maria Santos em Rooftop Copacabana no dia 20/02/2026"

    5. Call whatsapp-notify and continue as above...
```

## Variable Substitution Engine

```
Template String (input):
  "Olá {cliente}, seu evento em {local} está confirmado para {data}!"

Available Data Context:
  {
    client_name: "Ana Silva",
    client_email: "ana@example.com",
    client_phone: "5511999999999",
    event_name: "Formatura",
    event_date: "2026-02-25T19:00:00Z",
    event_location: "Salão de Festas",
    staff_name: "Carlos",
    staff_role: "Bartender"
  }

Substitution Rules (in order):
  1. {cliente} → data.client_name → "Ana Silva"
  2. {local} → data.event_location → "Salão de Festas"
  3. {data} → formatDate(data.event_date, "pt-BR") → "25/02/2026"

Output String:
  "Olá Ana Silva, seu evento em Salão de Festas está confirmado para 25/02/2026!"

Supported Variables:

  CLIENT VARIABLES:
  {cliente} / {client_name} → data.client_name
  {email} / {client_email}  → data.client_email
  {phone} / {client_phone}  → data.client_phone

  EVENT VARIABLES:
  {data} / {date}    → formatDate(data.event_date, "pt-BR")
  {local} / {location} → data.event_location
  {event_name}       → data.event_name

  STAFF VARIABLES:
  {nome} / {nome_staff} → data.staff_name
  {staff_role}         → data.staff_role

  CUSTOM VARIABLES:
  {any_field}  → data.any_field (any string/number field)

Date Formatting:
  Input:  "2026-02-25T19:00:00Z"
  Output: "25/02/2026"
  Locale: pt-BR (Portuguese - Brazil)
```

## Data Model: automation_triggers

```
┌──────────────────────────────────────────────────────┐
│        automation_triggers (Single Source of Truth)   │
├──────────────────────────────────────────────────────┤
│                                                        │
│ METADATA                                             │
│ ├─ id (uuid, PK)                                    │
│ ├─ created_at (timestamp)                           │
│ ├─ updated_at (timestamp, auto-updated)             │
│ └─ created_by (uuid, FK → auth.users)               │
│                                                        │
│ DEFINITION                                           │
│ ├─ name (text): "Agradecimento Pós-Checklist"       │
│ ├─ description (text, optional)                      │
│ └─ active (boolean): true/false                      │
│                                                        │
│ TRIGGER CONFIGURATION                               │
│ ├─ trigger_event (text):                            │
│ │  ├─ 'checklist_entrada'                          │
│ │  ├─ 'checklist_saida'                            │
│ │  └─ 'event_created'                              │
│ │                                                     │
│ └─ trigger_conditions (jsonb, optional):             │
│    └─ { "status": "completed" }                      │
│                                                        │
│ ACTION CONFIGURATION                                 │
│ ├─ action_type (text): 'whatsapp' | 'email'        │
│ │                                                     │
│ └─ action_config (jsonb):                            │
│    {                                                   │
│      "message": "Olá {cliente}...",                 │
│      "phone_source": "event.client_phone",          │
│      "delay_seconds": 0,                            │
│      "max_retries": 3,                              │
│      "test_mode": false                             │
│    }                                                  │
│                                                        │
│ EXECUTION METRICS                                    │
│ ├─ trigger_count (integer): 42                       │
│ └─ last_triggered_at (timestamp): 2026-02-06 17:43 │
│                                                        │
└──────────────────────────────────────────────────────┘
```

## RLS (Row Level Security) Policy Matrix

```
┌─────────────────────────────────────────────────────┐
│  automation_triggers - Access Control Matrix        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ User Role: ADMIN                                   │
│ ├─ SELECT (read)  ✓ allowed via admins_read       │
│ ├─ INSERT (create) ✓ allowed via admins_insert    │
│ ├─ UPDATE (edit)  ✓ allowed via admins_update     │
│ └─ DELETE (remove) ✓ allowed via admins_delete    │
│                                                      │
│ User Role: STAFF, CHEFE_BAR, OTHER                │
│ ├─ SELECT (read)  ✗ blocked                       │
│ ├─ INSERT (create) ✗ blocked                      │
│ ├─ UPDATE (edit)  ✗ blocked                       │
│ └─ DELETE (remove) ✗ blocked                      │
│                                                      │
│ Unauthenticated / Service Role                    │
│ ├─ SELECT (read)  ✓ allowed (service role bypass) │
│ ├─ INSERT (create) ✓ allowed (service role bypass)│
│ ├─ UPDATE (edit)  ✓ allowed (service role bypass) │
│ └─ DELETE (remove) ✓ allowed (service role bypass)│
│                                                      │
└─────────────────────────────────────────────────────┘

Role Check:
1. Check JWT claim: auth.jwt() ->> 'role'
2. OR Check profiles table: SELECT role FROM profiles WHERE id = auth.uid()
3. Match role = 'admin'
4. Allow or Block operation
```

## Performance Characteristics

```
Operation Metrics:

1. Webhook Reception → handle-automation invocation
   Time: < 100ms (Supabase infrastructure)

2. Automation Query (automation_triggers table)
   Time: < 50ms (indexed lookup)
   Query: SELECT * WHERE active=true AND trigger_event=X

3. Event Data Enrichment (events table)
   Time: < 100ms (indexed lookup by id)
   Query: SELECT client_name, phone, date, location FROM events

4. Variable Substitution Engine
   Time: < 10ms (string replacements)
   Complexity: O(n) where n = number of variables

5. whatsapp-notify Edge Function
   Time: 500-2000ms (network latency to Z-API)
   Depends on: Z-API response time

6. Total handle-automation Execution
   Time: 1-5 seconds (for single automation)
   Time: 2-10 seconds (for multiple automations)

Scalability:
- Single automation: ~1-2 seconds
- 5 automations: ~3-5 seconds
- 10 automations: ~5-10 seconds
- Supabase function timeout: 60 seconds (safe margin)

Database Indexes:
- automation_triggers.active: Speeds up active filter
- automation_triggers.trigger_event: Speeds up event type filter
- automation_triggers.created_by: Speeds up user's automations query
- automation_triggers.updated_at: Enables sorted listings
```

## Deployment Layers

```
┌─────────────────────────────────────────────────┐
│         Development / Staging                    │
├─────────────────────────────────────────────────┤
│ - Test Mode: ENABLED by default                 │
│ - Real sends: Blocked (test_mode=true)          │
│ - Phone validation: Enforced                     │
│ - Logs: Verbose, full context                   │
│ - Webhook triggers: Live                         │
└─────────────────────────────────────────────────┘
           │
           │ After testing & validation
           ▼
┌─────────────────────────────────────────────────┐
│         Production                               │
├─────────────────────────────────────────────────┤
│ - Test Mode: DISABLED in automations             │
│ - Real sends: Via Z-API                         │
│ - Phone validation: Enforced                     │
│ - Logs: Structured, monitoring                   │
│ - Webhook triggers: Live, monitored              │
│ - Error handling: Graceful degradation           │
│ - Rollback capability: Available                 │
└─────────────────────────────────────────────────┘
```

---

**Version**: 1.0
**Status**: Production-Ready
**Last Updated**: February 6, 2026
