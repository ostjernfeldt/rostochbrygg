
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from 'nanoid';
import { Check, Copy } from "lucide-react";

const Invite = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validera e-postadressen
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      // Skapa en unik token för inbjudan
      const token = nanoid(32);
      
      // Spara inbjudan i databasen
      const { error } = await supabase
        .from('invitations')
        .insert({
          email: email.trim(),
          invitation_token: token,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Generera inbjudningslänken
      const inviteLink = `${window.location.origin}/register?token=${token}`;
      setGeneratedLink(inviteLink);

      toast({
        title: "Inbjudningslänk skapad!",
        description: "Länken har genererats och kan nu delas med säljaren.",
      });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
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
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
