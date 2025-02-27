
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from 'nanoid';
import { Check, Copy, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Invite = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Kontrollera om användaren är inloggad
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking auth:", error);
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(!!data.session);
      }
    };

    checkAuth();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Validera e-postadressen
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      // Kontrollera om användaren är inloggad
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData?.user?.id;
      if (!userId) {
        throw new Error("Du måste vara inloggad för att skapa inbjudningar");
      }

      // Kontrollera om e-postadressen redan är registrerad
      const { data: existingUsers, error: existingError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email.trim())
        .is('used_at', null);
      
      if (existingError) throw existingError;
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error("Det finns redan en aktiv inbjudan för denna e-postadress");
      }

      // Skapa en unik token för inbjudan
      const token = nanoid(32);
      
      // Spara inbjudan i databasen
      const { error: insertError } = await supabase
        .from('invitations')
        .insert({
          email: email.trim(),
          invitation_token: token,
          created_by: userId
        });

      if (insertError) throw insertError;

      // Generera inbjudningslänken med absolut URL
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/register?token=${token}`;
      setGeneratedLink(inviteLink);

      // Rensa formuläret
      setEmail("");

      toast({
        title: "Inbjudningslänk skapad!",
        description: "Länken har genererats och kan nu delas med säljaren.",
      });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      setErrorMessage(error.message || "Ett fel uppstod. Försök igen senare.");
      toast({
        variant: "destructive",
        title: "Kunde inte skapa inbjudan",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: "Kopierad!",
        description: "Inbjudningslänken har kopierats till urklipp.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Åtkomst nekad</CardTitle>
            <CardDescription>
              Du måste vara inloggad för att bjuda in nya säljare
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          <CardTitle>Bjud in säljare</CardTitle>
          <CardDescription>
            Skapa en inbjudningslänk för en ny säljare
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Säljarens e-postadress"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Skapar..." : "Skapa inbjudningslänk"}
            </Button>

            {generatedLink && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Inbjudningslänk:</p>
                <div className="relative">
                  <div className="text-sm break-all bg-background p-3 rounded border mb-2 max-h-24 overflow-y-auto">
                    {generatedLink}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Kopierad
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Kopiera länk
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Denna länk är giltig i 7 dagar. Säljaren kommer att kunna välja sitt lösenord när de registrerar sig.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
