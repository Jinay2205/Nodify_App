import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, contact_id, notes, interaction_type } = await req.json()

    // 1. Ask Groq for STRICT JSON
    let structuredSummary = null;
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (groqApiKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }, // ✨ THE MAGIC SAUCE
            messages: [
              { 
                role: "system", 
                content: `You are an executive relationship manager. Analyze these meeting notes and extract the data into this EXACT JSON structure:
                {
                  "tl_dr": "A single sentence summary of the core business or mentorship discussion.",
                  "action_items": ["Task 1", "Task 2"],
                  "personal_context": "CRITICAL: Extract ANY background details, including education (schools/majors), past career history, media consumption (podcasts/books/news), hobbies, or family details."
                }
                CRITICAL RULES:
                - If a category has no relevant data, return an empty array [] or null. 
                - Err on the side of extracting career/education background into personal_context rather than leaving it null.
                - Do NOT hallucinate or invent filler text.`
              },
              { role: "user", content: notes }
            ],
            temperature: 0.3 
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          // Parse the stringified JSON from the AI into a real JavaScript object
          structuredSummary = JSON.parse(groqData.choices[0].message.content);
        } else {
          console.error("Groq API error:", await groqRes.text());
        }
      } catch (groqError) {
        console.error("Groq Fetch Error:", groqError);
      }
    }

    // 2. Generate the native vector embedding on the RAW NOTES (for perfect search)
    // @ts-ignore
    const session = new Supabase.ai.Session('gte-small');
    const output = await session.run(notes, { mean_pool: true, normalize: true });
    const embedding = Array.from(output);

    // 3. Connect to Database using Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Save BOTH to the database
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        user_id, 
        contact_id,
        notes: notes, // Save the raw, messy brain-dump forever
        ai_summary: structuredSummary, // Save the clean JSON for your UI dashboard
        interaction_type,
        embedding
      })
      .select()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("EMBEDDING ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})