import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface TransactionListHeaderProps {
  date: Date | null;
}

export const TransactionListHeader = ({ date }: TransactionListHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2 mb-6">
      <button 
        onClick={() => navigate("/")}
        className="text-gray-400 hover:text-primary transition-colors"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-2xl font-bold">
        {date ? `${format(date, 'd MMMM yyyy')} transaktioner` : 'Transaktioner'}
      </h1>
    </div>
  );
};