
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
