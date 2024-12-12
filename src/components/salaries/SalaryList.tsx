import { SalaryCard } from "./SalaryCard";
import { TotalSalariesCard } from "./TotalSalariesCard";
import { calculateAccumulatedSales } from "@/utils/salaryCalculations";

interface SalaryListProps {
  filteredSalaries: any[];
  sales: any[];
  shifts: any[];
  bonuses: any[];
  calculateTotalSales: (userName: string, startDate: string, endDate: string) => number;
  calculateShiftsCount: (userName: string, startDate: string, endDate: string) => number;
  calculateBonus: (userName: string, startDate: string, endDate: string) => number;
}

export const SalaryList = ({
  filteredSalaries,
  sales,
  shifts,
  bonuses,
  calculateTotalSales,
  calculateShiftsCount,
  calculateBonus
}: SalaryListProps) => {
  if (!filteredSalaries || filteredSalaries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Inga löner hittades för denna period
      </div>
    );
  }

  // Calculate salary details for each seller
  const salaryDetails = filteredSalaries.map(salary => {
    const shiftsCount = calculateShiftsCount(
      salary.user_display_name,
      salary.period_start,
      salary.period_end
    );

    const baseAmount = shiftsCount * 140;
    const periodSales = calculateTotalSales(
      salary.user_display_name,
      salary.period_start,
      salary.period_end
    );
    
    const accumulatedSales = calculateAccumulatedSales(
      sales,
      salary.user_display_name,
      salary.period_end
    );

    const commission = accumulatedSales > 25000 ? 
      periodSales * 0.15 : 
      periodSales * salary.commission_rate;

    const bonus = calculateBonus(
      salary.user_display_name,
      salary.period_start,
      salary.period_end
    );

    const subtotal = baseAmount + commission + bonus;
    const vacationPay = subtotal * 0.12;
    const totalSalary = subtotal + vacationPay;

    return {
      name: salary.user_display_name,
      total: totalSalary,
      periodStart: salary.period_start,
      periodEnd: salary.period_end
    };
  });

  // Calculate total by summing up all individual totals
  const totalSalaries = salaryDetails.reduce((sum, detail) => sum + detail.total, 0);

  return (
    <div className="space-y-4">
      <TotalSalariesCard 
        totalSalaries={totalSalaries} 
        salaryDetails={salaryDetails}
      />
      
      {filteredSalaries.map((salary) => {
        const periodSales = calculateTotalSales(
          salary.user_display_name,
          salary.period_start,
          salary.period_end
        );
        
        const accumulatedSales = calculateAccumulatedSales(
          sales,
          salary.user_display_name,
          salary.period_end
        );

        const bonus = calculateBonus(
          salary.user_display_name,
          salary.period_start,
          salary.period_end
        );

        const periodShifts = sales.filter(sale => 
          sale["User Display Name"] === salary.user_display_name &&
          new Date(sale.Timestamp) >= new Date(salary.period_start) &&
          new Date(sale.Timestamp) <= new Date(salary.period_end)
        );

        const periodBonuses = bonuses.filter(bonus => 
          bonus.user_display_name === salary.user_display_name &&
          new Date(bonus.bonus_date) >= new Date(salary.period_start) &&
          new Date(bonus.bonus_date) <= new Date(salary.period_end)
        );

        return (
          <SalaryCard
            key={`${salary.id}-${salary.period_start}`}
            salary={{
              ...salary,
              bonus: bonus
            }}
            totalSales={periodSales}
            accumulatedSales={accumulatedSales}
            shiftsCount={calculateShiftsCount(
              salary.user_display_name,
              salary.period_start,
              salary.period_end
            )}
            shifts={periodShifts}
            bonuses={periodBonuses}
          />
        );
      })}
    </div>
  );
};