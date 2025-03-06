
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

export const useLeaderboardData = (type: TimePeriod, selectedDate: string) => {
  return useQuery({
    queryKey: ["challengeLeaders", type, selectedDate],
    queryFn: async () => {
      console.log(`Fetching ${type} challenge leaders from total_purchases...`);
      
      try {
        // First, get the list of visible staff members in a single query
        const { data: visibleStaff, error: staffError } = await supabase
          .from("staff_roles")
          .select("user_display_name, historical_points:staff_historical_points(points)")
          .eq("hidden", false)
          .order("user_display_name");

        if (staffError) throw staffError;

        const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));
        
        // Calculate date ranges based on the selected date and type
        let startDate: Date;
        let endDate: Date;
        let useLatestDate = false;
        
        // Parse the selectedDate once
        const parsedSelectedDate = parseISO(selectedDate);

        switch (type) {
          case 'daily':
            startDate = new Date(parsedSelectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'weekly':
            startDate = startOfWeek(parsedSelectedDate);
            endDate = endOfWeek(startDate);
            break;
          case 'monthly':
            const [year, month] = selectedDate.split('-').map(Number);
            startDate = startOfMonth(new Date(year, month - 1));
            endDate = endOfMonth(startDate);
            break;
        }

        // Get all relevant sales in a single query
        const { data: sales, error: salesError } = await supabase
          .from("total_purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString())
          .not("refunded", "eq", true)
          .not("user_display_name", "is", null);

        if (salesError) throw salesError;

        // If no sales are found for the selected date range and we need the latest date
        if ((!sales || sales.length === 0) && type === 'daily') {
          // Check if there are any sales at all with a lightweight count query
          const { count, error: countError } = await supabase
            .from("total_purchases")
            .select("*", { count: 'exact', head: true });
          
          if (countError) throw countError;
          
          if (count === 0) {
            // No sales at all - return empty array for placeholder message
            console.log("No sales found at all, returning empty array");
            const emptyLeaders: UserSales[] = [];
            
            // Create a result object based on the requested type
            const result: Record<string, any> = { latestDate: null };
            
            // Use the string literal to create property name dynamically
            const leaderKey = `${type}Leaders` as const;
            result[leaderKey] = emptyLeaders;
            
            return result;
          }
          
          // If there are sales but none for selected date, find the latest date with sales
          const { data: latestSale, error: latestError } = await supabase
            .from("total_purchases")
            .select("timestamp")
            .not("user_display_name", "is", null)
            .order("timestamp", { ascending: false })
            .limit(1)
            .single();

          if (latestError) {
            console.log("Error getting latest sale, using current date", latestError);
            // Use current date as fallback
            const emptyResult: Record<string, any> = { latestDate: null };
            
            // Use the string literal to create property name dynamically
            const leaderKey = `${type}Leaders` as const;
            emptyResult[leaderKey] = [];
            
            return emptyResult;
          }
          
          // Update date range to use latest date
          startDate = new Date(latestSale.timestamp);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          useLatestDate = true;
          
          // Fetch sales for this latest date
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
            const emptyLeaders: UserSales[] = [];
            const emptyResult: Record<string, any> = { latestDate: startDate.toISOString() };
            
            // Use the string literal to create property name dynamically
            const leaderKey = `${type}Leaders` as const;
            emptyResult[leaderKey] = emptyLeaders;
            
            return emptyResult;
          }
          
          // Calculate leaders with the latest sales
          const leaders = calculateLeaders(latestSales, visibleStaffNames);
          
          const result: Record<string, any> = { latestDate: startDate.toISOString() };
          
          // Use the string literal to create property name dynamically
          const leaderKey = `${type}Leaders` as const;
          result[leaderKey] = leaders;
          
          return result;
        }

        // Calculate leaders with the originally requested date range
        const leaders = calculateLeaders(sales, visibleStaffNames);
        
        // Create result object based on the requested type
        const result: Record<string, any> = { 
          latestDate: useLatestDate ? startDate.toISOString() : null 
        };
        
        // Use the string literal to create property name dynamically
        const leaderKey = `${type}Leaders` as const;
        result[leaderKey] = leaders;
        
        return result;
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        throw error;
      }
    }
  });
};

// Simplified leader calculation with better performance
const calculateLeaders = (sales: TotalPurchase[] | null, visibleStaffNames: Set<string>): UserSales[] => {
  if (!sales || sales.length === 0) {
    return [];
  }
  
  // Process sales only once and track totals by user
  const userTotals: Record<string, { points: number, salesCount: number, sales: TotalPurchase[] }> = {};
  
  // Pre-filter sales to only include visible staff members - do this once
  const visibleSales = sales.filter(sale => 
    sale.user_display_name && visibleStaffNames.has(sale.user_display_name)
  );
  
  // Process transactions once
  const processedSales = processTransactions(visibleSales);
  
  // Group sales by user
  processedSales.forEach(sale => {
    const name = sale.user_display_name;
    if (!name || !visibleStaffNames.has(name)) return;
    
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
