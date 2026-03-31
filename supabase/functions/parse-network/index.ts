import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ✨ NEW: We now accept a "source" flag from the frontend!
    const { raw_text, user_id, source = "csv" } = await req.json()

    console.log(`1. Processing ${source} data with Groq LLM...`);
    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) throw new Error("Missing Groq API Key");
    
    // ✨ THE LOGIC FORK: Choose the exact right prompt based on the source
    let systemPrompt = "";

    if (source === "linkedin") {
      // YOUR ORIGINAL, STRICT, SINGLE-PROFILE PROMPT
      systemPrompt = `You are a strict data extraction API. Extract ONLY THE PRIMARY SUBJECT of the following LinkedIn profile text. 
      IGNORE any other people mentioned in "People also viewed", recommendations, or sidebars. 
      Return ONLY a valid JSON array containing EXACTLY ONE object representing the main profile owner. 
      Do NOT include markdown formatting, backticks, or the word 'json'.
      
      STRICT CATEGORIZATION RULES:
      You must classify each person's career into ONE Primary Interest from the list below, and up to 3 Specializations strictly from that exact category's sub-list. Do NOT invent your own categories.
      
      1. "Business & Finance" (Specializations: Corporate Finance, Investment & Asset Management, Advisory, Private Markets, Commercial Banking, FinTech, Still exploring)
      2. "Technology" (Specializations: Software Engineering, Product Management, AI / Machine Learning, Data / Analytics, Cybersecurity, Hardware / Systems, Still exploring)
      3. "Consulting & Strategy" (Specializations: Strategy Consulting, Operations Consulting, Economic / Policy Consulting, Corporate Strategy, Independent / Boutique Consulting, Still exploring)
      4. "Startups & Entrepreneurship" (Specializations: Founder / Co-founder, Early-stage startup roles, Growth / GTM, Venture building, Startup operations, Still exploring)
      5. "Research & Academia" (Specializations: Academic Research, Applied Research, PhD Track, Think Tanks, Lab / Technical Research, Still exploring)
      6. "Healthcare & Life Sciences" (Specializations: Clinical, Biotech, HealthTech, Public Health, Pharma, Still exploring)
      7. "Policy, Government & Law" (Specializations: Public Policy, Government roles, Law, International Affairs, Regulatory / Compliance, Still exploring)
      8. "Creative & Media" (Specializations: Film / TV, Journalism, Marketing / Branding, Design, Music / Entertainment, Content Creation, Still exploring)
      9. "Social Impact & Nonprofit" (Specializations: NGO / Nonprofit roles, Social Enterprise, Philanthropy, Impact Investing, Community Organizing, Still exploring)
      
      Each object must have these exact keys:
      - name (string)
      - school (string, or null if unknown)
      - education_level (string, or null if unknown)
      - primary_interest (string, exactly matching ONE of the 9 parent categories above, or null if completely unknown)
      - specializations (array of strings, maximum of 3, strictly matching the sub-options of their chosen primary_interest)
      - warmth_level (string, strictly "warm", "neutral", or "cool" - default to "neutral")`;
    } else {
      // THE BULK CSV PROMPT
      systemPrompt = `You are a strict data extraction API. Extract ALL CONTACTS from the following provided text, CSV, or spreadsheet data.
      Return ONLY a valid JSON array containing an object for EACH person found in the data.
      Do NOT include markdown formatting, backticks, or the word 'json'.
      
      [SAME CATEGORIZATION RULES AS ABOVE]
      
      Each object must have these exact keys:
      - name (string)
      - school (string, or null if unknown)
      - education_level (string, or null if unknown)
      - primary_interest (string, exactly matching ONE of the 9 parent categories above, or null if completely unknown)
      - specializations (array of strings, maximum of 3, strictly matching the sub-options of their chosen primary_interest)
      - warmth_level (string, strictly "warm", "neutral", or "cool" - determine this based on notes or status, default to "neutral" if unknown)
      
      If the data is empty or unintelligible, return an empty array [].`;
    }

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', 
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: raw_text }],
        temperature: 0.1, 
      }),
    });

    const aiData = await aiResponse.json();
    if (aiData.error) throw new Error(aiData.error.message);
    
    let rawContent = aiData.choices[0].message.content.trim();
    rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsedContacts = JSON.parse(rawContent);
    if (!Array.isArray(parsedContacts)) throw new Error("LLM did not return an array.");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const contactsToInsert = parsedContacts.map((contact: any) => ({
      ...contact, user_id: user_id, id: crypto.randomUUID() 
    }));

    if (contactsToInsert.length > 0) {
      const { data, error } = await supabase.from('contacts').insert(contactsToInsert).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, inserted: data.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    } else {
      return new Response(JSON.stringify({ success: true, inserted: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})