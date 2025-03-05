
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateInviteFormProps {
  onInviteCreated: () => void;
}

export const CreateInviteForm = ({ onInviteCreated }: CreateInviteFormProps) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      if (!displayName.trim()) {
        throw new Error("Vänligen ange ett namn för säljaren");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData?.user?.id;
      if (!userId) {
        throw new Error("Du måste vara inloggad för att skapa inbjudningar");
      }

      console.log("Creating invitation for email:", email, "with display name:", displayName, "by user:", userId);

      const { data: existingUsers, error: existingError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email.trim())
        .is('used_at', null);
      
      if (existingError) {
        console.error("Error checking existing invitations:", existingError);
        throw existingError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log("Found existing invitation:", existingUsers);
        throw new Error("Det finns redan en aktiv inbjudan för denna e-postadress");
      }

      // Generate a secure random token for the invitation
      const invitationToken = crypto.randomUUID();

      const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert({
          email: email.trim(),
          display_name: displayName.trim(),
          created_by: userId,
          status: 'pending',
          invitation_token: invitationToken
        })
        .select();

      if (insertError) {
        console.error("Error inserting invitation:", insertError);
        throw insertError;
      }

      console.log("Invitation created:", insertData);

      onInviteCreated();
      setEmail("");
      setDisplayName("");

      toast({
        title: "Inbjudan skapad!",
        description: "Säljaren kan nu registrera sig med sin e-postadress.",
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

  return (
    <>
      {errorMessage && (
        <Alert variant="destructive" className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleInvite} className="space-y-3">
        <div>
          <Input
            placeholder="Säljarens namn"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={isLoading}
            className="bg-card/50 mb-3"
          />
          
          <Input
            type="email"
            placeholder="Säljarens e-postadress"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="bg-card/50"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Skapar..." : "Skapa inbjudan"}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          Säljaren kan registrera sig med sin e-postadress när inbjudan har skapats.
        </p>
      </form>
    </>
  );
};
