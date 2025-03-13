
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';
import { toast } from '@/components/ui/use-toast';

export const useShiftDetails = (shiftId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      if (!shiftId) {
        console.log('No shift ID provided, returning null');
        return null;
      }

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Authentication error:', authError);
          toast({
            title: "Authentication error",
            description: "Please try logging in again.",
            variant: "destructive"
          });
          return null;
        }
        
        if (!user) {
          console.log('No authenticated user found');
          toast({
            title: "Authentication required",
            description: "You must be logged in to view shift details",
            variant: "destructive"
          });
          return null;
        }
        
        // Fetch the shift
        const { data: shift, error: shiftError } = await supabase
          .from('shifts')
          .select('*')
          .eq('id', shiftId)
          .maybeSingle();
        
        if (shiftError) {
          console.error('Error fetching shift:', shiftError);
          toast({
            title: "Error fetching shift",
            description: shiftError.message,
            variant: "destructive"
          });
          return null;
        }
        
        if (!shift) {
          console.log('Shift not found');
          toast({
            title: "Shift not found",
            description: "Could not find the requested shift",
            variant: "destructive"
          });
          return null;
        }
        
        // Fetch all bookings for this shift
        const { data: bookings, error: bookingsError } = await supabase
          .from('shift_bookings')
          .select('*')
          .eq('shift_id', shiftId);
        
        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          toast({
            title: "Error fetching bookings",
            description: bookingsError.message,
            variant: "destructive"
          });
          // Still continue, just with empty bookings
        }

        // Fetch the current user's staff role to get the display name
        const { data: staffRole, error: staffRoleError } = await supabase
          .from('staff_roles')
          .select('user_display_name')
          .eq('email', user.email)
          .maybeSingle();

        if (staffRoleError) {
          console.error('Error fetching staff role:', staffRoleError);
        }
        
        const currentUserDisplayName = staffRole?.user_display_name || null;
        console.log('Current user display name from staff_roles:', currentUserDisplayName);
        
        // Initialize bookings as empty array if undefined
        const processedBookings = Array.isArray(bookings) ? bookings.map(booking => {
          if (!booking) return null;
          
          // Ensure status is correctly typed
          const typedStatus = booking.status === 'cancelled' ? 'cancelled' : 'confirmed';
          
          // If this is the current user's booking, use their display name from staff_roles
          let displayName = booking.user_display_name || booking.user_email || 'Unknown seller';
          
          // Update the current user's booking with their proper display name
          if (booking.user_id === user.id && currentUserDisplayName) {
            displayName = currentUserDisplayName;
          }
          
          return {
            ...booking,
            status: typedStatus,
            user_display_name: displayName
          } as ShiftBooking;
        }).filter(Boolean) : []; // Filter out any null values
        
        // Filter to get only confirmed bookings for availability calculation
        const confirmedBookings = processedBookings.filter(booking => booking.status === 'confirmed');
        
        // Check if current user has booked this shift
        const isBookedByCurrentUser = user ? confirmedBookings.some(b => b.user_id === user.id) : false;
        
        // Calculate remaining slots based on confirmed bookings only
        const availableSlotsRemaining = shift.available_slots - confirmedBookings.length;
        
        return {
          ...shift,
          bookings: processedBookings,
          available_slots_remaining: availableSlotsRemaining,
          is_booked_by_current_user: isBookedByCurrentUser
        } as ShiftWithBookings;
      } catch (error) {
        console.error('Error in useShiftDetails query:', error);
        toast({
          title: "Error loading shift details",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!shiftId, // Only run query when shiftId exists
    retry: 1,
  });
  
  return {
    shift: data || null,
    isLoading,
    error,
  };
};
