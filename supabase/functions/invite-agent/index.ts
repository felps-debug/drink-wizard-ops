import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, role, full_name } = await req.json()

        // 1. Send invite email via Supabase Auth
        // This creates a user in auth.users and sends an email with a magic link
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name,
                role: role // This will be used by the handle_new_user trigger
            },
            redirectTo: `${req.headers.get('origin')}/profile`
        })

        if (error) throw error

        return new Response(
            JSON.stringify({ message: 'Invitation sent successfully', user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
