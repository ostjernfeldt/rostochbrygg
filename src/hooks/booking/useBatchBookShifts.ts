
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useBatchBookShifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du måste vara inloggad för att boka pass');
      }

      console.log('Batch booking shifts for user:', user.id, user.email);

      // Get the user's display name from staff_roles table by matching email
      const { data: staffRoleData, error: staffRoleError } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('email', user.email)
        .maybeSingle();

      if (staffRoleError) {
        console.error('Error fetching staff role:', staffRoleError);
        throw new Error('Du måste vara registrerad som säljare för att boka pass');
      }

      if (!staffRoleData) {
        throw new Error('Du måste vara registrerad som säljare för att boka pass');
      }

      const displayName = staffRoleData.user_display_name;
      console.log('Using display name from staff_roles:', displayName);

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
                user_display_name: displayName
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
