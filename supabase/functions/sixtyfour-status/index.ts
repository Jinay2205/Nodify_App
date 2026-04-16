import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { task_id } = await req.json();
    const SIXTYFOUR_API_KEY = Deno.env.get('SIXTYFOUR_API_KEY');

    // 1. Get Status
    const statusRes = await fetch(`https://api.sixtyfour.ai/search/status/${task_id}`, {
      method: "GET",
      headers: { "x-api-key": SIXTYFOUR_API_KEY || '' }
    });
    const statusData = await statusRes.json();

    // 2. 🚨 NEW: Fetch JSON results using the search_id and the /search/query endpoint
    if (statusData.status === "completed" && statusData.search_id) {
      const resultsRes = await fetch(`https://api.sixtyfour.ai/search/query`, {
        method: "POST",
        headers: { 
          "x-api-key": SIXTYFOUR_API_KEY || '',
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          search_id: statusData.search_id,
          page_size: 10 // Get up to 50 results at once
        })
      });
      
      const queryData = await resultsRes.json();
      
      // 3. Format the data: The docs show the info is nested inside 'raw_source'
      // 3. Format the data using Sixtyfour's exact schema
      const formattedResults = (queryData.results || []).map((item: any) => {
        const source = item.raw_source || {};
        
        // 🚀 Extract Company Name from their nested array structure
        let companyName = "";
        if (source.currentCompanies && source.currentCompanies.length > 0) {
          companyName = source.currentCompanies[0]?.element?.company?.name || "";
        }

        // 🚀 Construct the LinkedIn URL using the publicId
        let linkedinUrl = "";
        if (source.publicId) {
          linkedinUrl = `https://www.linkedin.com/in/${source.publicId}`;
        }

        return {
          name: source.fullName || "Unknown Name",
          role: source.headline || "No Title",
          company: companyName,
          linkedin: linkedinUrl,
          reasoning: "AI Scout matched this profile based on your query criteria."
        };
      });

      return new Response(JSON.stringify({
        status: "completed",
        results: formattedResults 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Return pending status
    return new Response(JSON.stringify(statusData), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: corsHeaders 
    });
  }
})