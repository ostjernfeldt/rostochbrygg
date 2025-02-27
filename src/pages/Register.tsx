
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError("Inbjudningslänken saknas eller är ogiltig.");
        setIsValidating(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('validate_invitation', { token });

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error("Inbjudningslänken kunde inte valideras.");
        }

        const [validation] = data;
        if (!validation?.is_valid) {
          throw new Error("Inbjudningslänken har upphört eller redan använts.");
        }

        setEmail(validation.email);
        setIsValidating(false);
        setValidationError(null);
      } catch (error: any) {
        console.error("Token validation error:", error);
        setValidationError(error.message || "Inbjudningslänken saknas eller är ogiltig.");
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Skapa användarkonto
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!signUpData?.user) throw new Error("No user data received");

      // Markera inbjudan som använd
      const { error: markUsedError } = await supabase
        .rpc('mark_invitation_used', { token });

      if (markUsedError) throw markUsedError;

      toast({
        title: "Registrering lyckades!",
        description: "Ditt konto har skapats. Du kan nu logga in.",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registrering misslyckades",
        description: error.message || "Ett fel uppstod vid registrering. Försök igen senare.",
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
            <CardTitle>Validerar inbjudan</CardTitle>
            <CardDescription>Vänligen vänta medan vi verifierar din inbjudningslänk...</CardDescription>
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

  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ogiltig länk</CardTitle>
            <CardDescription>
              Inbjudningslänken saknas eller är ogiltig.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fel</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
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
          <CardTitle>Skapa konto</CardTitle>
          <CardDescription>
            Välkommen! Skapa ditt säljarkonto nedan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <Input
                type="password"
                placeholder="Välj lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Skapar konto..." : "Skapa konto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
