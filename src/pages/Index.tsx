
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <img 
        src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
        alt="R&B Logo" 
        className="h-24 w-auto mb-8 object-contain"
      />
      
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Välkommen till R&B Sales Tracking</h1>
        
        <div className="space-y-4 w-full max-w-xs mx-auto">
          <Button 
            onClick={() => navigate("/login")} 
            className="w-full"
          >
            Logga in
          </Button>
          
          <Button 
            onClick={() => navigate("/create-account")} 
            variant="outline"
            className="w-full"
          >
            Skapa konto med inbjudan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
