
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

    // Calculate cost price from products if available
    const costPrice = purchaseData.products?.reduce((total: number, product: any) => {
      return total + (Number(product.costPrice || 0) * Number(product.quantity || 1));
    }, 0) || null;

    // Format numeric values properly - NOW DIVIDING BY 100 FOR NEW TRANSACTIONS
    const formatNumeric = (value: any) => {
      if (!value) return "0";
      if (typeof value === 'number') {
        // Convert to string and divide by 100 for the correct amount
        return (value / 100).toString();
      }
      const normalizedValue = value.toString().replace(',', '.');
      const numericValue = parseFloat(normalizedValue);
      if (isNaN(numericValue)) return "0";
      // Divide by 100 for the correct amount
      return (numericValue / 100).toString();
    };

    // Format timestamp properly
    const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return new Date().toISOString();
      
      // Handle Unix timestamps (both seconds and milliseconds)
      if (typeof timestamp === 'number') {
        const date = timestamp.toString().length > 10 
          ? new Date(timestamp) 
          : new Date(timestamp * 1000);
        return date.toISOString();
      }
      
      // Handle string timestamps
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          console.error('Invalid timestamp:', timestamp);
          return new Date().toISOString();
        }
        return date.toISOString();
      } catch (error) {
        console.error('Error formatting timestamp:', error);
        return new Date().toISOString();
      }
    };

    const formattedTimestamp = formatTimestamp(purchaseData.timestamp);
    const formattedAmount = formatNumeric(purchaseData.amount);
    const formattedVatAmount = formatNumeric(purchaseData.vatAmount);

    // Find refund reference if this is a refund
    let refundUuid = null;
    let isRefund = false;
    if (purchaseData.payments && Array.isArray(purchaseData.payments)) {
      for (const payment of purchaseData.payments) {
        if (payment.references?.refundsPayment) {
          refundUuid = payment.references.refundsPayment;
          isRefund = true;
          break;
        }
      }
    }

    // For historical data, check if amount is negative to identify refunds
    if (!isRefund && parseFloat(formattedAmount) < 0) {
      isRefund = true;
      // For historical refunds, we'll try to match with the original transaction later
    }

    console.log('Formatted data:', {
      timestamp: formattedTimestamp,
      amount: formattedAmount,
      vatAmount: formattedVatAmount,
      isRefund,
      refundUuid
    });

    // Insert into total_purchases with all available data
    const { error: totalPurchaseError } = await supabase
      .from('total_purchases')
      .insert([{
        purchase_uuid: purchaseData.purchaseUuid || purchaseData.uuid,
        timestamp: formattedTimestamp,
        amount: parseFloat(formattedAmount),
        user_display_name: purchaseData.userDisplayName,
        payment_type: purchaseData.payments?.[0]?.type || purchaseData.paymentType,
        product_name: purchaseData.products?.[0]?.name || purchaseData.productName,
        source: purchaseData.source || 'new',
        vat_amount: parseFloat(formattedVatAmount),
        currency: purchaseData.currency,
        country: purchaseData.country,
        purchase_number: purchaseData.purchaseNumber,
        gps_coordinates: purchaseData.gpsCoordinates,
        products: purchaseData.products,
        payments: purchaseData.payments,
        cost_price: costPrice ? parseFloat(formatNumeric(costPrice)) : null,
        refund_uuid: refundUuid,
        refunded: isRefund
      }]);

    if (totalPurchaseError) {
      console.error('Error inserting into total_purchases:', totalPurchaseError);
      return new Response(
        JSON.stringify({
          message: 'Failed to insert purchase data',
          error: totalPurchaseError.message
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // If this is a refund without a refund_uuid (historical data),
    // try to find and update the original transaction
    if (isRefund && !refundUuid) {
      const { data: originalTransaction, error: findError } = await supabase
        .from('total_purchases')
        .select('*')
        .eq('user_display_name', purchaseData.userDisplayName)
        .eq('amount', Math.abs(parseFloat(formattedAmount)))
        .lt('timestamp', formattedTimestamp)
        .eq('refunded', false)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (!findError && originalTransaction && originalTransaction.length > 0) {
        const { error: updateError } = await supabase
          .from('total_purchases')
          .update({
            refunded: true,
            refund_timestamp: formattedTimestamp
          })
          .eq('id', originalTransaction[0].id);

        if (updateError) {
          console.error('Error updating original transaction:', updateError);
        }
      }
    }

    console.log('Successfully processed purchase data');

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
    );

  } catch (err) {
    console.error('Unexpected error:', err);
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
    );
  }
});
