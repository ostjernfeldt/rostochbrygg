
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useShifts = (startDate: Date, endDate: Date, isAdmin = false) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shifts', startDate.toISOString(), endDate.toISOString(), isAdmin],
    queryFn: async () => {
      console.log('Fetching shifts for date range:', startDate.toISOString(), 'to', endDate.toISOString());
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error fetching user:', authError);
        throw new Error('Authentication error. Please try logging in again.');
      }
      
      if (!user) {
        console.log('No authenticated user found, returning empty shifts array');
        return [];
      }
      
      console.log('Fetching shifts for user:', user.id);
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')
        .order('start_time');
      
      if (error) {
        console.error('Error fetching shifts:', error);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        console.log('No shifts data returned or invalid format');
        return [];
      }
      
      console.log('Retrieved shifts:', data.length);
      
      // Get all bookings for retrieved shifts
      const shiftIds = data.map(shift => shift.id);
      
      // If no shifts, return empty array
      if (shiftIds.length === 0) {
        console.log('No shifts found for the date range');
        return [];
      }
      
      let bookingsData = [];
      
      try {
        const { data: bookings, error: bookingsError } = await supabase
          .from('shift_bookings')
          .select('*')
          .in('shift_id', shiftIds);
        
        if (bookingsError) {
          console.error('Error fetching shift bookings:', bookingsError);
          throw bookingsError;
        }
        
        if (bookings && Array.isArray(bookings)) {
          bookingsData = bookings;
        }
        
        console.log('Retrieved bookings:', bookingsData.length);
      } catch (error) {
        console.error('Error in bookings fetch:', error);
        // Continue with empty bookings rather than fail the whole query
        bookingsData = [];
      }
      
      // Transform shifts to ShiftWithBookings
      const shiftsWithBookings: ShiftWithBookings[] = data.map(shift => {
        const shiftBookings = bookingsData
          ? bookingsData.filter(booking => booking.shift_id === shift.id)
              .map(booking => {
                // Ensure status is correctly typed as "confirmed" | "cancelled"
                const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
                
                return {
                  ...booking,
                  status: typedStatus,
                  // Use user_display_name if available, otherwise use user_email or fallback to "Okänd säljare"
                  user_display_name: booking.user_display_name || booking.user_email || 'Okänd säljare'
                } as ShiftBooking;
              })
          : [];
          
        // Get only confirmed bookings for availability calculation
        const confirmedBookings = shiftBookings.filter(booking => booking.status === 'confirmed');
        
        // Check if user has a confirmed booking for this shift
        const isBooked = user 
          ? confirmedBookings.some(booking => booking.user_id === user.id) 
          : false;
        
        return {
          ...shift,
          bookings: shiftBookings,
          available_slots_remaining: shift.available_slots - confirmedBookings.length,
          is_booked_by_current_user: isBooked
        };
      });
      
      return shiftsWithBookings;
    },
    // Only run this query when startDate and endDate are valid
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60, // Refresh cache every minute
    retry: 1, // Only retry once to avoid excessive retries on auth issues
  });
  
  return {
    shifts: data || [],
    isLoading,
    error,
  };
};
