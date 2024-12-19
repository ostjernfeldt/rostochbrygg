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
      // Convert comma to dot for decimal numbers and ensure it's a valid number
      const normalizedValue = value.toString().replace(',', '.');
      // Convert from minor units (cents) to major units
      const numericValue = parseFloat(normalizedValue);
      if (isNaN(numericValue)) return "0";
      return (numericValue / 100).toString();
    };

    // Format timestamp properly
    const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return new Date().toISOString();
      
      // If timestamp is a number (unix timestamp), convert it to ISO string
      if (typeof timestamp === 'number') {
        // Check if timestamp is in milliseconds (13 digits) or seconds (10 digits)
        const date = timestamp.toString().length > 10 
          ? new Date(timestamp) 
          : new Date(timestamp * 1000);
        return date.toISOString();
      }
      
      // If timestamp is already a string, ensure it's in ISO format
      try {
        const date = new Date(timestamp);
        return date.toISOString();
      } catch (error) {
        console.error('Error formatting timestamp:', error);
        return new Date().toISOString();
      }
    };

    // Only include fields that exist in the purchases table
    const purchaseRecord = {
      purchase_uuid: purchaseData.purchaseUuid || purchaseData.uuid || null,
      timestamp: formatTimestamp(purchaseData.timestamp),
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

    console.log('Mapped data for purchases table:', purchaseRecord)

    if (purchaseRecord.purchase_uuid) {
      // Insert into purchases table
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseRecord])

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

      console.log('Purchase inserted successfully')

      // Also insert into total_purchases table
      const { error: totalPurchaseError } = await supabase
        .from('total_purchases')
        .insert([{
          purchase_uuid: purchaseRecord.purchase_uuid,
          timestamp: purchaseRecord.timestamp,
          amount: parseFloat(purchaseRecord.amount),
          user_display_name: purchaseRecord.user_display_name,
          payment_type: purchaseData.paymentType || null,
          product_name: purchaseData.productName || null,
          source: 'new'
        }])

      if (totalPurchaseError) {
        console.error('Error inserting into total_purchases:', totalPurchaseError)
      } else {
        console.log('Successfully inserted into total_purchases')
      }
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