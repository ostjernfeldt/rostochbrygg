
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
  const { data: userRole, isLoading } = useUserRole();

  console.log("AppContent - Current location:", location.pathname);
  console.log("AppContent - Current userRole:", userRole, "isLoading:", isLoading);
  
  // Hantera token i URL för register-routen
  useEffect(() => {
    // Om vi är på rot-sidan och det finns ett token i URL:en, dirigera om till register-sidan
    if (location.pathname === '/' || location.pathname === '') {
      const url = window.location.href;
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(location.hash.replace('#', ''));
      
      // Kontrollera om token finns i URL:en
      if (searchParams.has('token') || hashParams.has('token') || url.includes('token=')) {
        console.log("Found token in URL, redirecting to register page");
        
        // Extrahera token
        let token = searchParams.get('token') || hashParams.get('token');
        
        // Om token inte hittades i params, försök extrahera från URL-strängen
        if (!token && url.includes('token=')) {
          const tokenMatch = url.match(/token=([^&?#]+)/);
          if (tokenMatch && tokenMatch[1]) {
            token = tokenMatch[1];
          }
        }
        
        // Om token hittades, dirigera om till register med token som parameter
        if (token) {
          window.location.href = `/#/register?token=${encodeURIComponent(token)}`;
        }
      }
    }
    
    // Hantera specifikt hash-routing format som innehåller token
    if (location.hash && location.hash.includes('#/register?token=')) {
      console.log("Found register with token in hash:", location.hash);
      
      // Extrahera token
      const registerHashMatch = location.hash.match(/#\/register\?token=([^&?#]+)/);
      if (registerHashMatch && registerHashMatch[1]) {
        const token = registerHashMatch[1];
        console.log("Extracted token from hash:", token);
        
        // Se till att URL:en är korrekt formaterad för vår routing
        if (location.pathname !== '/register') {
          window.location.href = `/#/register?token=${encodeURIComponent(token)}`;
        }
      }
    }
  }, [location]);
  
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
          userRole === 'admin' ? <Navigate to="/" replace /> : <Navigate to="/leaderboard" replace />
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
