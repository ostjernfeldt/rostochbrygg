
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useBookingAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRoleChecked, setIsRoleChecked] = useState(false);
  
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
          setAuthError('Could not verify your login. Please log in again.');
          setIsAuthenticated(false);
          setUser(null);
          setIsRoleChecked(true);
          setIsLoading(false);
          return;
        }
        
        if (!session || !session.user) {
          console.log('No active session found');
          setAuthError('Your session has expired. Please log in again.');
          setIsAuthenticated(false);
          setUser(null);
          setIsRoleChecked(true);
          setIsLoading(false);
          return;
        }
        
        setUser(session.user);
        
        try {
          if (session.user.email) {
            const { data, error } = await supabase
              .from('staff_roles')
              .select('user_display_name')
              .eq('email', session.user.email)
              .maybeSingle();
            
            if (data && !error) {
              setUserName(data.user_display_name);
            }
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
        
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking user role:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data && data.role === 'admin');
          }
          
          // Only set authenticated after we've checked the role
          setIsRoleChecked(true);
          setIsAuthenticated(true);
          setAuthError(null);
        } catch (error) {
          console.error('Error checking user role:', error);
          setIsAdmin(false);
          setIsRoleChecked(true);
          // Still set authenticated since we have a user
          setIsAuthenticated(true);
          setAuthError(null);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        setAuthError('An unexpected error occurred. Please try again.');
        setIsAuthenticated(false);
        setUser(null);
        setIsRoleChecked(true);
        setIsLoading(false);
      }
    };
    
    checkUserSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, 'Session exists', !!session);
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setAuthError(null);
        navigate('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        checkUserSession(); // Refresh the user data and role
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
    isLoading: isLoading || !isRoleChecked, // Consider loading until role is checked
    authError,
    isAuthenticated: isAuthenticated && isRoleChecked // Only authenticated when role is checked
  };
};
