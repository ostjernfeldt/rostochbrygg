import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, accept any non-empty credentials
    if (email && password) {
      localStorage.setItem("isAuthenticated", "true");
      toast({
        title: "Inloggad",
        description: "Du är nu inloggad",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
        duration: 1000, // 1 second
      });
      navigate("/");
    } else {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält",
        variant: "destructive",
        className: "bg-red-500 text-white border-none rounded-xl shadow-lg",
        duration: 1000, // 1 second
      });
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
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Logga in
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;