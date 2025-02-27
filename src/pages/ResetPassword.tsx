
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hashParams = window.location.hash.split('?')[1];
    const urlParams = new URLSearchParams(hashParams || '');
    
    // Logga parametrarna för felsökning
    console.log("Hash params:", hashParams);
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');
    console.log("Access token:", accessToken ? "Exists" : "Missing");
    console.log("Type:", type);
    
    // Enkel validering av URL
    if (!accessToken || type !== 'recovery') {
      setError("Ogiltig eller utgången återställningslänk. Vänligen begär en ny.");
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Lösenorden matchar inte.");
      }

      if (password.length < 6) {
        throw new Error("Lösenordet måste vara minst 6 tecken långt.");
      }

      // Uppdatera användarens lösenord
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Lösenordet har uppdaterats!",
        description: "Ditt nya lösenord har sparats. Du kan nu logga in.",
      });

      // Automatisk omdirigering efter lyckad återställning
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Ett fel uppstod vid återställning av lösenordet.");
      toast({
        variant: "destructive",
        title: "Återställning misslyckades",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Återställ lösenord</CardTitle>
          <CardDescription>
            Välj ett nytt lösenord för ditt konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fel</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Lösenord uppdaterat</AlertTitle>
                <AlertDescription>
                  Ditt lösenord har uppdaterats framgångsrikt. Du kommer att omdirigeras till inloggningssidan...
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Gå till inloggning
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Nytt lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <Input
                  type="password"
                  placeholder="Bekräfta lösenord"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sparar..." : "Spara nytt lösenord"}
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  type="button"
                  onClick={() => navigate("/login")}
                  disabled={isLoading}
                >
                  Tillbaka till inloggning
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
