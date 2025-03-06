
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

        // Fetch only non-hidden staff
        const { data: allStaff, error: staffError } = await supabase
          .from("staff_roles")
          .select("*")
          .eq("hidden", false); // Explicitly filter out hidden staff

        if (staffError) {
          console.error("Error fetching staff:", staffError);
          throw staffError;
        }

        console.log(`Fetched ${allStaff?.length || 0} visible staff members`);
        
        if (allStaff.length === 0) {
          console.log("No active staff members found");
          return { [type + 'Leaders']: [] };
        }

        // Create a set of all visible staff display names for easier lookup
        const allStaffNames = new Set(allStaff.map(s => s.user_display_name));
        
        // Fetch non-refunded sales within the date range
        const { data: sales, error: salesError } = await supabase
          .from("total_purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString());

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          throw salesError;
        }

        console.log(`Fetched ${sales?.length || 0} sales for date range`);
        
        // If no sales data exists but we have staff, return empty array
        if (!sales || sales.length === 0) {
          console.log("No sales data found for period - returning empty array");
          return { [type + 'Leaders']: [] };
        }

        // Process transactions and calculate leaders
        const processedSales = processTransactions(sales);
        console.log(`After processing: ${processedSales.length} sales`);
        
        // Initialize userTotals with all visible staff members, even those without sales
        const userTotals: Record<string, { points: number, salesCount: number, sales: TotalPurchase[] }> = {};
        
        // Initialize entries for all visible staff
        allStaff.forEach(staff => {
          userTotals[staff.user_display_name] = {
            points: 0,
            salesCount: 0,
            sales: []
          };
        });
        
        // Process all sales, but only include those from visible staff members
        processedSales.forEach(sale => {
          const name = sale.user_display_name;
          
          if (!name) {
            console.log("Skipping sale with no user_display_name:", sale.id);
            return;
          }
          
          // Skip if the staff member is not in our visible list
          if (!allStaffNames.has(name)) {
            console.log(`Skipping sale from hidden or non-staff member: ${name}`);
            return;
          }
          
          userTotals[name].sales.push(sale);
        });
        
        const leaders = Object.entries(userTotals)
          .map(([name, data]) => {
            const points = calculateTotalPoints(data.sales);
            const salesCount = getValidSalesCount(data.sales);
            
            return {
              "User Display Name": name,
              points,
              salesCount
            };
          })
          // Filter out sellers with zero sales
          .filter(leader => leader.salesCount > 0)
          .sort((a, b) => b.points - a.points);
        
        console.log(`Generated ${leaders.length} leaders after filtering zero sales`);
        
        return { 
          [type + 'Leaders']: leaders,
          latestDate: useLatestDate ? startDate.toISOString() : null 
        };
      } catch (error) {
        console.error(`Error in ${type} challenge leaders query:`, error);
        throw error;
      }
    },
    staleTime: 1000 * 30, // Keep data fresh for 30 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!selectedDate,
    refetchOnMount: true // Ensure data is fresh when the component mounts
  });
};
