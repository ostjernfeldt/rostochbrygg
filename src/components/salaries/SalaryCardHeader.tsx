import { User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SalaryCardHeaderProps {
  userName: string;
  periodStart: string;
  periodEnd: string;
}

export const SalaryCardHeader = ({ userName, periodStart, periodEnd }: SalaryCardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">{userName}</h3>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        <span className="text-gray-400 text-sm">
          {format(new Date(periodStart), 'd MMM yyyy', { locale: sv })} - {format(new Date(periodEnd), 'd MMM yyyy', { locale: sv })}
        </span>
      </div>
    </div>
  );
};