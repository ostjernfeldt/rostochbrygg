
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useBookingAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setIsLoading(true);
        
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          setAuthError('Kunde inte verifiera din inloggning. Vänligen logga in igen.');
          navigate('/login');
          return;
        }
        
        if (!session) {
          console.log('No active session found, redirecting to login');
          setAuthError('Din session har utgått. Vänligen logga in igen.');
          navigate('/login');
          return;
        }
        
        setIsAuthenticated(true);
        setUser(session.user);
        
        try {
          const {
            data,
            error
          } = await supabase.from('staff_roles').select('user_display_name').eq('email', session.user.email).maybeSingle();
          
          if (data && !error) {
            setUserName(data.user_display_name);
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
        
        try {
          const {
            data,
            error
          } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
          
          if (error) {
            console.error('Error checking user role:', error);
            return;
          }
          
          setIsAdmin(data.role === 'admin');
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        setAuthError('Ett oväntat fel uppstod. Vänligen försök igen.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsAuthenticated(true);
        if (session) {
          setUser(session.user);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    isAdmin,
    userName,
    user,
    isLoading,
    authError,
    isAuthenticated
  };
};
