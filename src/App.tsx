import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSwipeable } from "react-swipeable";
import { BottomNav } from "./components/BottomNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Home from "./pages/Home";
import Competitions from "./pages/Competitions";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import Learn from "./pages/Learn";
import Article from "./pages/Article";
import Login from "./pages/Login";
import TransactionList from "./pages/TransactionList";
import Staff from "./pages/Staff";
import StaffMember from "./pages/StaffMember";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Session check result:", session ? "Session exists" : "No session");
        
        if (error) {
          console.error("Session check error:", error);
          setIsAuthenticated(false);
          navigate('/login');
          return;
        }

        setIsAuthenticated(!!session);
        if (!session) {
          navigate('/login');
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : null;
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routes = ['/', '/competitions', '/leaderboard', '/learn', '/settings', '/staff'];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = routes.indexOf(location.pathname);
      if (currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = routes.indexOf(location.pathname);
      if (currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    },
    touchEventOptions: { passive: false },
    trackMouse: false
  });

  console.log('Current route:', location.pathname);

  return (
    <div {...handlers} className="min-h-screen bg-background">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/competitions" element={
          <PrivateRoute>
            <Competitions />
          </PrivateRoute>
        } />
        <Route path="/leaderboard" element={
          <PrivateRoute>
            <Leaderboard />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="/learn" element={
          <PrivateRoute>
            <Learn />
          </PrivateRoute>
        } />
        <Route path="/learn/:slug" element={
          <PrivateRoute>
            <Article />
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
      </Routes>
      {location.pathname !== '/login' && <BottomNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;