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

    // 1. Intercept with Groq (Llama 3 8B) to generate a summary
    let summarizedNotes = notes; // Default to raw notes just in case
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
            model: "llama-3.3-70b-versatile", // Using your preferred fast 8B model
            messages: [
              { 
                role: "system", 
                content: "You are an executive assistant. Summarize the following meeting notes into 1 to 3 concise bullet points, depending on the length and detail of the input. For very short notes or single sentences, a single bullet point is perfect. Output ONLY the bullet points using standard markdown dashes (-). Do not include any introductory or concluding text." 
              },
              { role: "user", content: notes }
            ],
            temperature: 0.3
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          summarizedNotes = groqData.choices[0].message.content.trim();
        } else {
          console.error("Groq API returned an error, falling back to raw notes.");
        }
      } catch (groqError) {
        console.error("Groq Fetch Error:", groqError);
      }
    }

    // 2. Generate the native vector embedding on the SUMMARY, not the raw text
    // @ts-ignore
    const session = new Supabase.ai.Session('gte-small');
    const output = await session.run(summarizedNotes, { mean_pool: true, normalize: true });
    const embedding = Array.from(output);

    // 3. Connect to Database using Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Save the SUMMARY and the embedding to the database
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        user_id, 
        contact_id,
        notes: summarizedNotes, // <-- Saving the clean bullet points!
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