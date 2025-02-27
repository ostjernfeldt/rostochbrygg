
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Försök hämta token från olika ställen
  const tokenFromSearchParams = searchParams.get("token");
  const hashParams = new URLSearchParams(location.hash.replace('#/register?', ''));
  const tokenFromHash = hashParams.get("token");
  
  // Om ingen av de vanliga metoderna hittar en token, extrahera den direkt från URL:en
  const tokenFromUrl = extractTokenFromUrl();
  const token = decodeURIComponent(tokenFromSearchParams || tokenFromHash || tokenFromUrl || '');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [tokenDetails, setTokenDetails] = useState<any>(null);

  // Funktion för att extrahera token från URL:en direkt
  function extractTokenFromUrl() {
    const url = window.location.href;
    
    // Logga URL för felsökning
    console.log("Extracting token from URL:", url);
    
    // Försök hitta token i olika format i URL:en
    const tokenPatterns = [
      /[?&]token=([^&?#]+)/,  // Vanligt query parameter format
      /#\/register\?token=([^&?#]+)/, // Hash routing format
      /token=([^&?#]+)/,      // Enkel token parameter
    ];
    
    for (const pattern of tokenPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log("Token found with pattern:", pattern, "Token:", match[1]);
        return match[1];
      }
    }
    
    return null;
  }

  // Funktion för att direkt verifiera att tokenet existerar i databasen
  const checkTokenInDatabase = async (rawToken: string) => {
    try {
      // Testa med exakt värde
      const { data: exactData, error: exactError } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_token', rawToken);
      
      if (exactError) {
        console.error("Error with exact token check:", exactError);
        return null;
      }
      
      if (exactData && exactData.length > 0) {
        console.log("Token found with exact match:", exactData[0]);
        return exactData[0];
      }

      // Testa med trimmat värde
      const trimmedToken = rawToken.trim();
      if (trimmedToken !== rawToken) {
        console.log("Trying with trimmed token:", trimmedToken);
        
        const { data: trimmedData, error: trimmedError } = await supabase
          .from('invitations')
          .select('*')
          .eq('invitation_token', trimmedToken);
        
        if (trimmedError) {
          console.error("Error with trimmed token check:", trimmedError);
          return null;
        }
        
        if (trimmedData && trimmedData.length > 0) {
          console.log("Token found with trimmed match:", trimmedData[0]);
          return trimmedData[0];
        }
      }
      
      // Ingen matchning hittades
      return null;
    } catch (err) {
      console.error("Error checking token in database:", err);
      return null;
    }
  };

  useEffect(() => {
    // Detaljerad loggning av URL-parametrar för att hjälpa vid felsökning
    console.log("All URLSearchParams:");
    for (const [key, value] of searchParams.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Logga alla olika tokenformer
    console.log("Token sources:", {
      tokenFromSearchParams,
      tokenFromHash,
      tokenFromUrl,
      finalToken: token,
      tokenLength: token?.length,
    });
    
    console.log("Current URL:", window.location.href);
    console.log("Search params string:", window.location.search);
    console.log("Hash:", window.location.hash);

    const validateToken = async () => {
      // Kontrollera om token finns i URL:en
      if (!token) {
        console.error("No valid token provided in URL");
        setValidationError("Inbjudningslänken saknas eller är ogiltig.");
        setIsValidating(false);
        return;
      }

      try {
        console.log("Raw token from URL:", token);
        
        // Direkt kontroll mot databasen
        const invitation = await checkTokenInDatabase(token);
        
        if (invitation) {
          console.log("Invitation found directly in database:", invitation);
          setTokenDetails({
            tokenInDatabase: true,
            invitation: invitation
          });
          
          if (invitation.used_at) {
            throw new Error("Denna inbjudningslänk har redan använts.");
          }
          
          if (new Date(invitation.expires_at) < new Date()) {
            throw new Error("Denna inbjudningslänk har upphört att gälla.");
          }
          
          setEmail(invitation.email);
          setIsValidating(false);
          setValidationError(null);
          return;
        }
        
        setTokenDetails({
          tokenInDatabase: false,
          rawToken: token
        });
        
        console.log("Token not found directly in database, trying RPC function");
        
        // Fallback: Använd RPC-funktionen
        const { data, error } = await supabase
          .rpc('validate_invitation', { token });

        if (error) {
          console.error("RPC error:", error);
          setDebug(`Debug: Token fanns i URL men hittas inte i databasen. [${token}]`);
          throw error;
        }
        
        console.log("Validation result from RPC:", data);

        if (!data || data.length === 0) {
          console.error("No validation data returned");
          setDebug(`Debug: Token fanns i URL men hittas inte i databasen via RPC. [${token}]`);
          throw new Error("Inbjudningslänken kunde inte valideras.");
        }

        const [validation] = data;
        
        if (!validation || !validation.is_valid) {
          console.error("Token not valid:", validation);
          throw new Error("Inbjudningslänken har upphört eller redan använts.");
        }

        console.log("Valid token, setting email to:", validation.email);
        setEmail(validation.email);
        setIsValidating(false);
        setValidationError(null);
      } catch (error: any) {
        console.error("Token validation error:", error);
        setValidationError(error.message || "Inbjudningslänken saknas eller är ogiltig.");
        setIsValidating(false);
      }
    };

    // Kör validering med en liten fördröjning så att allt hinner ladda ordentligt
    const timer = setTimeout(() => {
      validateToken();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [token, searchParams, location, tokenFromSearchParams, tokenFromHash, tokenFromUrl]);

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
            
            {debug && (
              <div className="mt-4 text-xs text-muted-foreground">
                {debug}
              </div>
            )}
            
            {tokenDetails && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                <p className="font-semibold mb-1">Teknisk felinfo:</p>
                <pre className="whitespace-pre-wrap overflow-auto max-h-36">
                  {JSON.stringify(tokenDetails, null, 2)}
                </pre>
              </div>
            )}
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
