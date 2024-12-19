import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
    const body = await req.json()
    console.log('Raw webhook data:', JSON.stringify(body, null, 2))

    if (!body) {
      return new Response(
        JSON.stringify({
          message: 'No data received',
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
    }

    const purchaseData = body.payload ? (
      typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload
    ) : body

    console.log('Parsed purchase data:', JSON.stringify(purchaseData, null, 2))

    // Format numeric values properly
    const formatNumeric = (value: any) => {
      if (!value) return "0";
      return value.toString().replace(',', '.');
    };

    const mappedData = {
      purchase_uuid: purchaseData.purchaseUuid || purchaseData.uuid || null,
      timestamp: purchaseData.timestamp || new Date().toISOString(),
      amount: formatNumeric(purchaseData.amount),
      user_uuid: purchaseData.userUuid || null,
      purchase_number: purchaseData.purchaseNumber || null,
      vat_amount: formatNumeric(purchaseData.vatAmount),
      country: purchaseData.country || null,
      currency: purchaseData.currency || null,
      user_display_name: purchaseData.userDisplayName || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Mapped data for insert:', mappedData)

    if (mappedData.purchase_uuid) {
      const { data: purchaseInsert, error: purchaseError } = await supabase
        .from('total_purchases')
        .insert([mappedData])

      if (purchaseError) {
        console.error('Error inserting purchase:', purchaseError)
        return new Response(
          JSON.stringify({
            message: 'Processed but failed to insert purchase data',
            error: purchaseError.message
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

      console.log('Purchase inserted successfully:', purchaseInsert)
    }

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