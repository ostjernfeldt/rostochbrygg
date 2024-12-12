import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DollarSign, Calendar, User } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface Salary {
  id: string;
  user_display_name: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  commission_rate: number;
  bonus: number;
  vacation_pay: number;
}

const Salaries = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  
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
      
      return data as Salary[];
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
    `${format(new Date(salary.period_start), 'yyyy-MM')}`))] : [];

  const filteredSalaries = salaries?.filter(salary => 
    !selectedPeriod || format(new Date(salary.period_start), 'yyyy-MM') === selectedPeriod
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
          <Select
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
          >
            <SelectTrigger className="w-[180px] bg-card border-gray-800">
              <SelectValue placeholder="Välj period" />
            </SelectTrigger>
            <SelectContent className="bg-card border-gray-800">
              <SelectItem value="" className="focus:bg-gray-800">Alla perioder</SelectItem>
              {uniquePeriods.map((period) => (
                <SelectItem 
                  key={period} 
                  value={period}
                  className="focus:bg-gray-800"
                >
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredSalaries?.map((salary) => {
            const totalSales = calculateTotalSales(
              salary.user_display_name,
              salary.period_start,
              salary.period_end
            );
            const commission = totalSales * (salary.commission_rate / 100);
            const totalSalary = salary.base_salary + commission + (salary.bonus || 0) + (salary.vacation_pay || 0);

            return (
              <div
                key={salary.id}
                className="bg-card p-6 rounded-xl space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">{salary.user_display_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-400">
                      {format(new Date(salary.period_start), 'yyyy-MM-dd')} - {format(new Date(salary.period_end), 'yyyy-MM-dd')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Grundlön</div>
                    <div className="text-lg font-semibold">
                      {salary.base_salary.toLocaleString()} kr
                    </div>
                  </div>
                  
                  <div className="bg-background p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Total försäljning</div>
                    <div className="text-lg font-semibold">
                      {totalSales.toLocaleString()} kr
                    </div>
                  </div>

                  <div className="bg-background p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">
                      Provision ({salary.commission_rate}%)
                    </div>
                    <div className="text-lg font-semibold">
                      {commission.toLocaleString()} kr
                    </div>
                  </div>

                  <div className="bg-background p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Total lön</div>
                    <div className="text-lg font-semibold text-primary">
                      {totalSalary.toLocaleString()} kr
                    </div>
                  </div>

                  {salary.bonus > 0 && (
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Bonus</div>
                      <div className="text-lg font-semibold">
                        {salary.bonus.toLocaleString()} kr
                      </div>
                    </div>
                  )}

                  {salary.vacation_pay > 0 && (
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Semesterersättning</div>
                      <div className="text-lg font-semibold">
                        {salary.vacation_pay.toLocaleString()} kr
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default Salaries;