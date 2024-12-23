import { calculateCommission } from "@/utils/salaryCalculations";
import { SalaryCardHeader } from "./SalaryCardHeader";
import { SalaryDetailsGrid } from "./SalaryDetailsGrid";

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
  
  // Calculate increased commission (15%) only on sales after 25000
  const increasedCommission = accumulatedSales > 25000 ? 
    Math.max(0, (totalSales - Math.max(0, 25000 - (accumulatedSales - totalSales)))) * 0.15 : 0;
  
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
      <SalaryCardHeader 
        userName={salary.user_display_name}
        periodStart={salary.period_start}
        periodEnd={salary.period_end}
      />

      <SalaryDetailsGrid 
        shiftsCount={shiftsCount}
        baseAmount={baseAmount}
        totalSales={totalSales}
        accumulatedSales={accumulatedSales}
        commission={commission}
        commissionRate={salary.commission_rate}
        hasIncreasedCommission={hasIncreasedCommission}
        increasedCommission={increasedCommission}
        bonus={bonus}
        subtotal={subtotal}
        vacationPay={vacationPay}
        totalSalary={totalSalary}
        shifts={shifts}
        bonuses={bonuses}
        sales={shifts}
      />
    </div>
  );
};