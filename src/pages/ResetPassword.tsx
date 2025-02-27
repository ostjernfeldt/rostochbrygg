
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const hashParams = window.location.hash.split('?')[1];
    const urlParams = new URLSearchParams(hashParams || '');
    
    // Logga parametrarna för felsökning
    console.log("Hash params:", hashParams);
    console.log("Email from URL:", email);
    
    const accessToken = urlParams.get('access_token') || token;
    const type = urlParams.get('type');
    console.log("Access token:", accessToken ? "Exists" : "Missing");
    console.log("Type:", type);
    
    if (email && token) {
      console.log("Custom reset link with token and email detected");
      setIsValidating(false);
      return;
    }
    
    // Enkel validering av URL
    if (!accessToken && !token) {
      setError("Ogiltig eller utgången återställningslänk. Vänligen begär en ny.");
      setIsValidating(false);
    } else {
      setIsValidating(false);
    }
  }, [token, email]);

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

      // Om vi har en token och e-post från URL:en, använd en annan metod
      if (token && email) {
        console.log("Using custom reset method with token and email");
        // Här skulle vi kunna implementera en egen lösning med token och e-post
        // Men eftersom Supabase inte stöder detta direkt, går vi tillbaka till standardmetoden
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: "tempPassword123", // Detta kommer att misslyckas, vilket är förväntat
        });
        
        console.log("SignIn attempt (expected to fail):", signInError);
        
        // Fortsätt med lösenordsåterställning via e-post
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/#/reset-password",
        });
        
        if (error) throw error;
        
        setSuccess(true);
        toast({
          title: "Återställningsinstruktioner skickade",
          description: `Vi har skickat lösenordsåterställningsinstruktioner till ${email}. Vänligen kolla din e-post.`,
        });
      } else {
        // Standardmetod med Supabase-token
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
      }
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

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Validerar återställningslänk</CardTitle>
            <CardDescription>Vänligen vänta medan vi verifierar din återställningslänk...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ogiltig länk</CardTitle>
            <CardDescription>
              Återställningslänken är ogiltig eller har gått ut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fel</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              onClick={() => navigate("/login")}
            >
              Gå till inloggning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Återställ lösenord</CardTitle>
          <CardDescription>
            {email ? `Återställ lösenord för ${email}` : "Välj ett nytt lösenord för ditt konto"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Lösenord uppdaterat</AlertTitle>
                {email ? (
                  <AlertDescription>
                    Vi har skickat lösenordsåterställningsinstruktioner till din e-post. Vänligen kontrollera din inkorg.
                  </AlertDescription>
                ) : (
                  <AlertDescription>
                    Ditt lösenord har uppdaterats framgångsrikt. Du kommer att omdirigeras till inloggningssidan...
                  </AlertDescription>
                )}
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
