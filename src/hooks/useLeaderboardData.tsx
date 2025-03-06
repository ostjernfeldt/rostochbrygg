
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { processTransactions, getValidSalesCount } from "@/components/transactions/TransactionProcessor";
import { TotalPurchase } from "@/types/purchase";
import { calculateTotalPoints } from "@/utils/pointsCalculation";

interface UserSales {
  "User Display Name": string;
  points: number;
  salesCount: number;
}

// Defining a union type for the supported time periods
type TimePeriod = 'daily' | 'weekly' | 'monthly';

// Define return type for the query
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
      console.log(`Fetching ${type} challenge leaders from total_purchases...`);
      
      try {
        // Parse the selectedDate once to ensure proper date handling
        let parsedDate;
        try {
          parsedDate = parseISO(selectedDate);
        } catch (error) {
          console.error("Invalid date format:", selectedDate, error);
          return { [type + 'Leaders']: [] as UserSales[] };
        }

        // Calculate date ranges based on the selected date and type
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
            break;
          case 'monthly':
            const [year, month] = selectedDate.split('-').map(Number);
            startDate = startOfMonth(new Date(year, month - 1));
            endDate = endOfMonth(startDate);
            break;
          default:
            throw new Error(`Unsupported time period: ${type}`);
        }

        // Get all staff members (both visible and hidden) - removing any filtering by role
        const { data: allStaff, error: staffError } = await supabase
          .from("staff_roles")
          .select("user_display_name");

        if (staffError) {
          console.error("Error fetching staff:", staffError);
          throw staffError;
        }

        const allStaffNames = new Set(allStaff.map(s => s.user_display_name));
        
        if (allStaffNames.size === 0) {
          console.log("No staff members found in staff_roles table");
          return { [type + 'Leaders']: [] as UserSales[] };
        }

        // Get all relevant sales within the date range - removed any role-based filtering
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

        // If no sales are found for the selected date range and we need the latest date
        if ((!sales || sales.length === 0) && type === 'daily') {
          // Check if there are any sales at all with a lightweight count query
          const { count, error: countError } = await supabase
            .from("total_purchases")
            .select("*", { count: 'exact', head: true });
          
          if (countError) throw countError;
          
          if (count === 0) {
            // No sales at all - return empty array
            console.log("No sales found at all, returning empty array");
            return { [type + 'Leaders']: [] as UserSales[], latestDate: null };
          }
          
          // If there are sales but none for selected date, find the latest date with sales
          const { data: latestSale, error: latestError } = await supabase
            .from("total_purchases")
            .select("timestamp")
            .not("user_display_name", "is", null)
            .order("timestamp", { ascending: false })
            .limit(1);

          if (latestError) {
            console.log("Error getting latest sale, using current date", latestError);
            // Use current date as fallback
            return { [type + 'Leaders']: [] as UserSales[], latestDate: null };
          }
          
          if (!latestSale || latestSale.length === 0) {
            return { [type + 'Leaders']: [] as UserSales[], latestDate: null };
          }
          
          // Update date range to use latest date
          startDate = new Date(latestSale[0].timestamp);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          useLatestDate = true;
          
          // Fetch sales for this latest date - removed any role-based filtering
          const { data: latestSales, error: latestSalesError } = await supabase
            .from("total_purchases")
            .select("*")
            .gte("timestamp", startDate.toISOString())
            .lte("timestamp", endDate.toISOString())
            .not("refunded", "eq", true)
            .not("user_display_name", "is", null);
            
          if (latestSalesError) throw latestSalesError;
          
          if (!latestSales || latestSales.length === 0) {
            // Still no valid sales - return empty array
            return { 
              [type + 'Leaders']: [] as UserSales[], 
              latestDate: startDate.toISOString() 
            };
          }
          
          // Calculate leaders with the latest sales
          const leaders = calculateLeaders(latestSales, allStaffNames);
          
          return { 
            [type + 'Leaders']: leaders, 
            latestDate: startDate.toISOString() 
          };
        }

        // Calculate leaders with the originally requested date range
        const leaders = calculateLeaders(sales, allStaffNames);
        
        // Create result object based on the requested type
        return { 
          [type + 'Leaders']: leaders,
          latestDate: useLatestDate ? startDate.toISOString() : null 
        } as LeaderboardData;
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        return { [type + 'Leaders']: [] as UserSales[] };
      }
    }
  });
};

// Simplified leader calculation
const calculateLeaders = (sales: TotalPurchase[] | null, staffNames: Set<string>): UserSales[] => {
  if (!sales || sales.length === 0) {
    return [];
  }
  
  // Process sales only once and track totals by user
  const userTotals: Record<string, { points: number, salesCount: number, sales: TotalPurchase[] }> = {};
  
  // Process transactions once
  const processedSales = processTransactions(sales);
  
  // Group sales by user
  processedSales.forEach(sale => {
    const name = sale.user_display_name;
    if (!name || !staffNames.has(name)) return;
    
    if (!userTotals[name]) {
      userTotals[name] = {
        points: 0,
        salesCount: 0,
        sales: []
      };
    }
    
    userTotals[name].sales.push(sale);
  });
  
  // Calculate stats for each user
  const leaders = Object.entries(userTotals)
    .map(([name, data]) => {
      // Only calculate when needed
      return {
        "User Display Name": name,
        points: calculateTotalPoints(data.sales),
        salesCount: getValidSalesCount(data.sales)
      };
    })
    .sort((a, b) => b.points - a.points);
  
  return leaders;
};
