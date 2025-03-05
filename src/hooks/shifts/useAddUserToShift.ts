
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Invitation } from '@/types/booking';

export const useAddUserToShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      shiftId, 
      userDisplayName 
    }: { 
      shiftId: string; 
      userDisplayName: string;
    }) => {
      if (!userDisplayName) {
        throw new Error('Ett användarnamn måste anges');
      }
      
      // First, find the user ID from staff_roles by display name
      const { data: staffMember, error: staffError } = await supabase
        .from('staff_roles')
        .select('id')
        .eq('user_display_name', userDisplayName)
        .maybeSingle();
      
      if (staffError) {
        console.error('Error finding staff member:', staffError);
        throw staffError;
      }
      
      // If no staff member found, check invitations
      let userId = staffMember?.id;
      
      if (!userId) {
        console.log('No staff member found, checking invitations for:', userDisplayName);
        
        // Try to find a user from invitations with this display name
        const { data: invitationData, error: invitationError } = await supabase
          .from('invitations')
          .select('email, display_name, status')
          .eq('display_name', userDisplayName)
          .eq('status', 'used')
          .maybeSingle();
          
        if (invitationError) {
          console.error('Error finding invitation:', invitationError);
          throw invitationError;
        }
        
        if (invitationData) {
          console.log('Found invitation data:', invitationData);
          
          // Since we specifically selected 'email' in the query, it should be available directly
          if (!invitationData.email) {
            console.error('Invitation found but email is missing:', invitationData);
            throw new Error(`Kunde inte hitta e-post för användaren "${userDisplayName}"`);
          }
          
          // Find the user ID from auth.users table using the email
          const { data: authUserData, error: authError } = await supabase.auth
            .admin.listUsers();
            
          if (authError) {
            console.error('Error finding user by email:', authError);
            throw authError;
          }
          
          // Find the user with matching email
          const matchingUser = authUserData?.users?.find(user => 
            user.email?.toLowerCase() === invitationData.email.toLowerCase());
            
          if (matchingUser) {
            userId = matchingUser.id;
          }
        }
      }
      
      if (!userId) {
        throw new Error(`Kunde inte hitta en användare med namnet "${userDisplayName}"`);
      }
      
      // Check if the user already has a booking for this shift
      const { data: existingBooking, error: checkError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing booking:', checkError);
        throw checkError;
      }
      
      if (existingBooking) {
        throw new Error(`${userDisplayName} är redan bokad på detta pass`);
      }
      
      // Check if the shift has available slots
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
      
      if (shiftError) {
        console.error('Error fetching shift:', shiftError);
        throw shiftError;
      }
      
      // Count existing bookings
      const { count, error: countError } = await supabase
        .from('shift_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', shiftId)
        .eq('status', 'confirmed');
      
      if (countError) {
        console.error('Error counting bookings:', countError);
        throw countError;
      }
      
      if (count !== null && count >= shift.available_slots) {
        throw new Error('Detta säljpass är fullbokat');
      }
      
      // Create the booking
      const { data, error } = await supabase
        .from('shift_bookings')
        .insert([
          {
            shift_id: shiftId,
            user_id: userId,
            status: 'confirmed'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding user to shift:', error);
        throw error;
      }
      
      return {
        ...data,
        user_display_name: userDisplayName
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift', variables.shiftId] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyBookingSummary'] });
      
      toast({
        title: 'Säljare tillagd',
        description: `${variables.userDisplayName} har lagts till på säljpasset.`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid tillägg av säljare',
        description: error.message || 'Ett fel uppstod vid tillägg av säljaren på säljpasset.',
      });
    },
  });
};
