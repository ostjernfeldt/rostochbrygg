import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
    
    // Parse request body
    const body = await req.json()
    console.log('Raw webhook data:', JSON.stringify(body, null, 2))

    // More permissive validation - check if we have any data to work with
    if (!body) {
      return new Response(
        JSON.stringify({
          message: 'No data received',
          receivedData: body
        }),
        { 
          status: 200, // Changed to 200 to avoid webhook retries
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Extract purchase data - handle both direct payload and nested structures
    const purchaseData = body.payload ? (
      typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload
    ) : body

    console.log('Parsed purchase data:', JSON.stringify(purchaseData, null, 2))

    // Map the data to our database structure
    const mappedData = {
      purchase_uuid: purchaseData.purchaseUuid || purchaseData.uuid || null,
      timestamp: purchaseData.timestamp || new Date().toISOString(),
      amount: purchaseData.amount?.toString() || "0",
      user_uuid: purchaseData.userUuid || null,
      purchase_number: purchaseData.purchaseNumber || null,
      vat_amount: purchaseData.vatAmount?.toString() || null,
      country: purchaseData.country || null,
      currency: purchaseData.currency || null,
      user_display_name: purchaseData.userDisplayName || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Mapped data for insert:', mappedData)

    // Only insert if we have a purchase UUID
    if (mappedData.purchase_uuid) {
      const { data: purchaseInsert, error: purchaseError } = await supabase
        .from('purchases')
        .insert([mappedData])

      if (purchaseError) {
        console.error('Error inserting purchase:', purchaseError)
        return new Response(
          JSON.stringify({
            message: 'Processed but failed to insert purchase data',
            error: purchaseError.message
          }),
          { 
            status: 200, // Changed to 200 to avoid webhook retries
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      console.log('Purchase inserted successfully:', purchaseInsert)
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({
        message: 'Webhook processed successfully',
        receivedData: body
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    // Still return 200 to avoid webhook retries
    return new Response(
      JSON.stringify({
        message: 'Webhook received but encountered an error',
        error: err.message
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})