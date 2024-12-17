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

  const logs: any[] = [];
  const debugLog = (message: string, data: any) => {
    const log = { message, data, timestamp: new Date().toISOString() };
    logs.push(log);
    console.log(JSON.stringify(log));
  };

  try {
    const body = await req.json()
    console.log('Raw webhook data:', body)

    // Validate webhook structure
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse payload
    let parsedPayload;
    try {
      parsedPayload = typeof body.payload === 'string' 
        ? JSON.parse(body.payload) 
        : body.payload;

      console.log('Parsed purchase data:', parsedPayload)
    } catch (e) {
      return new Response(
        JSON.stringify({
          message: 'Failed to parse payload',
          error: e.message,
          receivedPayload: body.payload
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    const validation = {
      purchaseUuid: {
        value: parsedPayload.purchaseUuid,
        exists: !!parsedPayload.purchaseUuid,
        type: typeof parsedPayload.purchaseUuid
      },
      timestamp: {
        value: parsedPayload.timestamp,
        exists: !!parsedPayload.timestamp,
        type: typeof parsedPayload.timestamp
      },
      amount: {
        value: parsedPayload.amount,
        exists: parsedPayload.amount !== undefined,
        type: typeof parsedPayload.amount
      }
    };

    const missingFields = Object.entries(validation)
      .filter(([_, v]) => !v.exists)
      .map(([k, _]) => k);

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          message: 'Missing required fields',
          missingFields,
          validation,
          receivedData: {
            webhook: {
              eventName: body.eventName,
              messageId: body.messageId,
              timestamp: body.timestamp
            },
            parsedPayload,
            payloadKeys: Object.keys(parsedPayload || {})
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Map data to our database structure
    const purchaseData = {
      purchase_uuid: parsedPayload.purchaseUuid,
      timestamp: new Date(parsedPayload.timestamp).toISOString(),
      amount: parsedPayload.amount,
      user_uuid: parsedPayload.userUuid,
      purchase_number: parsedPayload.purchaseNumber?.toString(),
      vat_amount: parsedPayload.vatAmount,
      country: parsedPayload.country,
      currency: parsedPayload.currency,
      user_display_name: parsedPayload.userDisplayName
    };

    debugLog('Mapped purchase data:', purchaseData);

    // Store purchase data
    const { data: purchaseInsert, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()

    if (purchaseError) {
      console.error('Error storing purchase:', purchaseError)
      throw purchaseError
    }

    // Store products data
    if (parsedPayload.products && parsedPayload.products.length > 0) {
      const productsToInsert = parsedPayload.products.map((product: any) => ({
        purchase_uuid: parsedPayload.purchaseUuid,
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
    if (parsedPayload.payments && parsedPayload.payments.length > 0) {
      const paymentsToInsert = parsedPayload.payments.map((payment: any) => ({
        purchase_uuid: parsedPayload.purchaseUuid,
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

    console.log('Successfully stored purchase:', parsedPayload.purchaseUuid)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        purchaseId: parsedPayload.purchaseUuid
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        logs
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})