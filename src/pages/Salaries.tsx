import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { SalaryList } from "@/components/salaries/SalaryList";
import { DateRange } from "react-day-picker";
import { SalaryFilters } from "@/components/salaries/SalaryFilters";
import { useSalaryData } from "@/components/salaries/useSalaryData";

const Salaries = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const { actualSellers, salaries, sales, bonuses, isLoading } = useSalaryData();

  const uniquePeriods = salaries ? [...new Set(salaries.map(salary => 
    format(new Date(salary.period_start), 'yyyy-MM', { locale: sv })
  ))].sort((a, b) => b.localeCompare(a)) : [];

  const calculateTotalSales = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    const periodSales = sales.filter(sale => 
      sale.user_display_name === userName &&
      new Date(sale.timestamp) >= new Date(startDate) &&
      new Date(sale.timestamp) <= new Date(endDate)
    );

    return periodSales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
  };

  const filteredSalaries = salaries?.filter(salary => {
    if (searchQuery && !salary.user_display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (!actualSellers?.includes(salary.user_display_name)) {
      return false;
    }

    const totalSales = calculateTotalSales(
      salary.user_display_name,
      salary.period_start,
      salary.period_end
    );

    if (totalSales === 0) {
      return false;
    }

    if (selectedPeriod === "custom" && dateRange) {
      const salaryStart = new Date(salary.period_start);
      const salaryEnd = new Date(salary.period_end);
      const rangeStart = dateRange.from ? new Date(dateRange.from) : null;
      const rangeEnd = dateRange.to ? new Date(dateRange.to) : null;

      return (!rangeStart || salaryEnd >= rangeStart) && 
             (!rangeEnd || salaryStart <= rangeEnd);
    }

    return selectedPeriod === "all" || 
           format(new Date(salary.period_start), 'yyyy-MM') === selectedPeriod;
  });

  const calculateShiftsCount = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    const uniqueDates = new Set(
      sales
        .filter(sale => 
          sale.user_display_name === userName &&
          new Date(sale.timestamp) >= new Date(startDate) &&
          new Date(sale.timestamp) <= new Date(endDate)
        )
        .map(sale => new Date(sale.timestamp).toDateString())
    );
    
    return uniqueDates.size;
  };

  const calculateBonus = (userName: string, startDate: string, endDate: string) => {
    if (!bonuses) return 0;
    
    const periodBonuses = bonuses.filter(bonus => 
      bonus.user_display_name === userName &&
      new Date(bonus.bonus_date) >= new Date(startDate) &&
      new Date(bonus.bonus_date) <= new Date(endDate)
    );
    
    return periodBonuses.reduce((sum, bonus) => sum + (Number(bonus.amount) || 0), 0);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <h1 className="text-2xl font-bold mb-6">Löner</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-card rounded-xl"></div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SalaryFilters
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        uniquePeriods={uniquePeriods}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      <SalaryList
        filteredSalaries={filteredSalaries || []}
        sales={sales || []}
        shifts={[]}
        bonuses={bonuses || []}
        calculateTotalSales={calculateTotalSales}
        calculateShiftsCount={calculateShiftsCount}
        calculateBonus={calculateBonus}
      />
    </PageLayout>
  );
};

export default Salaries;