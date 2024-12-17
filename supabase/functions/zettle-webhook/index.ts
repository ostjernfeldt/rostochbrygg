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
    const body = await req.json()
    console.log('Received webhook payload:', body)

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Only process PurchaseCreated events
    if (body.eventName !== 'PurchaseCreated') {
      return new Response(
        JSON.stringify({ message: 'Event type not supported' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the payload string into an object
    const purchase = JSON.parse(body.payload)
    console.log('Parsed purchase data:', purchase)

    // Store purchase data
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        purchase_uuid: purchase.purchaseUuid,
        user_uuid: purchase.userUuid,
        purchase_number: purchase.purchaseNumber?.toString(),
        timestamp: new Date(purchase.timestamp).toISOString(),
        amount: purchase.amount,
        vat_amount: purchase.vatAmount,
        country: purchase.country,
        currency: purchase.currency,
        user_display_name: purchase.userDisplayName
      })
      .select()

    if (purchaseError) {
      console.error('Error storing purchase:', purchaseError)
      throw purchaseError
    }

    // Store products data
    if (purchase.products && purchase.products.length > 0) {
      const productsToInsert = purchase.products.map((product: any) => ({
        purchase_uuid: purchase.purchaseUuid,
        product_uuid: product.productUuid,
        name: product.name,
        unit_price: product.unitPrice,
        quantity: parseInt(product.quantity),
        vat_percentage: product.vatPercentage
      }))

      const { error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert)

      if (productsError) {
        console.error('Error storing products:', productsError)
        throw productsError
      }
    }

    // Store payments data
    if (purchase.payments && purchase.payments.length > 0) {
      const paymentsToInsert = purchase.payments.map((payment: any) => ({
        purchase_uuid: purchase.purchaseUuid,
        payment_uuid: payment.uuid,
        amount: payment.amount,
        type: payment.type
      }))

      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(paymentsToInsert)

      if (paymentsError) {
        console.error('Error storing payments:', paymentsError)
        throw paymentsError
      }
    }

    console.log('Successfully stored purchase:', purchase.purchaseUuid)

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