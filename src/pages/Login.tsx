import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Ogiltig inmatning",
        description: "Både e-post och lösenord krävs.",
      });
      setIsLoading(false);
      return;
    }

    console.log("Attempting login with email:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      console.log("Login response:", error ? "Error occurred" : "Success", data?.user ? "User exists" : "No user");

      if (error) {
        console.error("Login error details:", error);
        throw error;
      }

      if (!data?.user) {
        throw new Error("No user data received");
      }

      // Set session persistence after successful login
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      toast({
        title: "Inloggningen lyckades!",
        description: "Välkommen tillbaka.",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <img 
        src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
        alt="R&B Logo" 
        className="h-24 w-auto mb-8 object-contain"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isResetMode ? "Återställ lösenord" : "Logga in"}</CardTitle>
          <CardDescription>
            {isResetMode 
              ? "Ange din e-postadress för att få en återställningslänk" 
              : "Välkommen tillbaka! Logga in för att fortsätta."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              {!isResetMode && (
                <Input
                  type="password"
                  placeholder="Lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
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

            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsResetMode(!isResetMode)}
              disabled={isLoading}
            >
              {isResetMode ? "Tillbaka till inloggning" : "Glömt lösenord?"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;