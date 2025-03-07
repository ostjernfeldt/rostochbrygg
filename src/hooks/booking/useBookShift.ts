
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

        // If there's a cancelled booking, we need to update it rather than creating a new one
        // to avoid the unique constraint violation
        if (existingCancelledBookings && existingCancelledBookings.length > 0) {
          console.log('Found cancelled booking, updating status to confirmed');
          const cancelledBooking = existingCancelledBookings[0];
          
          // Update the cancelled booking, but don't use .select() to avoid empty response issues
          const { error: updateError } = await supabase
            .from('shift_bookings')
            .update({ 
              status: 'confirmed',
              user_display_name: displayName, // Update display name in case it changed
              updated_at: new Date().toISOString()
            })
            .eq('id', cancelledBooking.id);
            
          if (updateError) {
            console.error('Error updating cancelled booking:', updateError);
            throw updateError;
          }
          
          // Fetch the updated booking separately to ensure we get data back
          const { data: updatedBooking, error: fetchError } = await supabase
            .from('shift_bookings')
            .select('id, shift_id, user_id, status, user_display_name')
            .eq('id', cancelledBooking.id)
            .maybeSingle();
            
          if (fetchError) {
            console.error('Error fetching updated booking:', fetchError);
            // If fetch fails, return a reconstructed booking object
            return {
              id: cancelledBooking.id,
              shift_id: shiftId,
              user_id: user.id,
              status: 'confirmed',
              user_display_name: displayName
            };
          }
          
          if (!updatedBooking) {
            console.log('No updated booking found, using reconstructed booking data');
            return {
              id: cancelledBooking.id,
              shift_id: shiftId,
              user_id: user.id,
              status: 'confirmed',
              user_display_name: displayName
            };
          }
          
          console.log('Successfully fetched updated booking:', updatedBooking);
          return updatedBooking;
        } else {
          // No existing bookings (confirmed or cancelled), create a new one
          console.log('Creating new booking for shift:', shiftId);
          
          // Insert the new booking but don't use .select() to avoid empty response issues
          const { error: insertError } = await supabase
            .from('shift_bookings')
            .insert([{ 
              shift_id: shiftId, 
              user_id: user.id,
              user_email: user.email,
              user_display_name: displayName,
              status: 'confirmed'
            }]);
          
          if (insertError) {
            console.error('Error booking shift:', insertError);
            throw insertError;
          }
          
          // Fetch the newly created booking separately to ensure we get data back
          const { data: newBooking, error: fetchError } = await supabase
            .from('shift_bookings')
            .select('id, shift_id, user_id, status, user_display_name')
            .eq('shift_id', shiftId)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .maybeSingle();
            
          if (fetchError) {
            console.error('Error fetching new booking:', fetchError);
            // If fetch fails, return a fallback booking object
            return {
              id: 'temporary-id', // Will be replaced when data is refetched
              shift_id: shiftId,
              user_id: user.id,
              status: 'confirmed',
              user_display_name: displayName
            };
          }
          
          if (!newBooking) {
            console.log('No new booking found, using fallback booking data');
            return {
              id: 'temporary-id', 
              shift_id: shiftId,
              user_id: user.id,
              status: 'confirmed',
              user_display_name: displayName
            };
          }
          
          console.log('Successfully fetched new booking:', newBooking);
          return newBooking;
        }
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
