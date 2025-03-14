
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  getCurrentUser,
  fetchExistingBooking, 
  fetchUserStaffRole,
  updateCancelledBooking,
  createNewBooking
} from './utils/bookingOperations';
import { ShiftBooking } from '@/types/booking';

export const useBookShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      try {
        // Check if shift ID is valid
        if (!shiftId) {
          throw new Error('Ogiltig pass-ID');
        }

        const user = await getCurrentUser();
        console.log('Booking shift for user:', user.id, user.email);

        // First check if user already has a CONFIRMED booking for this shift
        const existingConfirmedBookings = await fetchExistingBooking(shiftId, user.id, 'confirmed');

        // If user already has a confirmed booking, prevent rebooking
        if (existingConfirmedBookings && existingConfirmedBookings.length > 0) {
          throw new Error('Du har redan bokat detta pass');
        }

        // Get the user's display name from staff_roles table by matching email
        const staffRoleData = await fetchUserStaffRole(user.email!);
        const displayName = staffRoleData.user_display_name;
        console.log('Using display name from staff_roles:', displayName);

        // Check if there's a cancelled booking for this shift
        const existingCancelledBookings = await fetchExistingBooking(shiftId, user.id, 'cancelled');
        
        let bookingResult: ShiftBooking;
        
        // If there's a cancelled booking, update it to confirmed
        if (existingCancelledBookings && existingCancelledBookings.length > 0) {
          console.log('Found cancelled booking, updating status to confirmed');
          const cancelledBooking = existingCancelledBookings[0] as ShiftBooking;
          const bookingId = cancelledBooking.id;
          
          // Update the cancelled booking to confirmed
          bookingResult = await updateCancelledBooking(bookingId, displayName, cancelledBooking);
        } else {
          // No existing bookings, create a new one
          bookingResult = await createNewBooking(shiftId, user.id, user.email!, displayName);
        }
        
        // Final validation to ensure we're returning valid data
        if (!bookingResult) {
          console.error('No booking result data available!');
          throw new Error('Ingen data returnerades från bokningsoperationen');
        }
        
        console.log('Booking completed successfully:', bookingResult);
        return bookingResult;
      } catch (error) {
        console.error('Error in booking mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Booking successful:', data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
      toast({
        title: 'Pass bokat',
        description: 'Du har bokat passet framgångsrikt.',
      });
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Fel vid bokning',
        description: error instanceof Error ? error.message : 'Ett fel uppstod vid bokningen av passet.',
      });
    },
  });
};
