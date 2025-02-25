
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "./components/BottomNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Learn from "./pages/Learn";
import Article from "./pages/Article";
import Login from "./pages/Login";
import TransactionList from "./pages/TransactionList";
import Staff from "./pages/Staff";
import StaffMember from "./pages/StaffMember";
import HallOfFame from "./pages/HallOfFame";
import { useUserRole, AppRole } from "./hooks/useUserRole";

const queryClient = new QueryClient();

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: userRole, isLoading: isRoleLoading } = useUserRole();

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
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isAuthenticated === null || isRoleLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Om en specifik roll krävs och användaren inte har den, omdirigera
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'user' ? '/leaderboard' : '/'} replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { data: userRole } = useUserRole();

  // Om användaren är inloggad och är på index-sidan men har user-roll, omdirigera till topplistan
  useEffect(() => {
    if (userRole === 'user' && location.pathname === '/') {
      navigate('/leaderboard');
    }
  }, [userRole, location.pathname]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin routes */}
        <Route path="/" element={
          <PrivateRoute requiredRole="admin">
            <Home />
          </PrivateRoute>
        } />
        <Route path="/staff" element={
          <PrivateRoute requiredRole="admin">
            <Staff />
          </PrivateRoute>
        } />
        <Route path="/staff/:name" element={
          <PrivateRoute requiredRole="admin">
            <StaffMember />
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute requiredRole="admin">
            <TransactionList />
          </PrivateRoute>
        } />
        
        {/* Routes accessible by both roles */}
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

        <Route path="*" element={
          <Navigate to={userRole === 'user' ? '/leaderboard' : '/'} replace />
        } />
      </Routes>
      {location.pathname !== '/login' && <BottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
