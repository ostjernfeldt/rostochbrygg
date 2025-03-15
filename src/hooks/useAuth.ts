
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth-user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAuthenticated: false, isAdmin: false };
      
      const { data, error } = await supabase.rpc('get_user_role', { user_id: user.id });
      if (error) {
        console.error('Error fetching user role:', error);
        return { isAuthenticated: true, isAdmin: false };
      }
      
      return {
        isAuthenticated: true,
        isAdmin: data === 'admin',
        user
      };
    },
  });
  
  return {
    isAuthenticated: data?.isAuthenticated || false,
    isAdmin: data?.isAdmin || false,
    user: data?.user,
    isLoading
  };
}
