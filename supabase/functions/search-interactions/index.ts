import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { search_query, user_id } = await req.json()

    console.log("1. Generating embedding for search query...");
    // @ts-ignore
    const session = new Supabase.ai.Session('gte-small');
    const output = await session.run(search_query, { mean_pool: true, normalize: true });
    const query_embedding = Array.from(output);

    console.log("2. Connecting to Database...");
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("3. Performing Semantic Search...");
    const { data, error } = await supabase.rpc('match_interactions', {
      query_embedding,
      match_threshold: 0.1, 
      match_count: 5, 
      p_user_id: user_id 
    });

    if (error) throw error;

    console.log("4. SUCCESS! Found matches.");
    return new Response(JSON.stringify({ results: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("SEARCH ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})