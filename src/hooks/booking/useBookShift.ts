
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useBookShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du måste vara inloggad för att boka pass');
      }

      // First, check if user already has a booking for this shift
      const { data: existingBookings } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', user.id);

      // Get the user's display name from staff_roles table
      const { data: staffRoleData, error: staffRoleError } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('id', user.id)
        .maybeSingle();

      let displayName = user.email;

      // If not found in staff_roles, try to get from invitations as fallback
      if (staffRoleError || !staffRoleData) {
        const { data: invitationData } = await supabase
          .from('invitations')
          .select('email, display_name')
          .eq('email', user.email)
          .maybeSingle();
          
        if (invitationData && invitationData.display_name) {
          displayName = invitationData.display_name;
        }
      } else {
        displayName = staffRoleData.user_display_name;
      }

      let data;
      let error;

      if (existingBookings && existingBookings.length > 0) {
        // If there's an existing booking, update its status to 'confirmed'
        const existingBooking = existingBookings[0];
        if (existingBooking.status === 'confirmed') {
          throw new Error('Du har redan bokat detta pass');
        }

        // Update the existing booking to confirmed status
        const result = await supabase
          .from('shift_bookings')
          .update({ 
            status: 'confirmed',
            user_display_name: displayName  // Ensure display name is updated
          })
          .eq('id', existingBooking.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create a new booking if none exists
        const result = await supabase
          .from('shift_bookings')
          .insert([{ 
            shift_id: shiftId, 
            user_id: user.id,
            user_email: user.email,
            user_display_name: displayName,
            status: 'confirmed'
          }])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error booking shift:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
      toast({
        title: 'Pass bokat',
        description: 'Du har bokat passet framgångsrikt.',
      });
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Fel vid bokning',
        description: error.message || 'Ett fel uppstod vid bokningen av passet.',
      });
    },
  });
};
