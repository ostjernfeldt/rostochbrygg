
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
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      // Fetch the updated booking to ensure we have the correct data
      const { data: updatedBooking, error: fetchUpdatedError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
        
      if (fetchUpdatedError) {
        console.error('Error fetching booking after cancel:', fetchUpdatedError);
        // If fetch fails, create a result with the data we know is correct
        return { 
          ...currentBooking, 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        };
      }
      
      if (!updatedBooking) {
        console.error('Updated booking not found after cancel:', bookingId);
        // If booking not found, create a result with the data we know is correct
        return { 
          ...currentBooking, 
          status: 'cancelled',
          updated_at: new Date().toISOString() 
        };
      }
      
      // Return the updated booking with the cancelled status
      return updatedBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
    },
    onError: (error) => {
      console.error('Error in cancel booking mutation:', error);
      toast({
        variant: 'destructive',
        title: 'Fel vid avbokning',
        description: error instanceof Error ? error.message : 'Ett fel uppstod vid avbokningen.',
      });
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
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('shift_id', shiftId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error cancelling user booking:', error);
        throw error;
      }

      // Fetch the updated booking to ensure we have the correct data
      const { data: updatedBooking, error: fetchUpdatedError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('id', currentBooking.id)
        .maybeSingle();
        
      if (fetchUpdatedError || !updatedBooking) {
        console.error('Error fetching updated user booking:', fetchUpdatedError);
        // Return the booking with updated status using our known data
        return {
          ...currentBooking,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        };
      }

      // Return the updated booking with cancelled status
      return updatedBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
      
      toast({
        title: 'Pass avbokat',
        description: 'Du har avbokat passet framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid avbokning',
        description: error instanceof Error ? error.message : 'Ett fel uppstod vid avbokningen av passet.',
      });
    },
  });
};
