
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Shift, ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useShifts = (startDate: Date, endDate: Date) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shifts', startDate.toISOString(), endDate.toISOString()],
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
      
      console.log('Retrieved shifts:', data ? data.length : 0);
      
      // Get all bookings for retrieved shifts
      const shiftIds = data.map(shift => shift.id);
      
      // If no shifts, return empty array
      if (shiftIds.length === 0) {
        console.log('No shifts found for the date range');
        return [];
      }
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('shift_bookings')
        .select('*')
        .in('shift_id', shiftIds);
      
      if (bookingsError) {
        console.error('Error fetching shift bookings:', bookingsError);
        throw bookingsError;
      }
      
      console.log('Retrieved bookings:', bookings ? bookings.length : 0);
      
      // Transform shifts to ShiftWithBookings
      const shiftsWithBookings: ShiftWithBookings[] = data.map(shift => {
        const shiftBookings = bookings
          ? bookings.filter(booking => booking.shift_id === shift.id)
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
    enabled: !!shiftId,
  });
  
  return {
    shift: data,
    isLoading,
    error,
  };
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftData: Omit<Shift, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du måste vara inloggad för att skapa säljpass');
      
      const { data, error } = await supabase
        .from('shifts')
        .insert([{ ...shiftData, created_by: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating shift:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: 'Säljpass skapat',
        description: 'Säljpasset har skapats framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid skapande av säljpass',
        description: error.message || 'Ett fel uppstod vid skapande av säljpasset.',
      });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftId: string) => {
      try {
        console.log('Attempting to delete shift with ID:', shiftId);
        
        // First, delete all associated bookings for this shift
        const { error: bookingsDeleteError } = await supabase
          .from('shift_bookings')
          .delete()
          .eq('shift_id', shiftId);
        
        if (bookingsDeleteError) {
          console.error('Error deleting associated bookings:', bookingsDeleteError);
          throw bookingsDeleteError;
        }
        
        console.log('Successfully deleted all bookings for shift:', shiftId);
        
        // Now delete the shift itself
        const { error: shiftDeleteError } = await supabase
          .from('shifts')
          .delete()
          .eq('id', shiftId);
        
        if (shiftDeleteError) {
          console.error('Error deleting shift:', shiftDeleteError);
          throw shiftDeleteError;
        }
        
        console.log('Successfully deleted shift:', shiftId);
        return shiftId;
      } catch (error) {
        console.error('Error in delete shift process:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: 'Säljpass borttaget',
        description: 'Säljpasset och tillhörande bokningar har tagits bort framgångsrikt.',
      });
    },
    onError: (error) => {
      console.error('Error in useDeleteShift:', error);
      toast({
        variant: 'destructive',
        title: 'Fel vid borttagning av säljpass',
        description: error.message || 'Ett fel uppstod vid borttagning av säljpasset.',
      });
    },
  });
};
