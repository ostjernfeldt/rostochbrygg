
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Validate invitation email function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client with the Admin key (Service Role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Validating invitation for email:", email);

    // Query the invitations table directly
    const { data: invitations, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email.trim())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());
    
    if (invitationError) {
      console.error("Error querying invitations:", invitationError);
      return new Response(
        JSON.stringify({ success: false, error: invitationError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!invitations || invitations.length === 0) {
      console.log("No valid invitation found for email:", email);
      return new Response(
        JSON.stringify({ success: true, data: [{ is_valid: false, email, invitation_id: null }] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invitation = invitations[0];
    console.log("Valid invitation found:", invitation.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: [{ 
          is_valid: true, 
          email: invitation.email, 
          invitation_id: invitation.id 
        }] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
