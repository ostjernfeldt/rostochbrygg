import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { InvitationCheckResult } from "@/components/invite/types";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          if (roleError) throw roleError;

          if (roleData?.role === 'admin') {
            navigate("/");
          } else {
            navigate("/leaderboard");
          }
        } catch (error) {
          console.error("Error checking role:", error);
        }
      }
    };

    checkSession();
  }, [navigate, location.search]);

  const checkInvitation = async (emailToCheck: string): Promise<InvitationCheckResult | null> => {
    try {
      setIsCheckingInvitation(true);
      
      const { data, error } = await supabase.functions.invoke('validate-invitation-email', {
        body: { email: emailToCheck.trim() }
      });

      if (error) {
        console.error("Error checking invitation:", error);
        return null;
      }

      return data as InvitationCheckResult;
    } catch (error) {
      console.error("Invitation check error:", error);
      return null;
    } finally {
      setIsCheckingInvitation(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInvitationMessage(null);
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Ogiltig inmatning",
        description: "Både e-post och lösenord krävs.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          const invitationResult = await checkInvitation(email);
          
          if (invitationResult && invitationResult.is_valid) {
            navigate(`/register?email=${encodeURIComponent(email)}&invited=true`);
            return;
          }

          throw new Error("Felaktig e-post eller lösenord.");
        }
        throw error;
      }
      
      if (!data?.user) throw new Error("No user data received");

      console.log("Checking role for user:", data.user.id);
      
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      console.log("Role check result:", { roleData, roleError });

      if (roleError) {
        console.error("Role check error:", roleError);
        await supabase.auth.signOut();
        throw new Error("Kunde inte verifiera användarrollen");
      }

      if (roleData?.role === 'admin') {
        navigate("/");
      } else {
        navigate("/leaderboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Ett fel uppstod vid inloggning.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Felaktig e-post eller lösenord.";
      } else if (error.message.includes("Behörighet saknas")) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Inloggningen misslyckades",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast({
        variant: "destructive",
        title: "Ogiltig inmatning",
        description: "E-post krävs för att återställa lösenord.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Återställningslänk skickad",
        description: "Kolla din e-post för instruktioner om hur du återställer ditt lösenord.",
      });
      
      setIsResetMode(false);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte skicka återställningslänk",
        description: error.message || "Försök igen senare.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckInvitationFirst = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Ogiltig inmatning",
        description: "E-post krävs för att kontrollera inbjudan.",
      });
      return;
    }

    setIsLoading(true);
    setInvitationMessage(null);

    try {
      const invitationResult = await checkInvitation(email);
      
      if (invitationResult && invitationResult.is_valid) {
        setInvitationMessage("Du har en inbjudan! För att skapa ditt konto, klicka på knappen nedan.");
      } else {
        setInvitationMessage(null);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) throw error;
        
        if (!data?.user) throw new Error("No user data received");

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

        if (roleError) {
          await supabase.auth.signOut();
          throw new Error("Kunde inte verifiera användarrollen");
        }

        toast({
          title: "Inloggningen lyckades!",
          description: "Välkommen tillbaka.",
        });
        
        if (roleData?.role === 'admin') {
          navigate("/");
        } else {
          navigate("/leaderboard");
        }
      }
    } catch (error: any) {
      console.error("Login/Invitation check error:", error);
      
      let errorMessage = "Ett fel uppstod vid inloggning.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Felaktig e-post eller lösenord.";
      }

      toast({
        variant: "destructive",
        title: "Inloggningen misslyckades",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <img 
        src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
        alt="R&B Logo" 
        className="h-24 w-auto mb-8 object-contain"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white">{isResetMode ? "Återställ lösenord" : "Logga in"}</CardTitle>
          <CardDescription className="text-gray-400">
            {isResetMode 
              ? "Ange din e-postadress för att få en återställningslänk" 
              : "Välkommen tillbaka! Logga in för att fortsätta."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationMessage && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                {invitationMessage}
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => navigate(`/register?email=${encodeURIComponent(email)}&invited=true`)}
                  >
                    Skapa ditt konto
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="text-white placeholder:text-gray-500"
              />
              {!isResetMode && (
                <Input
                  type="password"
                  placeholder="Lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="text-white placeholder:text-gray-500"
                />
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Laddar..." : isResetMode ? "Skicka återställningslänk" : "Logga in"}
            </Button>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                type="button"
                variant="link"
                className="w-full text-primary"
                onClick={() => setIsResetMode(!isResetMode)}
                disabled={isLoading}
              >
                {isResetMode ? "Tillbaka till inloggning" : "Glömt lösenord?"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full text-white"
                onClick={() => navigate('/create-account')}
                disabled={isLoading}
              >
                Har du fått en inbjudan? Skapa konto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
