
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  className?: string;
}

export const LoadingFallback = ({ 
  message = "Laddar...", 
  className = "h-[50vh]" 
}: LoadingFallbackProps) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);
