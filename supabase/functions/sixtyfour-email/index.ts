import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SIXTYFOUR_API_KEY = Deno.env.get('SIXTYFOUR_API_KEY');
    
    // We need the person's name and their company to find the email
    const { name, company } = await req.json();

    const response = await fetch("https://api.sixtyfour.ai/find-email", {
      method: "POST",
      headers: { 
        "x-api-key": SIXTYFOUR_API_KEY || '',
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        lead: {
          name: name,
          company: company
        }
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})