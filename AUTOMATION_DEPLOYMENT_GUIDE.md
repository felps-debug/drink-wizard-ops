# Automation System Deployment Guide

## Quick Reference

This guide walks through deploying the WhatsApp automation system backend to production.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Z-API (UAZapi) instance and token configured
- Access to Supabase project dashboard
- Current branch: nova-feature-drink with latest commits

## Step-by-Step Deployment

### Phase 1: Database Migration (Day 1)

#### 1.1 Apply Migration
```bash
cd /Users/davioliveeira/py/drink-wizard-ops
supabase db push
```

**What this does**:
- Creates `automation_triggers` table
- Sets up RLS policies (admin-only)
- Creates performance indexes
- Adds `client_phone` column to events table (if missing)
- Creates timestamp update trigger

**Expected output**:
```
Applying migration 20260206000000_automation_triggers.sql...
✓ Migration applied successfully
```

#### 1.2 Verify Migration
```bash
supabase db pull  # Verify schema matches
```

Or check via Supabase Dashboard:
- SQL Editor → Run: `SELECT * FROM public.automation_triggers;` (should be empty)
- Check events table for client_phone column

### Phase 2: Environment Variables (Day 1)

#### 2.1 Get Z-API Credentials

From Z-API dashboard:
1. Instance ID: `your-instance-id`
2. Token: `your-api-token`

#### 2.2 Set in Supabase Dashboard

1. Go to **Functions → Configuration**
2. Click **Environment Variables**
3. Add two variables:
   ```
   UAZAPI_INSTANCE = your-instance-id
   UAZAPI_TOKEN = your-api-token
   ```
4. Click **Save**

**Note**: Supabase automatically provides:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Phase 3: Deploy Edge Functions (Day 1)

#### 3.1 Deploy whatsapp-notify
```bash
supabase functions deploy whatsapp-notify
```

**Expected output**:
```
✓ Function 'whatsapp-notify' deployed successfully
  Endpoint: https://your-project.supabase.co/functions/v1/whatsapp-notify
```

#### 3.2 Deploy handle-automation
```bash
supabase functions deploy handle-automation
```

**Expected output**:
```
✓ Function 'handle-automation' deployed successfully
  Endpoint: https://your-project.supabase.co/functions/v1/handle-automation
```

#### 3.3 Verify Functions
```bash
# List deployed functions
supabase functions list

# Check logs (real-time)
supabase functions get-logs handle-automation
supabase functions get-logs whatsapp-notify
```

### Phase 4: Create Database Webhooks (Day 2)

**Via Supabase Dashboard**:

#### 4.1 Webhook 1: Checklist Completion

1. Go to **Database → Webhooks**
2. Click **+ Create a webhook**
3. Configure:
   - **Name**: `on-checklist-completed`
   - **Table**: `event_checklists`
   - **Events**: Check `UPDATE` only
   - **Webhook URL**: Copy from Function details
   - **Function**: `handle-automation`
4. Click **Create**

#### 4.2 Webhook 2: Event Creation

1. Click **+ Create a webhook**
2. Configure:
   - **Name**: `on-event-created`
   - **Table**: `events`
   - **Events**: Check `INSERT` only
   - **Webhook URL**: Copy from Function details
   - **Function**: `handle-automation`
3. Click **Create**

**Expected state**:
- Both webhooks appear in the list as "Enabled"
- Green checkmarks next to each

### Phase 5: Test in Staging (Day 2)

#### 5.1 Test whatsapp-notify Directly
```bash
# Use test_mode=true to avoid sending real messages
curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "phone": "5511999999999",
    "message": "Test message from automation system",
    "test_mode": true
  }'
```

**Expected response**:
```json
{
  "status": "test",
  "message": "[TEST MODE] Message would be sent to 5511999999999",
  "messageId": "test-1707249817000",
  "timestamp": "2026-02-06T17:43:37.000Z"
}
```

