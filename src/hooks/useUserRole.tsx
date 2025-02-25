
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/database";
import { useEffect } from "react";

export const useUserRole = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Invalidate the userRole query when auth state changes
      queryClient.invalidateQueries({ queryKey: ["userRole"] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return (roleData?.role || "user") as AppRole;
    },
  });
};
