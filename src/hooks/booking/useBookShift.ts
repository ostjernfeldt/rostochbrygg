
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
          
          // Important: We make a copy of the original booking for fallback
          const originalBooking = { ...cancelledBooking };
          
          // Update with returning data in the same query (which should work in most cases)
          const { data: updateData, error: updateError } = await supabase
            .from('shift_bookings')
            .update({ 
              status: 'confirmed',
              user_display_name: displayName,
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select('*')
            .maybeSingle();
            
          if (updateError) {
            console.error('Error updating cancelled booking:', updateError);
            throw updateError;
          }
          
          console.log('Update operation completed, returned data:', updateData);
          
          // If the update worked but didn't return data (which can happen),
          // we fetch it separately to make sure we have fresh data
          if (!updateData) {
            console.log('No data returned from update operation, fetching booking explicitly');
            
            // Explicit fetch to get the latest data
            const { data: freshBooking, error: fetchError } = await supabase
              .from('shift_bookings')
              .select('*')
              .eq('id', bookingId)
              .maybeSingle();
            
            if (fetchError) {
              console.error('Error fetching updated booking:', fetchError);
              // Return manually updated object as fallback
              bookingResult = {
                ...originalBooking,
                status: 'confirmed',
                user_display_name: displayName,
                updated_at: new Date().toISOString()
              };
              console.log('Using fallback booking data due to fetch error:', bookingResult);
            } else if (!freshBooking) {
              console.error('Updated booking not found in database');
              // Return manually updated object as fallback
              bookingResult = {
                ...originalBooking,
                status: 'confirmed',
                user_display_name: displayName,
                updated_at: new Date().toISOString()
              };
              console.log('Using fallback booking data (no booking found):', bookingResult);
            } else {
              // Use the freshly fetched booking data
              bookingResult = freshBooking;
              console.log('Successfully fetched updated booking:', bookingResult);
            }
          } else {
            // Use the data returned from the update operation
            bookingResult = updateData;
            console.log('Using data returned from update operation:', bookingResult);
          }
          
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
          
          // Insert with returning (which should work in most cases)
          const { data: insertData, error: insertError } = await supabase
            .from('shift_bookings')
            .insert([newBookingData])
            .select('*')
            .maybeSingle();
          
          if (insertError) {
            console.error('Error booking shift:', insertError);
            throw insertError;
          }
          
          console.log('Insert operation completed, returned data:', insertData);
          
          // If the insert worked but didn't return data (which can happen),
          // we fetch it separately to make sure we have fresh data
          if (!insertData) {
            console.log('No data returned from insert operation, fetching booking explicitly');
            
            // Explicit fetch to get the latest data
            const { data: freshBooking, error: fetchError } = await supabase
              .from('shift_bookings')
              .select('*')
              .eq('shift_id', shiftId)
              .eq('user_id', user.id)
              .eq('status', 'confirmed')
              .maybeSingle();
              
            if (fetchError) {
              console.error('Error fetching new booking:', fetchError);
              // Fallback: use what we know about the booking
              bookingResult = {
                id: 'temporary-id', // Will be replaced when data is refetched
                ...newBookingData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              console.log('Using fallback booking data due to fetch error:', bookingResult);
            } else if (!freshBooking) {
              console.error('New booking created but not found in fetch');
              // Fallback: use what we know about the booking
              bookingResult = {
                id: 'temporary-id',
                ...newBookingData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              console.log('Using fallback booking data (no fresh booking):', bookingResult);
            } else {
              // Use the freshly fetched booking data
              bookingResult = freshBooking;
              console.log('Successfully fetched new booking:', bookingResult);
            }
          } else {
            // Use the data returned from the insert operation
            bookingResult = insertData;
            console.log('Using data returned from insert operation:', bookingResult);
          }
        }
        
        // Final validation to ensure we're returning valid data
        if (!bookingResult) {
          console.error('No booking result data available!');
          throw new Error('Ingen data returnerades från bokningsoperationen');
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
