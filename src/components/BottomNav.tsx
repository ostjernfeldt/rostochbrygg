
import { Menu, LogOut, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBookingSystemEnabled } from "@/hooks/useAppSettings";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const { isEnabled: bookingSystemEnabled } = useBookingSystemEnabled();

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username);
        }
      }
    };
    
    getUserInfo();
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { path: "/leaderboard", label: "Topplista" },
      { path: "/hall-of-fame", label: "Hall of Fame" },
      { path: "/staff", label: "Personal" },
    ];
    
    // Only add booking if system is enabled or user is admin
    if (bookingSystemEnabled || userRole === 'admin') {
      baseItems.push({ path: "/booking", label: "Bokningar" });
    }

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
          {(username || userEmail) && (
            <div className="border-b border-gray-800 py-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="overflow-hidden">
                  {username && (
                    <p className="font-medium text-white truncate">{username}</p>
                  )}
                  {userEmail && (
                    <p className="text-sm text-gray-400 truncate">{userEmail}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
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
