
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangle, Loader2 } from "lucide-react";

const CreateAccount = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationMessage(null);
    setValidationError(null);

    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      console.log("Verifying invitation for email:", email);
      
      // Call the edge function to validate the invitation
      const { data, error } = await supabase.functions.invoke('validate-invitation-email', {
        body: { email: email.trim() }
      });

      if (error) {
        console.error("Validation error:", error);
        throw new Error("Ett fel uppstod vid kontroll av inbjudan: " + error.message);
      }
      
      console.log("Validation result:", data);

      if (!data || !data.data || data.data.length === 0 || !data.data[0].is_valid) {
        throw new Error("Ingen aktiv inbjudan hittades för denna e-postadress.");
      }

      // If the email is valid, show success message
      setValidationMessage("Du har en aktiv inbjudan! Klicka på knappen nedan för att skapa ditt konto.");
      
    } catch (error: any) {
      console.error("Invitation verification error:", error);
      setValidationError(error.message || "Kunde inte verifiera inbjudan. Kontrollera e-postadressen eller kontakta administratören.");
      
      toast({
        variant: "destructive",
        title: "Verifiering misslyckades",
        description: error.message || "Kunde inte verifiera inbjudan. Kontrollera e-postadressen eller kontakta administratören.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigate(`/register?email=${encodeURIComponent(email)}&invited=true`);
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
          <CardTitle>Skapa konto</CardTitle>
          <CardDescription>
            Har du fått en inbjudan? Ange din e-postadress för att skapa ditt konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
          
          {validationMessage && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                {validationMessage}
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={navigateToRegister}
                  >
                    Skapa ditt konto
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleCheckInvitation} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-postadress"
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifierar...
                </>
              ) : "Kontrollera inbjudan"}
            </Button>
            
            <Button 
              type="button" 
              variant="link" 
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Redan har ett konto? Logga in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccount;
