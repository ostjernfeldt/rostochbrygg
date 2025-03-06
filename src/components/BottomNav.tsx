
import { Menu, LogOut, User, Calendar } from "lucide-react";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email);
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    getUserInfo();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getUserInfo();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUsername(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Define always visible menu items
  const publicMenuItems = [
    { path: "/leaderboard", label: "Topplista", showFor: ["public"] },
    { path: "/hall-of-fame", label: "Hall of Fame", showFor: ["public"] },
    { path: "/staff", label: "Personal", showFor: ["public"] },
  ];
  
  // Define menu items that require authentication
  const authMenuItems = [
    { path: "/booking", label: "Bokningar", showFor: ["admin", "user"] },
  ];
  
  // Only admins can see "Idag" and "Bjud in" pages
  const adminMenuItems = [
    { path: "/", label: "Idag", showFor: ["admin"] },
  ];

  // Admin item that should appear after "Booking"
  const adminAfterBookingItems = [
    { path: "/invite", label: "Bjud in", showFor: ["admin"] },
  ];

  // Combine menu items based on authentication state
  let menuItems = [...publicMenuItems];
  
  if (isAuthenticated) {
    menuItems = [...menuItems, ...authMenuItems];
    
    if (userRole === 'admin') {
      menuItems = [...adminMenuItems, ...menuItems];
      
      // Insert admin-only items that should appear after Booking
      const bookingIndex = menuItems.findIndex(item => item.path === "/booking");
      if (bookingIndex !== -1) {
        menuItems.splice(bookingIndex + 1, 0, ...adminAfterBookingItems);
      } else {
        // If booking is not found for some reason, just append them
        menuItems = [...menuItems, ...adminAfterBookingItems];
      }
    }
  }

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
          {isAuthenticated && (username || userEmail) && (
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
            
            {isAuthenticated && (
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
            )}
            
            {!isAuthenticated && (
              <button
                onClick={() => {
                  navigate("/login");
                  setOpen(false);
                }}
                className="p-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-card/80 mt-4"
              >
                Logga in
              </button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};
