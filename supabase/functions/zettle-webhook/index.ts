import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-zettle-signature',
}

const ZETTLE_API_KEY = Deno.env.get('ZETTLE_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate iZettle webhook signature
    const signature = req.headers.get('x-zettle-signature')
    if (!signature) {
      console.error('Missing Zettle signature')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the raw body
    const body = await req.json()
    console.log('Received webhook payload:', body)

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Process purchase data
    const purchase = body.payload
    if (!purchase) {
      throw new Error('Invalid purchase payload')
    }

    // Extract purchase data
    const purchaseData = {
      "User Display Name": purchase.userDisplayName || null,
      "Amount": purchase.amount || null,
      "VAT Amount": purchase.vatAmount || null,
      "Payment Type": purchase.type || null,
      "Currency": purchase.currency || null,
      "Purchase UUID": purchase.purchaseUUID || null,
      "Timestamp": purchase.timestamp || null,
      raw_data: body
    }

    // Store in Supabase
    const { data, error } = await supabase
      .from('purchases')
      .insert(purchaseData)

    if (error) {
      console.error('Error storing purchase:', error)
      throw error
    }

    console.log('Successfully stored purchase:', purchaseData["Purchase UUID"])

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})