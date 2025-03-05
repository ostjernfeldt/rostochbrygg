
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ShiftBooking, WeeklyBookingSummary } from '@/types/booking';

export const useGetWeeklyBookings = (weekStart: Date) => {
  const weekEnd = addDays(weekStart, 6);
  
  return useQuery({
    queryKey: ['weeklyBookings', weekStart.toISOString()],
    queryFn: async () => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Format dates for the query
      const formattedStartDate = format(weekStart, 'yyyy-MM-dd');
      const formattedEndDate = format(weekEnd, 'yyyy-MM-dd');
      
      console.log(`Fetching bookings for user ${user.id} from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Get all shifts in the date range
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, date')
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
      
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        throw shiftsError;
      }
      
      if (shifts.length === 0) {
        console.log('No shifts found for the specified date range');
        return {
          week_start: formattedStartDate,
          week_end: formattedEndDate,
          total_bookings: 0,
          meets_minimum_requirement: false
        } as WeeklyBookingSummary;
      }
      
      const shiftIds = shifts.map(shift => shift.id);
      
      // Get user's bookings for these shifts
      const { data: bookings, error: bookingsError } = await supabase
        .from('shift_bookings')
        .select('*')
        .in('shift_id', shiftIds)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }
      
      console.log(`Found ${bookings.length} bookings for user ${user.id}`);
      
      const meetsRequirement = bookings.length >= 2;
      
      return {
        week_start: formattedStartDate,
        week_end: formattedEndDate,
        total_bookings: bookings.length,
        meets_minimum_requirement: meetsRequirement
      } as WeeklyBookingSummary;
    }
  });
};
