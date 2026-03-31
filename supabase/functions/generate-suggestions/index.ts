import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { contact_id } = await req.json()

    // 1. Connect to Database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch history
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('notes, interaction_type, created_at')
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!interactions || interactions.length === 0) {
      return new Response(JSON.stringify({ suggestions: ["Not enough history to generate suggestions yet! Log some notes first."] }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
      });
    }

    const historyText = interactions.map(i => `[${i.interaction_type}]: ${i.notes}`).join('\n\n');

    // 3. Setup GROQ
    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) throw new Error("Missing GROQ_API_KEY");

    // 4. The God-Tier System Prompt (using backticks for multi-line formatting)
    const systemPrompt = `You are an elite Chief of Staff and executive relationship manager. Your job is to read the user's rough meeting notes and generate 3 hyper-personalized, high-leverage follow-up angles or icebreakers for their next interaction.

    RULES FOR GENERATION:
    1. BAN THE CRINGE: No corporate speak, no robotic enthusiasm, no 'I hope this finds you well', no 'delve'. Write like a smart, busy professional messaging a highly respected peer.
    2. ACTION ITEM PRIORITY: Scour the notes for pending action items, promises made, or deadlines (e.g., sending a blurb, reviewing code, making an intro). If one exists, ONE of your suggestions MUST be the execution of that item (e.g., "Here is that blurb for the PM...").
    3. NO AMNESIA: Do not ask them about something if the notes say YOU were supposed to do it. 
    4. DIVERSE ANGLES: Provide 3 distinctly different 1-to-2 sentence approaches:
       - Angle 1: Execution of a pending action item or deadline mentioned in the notes.
       - Angle 2: A value-add approach (e.g., 'Saw this article/project and thought of your work on X').
       - Angle 3: A low-friction, casual check-in based on a specific project or personal detail they mentioned.

Return ONLY a raw JSON object with a single key 'suggestions' containing an array of 3 strings. Do not include markdown formatting or any other text.`;

    // 5. Ask Groq (Upgraded to Llama 3.3 70B for the absolute best reasoning)
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is our past interaction history:\n${historyText}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    const aiData = await aiResponse.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const result = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ suggestions: result.suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("GENERATION ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})