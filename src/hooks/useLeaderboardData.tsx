import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

interface UserTotals {
  [key: string]: {
    totalAmount: number;
    salesCount: number;
  };
}

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
            dailyLeaders: [],
            weeklyLeaders: [],
            monthlyLeaders: []
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

        const calculateLeaders = (sales: any[] | null) => {
          if (!sales || sales.length === 0) return [];
          
          // Group sales by user and calculate total amount and count
          const userTotals = sales.reduce<UserTotals>((acc, sale) => {
            const name = sale["User Display Name"];
            const amount = Number(sale.Amount || 0);
            
            if (!acc[name]) {
              acc[name] = { totalAmount: 0, salesCount: 0 };
            }
            
            acc[name].totalAmount += amount;
            acc[name].salesCount += 1;
            
            return acc;
          }, {});

          // Convert to array and sort by total amount
          return Object.entries(userTotals)
            .map(([name, { totalAmount, salesCount }]) => ({
              "User Display Name": name,
              totalAmount,
              salesCount
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
        };

        const leaders = calculateLeaders(sales || []);
        console.log(`${type} leaders calculated:`, leaders);

        return {
          dailyLeaders: type === 'daily' ? leaders : [],
          weeklyLeaders: type === 'weekly' ? leaders : [],
          monthlyLeaders: type === 'monthly' ? leaders : []
        };
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        throw error;
      }
    }
  });
};