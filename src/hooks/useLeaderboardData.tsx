import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

interface TotalPurchase {
  id: string;
  purchase_uuid: string | null;
  timestamp: string;
  amount: number;
  user_display_name: string | null;
  payment_type: string | null;
  product_name: string | null;
  source: string;
  created_at: string | null;
  updated_at: string | null;
}

interface UserTotals {
  totalAmount: number;
  salesCount: number;
}

export const useLeaderboardData = (type: 'daily' | 'weekly' | 'monthly', selectedDate: string) => {
  return useQuery({
    queryKey: ["challengeLeaders", type, selectedDate],
    queryFn: async () => {
      console.log(`Fetching ${type} challenge leaders...`);
      
      try {
        const { data: latestSale, error: latestError } = await supabase
          .from("total_purchases")
          .select("timestamp")
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        if (latestError) throw latestError;

        if (!latestSale) {
          console.log("No sales found at all");
          return {
            dailyLeaders: [],
            weeklyLeaders: [],
            monthlyLeaders: []
          };
        }

        let startDate: Date;
        let endDate: Date;
        let useLatestDate = false;

        switch (type) {
          case 'daily':
            startDate = parseISO(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);

            // Check if there are any sales for the selected date
            const { data: checkSales } = await supabase
              .from("total_purchases")
              .select("id")
              .gte("timestamp", startDate.toISOString())
              .lte("timestamp", endDate.toISOString())
              .limit(1);

            // If no sales found for selected date, use the latest date with sales
            if (!checkSales || checkSales.length === 0) {
              console.log("No sales for selected date, using latest date:", latestSale.timestamp);
              startDate = new Date(latestSale.timestamp);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(startDate);
              endDate.setHours(23, 59, 59, 999);
              useLatestDate = true;
            }
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
          .from("total_purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString());

        if (salesError) throw salesError;

        console.log(`Sales data for ${type}:`, sales);

        const calculateLeaders = (sales: TotalPurchase[] | null): UserSales[] => {
          if (!sales || sales.length === 0) return [];
          
          const userTotals = sales.reduce<Record<string, UserTotals>>((acc, sale) => {
            const name = sale.user_display_name;
            if (!name) return acc;
            
            if (!acc[name]) {
              acc[name] = { totalAmount: 0, salesCount: 0 };
            }
            
            acc[name].totalAmount += Number(sale.amount) || 0;
            acc[name].salesCount += 1;
            
            return acc;
          }, {});

          return Object.entries(userTotals)
            .map(([name, { totalAmount, salesCount }]) => ({
              "User Display Name": name,
              totalAmount,
              salesCount
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
        };

        const leaders = calculateLeaders(sales);
        console.log(`${type} leaders:`, leaders);

        return {
          dailyLeaders: type === 'daily' ? leaders : [],
          weeklyLeaders: type === 'weekly' ? leaders : [],
          monthlyLeaders: type === 'monthly' ? leaders : [],
          latestDate: useLatestDate ? startDate.toISOString() : null
        };
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        throw error;
      }
    }
  });
};