import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const UAZAPI_URL = Deno.env.get("UAZAPI_URL") || "https://nexus-ultra.uazapi.com";
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

/**
 * Validates phone number format (Brazilian format)
 * Accepts: 11999999999, 5511999999999, +55 11 99999999, etc.
 */
function validatePhone(phone: string): { valid: boolean; cleaned: string } {
  if (!phone) {
    return { valid: false, cleaned: "" };
  }

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Must be at least 10 digits (area code + number)
  if (cleaned.length < 10) {
    return { valid: false, cleaned: "" };
  }

  // If starts with 55 (Brazil country code), allow
  // If doesn't start with 55, assume it's a local number and add 55
  const normalized = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;

  return { valid: true, cleaned: normalized };
}

/**
 * Send WhatsApp message via UAZapi
 * Note: This function is designed to be called internally by handle-automation
 * It does not require JWT authentication
 */
serve(async (req) => {
  // Allow CORS for internal calls
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { phone, message, test_mode } = await req.json() as WhatsAppRequest;

    console.log(`[WhatsApp] Request received - test_mode: ${test_mode}`);

    // Validation
    if (!phone) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing phone number",
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing message",
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate phone format
    const { valid, cleaned } = validatePhone(phone);
    if (!valid) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: `Invalid phone number format. Expected Brazilian format (10+ digits). Got: ${phone}`,
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Test mode: return mock response without sending
    if (test_mode) {
      console.log(`[WhatsApp TEST MODE] Would send to ${cleaned}: ${message.substring(0, 100)}...`);
      return new Response(
        JSON.stringify({
          status: "test",
          message: `[TEST MODE] Message would be sent to ${cleaned}`,
          messageId: "test-" + Date.now(),
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify environment variables are set
    if (!UAZAPI_TOKEN) {
      console.error("[WhatsApp] Missing UAZAPI_TOKEN");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "WhatsApp service not properly configured - missing token",
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[WhatsApp] Sending to ${cleaned}: ${message.substring(0, 50)}...`);
    console.log(`[WhatsApp] Using UAZapi URL: ${UAZAPI_URL}`);

    // Call UAZapi endpoint
    const uazapiResponse = await fetch(
      `${UAZAPI_URL}/send/text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": UAZAPI_TOKEN
        },
        body: JSON.stringify({
          number: cleaned,
          text: message
        })
      }
    );

    const responseData = await uazapiResponse.json();

    if (uazapiResponse.ok) {
      const messageId = responseData.messageId || responseData.key?.id || "sent";
      console.log(`[WhatsApp] Successfully sent message: ${messageId}`);

      return new Response(
        JSON.stringify({
          status: "success",
          messageId: messageId,
          message: "Message sent successfully",
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.error("[WhatsApp] API error:", responseData);
      return new Response(
        JSON.stringify({
          status: "error",
          message: responseData.message || "Failed to send message via WhatsApp",
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[WhatsApp] Exception:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: `Internal error: ${errorMessage}`,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
