
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

      console.log('Booking shift for user:', user.id, user.email);

      // First check if user already has a CONFIRMED booking for this shift
      const { data: existingConfirmedBookings, error: bookingCheckError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (bookingCheckError) {
        console.error('Error checking existing bookings:', bookingCheckError);
        throw bookingCheckError;
      }

      // If user already has a confirmed booking, prevent rebooking
      if (existingConfirmedBookings && existingConfirmedBookings.length > 0) {
        throw new Error('Du har redan bokat detta pass');
      }

      // Get the user's display name from staff_roles table by matching email
      const { data: staffRoleData, error: staffRoleError } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('email', user.email)
        .maybeSingle();

      if (staffRoleError) {
        console.error('Error fetching staff role:', staffRoleError);
        throw new Error('Du måste vara registrerad som säljare för att boka pass');
      }

      if (!staffRoleData) {
        throw new Error('Du måste vara registrerad som säljare för att boka pass');
      }

      const displayName = staffRoleData.user_display_name;
      console.log('Using display name from staff_roles:', displayName);

      let data;
      let error;

      // Always create a new booking entry, even if there was a cancelled one before
      console.log('Creating new booking for shift:', shiftId);
      
      const result = await supabase
        .from('shift_bookings')
        .insert([{ 
          shift_id: shiftId, 
          user_id: user.id,
          user_email: user.email,
          user_display_name: displayName,
          status: 'confirmed'
        }])
        .select();
      
      data = result.data && result.data.length > 0 ? result.data[0] : null;
      error = result.error;
      
      console.log('Create booking result:', { data, error });

      if (error) {
        console.error('Error booking shift:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from booking operation');
        throw new Error('Ingen data returnerades från bokningsoperationen');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Booking successful:', data);
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
