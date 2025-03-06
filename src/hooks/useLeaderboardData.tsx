import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { processTransactions, getValidSalesCount } from "@/components/transactions/TransactionProcessor";
import { TotalPurchase } from "@/types/purchase";
import { calculateTotalPoints } from "@/utils/pointsCalculation";

interface UserSales {
  "User Display Name": string;
  points: number;
  salesCount: number;
  hidden?: boolean;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly';

interface LeaderboardData {
  dailyLeaders?: UserSales[];
  weeklyLeaders?: UserSales[];
  monthlyLeaders?: UserSales[];
  latestDate?: string | null;
}

export const useLeaderboardData = (type: TimePeriod, selectedDate: string) => {
  return useQuery({
    queryKey: ["challengeLeaders", type, selectedDate],
    queryFn: async (): Promise<LeaderboardData> => {
      if (!selectedDate) {
        console.error("No date selected");
        return { [type + 'Leaders']: [] };
      }

      console.log(`Fetching ${type} challenge leaders for date: ${selectedDate}`);
      
      try {
        const parsedDate = parseISO(selectedDate);
        if (!isValid(parsedDate)) {
          console.error("Invalid date format:", selectedDate);
          return { [type + 'Leaders']: [] };
        }
        console.log(`Parsed date: ${parsedDate.toISOString()}`);

        let startDate: Date;
        let endDate: Date;
        let useLatestDate = false;
        
        switch (type) {
          case 'daily':
            startDate = new Date(parsedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(parsedDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'weekly':
            startDate = startOfWeek(parsedDate);
            endDate = endOfWeek(parsedDate);
            console.log(`Weekly range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
            break;
          case 'monthly':
            startDate = startOfMonth(parsedDate);
            endDate = endOfMonth(parsedDate);
            console.log(`Monthly range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
            break;
          default:
            console.error(`Unsupported time period: ${type}`);
            return { [type + 'Leaders']: [] };
        }

        const { data: allStaff, error: staffError } = await supabase
          .from("staff_roles")
          .select("*");

        if (staffError) {
          console.error("Error fetching staff:", staffError);
          throw staffError;
        }

        const staffMap = new Map<string, boolean>();
        allStaff.forEach(staff => {
          staffMap.set(staff.user_display_name, !!staff.hidden);
        });

        const allStaffNames = new Set(allStaff.map(s => s.user_display_name));
        
        if (allStaffNames.size === 0) {
          console.log("No staff members found");
          return { [type + 'Leaders']: [] };
        }

        const { data: sales, error: salesError } = await supabase
          .from("total_purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString())
          .not("refunded", "eq", true)
          .not("user_display_name", "is", null);

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          throw salesError;
        }

        console.log(`Fetched ${sales?.length || 0} sales for date range`);

        if ((!sales || sales.length === 0) && type === 'daily') {
          const { count, error: countError } = await supabase
            .from("total_purchases")
            .select("*", { count: 'exact', head: true });
          
          if (countError) {
            console.error("Error checking total sales:", countError);
            throw countError;
          }
          
          if (count === 0) {
            console.log("No sales found in database");
            return { [type + 'Leaders']: [], latestDate: null };
          }
          
          const { data: latestSale, error: latestError } = await supabase
            .from("total_purchases")
            .select("timestamp")
            .not("user_display_name", "is", null)
            .order("timestamp", { ascending: false })
            .limit(1);

          if (latestError) {
            console.error("Error getting latest sale:", latestError);
            return { [type + 'Leaders']: [], latestDate: null };
          }
          
          if (!latestSale || latestSale.length === 0) {
            return { [type + 'Leaders']: [], latestDate: null };
          }
          
          startDate = new Date(latestSale[0].timestamp);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          useLatestDate = true;
          
          const { data: latestSales, error: latestSalesError } = await supabase
            .from("total_purchases")
            .select("*")
            .gte("timestamp", startDate.toISOString())
            .lte("timestamp", endDate.toISOString())
            .not("refunded", "eq", true)
            .not("user_display_name", "is", null);
            
          if (latestSalesError) {
            console.error("Error fetching latest sales:", latestSalesError);
            throw latestSalesError;
          }
          
          if (!latestSales || latestSales.length === 0) {
            return { 
              [type + 'Leaders']: [], 
              latestDate: startDate.toISOString() 
            };
          }
          
          const leaders = calculateLeaders(latestSales, allStaffNames, staffMap);
          const visibleLeaders = leaders.filter(leader => !leader.hidden);
          
          return { 
            [type + 'Leaders']: visibleLeaders,
            latestDate: startDate.toISOString() 
          };
        }

        const leaders = calculateLeaders(sales, allStaffNames, staffMap);
        const visibleLeaders = leaders.filter(leader => !leader.hidden);
        
        console.log(`Calculated ${visibleLeaders.length} visible leaders for ${type}`);
        
        return { 
          [type + 'Leaders']: visibleLeaders,
          latestDate: useLatestDate ? startDate.toISOString() : null 
        };
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        throw error;
      }
    },
    staleTime: 1000 * 30,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!selectedDate
  });
};

const calculateLeaders = (
  sales: TotalPurchase[] | null, 
  staffNames: Set<string>,
  staffHiddenMap: Map<string, boolean>
): UserSales[] => {
  if (!sales || sales.length === 0) {
    return [];
  }
  
  const userTotals: Record<string, { points: number, salesCount: number, sales: TotalPurchase[], hidden: boolean }> = {};
  
  const processedSales = processTransactions(sales);
  
  processedSales.forEach(sale => {
    const name = sale.user_display_name;
    
    if (!name) return;
    
    if (!userTotals[name]) {
      userTotals[name] = {
        points: 0,
        salesCount: 0,
        sales: [],
        hidden: staffHiddenMap.get(name) || false
      };
    }
    
    userTotals[name].sales.push(sale);
  });
  
  const leaders = Object.entries(userTotals)
    .map(([name, data]) => {
      return {
        "User Display Name": name,
        points: calculateTotalPoints(data.sales),
        salesCount: getValidSalesCount(data.sales),
        hidden: data.hidden
      };
    })
    .sort((a, b) => b.points - a.points);
  
  return leaders;
};
