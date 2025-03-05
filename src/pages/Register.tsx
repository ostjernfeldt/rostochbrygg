import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, InfoIcon, Loader2 } from "lucide-react";
import { InvitationCheckResult } from "@/components/invite/types";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [isComingFromLogin, setIsComingFromLogin] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    const invitedParam = searchParams.get('invited');
    
    if (emailParam) {
      setEmail(emailParam);
      
      if (invitedParam === 'true') {
        setIsComingFromLogin(true);
        setIsVerified(true);
        console.log("Setting as verified directly from URL params");
      }
    }
  }, [location.search]);

  const verifyInvitationByEmail = async (emailToVerify: string) => {
    setIsVerifying(true);
    setValidationError(null);

    try {
      if (!emailToVerify.trim() || !emailToVerify.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      console.log("Verifying invitation for email:", emailToVerify);
      
      const { data, error } = await supabase.functions.invoke('validate-invitation-email', {
        body: { email: emailToVerify.trim() }
      });

      if (error) {
        console.error("Validation error:", error);
        throw error;
      }
      
      console.log("Validation result:", data);

      if (!data || !data.success || !data.data || data.data.length === 0 || !data.data[0].is_valid) {
        throw new Error("Ingen aktiv inbjudan hittades för denna e-postadress.");
      }

      setInvitationId(data.data[0].invitation_id || null);
      setDisplayName(data.data[0].display_name || "");
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

  const verifyInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyInvitationByEmail(email);
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
      
      if (!displayName.trim()) {
        throw new Error("Ett namn för säljaren krävs.");
      }
      
      console.log("Creating account with email:", email, "and display name:", displayName);
      
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

      const { error: staffRoleError } = await supabase
        .from('staff_roles')
        .insert({
          id: signUpData.user.id,
          user_display_name: displayName.trim()
        });

      if (staffRoleError) {
        console.error("Error creating staff role:", staffRoleError);
        throw staffRoleError;
      }

      const { error: markUsedError } = await supabase.functions.invoke('mark-invitation-used', {
        body: { email: email.trim() }
      });

      if (markUsedError) {
        console.error("Error marking invitation as used:", markUsedError);
        throw markUsedError;
      }

      console.log("Invitation marked as used");
      
      toast({
        title: "Registrering lyckades!",
        description: "Ditt konto har skapats. Du loggas nu in automatiskt.",
      });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        console.error("Auto sign-in error:", signInError);
        toast({
          variant: "destructive",
          title: "Automatisk inloggning misslyckades",
          description: "Ditt konto har skapats, men vi kunde inte logga in dig automatiskt. Vänligen logga in manuellt.",
        });
        navigate("/login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signUpData.user.id)
        .single();

      if (roleData?.role === 'admin') {
        navigate("/");
      } else {
        navigate("/leaderboard");
      }
      
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
            
            {isComingFromLogin && (
              <Alert className="mb-4 bg-card border border-accent/20">
                <InfoIcon className="h-4 w-4 text-accent" />
                <AlertDescription className="text-card-foreground">
                  Din e-postadress är inbjuden! Fortsätt för att skapa ditt konto.
                </AlertDescription>
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
                  disabled={isVerifying || isComingFromLogin}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifierar...
                  </>
                ) : "Fortsätt"}
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
                type="text"
                placeholder="Ditt namn"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isLoading}
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
              <p className="text-xs text-muted-foreground">
                Lösenordet måste vara minst 6 tecken långt.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skapar konto...
                </>
              ) : "Skapa konto"}
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
