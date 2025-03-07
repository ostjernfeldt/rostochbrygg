
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShiftBooking } from '@/types/booking';
import { fetchUserStaffRole } from './utils/bookingOperations';

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

      // Process each booking
      for (const booking of bookings) {
        try {
          // Check if the seller already has a booking for this shift
          const { data: existingSellerBookings } = await supabase
            .from('shift_bookings')
            .select('*')
            .eq('shift_id', booking.shiftId)
            .eq('user_display_name', booking.userDisplayName)
            .eq('status', 'confirmed');

          if (existingSellerBookings && existingSellerBookings.length > 0) {
            errors.push(`${booking.userDisplayName} har redan bokat detta pass`);
            continue;
          }

          // Create new booking
          const newBookingData = {
            shift_id: booking.shiftId,
            user_display_name: booking.userDisplayName,
            user_email: booking.userEmail,
            // User ID is not known for admin-created bookings, use dummy ID
            user_id: '00000000-0000-0000-0000-000000000000',
            status: 'confirmed' as const
          };

          const { data, error } = await supabase
            .from('shift_bookings')
            .insert([newBookingData])
            .select()
            .single();

          if (error) {
            errors.push(`Fel vid bokning för ${booking.userDisplayName}: ${error.message}`);
          } else if (data) {
            results.push(data as ShiftBooking);
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
