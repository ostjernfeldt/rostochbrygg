
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// For admin use - cancel any booking by ID
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      console.log('Cancelling booking with ID:', bookingId);
      
      // First, get the current booking data before updating
      const { data: currentBooking, error: fetchError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching booking before cancel:', fetchError);
        throw fetchError;
      }
      
      if (!currentBooking) {
        console.error('Booking not found with ID:', bookingId);
        throw new Error('Booking not found');
      }
      
      // Update the booking status
      const { error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      // Since we already have the booking data, just return it with updated status
      return { 
        ...currentBooking, 
        status: 'cancelled' 
      };
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

      // First, get the current booking before updating
      const { data: currentBooking, error: fetchError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching booking before user cancel:', fetchError);
        throw fetchError;
      }
      
      if (!currentBooking) {
        console.error('User booking not found for shift:', shiftId);
        throw new Error('Booking not found');
      }

      // Update the booking status
      const { error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('shift_id', shiftId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error cancelling user booking:', error);
        throw error;
      }

      // Return the booking with updated status
      return {
        ...currentBooking,
        status: 'cancelled'
      };
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
