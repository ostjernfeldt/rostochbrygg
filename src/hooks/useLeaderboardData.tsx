
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

        // Fetch all staff first to ensure we have entries for everyone
        const { data: allStaff, error: staffError } = await supabase
          .from("staff_roles")
          .select("*")
          .eq("hidden", false); // Only fetch non-hidden staff

        if (staffError) {
          console.error("Error fetching staff:", staffError);
          throw staffError;
        }

        console.log(`Fetched ${allStaff?.length || 0} non-hidden staff members`);
        
        // Create a map of staff members and their hidden status
        const staffMap = new Map<string, boolean>();
        allStaff.forEach(staff => {
          staffMap.set(staff.user_display_name, !!staff.hidden);
        });

        // Create a set of all staff display names for easier lookup
        const allStaffNames = new Set(allStaff.map(s => s.user_display_name));
        
        if (allStaffNames.size === 0) {
          console.log("No active staff members found - creating dummy data");
          
          // If no real staff exists, return dummy data
          const dummyLeaders = [
            { "User Display Name": "Säljare 1", points: 450, salesCount: 30, hidden: false },
            { "User Display Name": "Säljare 2", points: 375, salesCount: 25, hidden: false },
            { "User Display Name": "Säljare 3", points: 300, salesCount: 20, hidden: false },
            { "User Display Name": "Säljare 4", points: 225, salesCount: 15, hidden: false },
            { "User Display Name": "Säljare 5", points: 150, salesCount: 10, hidden: false }
          ];
          
          return { [type + 'Leaders']: dummyLeaders };
        }

        // Fetch non-refunded sales within the date range
        const { data: sales, error: salesError } = await supabase
          .from("total_purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString())
          .not("refunded", "eq", true);

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          throw salesError;
        }

        console.log(`Fetched ${sales?.length || 0} sales for date range`);
        
        // If no sales data exists but we have staff, create empty entries for all staff
        if (!sales || sales.length === 0) {
          console.log("No sales data found for period - creating zero entries for all staff");
          
          const emptyLeaders = Array.from(allStaffNames).map(name => {
            return {
              "User Display Name": name,
              points: 0,
              salesCount: 0,
              hidden: staffMap.get(name) || false
            };
          });
          
          return { [type + 'Leaders']: emptyLeaders };
        }

        // Process transactions and calculate leaders
        const processedSales = processTransactions(sales);
        console.log(`After processing: ${processedSales.length} sales`);
        
        // Initialize userTotals with all staff members, even those without sales
        const userTotals: Record<string, { points: number, salesCount: number, sales: TotalPurchase[], hidden: boolean }> = {};
        
        // First initialize all staff with zero values
        allStaffNames.forEach(name => {
          userTotals[name] = {
            points: 0,
            salesCount: 0,
            sales: [],
            hidden: staffMap.get(name) || false
          };
        });
        
        // Then process all sales, including those from non-staff members
        processedSales.forEach(sale => {
          const name = sale.user_display_name;
          
          if (!name) {
            console.log("Skipping sale with no user_display_name:", sale.id);
            return;
          }
          
          // Create an entry for this user if they don't exist yet
          // (this handles sales from users not in staff_roles)
          if (!userTotals[name]) {
            userTotals[name] = {
              points: 0,
              salesCount: 0,
              sales: [],
              hidden: false // Non-staff sales are visible by default
            };
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
              salesCount,
              hidden: data.hidden
            };
          })
          .sort((a, b) => b.points - a.points);
        
        console.log(`Generated ${leaders.length} leaders (including zero entries)`);
        
        // Filter out hidden staff
        const visibleLeaders = leaders.filter(leader => !leader.hidden);
        console.log(`Showing ${visibleLeaders.length} visible leaders for ${type}`);
        
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
    enabled: !!selectedDate,
    refetchOnMount: true
  });
};
