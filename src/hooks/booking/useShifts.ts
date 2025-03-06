
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';
import { toast } from '@/components/ui/use-toast';

export const useShifts = (startDate: Date, endDate: Date, isAdmin = false) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shifts', startDate.toISOString(), endDate.toISOString(), isAdmin],
    queryFn: async () => {
      console.log('Fetching shifts for date range:', startDate.toISOString(), 'to', endDate.toISOString());
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Error fetching user:', authError);
          toast({
            title: "Authentication error",
            description: "Please try logging in again.",
            variant: "destructive"
          });
          return [];
        }
        
        if (!user) {
          console.log('No authenticated user found, returning empty shifts array');
          // Don't show error toast for simply not being logged in
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
          toast({
            title: "Error fetching shifts",
            description: error.message,
            variant: "destructive"
          });
          return [];
        }
        
        // Ensure we have an array to work with, even if data is null/undefined
        const shiftsData = data || [];
        console.log('Retrieved shifts:', shiftsData.length);
        
        // Get all bookings for retrieved shifts
        const shiftIds = shiftsData.map(shift => shift.id);
        
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
            toast({
              title: "Error fetching bookings",
              description: bookingsError.message,
              variant: "destructive"
            });
            // Continue with empty bookings rather than fail the whole query
            bookingsData = [];
          } else {
            // Ensure we have an array to work with
            bookingsData = bookings || [];
            console.log('Retrieved bookings:', bookingsData.length);
          }
        } catch (error) {
          console.error('Error in bookings fetch:', error);
          // Continue with empty bookings rather than fail the whole query
          bookingsData = [];
        }
        
        // Transform shifts to ShiftWithBookings
        const shiftsWithBookings: ShiftWithBookings[] = shiftsData.map(shift => {
          // Ensure we have valid booking objects and filter out any null/undefined ones
          const shiftBookings = Array.isArray(bookingsData) 
            ? bookingsData
                .filter(booking => booking && booking.shift_id === shift.id)
                .map(booking => {
                  // Ensure status is correctly typed as "confirmed" | "cancelled"
                  const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
                  
                  return {
                    ...booking,
                    status: typedStatus,
                    // Use user_display_name if available, otherwise use user_email or fallback to "Unknown seller"
                    user_display_name: booking.user_display_name || booking.user_email || 'Unknown seller'
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
      } catch (error) {
        console.error('Unexpected error in useShifts query:', error);
        toast({
          title: "Error loading shifts",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
        // Always return an empty array instead of null/undefined
        return [];
      }
    },
    // Only run this query when startDate and endDate are valid
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60, // Refresh cache every minute
    retry: 1, // Only retry once to avoid excessive retries on auth issues
  });
  
  // Explicitly ensure we always return an array, even during loading or error states
  return {
    shifts: Array.isArray(data) ? data : [],
    isLoading,
    error,
  };
};
