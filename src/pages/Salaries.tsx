import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { PeriodFilter } from "@/components/salaries/PeriodFilter";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { SalaryList } from "@/components/salaries/SalaryList";

const Salaries = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  
  // Fetch unique sellers from purchases table
  const { data: actualSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ["actualSellers"],
    queryFn: async () => {
      console.log("Fetching actual sellers from purchases...");
      const { data, error } = await supabase
        .from("purchases")
        .select('"User Display Name"')
        .not("User Display Name", "is", null)
        .not("User Display Name", "eq", "")
        .not("User Display Name", "ilike", '%test%')
        .not("User Display Name", "ilike", '%another%');

      if (error) {
        console.error("Error fetching sellers:", error);
        throw error;
      }

      // Get unique seller names
      const uniqueSellers = [...new Set(data.map(sale => sale["User Display Name"]))];
      console.log("Unique sellers found:", uniqueSellers);
      return uniqueSellers;
    }
  });

  // Fetch salaries data
  const { data: salaries, isLoading: salariesLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      console.log("Fetching salaries...");
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

  // Fetch bonus records
  const { data: bonuses, isLoading: bonusesLoading } = useQuery({
    queryKey: ["bonuses"],
    queryFn: async () => {
      console.log("Fetching bonuses...");
      const { data, error } = await supabase
        .from("bonus_records")
        .select("*");

      if (error) {
        console.error("Error fetching bonuses:", error);
        throw error;
      }

      return data;
    }
  });

  // Fetch sales data for the period
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      console.log("Fetching sales...");
      const { data, error } = await supabase
        .from("purchases")
        .select("*");

      if (error) {
        console.error("Error fetching sales:", error);
        throw error;
      }

      return data;
    }
  });

  const uniquePeriods = salaries ? [...new Set(salaries.map(salary => 
    format(new Date(salary.period_start), 'yyyy-MM', { locale: sv })
  ))].sort((a, b) => b.localeCompare(a)) : [];

  // Filter salaries to only include actual sellers and selected period
  const filteredSalaries = salaries?.filter(salary => 
    (selectedPeriod === "all" || format(new Date(salary.period_start), 'yyyy-MM') === selectedPeriod) &&
    actualSellers?.includes(salary.user_display_name)
  );

  const calculateTotalSales = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    const periodSales = sales.filter(sale => 
      sale["User Display Name"] === userName &&
      new Date(sale.Timestamp!) >= new Date(startDate) &&
      new Date(sale.Timestamp!) <= new Date(endDate)
    );
    
    return periodSales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
  };

  const calculateShiftsCount = (userName: string, startDate: string, endDate: string) => {
    if (!sales) return 0;
    
    const userSales = sales.filter(sale => 
      sale["User Display Name"] === userName &&
      new Date(sale.Timestamp!) >= new Date(startDate) &&
      new Date(sale.Timestamp!) <= new Date(endDate)
    );
    
    const salesByDate = userSales.reduce((acc, sale) => {
      const date = new Date(sale.Timestamp!).toDateString();
      acc[date] = (acc[date] || 0) + Number(sale.Amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.values(salesByDate).filter(total => total > 0).length;
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

  const isLoading = salariesLoading || salesLoading || bonusesLoading || sellersLoading;

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

        <SalaryList
          filteredSalaries={filteredSalaries || []}
          sales={sales || []}
          calculateTotalSales={calculateTotalSales}
          calculateShiftsCount={calculateShiftsCount}
          calculateBonus={calculateBonus}
        />
      </div>
    </PageLayout>
  );
};

export default Salaries;