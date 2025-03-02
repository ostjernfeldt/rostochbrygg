
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

interface UserTotals {
  points: number;
  salesCount: number;
}

export const useLeaderboardData = (type: 'daily' | 'weekly' | 'monthly', selectedDate: string) => {
  return useQuery({
    queryKey: ["challengeLeaders", type, selectedDate],
    queryFn: async () => {
      console.log(`Fetching ${type} challenge leaders from total_purchases...`);
      
      try {
        // First, get the list of visible staff members
        const { data: visibleStaff, error: staffError } = await supabase
          .from("staff_roles")
          .select("user_display_name, historical_points:staff_historical_points(points)")
          .eq("hidden", false)
          .order("user_display_name");

        if (staffError) throw staffError;

        const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));
        const staffHistoricalPoints: Record<string, number> = {};
        
        // Create a map of staff names to their historical points
        visibleStaff.forEach(staff => {
          const points = staff.historical_points?.[0]?.points || 0;
          staffHistoricalPoints[staff.user_display_name] = points;
        });

        // Set default date ranges for empty data scenarios
        let startDate: Date;
        let endDate: Date;
        let useLatestDate = false;

        // Check if there are any sales at all before proceeding with date calculations
        const { data: anySales, error: anySalesError } = await supabase
          .from("total_purchases")
          .select("timestamp")
          .limit(1);

        if (anySalesError) throw anySalesError;

        if (!anySales || anySales.length === 0) {
          console.log("No sales found at all, returning empty array");
          
          // Return empty leaders list since we want to show a placeholder message
          const emptyLeaders: UserSales[] = [];
          
          return {
            dailyLeaders: type === 'daily' ? emptyLeaders : [],
            weeklyLeaders: type === 'weekly' ? emptyLeaders : [],
            monthlyLeaders: type === 'monthly' ? emptyLeaders : [],
            latestDate: null
          };
        }

        // If sales exist, continue with normal date processing
        const { data: latestSale, error: latestError } = await supabase
          .from("total_purchases")
          .select("timestamp")
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        if (latestError) {
          console.log("Error getting latest sale, using current date", latestError);
          // Use current date as fallback
          const currentDate = new Date();
          
          switch (type) {
            case 'daily':
              startDate = new Date(currentDate);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(startDate);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'weekly':
              startDate = startOfWeek(currentDate);
              endDate = endOfWeek(startDate);
              break;
            case 'monthly':
              startDate = startOfMonth(currentDate);
              endDate = endOfMonth(startDate);
              break;
          }
        } else {
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
        }

        const { data: sales, error: salesError } = await supabase
          .from("total_purchases")
          .select("*")
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", endDate.toISOString())
          .not("refunded", "eq", true)
          .not("user_display_name", "is", null);

        if (salesError) throw salesError;

        console.log(`Sales data for ${type}:`, sales);

        const calculateLeaders = (sales: TotalPurchase[] | null): UserSales[] => {
          // Initialize with empty object for tracking user totals
          const userTotals: Record<string, { points: number, salesCount: number, sales: TotalPurchase[] }> = {};
          
          // If there are sales, process them and only add users with actual sales
          if (sales && sales.length > 0) {
            // Filter out sales from hidden staff members
            const visibleSales = sales.filter(sale => 
              sale.user_display_name && visibleStaffNames.has(sale.user_display_name)
            );
            
            const processedSales = processTransactions(visibleSales);
            
            // Update the stats for staff members who have sales
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
            
            // Calculate points and sales counts for staff with sales
            Object.keys(userTotals).forEach(name => {
              if (userTotals[name].sales.length > 0) {
                userTotals[name].points = calculateTotalPoints(userTotals[name].sales);
                userTotals[name].salesCount = getValidSalesCount(userTotals[name].sales);
              }
            });
          }

          // Convert to array and sort by points, only including users with actual sales
          return Object.entries(userTotals)
            .map(([name, stats]) => ({
              "User Display Name": name,
              points: stats.points,
              salesCount: stats.salesCount
            }))
            .sort((a, b) => b.points - a.points);
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
