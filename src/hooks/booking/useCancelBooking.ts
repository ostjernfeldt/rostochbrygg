
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// For admin use - cancel any booking by ID
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      console.log('Cancelling booking with ID:', bookingId);
      
      // Update without using select() to avoid empty response issues
      const { error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      // Fetch the updated booking to ensure we have data to return
      const { data: updatedBooking, error: fetchError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching updated booking:', fetchError);
        // Return a minimal object if we can't fetch the updated booking
        return { id: bookingId, status: 'cancelled' };
      }

      return updatedBooking || { id: bookingId, status: 'cancelled' };
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

// For user cancellations - cancel current user's booking for a shift
export const useCancelUserBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId }: { shiftId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du måste vara inloggad för att avboka pass');
      }

      // Update without using select() to avoid empty response issues
      const { error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('shift_id', shiftId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error cancelling user booking:', error);
        throw error;
      }

      // Fetch the updated booking to ensure we have data to return
      const { data: updatedBooking, error: fetchError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching updated booking:', fetchError);
        // Return a minimal object if we can't fetch the updated booking
        return { shift_id: shiftId, user_id: user.id, status: 'cancelled' };
      }

      return updatedBooking || { shift_id: shiftId, user_id: user.id, status: 'cancelled' };
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
