
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
      
      // Store the current data for reference
      const bookingBeforeUpdate = { ...currentBooking };
      
      // Update the booking status
      const { data: updateData, error: updateError } = await supabase
        .from('shift_bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select('*')
        .maybeSingle();

      if (updateError) {
        console.error('Error cancelling booking:', updateError);
        throw updateError;
      }
      
      // If update worked but didn't return data, fetch it explicitly
      if (!updateData) {
        console.log('No data returned from cancel operation, fetching booking explicitly');
        
        const { data: refetchedBooking, error: refetchError } = await supabase
          .from('shift_bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle();
          
        if (refetchError) {
          console.error('Error fetching updated booking after cancel:', refetchError);
          // Return manually updated object as fallback
          return { 
            ...bookingBeforeUpdate, 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          };
        }
        
        if (!refetchedBooking) {
          console.error('Could not find booking after update:', bookingId);
          // Return manually updated object as fallback
          return { 
            ...bookingBeforeUpdate, 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          };
        }
        
        return refetchedBooking;
      }
      
      // Return the updated booking with the cancelled status
      return updateData;
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

      // Store the current data for reference
      const bookingBeforeUpdate = { ...currentBooking };

      // Update the booking status with direct selection in the same query
      const { data: updateData, error: updateError } = await supabase
        .from('shift_bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('shift_id', shiftId)
        .eq('user_id', user.id)
        .select('*')
        .maybeSingle();

      if (updateError) {
        console.error('Error cancelling user booking:', updateError);
        throw updateError;
      }

      // If update worked but didn't return data, fetch it explicitly
      if (!updateData) {
        console.log('No data returned from user cancel operation, fetching explicitly');
        
        const { data: refetchedBooking, error: refetchError } = await supabase
          .from('shift_bookings')
          .select('*')
          .eq('id', currentBooking.id)
          .maybeSingle();
          
        if (refetchError) {
          console.error('Error fetching updated user booking after cancel:', refetchError);
          // Return manually updated object as fallback
          return {
            ...bookingBeforeUpdate,
            status: 'cancelled',
            updated_at: new Date().toISOString()
          };
        }
        
        if (!refetchedBooking) {
          console.error('Could not find booking after user cancel:', currentBooking.id);
          // Return manually updated object as fallback
          return {
            ...bookingBeforeUpdate,
            status: 'cancelled',
            updated_at: new Date().toISOString()
          };
        }
        
        return refetchedBooking;
      }

      // Return the updated booking with cancelled status
      return updateData;
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
