
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyBookingSummary } from '@/types/booking';

export const useWeeklyBookingSummary = (userId?: string, startDate?: Date) => {
  const currentDate = startDate || new Date();
  const weekStart = new Date(currentDate);
  weekStart.setHours(0, 0, 0, 0);
  
  // Ensure the date is set to Monday of the current week
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  
  // Calculate week end (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: ['weekly-booking-summary', userId, weekStart.toISOString()],
    queryFn: async () => {
      console.log('Fetching weekly booking summary for date range:', weekStart.toISOString(), 'to', weekEnd.toISOString());
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error fetching current user:', authError);
        throw new Error('Authentication error');
      }
      
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        console.log('No user ID provided and no user is logged in, returning empty summary');
        return {
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          total_bookings: 0,
          meets_minimum_requirement: false
        };
      }

      // Get shifts for the week
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, date')
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);
      
      if (shiftsError) {
        console.error('Error fetching shifts for weekly summary:', shiftsError);
        throw shiftsError;
      }
      
      const shiftIds = shifts.map(shift => shift.id);
      
      console.log('Found shifts for the week:', shiftIds.length);
      
      // If no shifts exist for this week, return zero bookings
      if (shiftIds.length === 0) {
        return {
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          total_bookings: 0,
          meets_minimum_requirement: false
        };
      }
      
      // Get confirmed bookings for the user for these specific shifts
      const { data: bookings, error } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'confirmed')
        .in('shift_id', shiftIds);

      if (error) {
        console.error('Error fetching weekly booking summary:', error);
        throw error;
      }

      console.log('Found confirmed bookings for the week:', bookings ? bookings.length : 0);

      // Create the summary
      const summary: WeeklyBookingSummary = {
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        total_bookings: bookings ? bookings.length : 0,
        meets_minimum_requirement: bookings ? bookings.length >= 2 : false
      };

      return summary;
    },
    // Only run this query when we have a user (either from auth or passed as prop)
    enabled: true, // We return a fallback object if no user is found
    staleTime: 1000 * 60, // Refresh cache every minute
    retry: 1, // Limit retries to avoid infinite loops on auth issues
  });
};
