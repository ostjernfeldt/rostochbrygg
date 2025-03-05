
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useGetShifts = (startDate: Date, endDate: Date) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shifts', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
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
      
      const shiftIds = data.map(shift => shift.id);
      const { data: bookings, error: bookingsError } = await supabase
        .from('shift_bookings')
        .select('*')
        .in('shift_id', shiftIds);
      
      if (bookingsError) {
        console.error('Error fetching shift bookings:', bookingsError);
        throw bookingsError;
      }
      
      const shiftsWithBookings: ShiftWithBookings[] = data.map(shift => {
        const shiftBookings = bookings.filter(booking => booking.shift_id === shift.id)
          .map(booking => {
            const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
            
            return {
              ...booking,
              status: typedStatus
            } as ShiftBooking;
          });
          
        const isBooked = user ? shiftBookings.some(booking => booking.user_id === user.id) : false;
        
        return {
          ...shift,
          bookings: shiftBookings,
          available_slots_remaining: shift.available_slots - shiftBookings.length,
          is_booked_by_current_user: isBooked
        };
      });
      
      return shiftsWithBookings;
    },
  });
  
  return {
    shifts: data || [],
    isLoading,
    error,
  };
};
