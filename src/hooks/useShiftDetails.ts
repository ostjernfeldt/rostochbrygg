
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useShiftDetails = (shiftId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch the shift
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
      
      if (shiftError) throw shiftError;
      
      // Fetch all bookings for this shift
      const { data: bookings, error: bookingsError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId);
      
      if (bookingsError) throw bookingsError;
      
      // Process bookings to ensure they have the correct types
      const processedBookings = bookings.map(booking => {
        // Ensure status is correctly typed
        const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
        
        // Use user_display_name from the booking if available, otherwise use the email, or fallback to "Okänd säljare"
        const displayName = booking.user_display_name || booking.user_email || 'Okänd säljare';
        
        return {
          ...booking,
          status: typedStatus,
          user_display_name: displayName
        } as ShiftBooking;
      });
      
      // Check if current user has booked this shift
      const isBookedByCurrentUser = user ? bookings.some(b => b.user_id === user.id) : false;
      
      // Calculate remaining slots
      const availableSlotsRemaining = shift.available_slots - bookings.length;
      
      return {
        ...shift,
        bookings: processedBookings,
        available_slots_remaining: availableSlotsRemaining,
        is_booked_by_current_user: isBookedByCurrentUser
      } as ShiftWithBookings;
    },
    enabled: !!shiftId,
  });
  
  return {
    shift: data,
    isLoading,
    error,
  };
};
