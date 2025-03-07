
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useBookShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      try {
        // Check if shift ID is valid
        if (!shiftId) {
          throw new Error('Ogiltig pass-ID');
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Authentication error:', authError);
          throw new Error('Autentiseringsfel: Du måste vara inloggad för att boka pass');
        }
        
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

        // Check if there's a cancelled booking for this shift
        const { data: existingCancelledBookings, error: cancelledCheckError } = await supabase
          .from('shift_bookings')
          .select('*')
          .eq('shift_id', shiftId)
          .eq('user_id', user.id)
          .eq('status', 'cancelled');
          
        if (cancelledCheckError) {
          console.error('Error checking cancelled bookings:', cancelledCheckError);
          throw cancelledCheckError;
        }
        
        let bookingResult;
        
        // If there's a cancelled booking, update it to confirmed
        if (existingCancelledBookings && existingCancelledBookings.length > 0) {
          console.log('Found cancelled booking, updating status to confirmed');
          const cancelledBooking = existingCancelledBookings[0];
          const bookingId = cancelledBooking.id;
          
          // Update the booking without expecting data back
          const { error: updateError } = await supabase
            .from('shift_bookings')
            .update({ 
              status: 'confirmed',
              user_display_name: displayName,
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);
            
          if (updateError) {
            console.error('Error updating cancelled booking:', updateError);
            throw updateError;
          }
          
          // Create the result object based on the cancelled booking we already have
          bookingResult = {
            ...cancelledBooking,
            status: 'confirmed',
            user_display_name: displayName,
            updated_at: new Date().toISOString()
          };
          
        } else {
          // No existing bookings, create a new one
          console.log('Creating new booking for shift:', shiftId);
          
          // Prepare the new booking data
          const newBookingData = { 
            shift_id: shiftId, 
            user_id: user.id,
            user_email: user.email,
            user_display_name: displayName,
            status: 'confirmed'
          };
          
          // Insert without expecting data back
          const { error: insertError } = await supabase
            .from('shift_bookings')
            .insert([newBookingData]);
          
          if (insertError) {
            console.error('Error booking shift:', insertError);
            throw insertError;
          }
          
          // Fetch the newly created booking to get its ID and timestamps
          const { data: freshBooking, error: fetchError } = await supabase
            .from('shift_bookings')
            .select('*')
            .eq('shift_id', shiftId)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .maybeSingle();
            
          if (fetchError) {
            console.error('Error fetching new booking:', fetchError);
            // If we can't fetch the data, use what we know
            bookingResult = {
              id: 'temporary-id', // Will be replaced when data is refetched
              ...newBookingData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else if (!freshBooking) {
            console.log('New booking created but not found in fetch, using fallback data');
            bookingResult = {
              id: 'temporary-id',
              ...newBookingData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else {
            bookingResult = freshBooking;
          }
        }
        
        console.log('Booking completed successfully:', bookingResult);
        return bookingResult;
      } catch (error) {
        console.error('Error in booking mutation:', error);
        throw error;
      }
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
        description: error instanceof Error ? error.message : 'Ett fel uppstod vid bokningen av passet.',
      });
    },
  });
};
