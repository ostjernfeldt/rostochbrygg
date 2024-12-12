import { format } from "date-fns";
import { Calendar, User } from "lucide-react";

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
}

export const SalaryCard = ({ salary, totalSales }: SalaryCardProps) => {
  const commission = totalSales * (salary.commission_rate / 100);
  const totalSalary = salary.base_salary + commission + (salary.bonus || 0) + (salary.vacation_pay || 0);

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
            {format(new Date(salary.period_start), 'yyyy-MM-dd')} - {format(new Date(salary.period_end), 'yyyy-MM-dd')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Grundlön</div>
          <div className="text-lg font-semibold">
            {salary.base_salary.toLocaleString()} kr
          </div>
        </div>
        
        <div className="bg-background p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Total försäljning</div>
          <div className="text-lg font-semibold">
            {totalSales.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">
            Provision ({salary.commission_rate}%)
          </div>
          <div className="text-lg font-semibold">
            {commission.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Total lön</div>
          <div className="text-lg font-semibold text-primary">
            {totalSalary.toLocaleString()} kr
          </div>
        </div>

        {salary.bonus > 0 && (
          <div className="bg-background p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Bonus</div>
            <div className="text-lg font-semibold">
              {salary.bonus.toLocaleString()} kr
            </div>
          </div>
        )}

        {salary.vacation_pay > 0 && (
          <div className="bg-background p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Semesterersättning</div>
            <div className="text-lg font-semibold">
              {salary.vacation_pay.toLocaleString()} kr
            </div>
          </div>
        )}
      </div>
    </div>
  );
};