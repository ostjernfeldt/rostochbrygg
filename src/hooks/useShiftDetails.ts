
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useShiftDetails = (shiftId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      if (!shiftId) {
        return null;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        throw new Error('Du måste vara inloggad för att se detaljer');
      }
      
      // Fetch the shift
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
      
      if (shiftError) {
        console.error('Error fetching shift:', shiftError);
        throw shiftError;
      }
      
      if (!shift) {
        throw new Error('Kunde inte hitta säljpasset');
      }
      
      // Fetch all bookings for this shift
      const { data: bookings, error: bookingsError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId);
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }
      
      // Initialize bookings as empty array if undefined
      const processedBookings = Array.isArray(bookings) ? bookings.map(booking => {
        // Ensure status is correctly typed
        const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
        
        // Use user_display_name from the booking if available, otherwise use the email, or fallback to "Okänd säljare"
        const displayName = booking.user_display_name || booking.user_email || 'Okänd säljare';
        
        return {
          ...booking,
          status: typedStatus,
          user_display_name: displayName
        } as ShiftBooking;
      }) : [];
      
      // Filter to get only confirmed bookings for availability calculation
      const confirmedBookings = processedBookings.filter(booking => booking.status === 'confirmed');
      
      // Check if current user has booked this shift
      const isBookedByCurrentUser = user ? confirmedBookings.some(b => b.user_id === user.id) : false;
      
      // Calculate remaining slots based on confirmed bookings only
      const availableSlotsRemaining = shift.available_slots - confirmedBookings.length;
      
      return {
        ...shift,
        bookings: processedBookings,
        available_slots_remaining: availableSlotsRemaining,
        is_booked_by_current_user: isBookedByCurrentUser
      } as ShiftWithBookings;
    },
    enabled: !!shiftId, // Only run query when shiftId exists
    retry: 1,
  });
  
  return {
    shift: data,
    isLoading,
    error,
  };
};
