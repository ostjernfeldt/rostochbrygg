import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

export const useLeaderboardData = (type: 'daily' | 'weekly' | 'monthly', selectedDate: string) => {
  return useQuery({
    queryKey: ["challengeLeaders", type, selectedDate],
    queryFn: async () => {
      console.log(`Fetching ${type} challenge leaders...`);
      
      try {
        const { data: latestSale, error: saleError } = await supabase
          .from("purchases")
          .select("Timestamp")
          .order("Timestamp", { ascending: false })
          .limit(1)
          .single();

        if (saleError) throw saleError;

        if (!latestSale) {
          console.log("No sales found");
          return {
            dailyLeader: null,
            weeklyLeader: null,
            monthlyLeader: null
          };
        }

        let startDate: Date;
        let endDate: Date;

        switch (type) {
          case 'daily':
            startDate = parseISO(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'weekly':
            startDate = startOfWeek(parseISO(selectedDate));
            endDate = endOfWeek(startDate);
            break;
          case 'monthly':
            const [year, month] = selectedDate.split('-').map(Number);
            startDate = startOfMonth(new Date(year, month - 1));
            endDate = endOfMonth(startDate);
            break;
        }

        const { data: sales, error: salesError } = await supabase
          .from("purchases")
          .select('"User Display Name", Amount, Timestamp')
          .gte("Timestamp", startDate.toISOString())
          .lte("Timestamp", endDate.toISOString());

        if (salesError) throw salesError;

        const calculateLeader = (sales: any[] | null) => {
          if (!sales || sales.length === 0) return null;
          
          const totals = sales.reduce((acc: { [key: string]: number }, sale) => {
            const name = sale["User Display Name"];
            const amount = Number(sale.Amount || 0);
            acc[name] = (acc[name] || 0) + amount;
            return acc;
          }, {});

          const sortedTotals = Object.entries(totals)
            .sort(([, a], [, b]) => Number(b) - Number(a));

          return sortedTotals.length > 0 
            ? { 
                name: sortedTotals[0][0], 
                amount: Number(sortedTotals[0][1])
              }
            : null;
        };

        const leader = calculateLeader(sales || []);
        console.log(`${type} leader calculated:`, leader);

        return {
          dailyLeader: type === 'daily' ? leader : null,
          weeklyLeader: type === 'weekly' ? leader : null,
          monthlyLeader: type === 'monthly' ? leader : null
        };
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        throw error;
      }
    }
  });
};