import { SalaryCard } from "./SalaryCard";
import { calculateAccumulatedSales } from "@/utils/salaryCalculations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

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

    console.log(`Salary calculation for ${salary.user_display_name}:`, {
      baseAmount,
      commission,
      bonus,
      subtotal,
      vacationPay,
      totalSalary
    });

    return {
      name: salary.user_display_name,
      total: Math.round(totalSalary), // Round to avoid floating point issues
      periodStart: salary.period_start,
      periodEnd: salary.period_end
    };
  });

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-4">
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
            <AccordionItem 
              key={`${salary.id}-${salary.period_start}`}
              value={`${salary.id}-${salary.period_start}`}
              className="bg-card rounded-xl border-0"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
                  <div className="text-xl font-semibold">{salary.user_display_name}</div>
                  <div className="text-gray-400 text-sm">
                    {format(new Date(salary.period_start), 'd MMM yyyy', { locale: sv })} - {format(new Date(salary.period_end), 'd MMM yyyy', { locale: sv })}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <SalaryCard
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};