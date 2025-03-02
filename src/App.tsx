import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./integrations/supabase/client";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateAccount from "./pages/CreateAccount";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import HallOfFame from "./pages/HallOfFame";
import Staff from "./pages/Staff";
import Invite from "./pages/Invite";
import PageLayout from "./components/PageLayout";
import { Toaster } from "@/components/ui/toaster";

// Add the Admin import
import Admin from "./pages/Admin";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { session, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (session?.user?.id) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        setIsAdmin(roleData?.role === "admin");
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [session]);

  if (isLoading) {
    return <div>Laddar...</div>;
  }

  if (!session?.user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <PageLayout>
                <Home />
              </PageLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PrivateRoute>
              <PageLayout>
                <Leaderboard />
              </PageLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hall-of-fame"
          element={
            <PrivateRoute>
              <PageLayout>
                <HallOfFame />
              </PageLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <PrivateRoute>
              <PageLayout>
                <Staff />
              </PageLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/invite"
          element={
            <PrivateRoute requireAdmin={true}>
              <PageLayout>
                <Invite />
              </PageLayout>
            </PrivateRoute>
          }
        />
        
        {/* Add the Admin route */}
        <Route 
          path="/admin" 
          element={
            <PrivateRoute requireAdmin={true}>
              <PageLayout>
                <Admin />
              </PageLayout>
            </PrivateRoute>
          }
        />
        
        <Route path="*" element={<div>Sidan hittades inte</div>} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
