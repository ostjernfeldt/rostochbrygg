
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Shift, ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useShifts = (startDate: Date, endDate: Date) => {
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

export const useShiftDetails = (shiftId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
      
      if (shiftError) throw shiftError;
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('shift_bookings')
        .select('*, user_id')
        .eq('shift_id', shiftId);
      
      if (bookingsError) throw bookingsError;
      
      const bookingsWithNames = await Promise.all(
        bookings.map(async (booking) => {
          // Get the user's display name from staff_roles
          const { data: staffData, error: staffError } = await supabase
            .from('staff_roles')
            .select('user_display_name')
            .eq('id', booking.user_id)
            .maybeSingle();
          
          // If no staff_role found or there was an error, try to get the name from invitations
          let displayName = staffData?.user_display_name;
          
          if (!displayName || staffError) {
            console.log(`No staff role found for user ${booking.user_id}, checking invitations`);
            
            // Get user email to match with invitation
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
              booking.user_id
            );
            
            if (!userError && userData?.user?.email) {
              // Find invitation by email
              const { data: invitationData, error: invitationError } = await supabase
                .from('invitations')
                .select('display_name')
                .eq('email', userData.user.email)
                .maybeSingle();
              
              if (!invitationError && invitationData?.display_name) {
                displayName = invitationData.display_name;
                console.log(`Found display name in invitations: ${displayName}`);
              }
            }
          }
          
          const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
          
          return {
            ...booking,
            status: typedStatus,
            user_display_name: displayName || 'Okänd säljare'
          } as ShiftBooking & { user_display_name: string };
        })
      );
      
      const isBookedByCurrentUser = user ? bookings.some(b => b.user_id === user.id) : false;
      
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
