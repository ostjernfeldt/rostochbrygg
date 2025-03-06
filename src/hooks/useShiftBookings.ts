
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WeeklyBookingSummary } from '@/types/booking';

export const useBookShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du måste vara inloggad för att boka pass');
      }

      // First, check if user already has a booking for this shift
      const { data: existingBookings } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', user.id);

      // Get the user's email and display_name from invitations table
      const { data: invitationData } = await supabase
        .from('invitations')
        .select('email, display_name')
        .eq('email', user.email)
        .single();

      let data;
      let error;

      if (existingBookings && existingBookings.length > 0) {
        // If there's an existing booking, update its status to 'confirmed'
        const existingBooking = existingBookings[0];
        if (existingBooking.status === 'confirmed') {
          throw new Error('Du har redan bokat detta pass');
        }

        // Update the existing booking to confirmed status
        const result = await supabase
          .from('shift_bookings')
          .update({ status: 'confirmed' })
          .eq('id', existingBooking.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create a new booking if none exists
        const result = await supabase
          .from('shift_bookings')
          .insert([{ 
            shift_id: shiftId, 
            user_id: user.id,
            user_email: user.email,
            user_display_name: invitationData?.display_name || user.email
          }])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error booking shift:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      toast({
        title: 'Pass bokat',
        description: 'Du har bokat passet framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid bokning',
        description: error.message || 'Ett fel uppstod vid bokningen av passet.',
      });
    },
  });
};

export const useBatchBookShifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du måste vara inloggad för att boka pass');
      }

      // Get the user's email and display_name from invitations table
      const { data: invitationData } = await supabase
        .from('invitations')
        .select('email, display_name')
        .eq('email', user.email)
        .single();

      // For each shift, check if user already has a booking
      const results = [];
      
      for (const shiftId of shiftIds) {
        // Check for existing bookings for this shift
        const { data: existingBookings } = await supabase
          .from('shift_bookings')
          .select('*')
          .eq('shift_id', shiftId)
          .eq('user_id', user.id);
        
        if (existingBookings && existingBookings.length > 0) {
          // If there's an existing booking that's already confirmed, skip it
          if (existingBookings[0].status === 'confirmed') {
            continue;
          }
          
          // If it's cancelled, update it to confirmed
          const { data, error } = await supabase
            .from('shift_bookings')
            .update({ status: 'confirmed' })
            .eq('id', existingBookings[0].id)
            .select();
          
          if (error) {
            console.error(`Error updating booking for shift ${shiftId}:`, error);
            throw error;
          }
          
          if (data) results.push(data[0]);
        } else {
          // Create a new booking if none exists
          const { data, error } = await supabase
            .from('shift_bookings')
            .insert([{
              shift_id: shiftId,
              user_id: user.id,
              user_email: user.email,
              user_display_name: invitationData?.display_name || user.email
            }])
            .select();
          
          if (error) {
            console.error(`Error creating booking for shift ${shiftId}:`, error);
            throw error;
          }
          
          if (data) results.push(data[0]);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: 'Pass bokade',
        description: 'Dina pass har bokats framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid bokning',
        description: error.message || 'Ett fel uppstod vid bokning av passen.',
      });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      console.log('Cancelling booking with ID:', bookingId);
      
      const { data, error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
    onError: (error) => {
      console.error('Error in cancel booking mutation:', error);
    },
  });
};

export const useCancelUserBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId }: { shiftId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du måste vara inloggad för att avboka pass');
      }

      const { data, error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('shift_id', shiftId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling user booking:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid avbokning',
        description: error.message || 'Ett fel uppstod vid avbokningen av passet.',
      });
    },
  });
};

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
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided and no user is logged in');
      }

      // Get confirmed bookings for the user within the date range
      const { data: bookings, error } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'confirmed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (error) {
        console.error('Error fetching weekly booking summary:', error);
        throw error;
      }

      // Create the summary
      const summary: WeeklyBookingSummary = {
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        total_bookings: bookings.length,
        meets_minimum_requirement: bookings.length >= 2
      };

      return summary;
    },
    enabled: true, // Always fetch when component mounts
  });
};
