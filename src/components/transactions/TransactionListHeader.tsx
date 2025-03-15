
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { PaymentVerification } from "@/components/verification/PaymentVerification";
import { useAuth } from "@/hooks/useAuth";

interface TransactionListHeaderProps {
  date: Date | null;
}

export function TransactionListHeader({ date }: TransactionListHeaderProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  // Format date in Swedish locale
  const formattedDate = date
    ? format(date, 'd MMMM yyyy', { locale: sv })
    : 'Idag';
  
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Försäljningar</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <CalendarIcon className="h-5 w-5 text-gray-400" />
        <span className="font-medium">{formattedDate}</span>
      </div>
      
      <PaymentVerification selectedDate={date || undefined} isAdmin={isAdmin} />
    </div>
  );
}
