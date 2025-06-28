
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('SOW generation request:', payload)

    // Validate required fields
    if (!payload.project_name) {
      throw new Error('Project name is required')
    }

    if (!payload.project_address) {
      throw new Error('Project address is required')
    }

    // Log the received data for debugging
    console.log('Received SOW generation request for:', {
      project: payload.project_name,
      address: payload.project_address,
      customer: payload.customer_name,
      sqft: payload.square_footage,
      wind_speed: payload.wind_speed,
      exposure: payload.exposure_category
    })

    // Mock successful response - in production this would call the actual SOW generation logic
    const response = {
      success: true,
      sow_id: `sow_${Date.now()}`,
      download_url: `/api/sow/${Date.now()}.pdf`,
      message: 'SOW generated successfully',
      project_name: payload.project_name,
      generation_time: new Date().toISOString()
    }

    console.log('SOW generation completed:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('SOW generation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'SOW generation failed'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
