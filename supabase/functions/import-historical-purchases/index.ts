import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ZETTLE_API_KEY = Deno.env.get('ZETTLE_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

async function fetchZettlePurchases(startDate: string, endDate: string) {
  const response = await fetch('https://purchase.izettle.com/purchases/v2', {
    headers: {
      'Authorization': `Bearer ${ZETTLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      startDate: startDate,
      endDate: endDate,
      limit: 1000 // Max allowed by Zettle
    })
  });

  if (!response.ok) {
    console.error('Zettle API error:', await response.text());
    throw new Error(`Failed to fetch purchases: ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { startDate, endDate } = await req.json()
    console.log('Fetching purchases from', startDate, 'to', endDate);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Fetch purchases from Zettle
    const purchases = await fetchZettlePurchases(startDate, endDate)
    console.log('Fetched', purchases.length, 'purchases from Zettle');

    // Process and store each purchase
    for (const purchase of purchases) {
      const purchaseData = {
        zettle_purchase_id: purchase.purchaseUUID,
        amount: purchase.amount,
        vat_amount: purchase.vatAmount,
        currency: purchase.currency,
        timestamp: purchase.timestamp,
        payment_type: purchase.type,
        products: purchase.products,
        raw_data: purchase
      }

      // Check if purchase already exists
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('zettle_purchase_id', purchaseData.zettle_purchase_id)
        .single()

      if (!existingPurchase) {
        const { error } = await supabase
          .from('purchases')
          .insert(purchaseData)

        if (error) {
          console.error('Error storing purchase:', error)
          throw error
        }
        console.log('Stored purchase:', purchaseData.zettle_purchase_id)
      } else {
        console.log('Purchase already exists:', purchaseData.zettle_purchase_id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${purchases.length} purchases` 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})