#### 5.2 Create Test Automation in Database
```sql
INSERT INTO public.automation_triggers (
  created_by,
  name,
  description,
  active,
  trigger_event,
  action_type,
  action_config,
  trigger_conditions
) VALUES (
  auth.uid(), -- Your user ID
  'Test: Checklist Completion',
  'Test automation for staging',
  true,
  'checklist_entrada',
  'whatsapp',
  jsonb_build_object(
    'message', 'Olá {cliente}, seu checklist de entrada foi concluído em {local} no dia {data}!',
    'test_mode', true,
    'delay_seconds', 0
  ),
  null
);
```

#### 5.3 Trigger the Automation
```sql
-- Create test event with client_phone
INSERT INTO public.events (client_name, client_phone, date, location)
VALUES ('Test Client', '5511999999999', now(), 'Test Location')
RETURNING id;

-- Use the returned event ID in next command

-- Create test checklist and mark as completed
-- This will trigger the webhook which will call handle-automation
INSERT INTO public.event_checklists (event_id, type, status)
VALUES ('YOUR_EVENT_ID', 'entrada', 'completed');

-- Note: You may need to UPDATE instead if the row already exists
UPDATE public.event_checklists
SET status = 'completed'
WHERE event_id = 'YOUR_EVENT_ID' AND type = 'entrada';
```

#### 5.4 Check Logs
```bash
# View whatsapp-notify logs
supabase functions get-logs whatsapp-notify --tail

# View handle-automation logs
supabase functions get-logs handle-automation --tail
```

**Look for**:
- `[WhatsApp] Sending to...` (test mode entry)
- `[Automation] Matched trigger event: checklist_entrada`
- `[Automation] Successfully sent` (or test status)

### Phase 6: Production Deployment (Day 3)

#### 6.1 Pre-Flight Checks
```bash
# 1. Verify Edge Functions are deployed
supabase functions list

# 2. Check environment variables are set
# (Go to Dashboard → Functions → Configuration)

# 3. Verify webhooks are enabled
# (Go to Dashboard → Database → Webhooks)

# 4. Test with real phone (but test_mode=true still)
curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "phone": "+55 11 98765-4321",
    "message": "Production test message",
    "test_mode": true
  }'
```

#### 6.2 Create Production Automations
```sql
-- Example 1: Checklist Completion Confirmation
INSERT INTO public.automation_triggers (
  created_by,
  name,
  active,
  trigger_event,
  action_type,
  action_config
) VALUES (
  auth.uid(),
  'Agradecimento Pós-Checklist de Entrada',
  true,
  'checklist_entrada',
  'whatsapp',
  jsonb_build_object(
    'message', 'Olá {cliente}, seu checklist de entrada foi concluído! Estamos prontos para {local} em {data}.',
    'test_mode', false,
    'delay_seconds', 0
  )
);

-- Example 2: Checklist Saída (Exit)
INSERT INTO public.automation_triggers (
  created_by,
  name,
  active,
  trigger_event,
  action_type,
  action_config
) VALUES (
  auth.uid(),
  'Confirmação de Encerramento',
  true,
  'checklist_saida',
  'whatsapp',
  jsonb_build_object(
    'message', 'Obrigado {cliente}! O evento em {local} foi finalizado. Até a próxima!',
    'test_mode', false
  )
);

-- Example 3: Event Created (New Event Notification)
INSERT INTO public.automation_triggers (
  created_by,
  name,
  active,
  trigger_event,
  action_type,
  action_config
) VALUES (
  auth.uid(),
  'Novo Evento Agendado',
  true,
  'event_created',
  'whatsapp',
  jsonb_build_object(
    'message', 'Novo evento agendado: {cliente} em {local} no dia {data}',
    'test_mode', false
  )
);
```

#### 6.3 Monitor First 24 Hours
```bash
# Keep logs open and monitor
supabase functions get-logs handle-automation --tail
supabase functions get-logs whatsapp-notify --tail

# Check metrics
# SELECT id, name, trigger_count, last_triggered_at
# FROM automation_triggers
# ORDER BY last_triggered_at DESC;
```

