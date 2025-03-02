
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

    console.log('Marking invitation as used for email:', email);

    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email address');
    }

    // Update invitation to mark it as used
    const { data, error } = await supabase
      .from('invitations')
      .update({ 
        used_at: new Date().toISOString(),
        status: 'used'
      })
      .eq('email', email.trim())
      .is('used_at', null)
      .select('id');

    if (error) {
      console.error('Error updating invitation:', error);
      throw error;
    }

    console.log('Update result:', data);

    const success = data && data.length > 0;

    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 'Invitation marked as used' : 'No active invitation found'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error marking invitation as used:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
