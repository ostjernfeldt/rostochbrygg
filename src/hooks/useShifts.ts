
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Shift, ShiftWithBookings } from '@/types/booking';

export const useShifts = (startDate: Date, endDate: Date) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shifts', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
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
      
      return data as Shift[];
    },
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
        .select('*, staff_roles(user_display_name)')
        .eq('shift_id', shiftId);
      
      if (bookingsError) throw bookingsError;
      
      // Format the bookings
      const formattedBookings = bookings.map(booking => ({
        ...booking,
        user_display_name: booking.staff_roles?.user_display_name || null
      }));
      
      // Check if current user has booked this shift
      const isBookedByCurrentUser = user ? formattedBookings.some(b => b.user_id === user.id) : false;
      
      // Calculate remaining slots
      const availableSlotsRemaining = shift.available_slots - formattedBookings.length;
      
      return {
        ...shift,
        bookings: formattedBookings,
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
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);
      
      if (error) {
        console.error('Error deleting shift:', error);
        throw error;
      }
      
      return shiftId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: 'Säljpass borttaget',
        description: 'Säljpasset har tagits bort framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid borttagning av säljpass',
        description: error.message || 'Ett fel uppstod vid borttagning av säljpasset.',
      });
    },
  });
};
