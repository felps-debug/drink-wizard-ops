import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  record: Record<string, any>;
  old_record?: Record<string, any>;
  event_type?: string; // HTTP Parameter from webhook config
}

interface AutomationTrigger {
  id: string;
  name: string;
  active: boolean;
  trigger_event: string;
  action_type: string;
  action_config: {
    message: string;
    phone_source?: string;
    delay_seconds?: number;
    max_retries?: number;
    test_mode?: boolean;
  };
  trigger_count?: number;
  last_triggered_at?: string;
}

/**
 * Variable substitution engine
 * Replaces {variable} placeholders with actual values from the data context
 */
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
  if (data.event_date) {
    const formattedDate = new Date(data.event_date).toLocaleDateString("pt-BR");
    result = result.replace(/{data}/g, formattedDate);
    result = result.replace(/{date}/g, formattedDate);
  } else {
    result = result.replace(/{data}/g, "");
    result = result.replace(/{date}/g, "");
  }

  result = result.replace(/{local}/g, data.event_location || "");
  result = result.replace(/{location}/g, data.event_location || "");
  result = result.replace(/{event_name}/g, data.event_name || "");

  // Staff variables
  result = result.replace(/{nome}/g, data.staff_name || "");
  result = result.replace(/{nome_staff}/g, data.staff_name || "");
  result = result.replace(/{staff_role}/g, data.staff_role || "");

  // Custom variables - any remaining {key} patterns
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" || typeof value === "number") {
      result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
    }
  }

  return result;
}

/**
 * Send WhatsApp message directly via UAZapi
 * This bypasses the whatsapp-notify Edge Function to avoid JWT issues
 */
