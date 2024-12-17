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

    // Validera webhook struktur
    if (!body || !body.eventName || !body.payload) {
      return new Response(
        JSON.stringify({
          message: 'Invalid webhook format',
          receivedData: body,
          expectedFormat: {
            organizationUuid: 'string',
            messageUuid: 'string',
            eventName: 'PurchaseCreated',
            messageId: 'string',
            payload: 'JSON string',
            timestamp: 'string'
          }
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Parse payload
    let parsedPayload
    try {
      parsedPayload = typeof body.payload === 'string' 
        ? JSON.parse(body.payload) 
        : body.payload

      console.log('Parsed purchase data:', JSON.stringify(parsedPayload, null, 2))
    } catch (e) {
      return new Response(
        JSON.stringify({
          message: 'Failed to parse payload',
          error: e.message,
          receivedPayload: body.payload
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Validera required fields
    const validation = {
      purchaseUuid: {
        value: parsedPayload.purchaseUuid,
        exists: !!parsedPayload.purchaseUuid,
        type: typeof parsedPayload.purchaseUuid,
        raw: parsedPayload.purchaseUuid
      },
      timestamp: {
        value: parsedPayload.timestamp,
        exists: !!parsedPayload.timestamp,
        type: typeof parsedPayload.timestamp,
        raw: parsedPayload.timestamp
      },
      amount: {
        value: parsedPayload.amount,
        exists: parsedPayload.amount !== undefined,
        type: typeof parsedPayload.amount,
        raw: parsedPayload.amount
      }
    }

    console.log('Validation results:', validation)

    const missingFields = Object.entries(validation)
      .filter(([_, v]) => !v.exists)
      .map(([k, _]) => k)

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          message: 'Felaktig data, vissa obligatoriska fält saknas',
          missingFields,
          validation,
          receivedData: {
            webhook: {
              eventName: body.eventName,
              messageId: body.messageId,
              timestamp: body.timestamp
            },
            parsedPayload,
            payloadKeys: Object.keys(parsedPayload || {}),
            originalPayload: body.payload
          }
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Mappa data
    const mappedData = {
      purchase_uuid: parsedPayload.purchaseUuid,
      timestamp: parsedPayload.created || new Date(parsedPayload.timestamp).toISOString(),
      amount: parsedPayload.amount,
      user_uuid: parsedPayload.userUuid,
      purchase_number: parsedPayload.purchaseNumber,
      vat_amount: parsedPayload.vatAmount,
      country: parsedPayload.country,
      currency: parsedPayload.currency,
      user_display_name: parsedPayload.userDisplayName
    }

    console.log('Mapped data for insert:', mappedData)

    // Insert i Supabase
    const { data: purchaseInsert, error: purchaseError } = await supabase
      .from('purchases')
      .insert([mappedData])

    if (purchaseError) {
      console.error('Error inserting purchase:', purchaseError)
      return new Response(
        JSON.stringify({
          message: 'Error inserting purchase data',
          error: purchaseError.message
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

    console.log('Purchase inserted successfully:', purchaseInsert)

    return new Response(
      JSON.stringify({
        message: 'Webhook processed successfully',
        purchaseInsert
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
    return new Response(
      JSON.stringify({
        message: 'Internal server error',
        error: err.message
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