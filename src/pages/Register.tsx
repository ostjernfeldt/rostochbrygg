
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          variant: "destructive",
          title: "Ogiltig länk",
          description: "Inbjudningslänken saknas eller är ogiltig.",
        });
        navigate("/login");
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('validate_invitation', { token });

        if (error) throw error;

        const [validation] = data;
        if (!validation?.is_valid) {
          throw new Error("Inbjudningslänken har upphört eller redan använts.");
        }

        setEmail(validation.email);
        setIsValidating(false);
      } catch (error: any) {
        console.error("Token validation error:", error);
        toast({
          variant: "destructive",
          title: "Ogiltig inbjudningslänk",
          description: error.message || "Länken är ogiltig eller har upphört.",
        });
        navigate("/login");
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Validerar inbjudningslänk...</p>
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
