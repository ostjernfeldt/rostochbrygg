
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
import { useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient();

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
    enabled: false
  });
};

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: userRole, isLoading: isRoleLoading, refetch } = useUserRole();

  console.log("PrivateRoute - userRole:", userRole, "requireAdmin:", requireAdmin);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session ? "Session exists" : "No session");
        
        if (!session) {
          console.log("No session found, redirecting to login");
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
      console.log("Auth state change:", event, session ? "Session exists" : "No session");
      
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
  }, [navigate, refetch]);

  if (isAuthenticated === null || (isAuthenticated && isRoleLoading)) {
    console.log("Loading auth state or role...");
    return null;
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userRole !== 'admin') {
    console.log("User is not admin, redirecting to leaderboard");
    return <Navigate to="/leaderboard" replace />;
  }

  console.log("Rendering protected content");
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: userRole, isLoading } = useUserRole();

  console.log("AppContent - Current location:", location.pathname, location.search, location.hash);
  console.log("Full URL:", window.location.href);

  useEffect(() => {
    // Check for token in invitation link
    const checkForInvitationToken = () => {
      // More robust method to capture token from different parts of URL
      const fullUrl = window.location.href;
      const urlParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
      
      // Check different places where token can exist
      let token = urlParams.get('token');
      
      // If no token in URL parameters, check in hashParams
      if (!token && location.hash) {
        // Handle both /#/register?token=xyz and /#?token=xyz formats
        if (hashParams.has('token')) {
          token = hashParams.get('token');
        } else {
          // Manual extraction if all else fails
          const tokenMatch = fullUrl.match(/[?&]token=([^&]+)/);
          if (tokenMatch) {
            token = decodeURIComponent(tokenMatch[1]);
          }
        }
      }

      if (token) {
        console.log("Token found:", token);
        
        // CRITICAL FIX: Force registration route even if already on another page
        if (!location.pathname.includes('/register')) {
          console.log("Redirecting to registration page with token");
          
          // Important: Include token properly in the URL
          navigate(`/register?token=${encodeURIComponent(token)}`, { replace: true });
          
          // Return true to indicate that this is an invitation link
          return true;
        }
      }
      
      return false;
    };
    
    // Execute the token check and store the result
    const isInvitationLink = checkForInvitationToken();
    
    // If we're handling an invitation link, don't proceed with other auth checks
    if (isInvitationLink) {
      console.log("Processing invitation link - skipping other auth checks");
      return;
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
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
        <Route path="/leaderboard" element={
          <PrivateRoute>
            <Leaderboard />
          </PrivateRoute>
        } />
        <Route path="/hall-of-fame" element={
          <PrivateRoute>
            <HallOfFame />
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute>
            <TransactionList />
          </PrivateRoute>
        } />
        <Route path="/staff" element={
          <PrivateRoute>
            <Staff />
          </PrivateRoute>
        } />
        <Route path="/staff/:name" element={
          <PrivateRoute>
            <StaffMember />
          </PrivateRoute>
        } />
        <Route path="*" element={
          <Navigate to={userRole === 'admin' ? "/" : "/leaderboard"} replace />
        } />
      </Routes>
      {location.pathname !== '/login' && 
       location.pathname !== '/register' && 
       location.pathname !== '/reset-password' && 
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
