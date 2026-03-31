import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. ADDED user_id HERE to catch it from React
    const { user_id, contact_id, notes, interaction_type } = await req.json()

    // 2. Generate the native vector embedding
    // @ts-ignore
    const session = new Supabase.ai.Session('gte-small');
    const output = await session.run(notes, { mean_pool: true, normalize: true });
    const embedding = Array.from(output);

    // 3. Connect to Database using Service Role (God Mode for MVP)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Save everything to the database
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        user_id, // <-- ADDED user_id HERE to save it to the database
        contact_id,
        notes,
        interaction_type,
        embedding
      })
      .select()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("EMBEDDING ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})