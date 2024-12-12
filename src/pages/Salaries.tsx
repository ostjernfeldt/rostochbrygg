import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { SalaryCard } from "@/components/salaries/SalaryCard";
import { PeriodFilter } from "@/components/salaries/PeriodFilter";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const Salaries = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  
  // Fetch salaries data
  const { data: salaries, isLoading: salariesLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .order("period_start", { ascending: false });

      if (error) {
        console.error("Error fetching salaries:", error);
        throw error;
      }
      
      console.log("Fetched salaries with bonuses:", data);
      return data;
    }
  });

  // Fetch sales data for the period
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*");

      if (error) {
        console.error("Error fetching sales:", error);
        throw error;
      }

      console.log("Fetched sales:", data);
      return data;
    }
  });

  const uniquePeriods = salaries ? [...new Set(salaries.map(salary => 
    format(new Date(salary.period_start), 'yyyy-MM', { locale: sv })
  ))].sort((a, b) => b.localeCompare(a)) : [];

  const filteredSalaries = salaries?.filter(salary => 
    selectedPeriod === "all" || format(new Date(salary.period_start), 'yyyy-MM') === selectedPeriod
  );

  const calculateTotalSales = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    const periodSales = sales.filter(sale => 
      sale["User Display Name"] === userName &&
      new Date(sale.Timestamp!) >= new Date(startDate) &&
      new Date(sale.Timestamp!) <= new Date(endDate)
    );
    
    console.log(`Calculating sales for ${userName} between ${startDate} and ${endDate}:`, periodSales);
    
    return periodSales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
  };

  const calculateShiftsCount = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    // Get all sales for the user in the period
    const userSales = sales.filter(sale => 
      sale["User Display Name"] === userName &&
      new Date(sale.Timestamp!) >= new Date(startDate) &&
      new Date(sale.Timestamp!) <= new Date(endDate)
    );
    
    // Group sales by date and count days with sales > 0
    const salesByDate = userSales.reduce((acc, sale) => {
      const date = new Date(sale.Timestamp!).toDateString();
      acc[date] = (acc[date] || 0) + Number(sale.Amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    // Count days where total sales > 0
    const shiftsCount = Object.values(salesByDate).filter(total => total > 0).length;
    
    console.log(`Calculating shifts for ${userName} between ${startDate} and ${endDate}:`, {
      salesByDate,
      shiftsCount
    });
    
    return shiftsCount;
  };

  const isLoading = salariesLoading || salesLoading;

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Löner</h1>
          <PeriodFilter
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            uniquePeriods={uniquePeriods}
          />
        </div>

        <div className="space-y-4">
          {filteredSalaries?.map((salary) => (
            <SalaryCard
              key={`${salary.id}-${salary.period_start}`}
              salary={salary}
              totalSales={calculateTotalSales(
                salary.user_display_name,
                salary.period_start,
                salary.period_end
              )}
              shiftsCount={calculateShiftsCount(
                salary.user_display_name,
                salary.period_start,
                salary.period_end
              )}
            />
          ))}
          
          {(!filteredSalaries || filteredSalaries.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              Inga löner hittades för denna period
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Salaries;