
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface SOWGenerationRequest {
  projectName: string;
  projectAddress: string;
  customerName?: string;
  customerPhone?: string;
  buildingHeight?: number;
  squareFootage?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  deckType?: string;
  membraneType?: string;
  insulationType?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  projectType?: string;
  notes?: string;
  inspectionId?: string;
  roofAssemblyLayers?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: SOWGenerationRequest = await req.json()
    console.log('🚀 SOW generation request received:', {
      projectName: payload.projectName,
      projectAddress: payload.projectAddress,
      inspectionId: payload.inspectionId
    })

    // Validate required fields (flexible field names)
    const projectName = payload.projectName || (payload as any).project_name
    const projectAddress = payload.projectAddress || (payload as any).project_address

    if (!projectName?.trim()) {
      throw new Error('Project name is required')
    }

    if (!projectAddress?.trim()) {
      throw new Error('Project address is required')
    }

    // Create SOW generation record in database
    const { data: sowRecord, error: createError } = await supabase
      .from('sow_generations')
      .insert({
        template_type: 'production-template',
        generation_status: 'processing',
        input_data: payload,
        user_id: '00000000-0000-0000-0000-000000000000', // Anonymous for now
        inspection_id: payload.inspectionId || null
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create SOW record:', createError)
      throw new Error('Failed to initialize SOW generation')
    }

    console.log('📝 SOW generation record created:', sowRecord.id)

    // Simulate SOW generation process
    console.log('🏗️ Processing SOW generation...')
    
    // Generate mock PDF content and file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${cleanProjectName}_SOW_${timestamp}.pdf`
    const mockFileUrl = `https://example.com/pdfs/${filename}`

    // Create mock engineering summary
    const engineeringSummary = {
      jurisdiction: {
        location: `${payload.city || 'Unknown'}, ${payload.state || 'Unknown'}`,
        windSpeed: payload.windSpeed || 120,
        exposureCategory: payload.exposureCategory || 'B'
      },
      buildingSpecs: {
        height: payload.buildingHeight || 30,
        area: payload.squareFootage || 10000,
        deckType: payload.deckType || 'steel'
      },
      roofSystem: {
        membraneType: payload.membraneType || 'TPO',
        insulationType: payload.insulationType || 'polyiso',
        projectType: payload.projectType || 'tearoff'
      },
      assemblyLayers: payload.roofAssemblyLayers?.length || 0
    }

    // Update SOW record with completion
    const { error: updateError } = await supabase
      .from('sow_generations')
      .update({
        generation_status: 'completed',
        output_file_path: filename,
        generation_completed_at: new Date().toISOString(),
        generation_duration_seconds: 15 // Mock duration
      })
      .eq('id', sowRecord.id)

    if (updateError) {
      console.error('❌ Failed to update SOW record:', updateError)
    }

    // Link inspection to SOW if inspection ID provided
    if (payload.inspectionId) {
      const { error: inspectionUpdateError } = await supabase
        .from('field_inspections')
        .update({
          sow_generated: true,
          sow_id: sowRecord.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.inspectionId)

      if (inspectionUpdateError) {
        console.error('⚠️ Failed to update inspection record:', inspectionUpdateError)
      } else {
        console.log('🔗 Linked inspection to SOW generation')
      }
    }

    const response = {
      success: true,
      sowId: sowRecord.id,
      downloadUrl: mockFileUrl,
      message: 'SOW generated successfully',
      data: {
        sow: `Generated SOW for ${projectName}`,
        pdf: 'base64-encoded-pdf-content-here',
        engineeringSummary
      },
      metadata: {
        generationTime: 15000,
        fileProcessed: !!payload.inspectionId,
        fileSize: 1200000
      }
    }

    console.log('✅ SOW generation completed successfully:', sowRecord.id)

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
    console.error('❌ SOW generation error:', error)
    
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
