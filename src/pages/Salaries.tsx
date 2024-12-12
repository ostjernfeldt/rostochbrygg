import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { SalaryCard } from "@/components/salaries/SalaryCard";
import { PeriodFilter } from "@/components/salaries/PeriodFilter";

const Salaries = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  
  const { data: salaries, isLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      console.log("Fetching salaries data...");
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .order("period_start", { ascending: false });

      if (error) {
        console.error("Error fetching salaries:", error);
        throw error;
      }
      
      return data;
    }
  });

  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*");

      if (error) throw error;
      return data;
    }
  });

  const uniquePeriods = salaries ? [...new Set(salaries.map(salary => 
    format(new Date(salary.period_start), 'yyyy-MM')
  ))].sort((a, b) => b.localeCompare(a)) : [];

  const filteredSalaries = salaries?.filter(salary => 
    selectedPeriod === "all" || format(new Date(salary.period_start), 'yyyy-MM') === selectedPeriod
  );

  const calculateTotalSales = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    return sales
      .filter(sale => 
        sale["User Display Name"] === userName &&
        new Date(sale.Timestamp!) >= new Date(startDate) &&
        new Date(sale.Timestamp!) <= new Date(endDate)
      )
      .reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <h1 className="text-2xl font-bold mb-6">Löner</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-card rounded-xl"></div>
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
              key={salary.id}
              salary={salary}
              totalSales={calculateTotalSales(
                salary.user_display_name,
                salary.period_start,
                salary.period_end
              )}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Salaries;