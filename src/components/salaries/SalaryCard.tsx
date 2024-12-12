import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, User, DollarSign, Percent } from "lucide-react";

interface SalaryCardProps {
  salary: {
    user_display_name: string;
    period_start: string;
    period_end: string;
    base_salary: number;
    commission_rate: number;
    bonus?: number;
    vacation_pay?: number;
  };
  totalSales: number;
  shiftsCount: number;
}

export const SalaryCard = ({ salary, totalSales, shiftsCount }: SalaryCardProps) => {
  // Calculate base salary (140 SEK per shift)
  const baseAmount = shiftsCount * 140;
  
  // Calculate commission (14% of total sales)
  const commission = totalSales * (salary.commission_rate / 100);
  
  // Calculate subtotal before vacation pay
  const subtotal = baseAmount + commission;
  
  // Calculate vacation pay (12% of total)
  const vacationPay = subtotal * 0.12;
  
  // Calculate final total
  const totalSalary = subtotal + vacationPay;

  return (
    <div className="bg-card p-6 rounded-xl space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">{salary.user_display_name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400">
            {format(new Date(salary.period_start), 'd MMM yyyy', { locale: sv })} - {format(new Date(salary.period_end), 'd MMM yyyy', { locale: sv })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Antal pass</div>
          <div className="text-lg font-semibold">
            {shiftsCount} st
          </div>
        </div>
        
        <div className="bg-background p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Grundlön</div>
          <div className="text-lg font-semibold">
            {baseAmount.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <span>Total försäljning</span>
          </div>
          <div className="text-lg font-semibold">
            {totalSales.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <span>Provision</span>
            <Percent className="h-3 w-3" />
            <span>{salary.commission_rate}</span>
          </div>
          <div className="text-lg font-semibold">
            {commission.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <span>Delsumma</span>
          </div>
          <div className="text-lg font-semibold">
            {subtotal.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <span>Semesterersättning</span>
            <Percent className="h-3 w-3" />
            <span>12</span>
          </div>
          <div className="text-lg font-semibold">
            {vacationPay.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg col-span-2">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span>Total lön</span>
          </div>
          <div className="text-lg font-semibold text-primary">
            {totalSalary.toLocaleString()} kr
          </div>
        </div>
      </div>
    </div>
  );
};