
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ShiftBooking } from '@/types/booking';
import { processBatchBookings } from './utils/batchBookingOperations';

export interface SellerBooking {
  shiftId: string;
  userDisplayName: string;
  userEmail?: string;
}

export interface BatchBookingResult {
  results: ShiftBooking[];
  errors: string[];
}

export const useBatchBookShifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processBatchBookings,
    onSuccess: (data) => {
      console.log('Batch booking successful:', data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
      
      if (data.results.length > 0) {
        toast({
          title: 'Säljare tillagda',
          description: `${data.results.length} säljare har lagts till i passet.`,
        });
      }
    },
    onError: (error) => {
      console.error('Batch booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Fel vid tillägg av säljare',
        description: error instanceof Error ? error.message : 'Ett fel uppstod vid tillägg av säljare.',
      });
    },
  });
};
