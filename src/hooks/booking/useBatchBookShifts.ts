
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShiftBooking } from '@/types/booking';

export interface SellerBooking {
  shiftId: string;
  userDisplayName: string;
  userEmail?: string;
}

export interface BatchBookingResult {
  results: ShiftBooking[];
  errors: string[];
}

export const useBatchBookShifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookings: SellerBooking[]): Promise<BatchBookingResult> => {
      if (!bookings.length) {
        return { results: [], errors: [] };
      }

      const results: ShiftBooking[] = [];
      const errors: string[] = [];

      // Check if there are enough available slots
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select('available_slots, id')
        .eq('id', bookings[0].shiftId)
        .single();

      if (shiftError) {
        throw new Error(`Kunde inte hämta information om passet: ${shiftError.message}`);
      }

      // Get all current bookings for this shift
      const { data: existingBookings, error: existingError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', bookings[0].shiftId)
        .eq('status', 'confirmed');

      if (existingError) {
        throw new Error(`Kunde inte kontrollera befintliga bokningar: ${existingError.message}`);
      }

      const existingCount = existingBookings?.length || 0;
      const availableSlots = shiftData?.available_slots || 0;
      
      if (existingCount + bookings.length > availableSlots) {
        throw new Error(`För många säljare valda. Det finns endast plats för ${availableSlots - existingCount} fler.`);
      }

      // Get current user for audit purposes
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      // Process each booking
      for (const booking of bookings) {
        try {
          // First check if there's ANY existing booking for this seller on this shift
          // This includes ALL bookings for this seller on this shift, regardless of status
          const { data: existingSellerBookings } = await supabase
            .from('shift_bookings')
            .select('*')
            .eq('shift_id', booking.shiftId)
            .eq('user_display_name', booking.userDisplayName);

          // Case 1: If there's an existing CONFIRMED booking for this seller, skip
          if (existingSellerBookings && existingSellerBookings.some(b => b.status === 'confirmed')) {
            errors.push(`${booking.userDisplayName} har redan bokat detta pass`);
            continue;
          }
          
          // Case 2: If there's a cancelled booking, update it to confirmed
          const cancelledBooking = existingSellerBookings?.find(b => b.status === 'cancelled');
          if (cancelledBooking) {
            console.log('Found cancelled booking, updating to confirmed:', cancelledBooking.id);
            
            const { data, error } = await supabase
              .from('shift_bookings')
              .update({ 
                status: 'confirmed',
                updated_at: new Date().toISOString()
              })
              .eq('id', cancelledBooking.id)
              .select()
              .single();
              
            if (error) {
              errors.push(`Fel vid återaktivering av bokning för ${booking.userDisplayName}: ${error.message}`);
            } else if (data) {
              results.push(data as ShiftBooking);
            }
            continue;
          }
          
          // Case 3: New booking - we need a valid user_id
          let userId = adminId || '00000000-0000-0000-0000-000000000000';
          
          if (booking.userEmail) {
            // Try to find the user ID from staff_roles table using email
            const { data: userData, error: userError } = await supabase
              .from('staff_roles')
              .select('id')
              .eq('email', booking.userEmail)
              .maybeSingle();
              
            if (!userError && userData?.id) {
              userId = userData.id;
            }
          }
          
          // Create new booking
          try {
            const { data, error } = await supabase
              .from('shift_bookings')
              .insert([{
                shift_id: booking.shiftId,
                user_display_name: booking.userDisplayName,
                user_email: booking.userEmail,
                user_id: userId,
                status: 'confirmed'
              }])
              .select()
              .single();

            if (error) {
              // Try with admin ID as a fallback
              if (error.message.includes('violates foreign key constraint') || 
                  error.message.includes('violates unique constraint')) {
                console.log('Constraint error, retrying with admin ID');
                
                // Always use the admin ID as a fallback
                const { data: retryResult, error: retryError } = await supabase
                  .from('shift_bookings')
                  .insert([{
                    shift_id: booking.shiftId,
                    user_display_name: booking.userDisplayName,
                    user_email: booking.userEmail,
                    user_id: adminId || '00000000-0000-0000-0000-000000000000',
                    status: 'confirmed'
                  }])
                  .select()
                  .single();
                  
                if (retryError) {
                  errors.push(`Fel vid bokning för ${booking.userDisplayName}: ${retryError.message}`);
                } else if (retryResult) {
                  results.push(retryResult as ShiftBooking);
                }
              } else {
                errors.push(`Fel vid bokning för ${booking.userDisplayName}: ${error.message}`);
              }
            } else if (data) {
              results.push(data as ShiftBooking);
            }
          } catch (insertError) {
            // This is a more general catch for any other errors that might occur during the insertion
            const message = insertError instanceof Error ? insertError.message : 'Ett okänt fel uppstod';
            errors.push(`Fel för ${booking.userDisplayName}: ${message}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
          errors.push(`Fel för ${booking.userDisplayName}: ${message}`);
        }
      }

      // If there were any errors, show them in a toast
      if (errors.length > 0) {
        console.error('Booking errors:', errors);
        const errorMessage = errors.join('\n');
        toast({
          variant: 'destructive',
          title: `${errors.length} fel vid bokning av säljare`,
          description: errorMessage,
        });
      }

      // Return both results and errors
      return { results, errors };
    },
    onSuccess: (data) => {
      console.log('Batch booking successful:', data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
      
      if (data.results.length > 0) {
        toast({
          title: 'Säljare tillagda',
          description: `${data.results.length} säljare har lagts till i passet.`,
        });
      }
    },
    onError: (error) => {
      console.error('Batch booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Fel vid tillägg av säljare',
        description: error instanceof Error ? error.message : 'Ett fel uppstod vid tillägg av säljare.',
      });
    },
  });
};
