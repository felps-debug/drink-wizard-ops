import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, role, full_name } = await req.json();

        if (!email || !role || !full_name) {
            return new Response(
                JSON.stringify({ error: "email, role and full_name are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );

        let userId: string;

        if (existingUser) {
            userId = existingUser.id;
            console.log(`[invite-agent] User already exists: ${userId}`);
        } else {
            // 2. Create auth user with temporary password
            const tempPassword = crypto.randomUUID().slice(0, 16);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name }
            });

            if (createError) {
                console.error("[invite-agent] Error creating user:", createError);
                return new Response(
                    JSON.stringify({ error: createError.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            userId = newUser.user.id;
            console.log(`[invite-agent] Created new user: ${userId}`);
        }

        // 3. Upsert profile with correct role
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: userId,
                nome: full_name,
                cargo: role,
                roles: [role],
            }, { onConflict: "id" });

        if (profileError) {
            console.error("[invite-agent] Profile upsert error:", profileError);
        }

        // 4. Link to magodosdrinks_staff if there's a matching email
        const { data: staffRecords } = await supabaseAdmin
            .from("magodosdrinks_staff")
            .select("id")
            .eq("email", email.toLowerCase())
            .is("user_id", null);

        if (staffRecords && staffRecords.length > 0) {
            await supabaseAdmin
                .from("magodosdrinks_staff")
                .update({ user_id: userId, status: "active" })
                .eq("id", staffRecords[0].id);
            console.log(`[invite-agent] Linked staff record ${staffRecords[0].id} to user ${userId}`);
        }

        return new Response(
            JSON.stringify({ success: true, userId }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("[invite-agent] Unexpected error:", err);
        return new Response(
            JSON.stringify({ error: (err as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
