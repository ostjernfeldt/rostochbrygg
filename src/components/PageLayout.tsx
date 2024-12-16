import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface PageLayoutProps {
  children: ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 pb-24">
      <img 
        src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
        alt="R&B Logo" 
        className="h-16 w-auto mb-4 mx-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/')}
      />
      {children}
    </div>
  );
};