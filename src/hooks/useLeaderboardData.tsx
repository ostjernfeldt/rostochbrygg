import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface PurchaseData {
  "User Display Name": string;
  Amount: number;
  Timestamp: string;
}

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

const processLeaderboardData = (salesData: PurchaseData[]): UserSales[] => {
  const userSales = salesData.reduce((acc: { [key: string]: UserSales }, sale) => {
    const userName = sale["User Display Name"];
    const amount = Number(sale.Amount || 0);

    if (!acc[userName]) {
      acc[userName] = {
        "User Display Name": userName,
        totalAmount: 0,
        salesCount: 0
      };
    }

    acc[userName].totalAmount += amount;
    acc[userName].salesCount += 1;

    return acc;
  }, {});

  return Object.values(userSales).sort((a, b) => b.totalAmount - a.totalAmount);
};

export const useLeaderboardData = (type: 'daily' | 'weekly' | 'monthly', selectedDate: string) => {
  return useQuery({
    queryKey: ["leaderboard", type, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      console.log(`Fetching ${type} leaderboard data...`);
      
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
          const [year, month] = selectedDate.split('-');
          startDate = startOfMonth(new Date(Number(year), Number(month) - 1));
          endDate = endOfMonth(startDate);
          break;
      }

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount, Timestamp')
        .gte("Timestamp", startDate.toISOString())
        .lte("Timestamp", endDate.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    },
    enabled: !!selectedDate
  });
};