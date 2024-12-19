import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { mapPurchaseArray } from "@/utils/purchaseMappers";

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
        // First, get the latest date with sales
        const { data: latestSale, error: latestError } = await supabase
          .from("purchases")
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
              .from("purchases")
              .select("purchase_uuid")
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

        console.log("Fetching sales between:", startDate, "and", endDate);

        const { data: sales, error: salesError } = await supabase
          .from("purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString());

        if (salesError) throw salesError;

        const mappedSales = sales ? mapPurchaseArray(sales) : [];

        const calculateLeaders = (sales: LegacyPurchaseFormat[]) => {
          if (!sales || sales.length === 0) return [];
          
          // Group sales by user and calculate total amount and count
          const userTotals = sales.reduce<UserTotals>((acc, sale) => {
            const name = sale["User Display Name"];
            const amount = sale.Amount;
            
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

        const leaders = calculateLeaders(mappedSales);
        console.log(`${type} leaders calculated:`, leaders);
        console.log("Using latest date:", useLatestDate);

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
