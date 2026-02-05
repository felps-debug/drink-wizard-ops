# Deployment Guide - Automation Module

## Prerequisites
- Supabase CLI installed (`brew install supabase/tap/supabase`)
- Supabase project linked (`supabase link --project-ref <your-project-ref>`)
- ZAPI credentials (Instance ID and Token)

## Step 1: Apply Database Migration

```bash
cd /Users/davioliveeira/py/drink-wizard-ops
supabase db push
```

This will create the `automations` table in your Supabase database.

## Step 2: Deploy Edge Function

```bash
supabase functions deploy handle-automation
```

## Step 3: Configure Environment Variables

Set the ZAPI credentials as secrets:

```bash
supabase secrets set ZAPI_INSTANCE=<your-instance-id>
supabase secrets set ZAPI_TOKEN=<your-token>
```

## Step 4: Configure Database Webhook (Optional)

If you want events to automatically trigger the function:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - **Name**: `automation-trigger`
   - **Table**: `events`
   - **Events**: `INSERT`, `UPDATE`
   - **HTTP Request URL**: `https://<project-ref>.supabase.co/functions/v1/handle-automation`
   - **HTTP Headers**: 
     ```json
     {
       "Authorization": "Bearer <your-anon-key>"
     }
     ```

## Manual Testing

You can test the automation manually:

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/handle-automation \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "record": {
      "client_name": "João Silva",
      "date": "2026-03-15",
      "location": "Clube do Morumbi"
    }
  }'
```

## Notes

- The Edge Function currently uses a placeholder phone number (`5511999999999`)
- To use real client phones, add a `client_phone` column to the `events` table
- Templates support variables: `{client_name}`, `{date}`, `{location}`
