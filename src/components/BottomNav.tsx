
import { Menu, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const useUserRole = () => {
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

      return roleData?.role || "user";
    },
  });
};

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: userRole } = useUserRole();

  const getMenuItems = () => {
    const baseItems = [
      { path: "/leaderboard", label: "Topplista" },
      { path: "/hall-of-fame", label: "Hall of Fame" },
      { path: "/staff", label: "Personal" },
    ];

    // Only show "Idag" and "Bjud in" for admin users
    if (userRole === 'admin') {
      return [
        { path: "/", label: "Idag" },
        ...baseItems,
        { path: "/invite", label: "Bjud in" },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Fel vid utloggning",
        description: error.message,
      });
    } else {
      toast({
        title: "Utloggad",
        description: "Du har loggats ut",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
        duration: 1000,
      });
      navigate("/login");
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="p-2 rounded-lg bg-card hover:bg-card/80 transition-colors">
            <Menu className="h-6 w-6 text-white" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] bg-card border-r border-gray-800">
          <nav className="flex flex-col gap-2 mt-8">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                className={`p-3 text-left rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-card/80"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                handleSignOut();
                setOpen(false);
              }}
              className="p-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-card/80 mt-4 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logga ut
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};
