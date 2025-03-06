
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
        .select('*, user_id')
        .eq('shift_id', shiftId);
      
      if (bookingsError) throw bookingsError;
      
      // Get user display names for each booking and ensure status is correctly typed
      const bookingsWithNames = await Promise.all(
        bookings.map(async (booking) => {
          // First check invitations for display_name
          const { data: invitationData } = await supabase
            .from('invitations')
            .select('display_name, email')
            .eq('email', booking.user_email)
            .maybeSingle();
          
          let displayName = booking.user_email || 'Okänd säljare';
          
          if (invitationData?.display_name) {
            displayName = invitationData.display_name;
          }
          
          // Ensure status is correctly typed as "confirmed" | "cancelled"
          const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
          
          return {
            ...booking,
            status: typedStatus,
            user_display_name: displayName
          } as ShiftBooking & { user_display_name: string };
        })
      );
      
      // Check if current user has booked this shift
      const isBookedByCurrentUser = user ? bookings.some(b => b.user_id === user.id) : false;
      
      // Calculate remaining slots
      const availableSlotsRemaining = shift.available_slots - bookings.length;
      
      return {
        ...shift,
        bookings: bookingsWithNames,
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
