
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

      // Get the user's display name from staff_roles table
      const { data: staffRoleData, error: staffRoleError } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('id', user.id)
        .maybeSingle();

      let displayName = user.email;

      // If not found in staff_roles, try to get from invitations as fallback
      if (staffRoleError || !staffRoleData) {
        const { data: invitationData } = await supabase
          .from('invitations')
          .select('email, display_name')
          .eq('email', user.email)
          .maybeSingle();
          
        if (invitationData && invitationData.display_name) {
          displayName = invitationData.display_name;
        }
      } else {
        displayName = staffRoleData.user_display_name;
      }

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
          .update({ 
            status: 'confirmed',
            user_display_name: displayName  // Ensure display name is updated
          })
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
            user_display_name: displayName,
            status: 'confirmed'
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

      console.log('Batch booking shifts for user:', user.id, user.email);

      // Get the user's display name from staff_roles table first
      const { data: staffRoleData, error: staffRoleError } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('id', user.id)
        .maybeSingle();

      let displayName = user.email;

      // If not found in staff_roles, try to get from invitations as fallback
      if (staffRoleError || !staffRoleData) {
        console.log('Staff role not found, checking invitations');
        const { data: invitationData } = await supabase
          .from('invitations')
          .select('email, display_name')
          .eq('email', user.email)
          .maybeSingle();
          
        if (invitationData && invitationData.display_name) {
          displayName = invitationData.display_name;
          console.log('Using display name from invitation:', displayName);
        }
      } else {
        displayName = staffRoleData.user_display_name;
        console.log('Using display name from staff_roles:', displayName);
      }

      // For each shift, check if user already has a booking
      const results = [];
      const errors = [];
      
      for (const shiftId of shiftIds) {
        try {
          console.log('Processing shift:', shiftId);
          
          // Check for existing bookings for this shift
          const { data: existingBookings, error: existingBookingsError } = await supabase
            .from('shift_bookings')
            .select('*')
            .eq('shift_id', shiftId)
            .eq('user_id', user.id);
          
          if (existingBookingsError) {
            console.error(`Error checking existing bookings for shift ${shiftId}:`, existingBookingsError);
            errors.push({ shiftId, error: existingBookingsError });
            continue;
          }
          
          if (existingBookings && existingBookings.length > 0) {
            // If there's an existing booking that's already confirmed, skip it
            if (existingBookings[0].status === 'confirmed') {
              console.log(`Shift ${shiftId} already booked, skipping`);
              continue;
            }
            
            // If it's cancelled, update it to confirmed
            const { data, error } = await supabase
              .from('shift_bookings')
              .update({ 
                status: 'confirmed',
                user_display_name: displayName  // Ensure display name is updated
              })
              .eq('id', existingBookings[0].id)
              .select();
            
            if (error) {
              console.error(`Error updating booking for shift ${shiftId}:`, error);
              errors.push({ shiftId, error });
              continue;
            }
            
            if (data) {
              console.log(`Successfully updated booking for shift ${shiftId}`);
              results.push(data[0]);
            }
          } else {
            // Create a new booking if none exists
            console.log(`Creating new booking for shift ${shiftId}`);
            const { data, error } = await supabase
              .from('shift_bookings')
              .insert([{
                shift_id: shiftId,
                user_id: user.id,
                user_email: user.email,
                user_display_name: displayName,
                status: 'confirmed'
              }])
              .select();
            
            if (error) {
              console.error(`Error creating booking for shift ${shiftId}:`, error);
              errors.push({ shiftId, error });
              continue;
            }
            
            if (data) {
              console.log(`Successfully created booking for shift ${shiftId}`);
              results.push(data[0]);
            }
          }
        } catch (error) {
          console.error(`Unexpected error processing shift ${shiftId}:`, error);
          errors.push({ shiftId, error });
        }
      }

      if (errors.length > 0) {
        console.error('Batch booking encountered errors:', errors);
        if (results.length === 0) {
          throw new Error('Inga pass kunde bokas. Vänligen försök igen.');
        }
      }

      return { results, errors };
    },
    onSuccess: (data) => {
      console.log('Batch booking success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-booking-summary'] });
      
      // Show appropriate toast based on partial or complete success
      if (data.errors && data.errors.length > 0) {
        if (data.results && data.results.length > 0) {
          toast({
            title: 'Delvis framgång',
            description: `${data.results.length} pass bokades framgångsrikt, men ${data.errors.length} kunde inte bokas.`,
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Pass bokade',
          description: 'Dina pass har bokats framgångsrikt.',
        });
      }
    },
    onError: (error) => {
      console.error('Batch booking error:', error);
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
      console.log('Fetching weekly booking summary for date range:', weekStart.toISOString(), 'to', weekEnd.toISOString());
      
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided and no user is logged in');
      }

      // Get confirmed bookings for the user within the date range
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, date')
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);
      
      if (shiftsError) {
        console.error('Error fetching shifts for weekly summary:', shiftsError);
        throw shiftsError;
      }
      
      const shiftIds = shifts.map(shift => shift.id);
      
      console.log('Found shifts for the week:', shiftIds.length);
      
      // If no shifts exist for this week, return zero bookings
      if (shiftIds.length === 0) {
        return {
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          total_bookings: 0,
          meets_minimum_requirement: false
        };
      }
      
      // Get confirmed bookings for the user for these specific shifts
      const { data: bookings, error } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'confirmed')
        .in('shift_id', shiftIds);

      if (error) {
        console.error('Error fetching weekly booking summary:', error);
        throw error;
      }

      console.log('Found confirmed bookings for the week:', bookings ? bookings.length : 0);

      // Create the summary
      const summary: WeeklyBookingSummary = {
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        total_bookings: bookings ? bookings.length : 0,
        meets_minimum_requirement: bookings ? bookings.length >= 2 : false
      };

      return summary;
    },
    staleTime: 1000 * 60, // Refresh cache every minute
    enabled: true, // Always fetch when component mounts
  });
};
