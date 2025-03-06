
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AuthErrorProps {
  errorMessage: string | null;
}

export const AuthError = ({ errorMessage }: AuthErrorProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] p-6">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
      <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
      <p className="text-muted-foreground mb-4">{errorMessage || 'Du behöver vara inloggad för att komma åt denna sida'}</p>
      <Button 
        onClick={() => navigate('/login')}
        variant="default"
      >
        Gå till inloggning
      </Button>
    </div>
  );
};
