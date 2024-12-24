import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const zettleApiKey = Deno.env.get('ZETTLE_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting historical data import...')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // First, clear the legacy_purchases table
    const { error: clearError } = await supabase
      .from('legacy_purchases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      throw new Error(`Error clearing legacy_purchases: ${clearError.message}`)
    }

    let startDate = new Date('2023-01-01')
    const endDate = new Date()
    const purchases = []

    while (startDate <= endDate) {
      const batchEndDate = new Date(startDate)
      batchEndDate.setMonth(startDate.getMonth() + 1)
      
      console.log(`Fetching purchases from ${startDate.toISOString()} to ${batchEndDate.toISOString()}`)
      
      const response = await fetch(
        `https://purchase.izettle.com/purchases/v2?startDate=${startDate.toISOString()}&endDate=${batchEndDate.toISOString()}&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${zettleApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Zettle API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      purchases.push(...data.purchases)
      startDate = batchEndDate
    }

    console.log(`Found ${purchases.length} historical purchases`)

    const batchSize = 100
    for (let i = 0; i < purchases.length; i += batchSize) {
      const batch = purchases.slice(i, i + batchSize).map(purchase => {
        // Find refund information
        let refundUuid = null
        const amount = purchase.amount ? (purchase.amount / 100) : 0

        // If amount is negative, this is a refund
        if (amount < 0 && purchase.payments && purchase.payments.length > 0) {
          const payment = purchase.payments[0]
          // Check for refund reference in the payment object
          if (payment.references && payment.references.refundsPayment) {
            refundUuid = payment.references.refundsPayment
            console.log(`Found refund reference for purchase ${purchase.purchaseUUID}: ${refundUuid}`)
          }
        }

        return {
          "Purchase UUID": purchase.purchaseUUID,
          "Timestamp": purchase.timestamp,
          "Amount": amount.toString(),
          "User Display Name": purchase.userDisplayName,
          "Payment Type": purchase.payments?.[0]?.type,
          "Product Name": purchase.products?.[0]?.name,
          "Currency": purchase.currency,
          "Purchase Number": purchase.purchaseNumber?.toString(),
          "Refund UUID": refundUuid
        }
      })

      console.log(`Inserting batch ${i + 1} to ${Math.min(i + batchSize, purchases.length)} of ${purchases.length}`)
      console.log('Sample batch item:', batch[0])

      const { error: insertError } = await supabase
        .from('legacy_purchases')
        .insert(batch)

      if (insertError) {
        throw new Error(`Error inserting batch ${i}: ${insertError.message}`)
      }
    }

    // Run the sync function to update total_purchases
    const { error: syncError } = await supabase
      .rpc('sync_total_purchases')

    if (syncError) {
      throw new Error(`Error running sync_total_purchases: ${syncError.message}`)
    }

    return new Response(
      JSON.stringify({
        message: 'Historical data import completed successfully',
        purchasesCount: purchases.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (err) {
    console.error('Error importing historical data:', err)
    return new Response(
      JSON.stringify({
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