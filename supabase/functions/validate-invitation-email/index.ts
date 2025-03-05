
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No email provided'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if there's a valid invitation for this email
    const { data, error } = await supabaseClient.rpc('validate_invitation_by_email', {
      email_address: email
    })

    if (error) {
      console.error('Error validating invitation:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get the invitation to return display_name
    if (data && data.length > 0 && data[0].is_valid) {
      // Fetch the invitation to get the display_name
      const { data: invitationData, error: invitationError } = await supabaseClient
        .from('invitations')
        .select('display_name')
        .eq('id', data[0].invitation_id)
        .single();

      if (invitationError) {
        console.error('Error fetching invitation details:', invitationError);
      } else if (invitationData) {
        // Add display_name to the response data
        data[0].display_name = invitationData.display_name;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
