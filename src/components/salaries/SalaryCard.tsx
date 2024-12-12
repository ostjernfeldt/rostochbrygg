import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, User, Percent, Gift } from "lucide-react";
import { calculateCommission } from "@/utils/salaryCalculations";
import SalaryDetail, { 
  ShiftDetail, 
  CommissionDetail, 
  BonusDetail,
  SubtotalDetail,
  VacationPayDetail,
  TotalSalaryDetail
} from "./SalaryDetailDialog";

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
  accumulatedSales: number;
  shiftsCount: number;
  shifts: any[];
  bonuses: any[];
}

export const SalaryCard = ({ 
  salary, 
  totalSales, 
  accumulatedSales, 
  shiftsCount,
  shifts,
  bonuses
}: SalaryCardProps) => {
  // Calculate base salary (140 SEK per shift)
  const baseAmount = shiftsCount * 140;
  
  // Calculate commission with the new logic
  const commission = calculateCommission(totalSales, salary.commission_rate, accumulatedSales);
  
  // Get bonus amount (if any)
  const bonus = salary.bonus || 0;
  
  // Calculate subtotal before vacation pay
  const subtotal = baseAmount + commission + bonus;
  
  // Calculate vacation pay (12% of total)
  const vacationPay = subtotal * 0.12;
  
  // Calculate final total
  const totalSalary = subtotal + vacationPay;

  const hasIncreasedCommission = accumulatedSales > 25000;

  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">{salary.user_display_name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400 text-sm">
            {format(new Date(salary.period_start), 'd MMM yyyy', { locale: sv })} - {format(new Date(salary.period_end), 'd MMM yyyy', { locale: sv })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <SalaryDetail 
          title="Antal pass" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="text-sm text-gray-400 mb-1">Antal pass</div>
              <div className="text-lg font-semibold">
                {shiftsCount} st
              </div>
            </div>
          }
        >
          <ShiftDetail shifts={shifts} baseAmount={baseAmount} />
        </SalaryDetail>
        
        <SalaryDetail 
          title="Grundlön" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="text-sm text-gray-400 mb-1">Grundlön</div>
              <div className="text-lg font-semibold">
                {baseAmount.toLocaleString()} kr
              </div>
            </div>
          }
        >
          <ShiftDetail shifts={shifts} baseAmount={baseAmount} />
        </SalaryDetail>

        <div className="bg-background p-3 rounded-lg">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <span>Total försäljning</span>
          </div>
          <div className="text-lg font-semibold">
            {totalSales.toLocaleString()} kr
          </div>
        </div>

        <div className="bg-background p-3 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">
            <span>Ackumulerad försäljning</span>
          </div>
          <div className="text-lg font-semibold">
            {accumulatedSales.toLocaleString()} kr
          </div>
        </div>

        <SalaryDetail 
          title="Provision" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                <span>Provision</span>
                <Percent className="h-3 w-3" />
                <span>{salary.commission_rate}</span>
              </div>
              <div className="text-lg font-semibold">
                {commission.toLocaleString()} kr
              </div>
            </div>
          }
        >
          <CommissionDetail 
            totalSales={totalSales} 
            commission={commission} 
            rate={salary.commission_rate} 
          />
        </SalaryDetail>

        <SalaryDetail 
          title="Provision 15%" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="text-sm text-gray-400 mb-1">
                <span>Provision 15%</span>
              </div>
              <div className="text-lg font-semibold">
                {hasIncreasedCommission ? (totalSales * 0.15).toLocaleString() : '0'} kr
              </div>
            </div>
          }
        >
          <CommissionDetail 
            totalSales={totalSales} 
            commission={hasIncreasedCommission ? totalSales * 0.15 : 0} 
            rate={15} 
          />
        </SalaryDetail>

        <SalaryDetail 
          title="Bonus" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                <Gift className="h-4 w-4" />
                <span>Bonus</span>
              </div>
              <div className="text-lg font-semibold">
                {bonus.toLocaleString()} kr
              </div>
            </div>
          }
        >
          <BonusDetail bonuses={bonuses} />
        </SalaryDetail>

        <SalaryDetail 
          title="Delsumma" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="text-sm text-gray-400 mb-1">
                <span>Delsumma</span>
              </div>
              <div className="text-lg font-semibold">
                {subtotal.toLocaleString()} kr
              </div>
            </div>
          }
        >
          <SubtotalDetail 
            baseAmount={baseAmount}
            commission={commission}
            bonusAmount={bonus}
            subtotal={subtotal}
          />
        </SalaryDetail>

        <SalaryDetail 
          title="Semesterersättning" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                <span>Semesterersättning</span>
                <Percent className="h-3 w-3" />
                <span>12</span>
              </div>
              <div className="text-lg font-semibold">
                {vacationPay.toLocaleString()} kr
              </div>
            </div>
          }
        >
          <VacationPayDetail 
            subtotal={subtotal}
            vacationPay={vacationPay}
          />
        </SalaryDetail>

        <SalaryDetail 
          title="Total lön" 
          trigger={
            <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                <span>Total lön</span>
              </div>
              <div className="text-lg font-semibold text-primary">
                {totalSalary.toLocaleString()} kr
              </div>
            </div>
          }
        >
          <TotalSalaryDetail 
            subtotal={subtotal}
            vacationPay={vacationPay}
            totalSalary={totalSalary}
          />
        </SalaryDetail>
      </div>
    </div>
  );
};
