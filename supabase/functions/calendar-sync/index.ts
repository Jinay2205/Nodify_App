import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ✨ Grab the dynamic timeZone passed from the frontend
    const { contactName, date, time, duration, providerToken, timeZone } = await req.json()

    if (!providerToken) {
      throw new Error("Missing Google Provider Token in request body.");
    }

    const [timeVal, period] = time.split(' ')
    let [hoursStr, minutesStr] = timeVal.split(':')
    let hours = parseInt(hoursStr)
    const minutes = parseInt(minutesStr)

    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    const startMins = hours * 60 + minutes
    const endMins = startMins + parseInt(duration)
    
    const endHours = Math.floor(endMins / 60) % 24
    const endMinutes = endMins % 60

    const pad = (n: number) => String(n).padStart(2, '0')
    
    // ✨ REMOVED the hardcoded -05:00 offset. Google handles it now.
    const startDateTime = `${date}T${pad(hours)}:${pad(minutes)}:00`
    const endDateTime = `${date}T${pad(endHours)}:${pad(endMinutes)}:00`

    const event = {
      summary: `Coffee Chat with ${contactName}`,
      description: `Reconnect meeting generated via Nodify CRM.`,
      start: {
        dateTime: startDateTime,
        timeZone: timeZone || 'UTC', // ✨ Use the dynamic timezone!
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone || 'UTC', // ✨ Use the dynamic timezone!
      },
    }

    const googleRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!googleRes.ok) {
      const errorText = await googleRes.text()
      throw new Error(`Google API Error: ${errorText}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})