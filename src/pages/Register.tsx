
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
    // Detaljerad loggning av URL-parametrar för att hjälpa vid felsökning
    console.log("All URLSearchParams:");
    for (const [key, value] of searchParams.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    console.log("Token from searchParams:", token);
    console.log("Current URL:", window.location.href);
    console.log("Search params string:", window.location.search);
    console.log("Hash:", window.location.hash);
    console.log("Current pathname:", window.location.pathname);

    const validateToken = async () => {
      // Kontrollera om token finns i URL:en
      if (!token) {
        console.error("No token provided in URL");
        setValidationError("Inbjudningslänken saknas eller är ogiltig.");
        setIsValidating(false);
        return;
      }

      // Fortsätt med validering
      try {
        console.log("Validating token:", token);
        
        // Hämta inbjudningsinformation direkt från tabellen för felsökning
        const { data: invitationData, error: invitationError } = await supabase
          .from('invitations')
          .select('*')
          .eq('invitation_token', token)
          .single();
        
        if (invitationError) {
          console.error("Error fetching invitation:", invitationError);
          if (invitationError.code === 'PGRST116') {
            throw new Error("Inbjudningslänken hittades inte. Token: " + token);
          }
        } else {
          console.log("Invitation data found:", invitationData);
          if (!invitationData) {
            throw new Error("Ingen inbjudan hittades med denna token.");
          }
        }
        
        // Validera token med Supabase-funktionen
        const { data, error } = await supabase
          .rpc('validate_invitation', { token });

        if (error) {
          console.error("RPC error:", error);
          throw error;
        }
        
        console.log("Validation result:", data);

        if (!data || data.length === 0) {
          console.error("No validation data returned");
          throw new Error("Inbjudningslänken kunde inte valideras.");
        }

        const [validation] = data;
        console.log("Validation details:", validation);
        
        if (!validation || !validation.is_valid) {
          console.error("Token not valid:", validation);
          throw new Error("Inbjudningslänken har upphört eller redan använts.");
        }

        console.log("Setting email to:", validation.email);
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
  }, [token, searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!token) {
        throw new Error("Inbjudningslänken är ogiltig. Försök igen eller kontakta administratören.");
      }
      
      console.log("Creating account with email:", email);
      
      // Skapa användarkonto
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }
      
      if (!signUpData?.user) {
        console.error("No user data received");
        throw new Error("No user data received");
      }

      console.log("User created successfully:", signUpData.user.id);

      // Markera inbjudan som använd
      const { error: markUsedError } = await supabase
        .rpc('mark_invitation_used', { token });

      if (markUsedError) {
        console.error("Error marking invitation as used:", markUsedError);
        throw markUsedError;
      }

      console.log("Invitation marked as used");
      
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
              disabled={isLoading || !token}
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
