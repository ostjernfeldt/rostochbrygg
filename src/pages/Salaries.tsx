import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO, startOfDay, endOfDay, isEqual } from "date-fns";
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
    // Log the salary period for debugging
    console.log('Checking salary:', {
      salary_start: salary.period_start,
      salary_end: salary.period_end,
      selectedPeriod
    });

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
      const rangeStart = dateRange.from ? startOfDay(dateRange.from) : null;
      const rangeEnd = dateRange.to ? endOfDay(dateRange.to) : null;

      return (!rangeStart || salaryEnd >= rangeStart) && 
             (!rangeEnd || salaryStart <= rangeEnd);
    }

    if (selectedPeriod === "all") {
      return true;
    }

    // Handle salary period format (yyyy-MM-dd)
    const selectedDate = parseISO(selectedPeriod);
    const salaryStart = new Date(salary.period_start);
    
    // Compare the dates by checking if the salary period starts on the selected date
    const isMatchingPeriod = isEqual(
      startOfDay(salaryStart),
      startOfDay(selectedDate)
    );

    console.log('Date comparison:', {
      salaryStart: format(salaryStart, 'yyyy-MM-dd'),
      selectedDate: format(selectedDate, 'yyyy-MM-dd'),
      isMatchingPeriod
    });

    return isMatchingPeriod;
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

  console.log('Selected period:', selectedPeriod);
  console.log('Filtered salaries:', filteredSalaries);

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