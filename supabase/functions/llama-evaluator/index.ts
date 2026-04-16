import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    
    const { originalQuery, profiles } = await req.json();

    const simplifiedProfiles = profiles.map((p: any, idx: number) => ({
      id: idx,
      name: p.name,
      role: p.role,
      company: p.company
    }));

    const systemPrompt = `You are an expert networking strategist. The user's goal is: "${originalQuery}". 
    I will provide a JSON list of scouted profiles. For each profile, write exactly ONE compelling sentence explaining the unique strategic value of connecting with them. 
    
    RULES:
    - Focus on specific details from their title or background (e.g., if they share an alma mater, or have a highly specialized role).
    - DO NOT start with generic phrases like "You should connect with..." or "[Name] offers..."
    - Write it like an insider tip (e.g., "As a Rice alum leading Azure GTM strategy, Laz is the perfect bridge between your network and Microsoft's sales org.")
    
    You MUST return ONLY a valid JSON object with a single key called "reasons", which contains an array of strings in the exact same order as the profiles provided.`;
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(simplifiedProfiles) }
        ],
        temperature: 0.3,
        // 🚀 FIX 1: Force Groq to return clean, parseable JSON
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();
    
    // 🚀 FIX 2: Correctly extract the "reasons" array from Llama's object
    const parsedData = JSON.parse(data.choices[0].message.content);

    // Return it in the exact format the React frontend expects
    return new Response(JSON.stringify({ reasons: parsedData.reasons }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Evaluator Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})