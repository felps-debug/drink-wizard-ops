import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const ZAPI_INSTANCE = Deno.env.get("ZAPI_INSTANCE");
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");

if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
  console.error("Missing ZAPI credentials");
}

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook received:", payload);

    // Only process inserts or specific updates
    const record = payload.record;
    if (!record) return new Response("No record", { status: 200 });

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch matching automations
    const { data: automations, error } = await supabaseClient
      .from("automations")
      .select("*")
      .eq("active", true)
      .eq("trigger_event", payload.type === "INSERT" ? "event_created" : "event_updated");

    if (error) throw error;
    if (!automations || automations.length === 0) {
      return new Response("No matching automations", { status: 200 });
    }

    // 2. Process each automation
    const results = [];
    for (const automation of automations) {
      if (automation.action_type === "whatsapp_message") {
        const messageTemplate = automation.action_config.message;

        // Simple variable substitution
        const message = messageTemplate
          .replace("{client_name}", record.client_name || "")
          .replace("{date}", new Date(record.date).toLocaleDateString("pt-BR") || "")
          .replace("{location}", record.location || "");

        // Determine destination phone (Logic placeholder)
        // Ideally, 'events' table should have 'client_phone'.
        // For now, we use a hardcoded fallback or environment var for testing.
        const phone = "5511999999999"; // TODO: Get from record.client_phone

        console.log(`Sending WhatsApp to ${phone}: ${message}`);

        // Call ZAPI
        const zapiResponse = await fetch(
          `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, message }),
          }
        );

        results.push({ automation: automation.name, status: zapiResponse.status });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
