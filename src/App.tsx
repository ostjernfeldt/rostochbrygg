
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "./components/BottomNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Invite from "./pages/Invite";
import TransactionList from "./pages/TransactionList";
import Staff from "./pages/Staff";
import StaffMember from "./pages/StaffMember";
import HallOfFame from "./pages/HallOfFame";
import CreateAccount from "./pages/CreateAccount";
import Booking from "./pages/Booking";
import { useQuery } from "@tanstack/react-query";

// Create a new QueryClient with better defaults for error handling and retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5,
      // Make refetching more consistent
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    }
  }
});

const useUserRole = () => {
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError);
          return null;
        }
        
        if (!user) {
          console.log("No user found");
          return null;
        }

        console.log("Fetching role for user:", user.id);
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleError) {
          console.error("Error fetching user role:", roleError);
          return "user";
        }

        console.log("User role data:", roleData);
        return roleData?.role || "user";
      } catch (error) {
        console.error("Unexpected error in useUserRole:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
    // Important: enable this query by default to avoid authentication flash
    enabled: true
  });
};

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  // New property to bypass authentication for specific routes
  bypassAuth?: boolean;
}

const PrivateRoute = ({ children, requireAdmin = false, bypassAuth = false }: PrivateRouteProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: userRole, isLoading: isRoleLoading, refetch } = useUserRole();

  useEffect(() => {
    // If this route bypasses authentication, don't check session
    if (bypassAuth) {
      setIsAuthenticated(true);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          navigate('/login');
          return;
        }
        
        setIsAuthenticated(true);
        refetch();
      } catch (error) {
        console.error("Session check error:", error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        navigate('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsAuthenticated(true);
        refetch();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, refetch, bypassAuth]);

  // For routes that bypass auth, we don't need to show loading state
  if (bypassAuth) {
    return <>{children}</>;
  }

  // Add a loading state to prevent flashing of unauthorized content
  if (isAuthenticated === null || (isAuthenticated && isRoleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-card rounded w-1/3 mx-auto"></div>
          <div className="h-24 bg-card rounded mx-auto"></div>
          <div className="h-24 bg-card rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only restrict access for admin-only pages
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/leaderboard" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { data: userRole } = useUserRole();

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/create-account" element={<CreateAccount />} />
        
        {/* Admin-only routes */}
        <Route path="/" element={
          <PrivateRoute requireAdmin={true}>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/invite" element={
          <PrivateRoute requireAdmin={true}>
            <Invite />
          </PrivateRoute>
        } />
        
        {/* Routes for all users - bypassing authentication */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/hall-of-fame" element={<HallOfFame />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/:name" element={<StaffMember />} />
        
        {/* Routes that still require authentication */}
        <Route path="/transactions" element={
          <PrivateRoute>
            <TransactionList />
          </PrivateRoute>
        } />
        <Route path="/booking" element={
          <PrivateRoute>
            <Booking />
          </PrivateRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={
          <Navigate to={userRole === 'admin' ? "/" : "/leaderboard"} replace />
        } />
      </Routes>
      {location.pathname !== '/login' && 
       location.pathname !== '/register' && 
       location.pathname !== '/reset-password' && 
       location.pathname !== '/create-account' && 
       <BottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
