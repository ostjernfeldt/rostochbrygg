
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const verifyInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setValidationError(null);

    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      console.log("Verifying invitation for email:", email);
      
      // Use the new function to validate by email
      const { data, error } = await supabase
        .rpc('validate_invitation_by_email', { email_address: email.trim() });

      if (error) {
        console.error("Validation error:", error);
        throw error;
      }
      
      console.log("Validation result:", data);

      if (!data || data.length === 0 || !data[0].is_valid) {
        throw new Error("Ingen aktiv inbjudan hittades för denna e-postadress.");
      }

      const invitation = data[0];
      setInvitationId(invitation.invitation_id);
      setIsVerified(true);
      setValidationError(null);
    } catch (error: any) {
      console.error("Invitation verification error:", error);
      setValidationError(error.message || "Kunde inte verifiera inbjudan. Kontrollera e-postadressen eller kontakta administratören.");
      setIsVerified(false);
      setInvitationId(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Både e-post och lösenord krävs.");
      }
      
      if (password.length < 6) {
        throw new Error("Lösenordet måste vara minst 6 tecken långt.");
      }
      
      console.log("Creating account with email:", email);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }
      
      if (!signUpData?.user) {
        console.error("No user data received");
        throw new Error("Inget användardata mottogs.");
      }

      console.log("User created successfully:", signUpData.user.id);

      // Mark the invitation as used
      const { error: markUsedError } = await supabase
        .rpc('mark_invitation_used_by_email', { email_address: email.trim() });

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

  // Show verification form if not verified yet
  if (!isVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <img 
          src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
          alt="R&B Logo" 
          className="h-24 w-auto mb-8 object-contain"
        />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Registrera nytt konto</CardTitle>
            <CardDescription>
              Ange din e-postadress som har blivit inbjuden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verifiering misslyckades</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={verifyInvitation} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="E-postadress"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isVerifying}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifierar..." : "Fortsätt"}
              </Button>
              
              <Button 
                type="button" 
                variant="link" 
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Tillbaka till inloggning
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration form if email is verified
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <img 
        src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
        alt="R&B Logo" 
        className="h-24 w-auto mb-8 object-contain"
      />
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
            
            <Button 
              type="button" 
              variant="link" 
              className="w-full"
              onClick={() => {
                setIsVerified(false);
                setPassword("");
              }}
            >
              Ändra e-postadress
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
