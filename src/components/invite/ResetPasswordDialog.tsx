
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

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail: string;
}

export const ResetPasswordDialog = ({
  open,
  onOpenChange,
  initialEmail,
}: ResetPasswordDialogProps) => {
  const { toast } = useToast();
  const [resetPasswordEmail, setResetPasswordEmail] = useState(initialEmail);
  const [isProcessingReset, setIsProcessingReset] = useState(false);

  const handleResetPassword = async () => {
    setIsProcessingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Återställningslänk skickad",
        description: "En länk för att återställa lösenordet har skickats till e-postadressen.",
      });
      
      onOpenChange(false);
      setResetPasswordEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte skicka återställningslänk",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
      });
    } finally {
      setIsProcessingReset(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Återställ lösenord</DialogTitle>
          <DialogDescription>
            Ange e-postadressen för kontot
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <Input
            type="email"
            placeholder="E-postadress"
            value={resetPasswordEmail}
            onChange={(e) => setResetPasswordEmail(e.target.value)}
            disabled={isProcessingReset}
            className="bg-card/50"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessingReset}
          >
            Stäng
          </Button>
          <Button 
            size="sm"
            onClick={handleResetPassword}
            disabled={isProcessingReset}
          >
            {isProcessingReset ? (
              <>
                <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Skickar...
              </>
            ) : (
              "Skicka återställningslänk"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
