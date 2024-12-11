import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Inloggad",
        description: "Du är nu inloggad",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
        duration: 1000,
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid inloggning",
        variant: "destructive",
        className: "bg-red-500 text-white border-none rounded-xl shadow-lg",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Återställningslänk skickad",
        description: "Kolla din e-post för instruktioner",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
        duration: 3000,
      });
      setShowResetDialog(false);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod",
        variant: "destructive",
        className: "bg-red-500 text-white border-none rounded-xl shadow-lg",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            src="/lovable-uploads/c6c8c7bb-9f2b-4343-8758-403b947e10d9.png" 
            alt="R&B Logo" 
            className="h-32 w-auto mx-auto mb-8"
          />
          <h2 className="text-3xl font-bold">Välkommen tillbaka</h2>
          <p className="text-gray-400 mt-2">Logga in för att fortsätta</p>
        </div>
        
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="E-postadress"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Glömt lösenord?
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Återställ lösenord</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                  <Input
                    type="email"
                    placeholder="Din e-postadress"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Skicka återställningslänk
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Loggar in..." : "Logga in"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;