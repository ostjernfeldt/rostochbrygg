
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/booking';

type Seller = {
  id: string;
  user_display_name: string;
};

export const useGetAllSellers = () => {
  return useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      // Get all staff roles (sellers)
      const { data: staffRoles, error: staffError } = await supabase
        .from('staff_roles')
        .select('id, user_display_name')
        .eq('hidden', false)
        .order('user_display_name');
      
      if (staffError) {
        console.error('Error fetching sellers:', staffError);
        throw staffError;
      }
      
      // Get all users who registered through invitations but don't have staff roles yet
      const { data: invitedUsers, error: invitedError } = await supabase
        .from('invitations')
        .select('display_name, email, status')
        .eq('status', 'used');
        
      if (invitedError) {
        console.error('Error fetching invited users:', invitedError);
        throw invitedError;
      }
      
      // Make sure invitedUsers has the expected shape with email property
      const typedInvitations = invitedUsers as Invitation[];
      
      // Check if invitedUsers with display_name are already in staffRoles
      const additionalSellers = typedInvitations
        .filter(invitation => invitation.display_name)
        .filter(invitation => 
          !staffRoles.some(staff => 
            staff.user_display_name.toLowerCase() === invitation.display_name?.toLowerCase()
          )
        )
        .map(invitation => ({
          id: invitation.email, // Use email as ID for invited users without a staff role
          user_display_name: invitation.display_name || ''
        }));
      
      // Combine staff roles with additional sellers from invitations
      const sellers: Seller[] = [
        ...staffRoles,
        ...additionalSellers
      ].sort((a, b) => a.user_display_name.localeCompare(b.user_display_name));
      
      return sellers;
    },
  });
};
