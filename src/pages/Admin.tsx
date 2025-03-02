
import { UserAdminSection } from "@/components/admin/UserAdminSection";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  const navigate = useNavigate();
  
  // Fetch user role to check for admin access
  const { data: roleData, isLoading } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return roleData?.role || "user";
    },
  });

  useEffect(() => {
    // Redirect non-admin users
    if (!isLoading && roleData !== "admin") {
      navigate("/");
    }
  }, [roleData, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse">
          <div className="h-10 w-1/4 bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (roleData !== "admin") {
    return null; // We'll redirect anyway
  }

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">Administrera</h1>
      <UserAdminSection />
    </div>
  );
}
