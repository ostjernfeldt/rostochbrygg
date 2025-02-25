
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
import Settings from "./pages/Settings";
import Learn from "./pages/Learn";
import Article from "./pages/Article";
import Login from "./pages/Login";
import TransactionList from "./pages/TransactionList";
import Staff from "./pages/Staff";
import StaffMember from "./pages/StaffMember";
import HallOfFame from "./pages/HallOfFame";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : null;
};

const AppContent = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
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
        <Route path="*" element={<Navigate to="/" replace />} />
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