async function sendWhatsAppMessage(
  supabaseUrl: string,
  serviceRoleKey: string,
  phone: string,
  message: string,
  testMode: boolean
): Promise<{ status: string; messageId?: string; message: string }> {
  const UAZAPI_URL = Deno.env.get("UAZAPI_URL") || "https://nexus-ultra.uazapi.com";
  const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN");

  // Normalize phone number (add 55 if needed)
  const cleaned = phone.replace(/\D/g, "");
  const normalized = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;

  // Test mode
  if (testMode) {
    console.log(`[WhatsApp TEST] Would send to ${normalized}: ${message.substring(0, 100)}`);
    return {
      status: "test",
      messageId: "test-" + Date.now(),
      message: `[TEST MODE] Message would be sent to ${normalized}`
    };
  }

  if (!UAZAPI_TOKEN) {
    console.error("[WhatsApp] Missing UAZAPI_TOKEN");
    return {
      status: "error",
      message: "Missing UAZAPI_TOKEN environment variable"
    };
  }

  console.log(`[WhatsApp] Calling UAZapi directly: ${UAZAPI_URL}/send/text`);
  console.log(`[WhatsApp] Sending to: ${normalized}`);

  try {
    const response = await fetch(
      `${UAZAPI_URL}/send/text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": UAZAPI_TOKEN
        },
        body: JSON.stringify({
          number: normalized,
          text: message
        })
      }
    );

    const data = await response.json();
    console.log(`[WhatsApp] UAZapi response:`, data);

    if (response.ok) {
      return {
        status: "success",
        messageId: data.id || data.messageId || "sent",
        message: "Message sent successfully"
      };
    } else {
      return {
        status: "error",
        message: data.message || data.error || "Failed to send message"
      };
    }
  } catch (error) {
    console.error("[WhatsApp] Exception:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

serve(async (req) => {
  try {
    const payload = await req.json() as WebhookPayload;
    console.log(`[Automation] Webhook received: table=${payload.table}, type=${payload.type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const record = payload.record;

    if (!record) {
      console.log("[Automation] No record in payload");
      return new Response(JSON.stringify({ message: "No record" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map webhook events to automation trigger events
    let triggerEvent = "";

    // Priority 1: Use event_type HTTP Parameter if provided (from webhook config)
    if (payload.event_type) {
      // Map HTTP Parameter values to trigger event names
      if (payload.event_type === "entrada" || payload.event_type === "inicial") {
        triggerEvent = "checklist_entrada";
      } else if (payload.event_type === "saida") {
        triggerEvent = "checklist_saida";
      } else if (payload.event_type === "event_created") {
        triggerEvent = "event_created";
      }
      console.log(`[Automation] Using event_type parameter: ${payload.event_type} -> ${triggerEvent}`);
    }
    // Priority 2: Fallback to legacy table/type detection
    else if (payload.table === "event_checklists") {
      // Trigger on checklist completion
      if (record.status === "completed") {
        if (record.type === "entrada" || record.type === "inicial") {
          triggerEvent = "checklist_entrada";
        } else if (record.type === "saida") {
          triggerEvent = "checklist_saida";
        }
      }
      console.log(`[Automation] Using legacy detection: table=${payload.table}, record.type=${record.type} -> ${triggerEvent}`);
    } else if (payload.table === "events" && payload.type === "INSERT") {
      // Trigger on event creation
      triggerEvent = "event_created";
      console.log(`[Automation] Using legacy detection: new event created -> ${triggerEvent}`);
    }

    if (!triggerEvent) {
      console.log(`[Automation] No matching trigger for: table=${payload.table}, type=${payload.type}, event_type=${payload.event_type}`);
      return new Response(JSON.stringify({ message: "No matching trigger" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[Automation] Matched trigger event: ${triggerEvent}`);

    // Fetch matching automation triggers
    const { data: automations, error } = await supabase
      .from("automation_triggers")
      .select("*")
      .eq("active", true)
      .eq("trigger_event", triggerEvent);

    if (error) {
      throw new Error(`Failed to fetch automations: ${error.message}`);
    }

    if (!automations || automations.length === 0) {
      console.log(`[Automation] No active automations for trigger: ${triggerEvent}`);
      return new Response(JSON.stringify({ message: "No matching automations" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[Automation] Found ${automations.length} matching automation(s)`);

    // Execute each automation
    const results: any[] = [];

    for (const automation of automations) {
      try {
        const messageTemplate = automation.action_config?.message;
        if (!messageTemplate) {
          console.warn(`[Automation] No message template for automation: ${automation.id}`);
          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: "error",
            reason: "No message template"
          });
          continue;
        }

        // Build substitution data with webhook record
        let substitutionData = { ...record };

        // If this is a checklist event, fetch the associated event details
        if (record.event_id) {
          console.log(`[Automation] Fetching event details for: ${record.event_id}`);
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("client_name, client_phone, date, location")
            .eq("id", record.event_id)
            .single();

          if (eventError) {
            console.warn(`[Automation] Failed to fetch event: ${eventError.message}`);
          } else if (eventData) {
            substitutionData = {
              ...substitutionData,
              client_name: eventData.client_name,
              client_phone: eventData.client_phone,
              event_date: eventData.date,
              event_location: eventData.location
            };
          }
        }

        // Perform variable substitution
        const message = substituteVariables(messageTemplate, substitutionData);
        console.log(`[Automation] Substituted message: ${message.substring(0, 80)}...`);

        // Determine phone number
        const phone = substitutionData.client_phone || substitutionData.phone;

        if (!phone) {
          console.warn(`[Automation] No phone number available for automation: ${automation.id}`);
          results.push({
            automation_id: automation.id,
            automation_name: automation.name,
            status: "error",
            reason: "No phone number available"
          });
          continue;
        }

        // Send WhatsApp message
        console.log(`[Automation] Sending WhatsApp to ${phone}`);
        const whatsappResponse = await sendWhatsAppMessage(
          supabaseUrl,
          serviceRoleKey,
          phone,
          message,
          automation.action_config?.test_mode || false
        );

        console.log(`[Automation] WhatsApp response: ${whatsappResponse.status}`);

        // Update trigger statistics
        await supabase
          .from("automation_triggers")
          .update({
            trigger_count: (automation.trigger_count || 0) + 1,
            last_triggered_at: new Date().toISOString()
          })
          .eq("id", automation.id);

        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          status: whatsappResponse.status,
          messageId: whatsappResponse.messageId,
          message: whatsappResponse.message
        });

      } catch (automationError) {
        console.error(`[Automation] Error processing automation:`, automationError);
        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          status: "error",
          reason: automationError instanceof Error ? automationError.message : String(automationError)
        });
      }
    }

    console.log(`[Automation] Completed with ${results.length} result(s)`);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[Automation] Fatal error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({
      error: "Failed to process automation",
      message: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
