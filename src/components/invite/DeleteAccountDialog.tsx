
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define SupabaseUser type
type SupabaseUser = {
  id: string;
  email?: string | null;
};

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail: string;
}

export const DeleteAccountDialog = ({
  open,
  onOpenChange,
  initialEmail,
}: DeleteAccountDialogProps) => {
  const { toast } = useToast();
  const [deleteAccountEmail, setDeleteAccountEmail] = useState(initialEmail);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const handleDeleteAccount = async () => {
    setIsProcessingDelete(true);
    try {
      if (!deleteAccountEmail.trim() || !deleteAccountEmail.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      // Försök att hitta användaren direkt via Supabase Auth
      const { data, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error listing users:", authError);
        throw new Error("Det gick inte att hämta användare. Du kanske inte har admin-behörigheter.");
      }
      
      // Explicit typkonvertering för att säkerställa att TypeScript förstår strukturen
      const users = data?.users as SupabaseUser[] || [];
      
      const userToDelete = users.find(user => 
        user.email?.toLowerCase() === deleteAccountEmail.trim().toLowerCase()
      );

      if (!userToDelete) {
        throw new Error(`Hittade ingen användare med e-postadressen ${deleteAccountEmail}`);
      }

      // Använd admin-API för att ta bort användarkontot
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        userToDelete.id
      );

      if (deleteError) throw deleteError;

      toast({
        title: "Konto borttaget",
        description: `Användarkontot för ${deleteAccountEmail} har tagits bort.`,
      });

      onOpenChange(false);
      setDeleteAccountEmail("");
    } catch (error: any) {
      console.error("Delete account error:", error);
      
      // Om vi får 403 Forbidden så saknar vi admin-behörighet, försök med ett annat sätt
      if (error.status === 403 || error.message.includes("insufficient_permissions")) {
        toast({
          variant: "destructive",
          title: "Behörighetsproblem",
          description: "Du har inte behörighet att ta bort användare direkt. Kontakta system-administratören för att ta bort detta konto.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Kunde inte ta bort konto",
          description: error.message || "Ett fel uppstod. Försök igen senare.",
        });
      }
    } finally {
      setIsProcessingDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ta bort konto</DialogTitle>
          <DialogDescription>
            Ange e-postadressen för kontot som ska tas bort
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <Input
            type="email"
            placeholder="E-postadress"
            value={deleteAccountEmail}
            onChange={(e) => setDeleteAccountEmail(e.target.value)}
            disabled={isProcessingDelete}
            className="bg-card/50"
          />
          <p className="text-xs text-destructive mt-2">
            Varning: Detta tar bort kontot permanent
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessingDelete}
          >
            Avbryt
          </Button>
          <Button 
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
            disabled={isProcessingDelete}
          >
            {isProcessingDelete ? (
              <>
                <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Tar bort...
              </>
            ) : (
              "Ta bort konto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
