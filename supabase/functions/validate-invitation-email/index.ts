
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { email } = await req.json();

    console.log('Validating invitation for email:', email);

    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email address');
    }

    // Check if there's an active invitation for this email
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, expires_at, used_at, status')
      .eq('email', email.trim())
      .maybeSingle();

    if (error) {
      console.error('Error querying invitation:', error);
      throw error;
    }

    console.log('Invitation data:', data);

    if (!data) {
      return new Response(
        JSON.stringify({ 
          is_valid: false, 
          message: 'No invitation found for this email address' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const isExpired = new Date(data.expires_at) < new Date();
    const isUsed = data.used_at !== null || data.status === 'used';

    const isValid = !isExpired && !isUsed;

    return new Response(
      JSON.stringify({ 
        is_valid: isValid,
        invitation_id: data.id,
        email: data.email,
        message: isExpired ? 'Invitation has expired' : 
                 isUsed ? 'Invitation has already been used' : 
                 'Invitation is valid'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error validating invitation:', error);
    return new Response(
      JSON.stringify({ 
        is_valid: false, 
        message: error.message || 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
