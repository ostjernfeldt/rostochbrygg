import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
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
    
    console.log('Calculating total sales for:', {
      userName,
      startDate,
      endDate,
      salesCount: sales.length
    });
    
    const periodSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      
      const isWithinPeriod = saleDate >= start && saleDate <= end;
      
      console.log('Checking sale:', {
        saleDate: format(saleDate, 'yyyy-MM-dd HH:mm:ss'),
        start: format(start, 'yyyy-MM-dd HH:mm:ss'),
        end: format(end, 'yyyy-MM-dd HH:mm:ss'),
        isWithinPeriod,
        userName: sale.user_display_name,
        amount: sale.amount,
        refunded: sale.refunded
      });
      
      return sale.user_display_name === userName &&
             isWithinPeriod &&
             !sale.refunded &&
             sale.amount > 0;
    });

    const total = periodSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
    
    console.log('Period sales result:', {
      userName,
      periodSalesCount: periodSales.length,
      total,
      startDate,
      endDate
    });

    return total;
  };

  const filteredSalaries = salaries?.filter(salary => {
    if (searchQuery && !salary.user_display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (!actualSellers?.includes(salary.user_display_name)) {
      return false;
    }

    // Adjust the salary period based on the selected period
    let adjustedStartDate = salary.period_start;
    let adjustedEndDate = salary.period_end;

    if (selectedPeriod === "custom" && dateRange) {
      const rangeStart = dateRange.from ? startOfDay(dateRange.from) : null;
      const rangeEnd = dateRange.to ? endOfDay(dateRange.to) : null;

      if (rangeStart && rangeEnd) {
        adjustedStartDate = rangeStart.toISOString();
        adjustedEndDate = rangeEnd.toISOString();
      }
    } else if (selectedPeriod !== "all") {
      // For specific salary period selection (e.g., "2024-11-21")
      const periodStart = new Date(selectedPeriod);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(20);
      
      adjustedStartDate = periodStart.toISOString();
      adjustedEndDate = periodEnd.toISOString();
    }

    const totalSales = calculateTotalSales(
      salary.user_display_name,
      adjustedStartDate,
      adjustedEndDate
    );

    // Update the salary object with the adjusted period
    salary.period_start = adjustedStartDate;
    salary.period_end = adjustedEndDate;

    return totalSales > 0;
  });

  const calculateShiftsCount = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    const uniqueDates = new Set(
      sales
        .filter(sale => {
          const saleDate = new Date(sale.timestamp);
          const start = startOfDay(new Date(startDate));
          const end = endOfDay(new Date(endDate));
          
          return sale.user_display_name === userName &&
                 saleDate >= start &&
                 saleDate <= end &&
                 !sale.refunded &&
                 sale.amount > 0;
        })
        .map(sale => format(new Date(sale.timestamp), 'yyyy-MM-dd'))
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