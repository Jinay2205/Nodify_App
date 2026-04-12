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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get the contact's profile data (School, Interests, etc.)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single()

    if (contactError) throw contactError;

    // 2. Get their last 3 interactions (if any exist)
    const { data: interactions } = await supabase
      .from('interactions')
      .select('notes')
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false })
      .limit(3)

    // 3. Format the data for the AI
    const historyText = interactions && interactions.length > 0
      ? interactions.map(i => `- ${i.notes}`).join('\n')
      : "No previous interaction history."

    const contactProfile = `
      Name: ${contact.name}
      School: ${contact.school || 'Not specified'}
      Education Level: ${contact.education_level || 'Not specified'}
      Primary Interest: ${contact.primary_interest || 'Not specified'}
      Specializations: ${contact.specializations ? contact.specializations.join(', ') : 'Not specified'}
    `

    // 4. Send to Groq
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Keep using the fast model you verified works!
        messages: [
          { 
            role: "system", 
            content: `You are an expert executive assistant drafting a short, casual check-in email to a contact.
            You have two pieces of context: Past Interaction History, and Contact Profile.
            
            - If Interaction History exists, write a draft referencing those specific past conversations.
            - If Interaction History is empty, DO NOT mention the lack of history. Instead, use the Contact Profile to ask an insightful question about their school, primary interest, or specializations.
            
            Keep the email strictly under 4 sentences. Tone is warm, professional, and concise. Do NOT include a subject line or placeholders like [Your Name], just the raw email body.` 
          },
          { role: "user", content: `Contact Profile:\n${contactProfile}\n\nInteraction History:\n${historyText}` }
        ],
        temperature: 0.7
      })
    });

    const groqData = await groqRes.json();
    const draft = groqData.choices[0].message.content.trim();

    return new Response(JSON.stringify({ draft }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("DRAFT ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})