**Watch for**:
- Successful message deliveries
- Error patterns
- Performance metrics
- Z-API quota usage

### Phase 7: Scale Up (Days 4+)

Once stable for 24 hours:

1. **Enable more automations**: Create additional triggers as needed
2. **Monitor Z-API quotas**: Check usage and limits
3. **Set up alerting**: Create notifications for failed sends
4. **Performance tuning**: Adjust if needed

## Rollback Procedure

If critical issues occur:

### Quick Disable
```sql
-- Disable all automations immediately
UPDATE public.automation_triggers SET active = false;
```

### Disable Webhooks
1. Go to Dashboard → Database → Webhooks
2. Click each webhook and click "Disable"

### Revert Edge Functions
```bash
# Redeploy previous version (if available)
# Contact Supabase support for version rollback
```

### Recovery Steps
1. Disable webhooks (prevent triggers)
2. Disable all automations (UPDATE SET active = false)
3. Check logs to identify issue
4. Fix code/configuration
5. Re-enable and test before scaling

## Troubleshooting

### Edge Functions Not Triggering

**Check**:
1. Webhooks enabled? Dashboard → Database → Webhooks
2. Webhook URLs correct?
3. Function deployments successful? `supabase functions list`
4. Function logs for errors? `supabase functions get-logs handle-automation`

**Test**:
```bash
# Manually call handle-automation
curl -X POST https://your-project.supabase.co/functions/v1/handle-automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "UPDATE",
    "table": "event_checklists",
    "record": {
      "id": "test-id",
      "event_id": "event-uuid",
      "type": "entrada",
      "status": "completed"
    }
  }'
```

### Messages Not Sending

**Check**:
1. Z-API credentials correct?
2. Phone format valid? (10+ digits, numeric)
3. Test mode disabled for production? (`test_mode: false`)
4. Z-API quota available?
5. Function logs: `supabase functions get-logs whatsapp-notify`

**Test directly**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "phone": "5511999999999",
    "message": "Direct test",
    "test_mode": false
  }'
```

### Variables Not Substituting

**Check**:
1. Variable names correct? (`{cliente}`, `{data}`, etc.)
2. Data available in context? (client_phone in events table?)
3. Function logs show substitution?

**Verify**:
```sql
-- Check automation message template
SELECT id, name, action_config->>'message' as template
FROM automation_triggers;
```

## Environment Variable Checklist

- [ ] UAZAPI_INSTANCE set in Functions Configuration
- [ ] UAZAPI_TOKEN set in Functions Configuration
- [ ] SUPABASE_URL available (auto)
- [ ] SUPABASE_SERVICE_ROLE_KEY available (auto)

## Webhook Configuration Checklist

- [ ] Webhook 1: event_checklists, UPDATE, handle-automation
- [ ] Webhook 2: events, INSERT, handle-automation
- [ ] Both webhooks showing "Enabled"
- [ ] Function endpoints configured correctly

## Final Verification

```bash
# 1. Database ready
supabase db list  # Should show automation_triggers

# 2. Functions deployed
supabase functions list  # Should show whatsapp-notify, handle-automation

# 3. Environment variables
# (Check in Dashboard → Functions → Configuration)

# 4. Webhooks enabled
# (Check in Dashboard → Database → Webhooks)

# 5. Can send test message
curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-notify \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Test", "test_mode": true}'

# 6. Logs accessible
supabase functions get-logs whatsapp-notify

# All green? You're ready!
```

## Support & Debugging

For issues, provide:
1. **Recent logs** from Edge Functions
2. **Automation configuration** (automation_triggers record)
3. **Webhook configuration** (screenshot from Dashboard)
4. **Error messages** from responses
5. **Environment variables** (without secrets)

---

**Version**: 1.0
**Last Updated**: February 6, 2026
**Status**: Production-Ready
