
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShiftWithBookings, ShiftBooking } from '@/types/booking';

export const useGetShiftDetails = (shiftId: string) => {
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
