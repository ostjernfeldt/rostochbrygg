
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useShiftDetails = (shiftId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      if (!shiftId) {
        console.log('No shift ID provided, returning null');
        return null;
      }

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Authentication error:', authError);
          throw new Error('Authentication error. Please try logging in again.');
        }
        
        if (!user) {
          console.log('No authenticated user found');
          throw new Error('You must be logged in to view shift details');
        }
        
        // Fetch the shift
        const { data: shift, error: shiftError } = await supabase
          .from('shifts')
          .select('*')
          .eq('id', shiftId)
          .maybeSingle();
        
        if (shiftError) {
          console.error('Error fetching shift:', shiftError);
          throw shiftError;
        }
        
        if (!shift) {
          console.log('Shift not found');
          throw new Error('Could not find the shift');
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
          if (!booking) return null;
          
          // Ensure status is correctly typed
          const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
          
          // Use user_display_name from the booking if available, otherwise use the email, or fallback to "Unknown seller"
          const displayName = booking.user_display_name || booking.user_email || 'Unknown seller';
          
          return {
            ...booking,
            status: typedStatus,
            user_display_name: displayName
          } as ShiftBooking;
        }).filter(Boolean) : []; // Filter out any null values
        
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
      } catch (error) {
        console.error('Error in useShiftDetails query:', error);
        throw error;
      }
    },
    enabled: !!shiftId, // Only run query when shiftId exists
    retry: 1,
  });
  
  return {
    shift: data || null,
    isLoading,
    error,
  };
};
