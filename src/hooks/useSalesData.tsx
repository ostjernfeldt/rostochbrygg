
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processTransactions, getValidSalesCount, getValidTotalAmount } from "@/components/transactions/TransactionProcessor";

interface SalesData {
  totalAmount: number;
  salesCount: number;
  averageValue: number;
  sellingDays: number;
  uniqueSellers: number;
  dailyAverage: number;
  transactions: any[];
  paymentMethodStats: any[];
  percentageChanges: {
    totalAmount: number;
    salesCount: number;
    averageValue: number;
  };
}

export const useSalesData = (selectedDate?: string) => {
  return useQuery({
    queryKey: ["latestSales", selectedDate],
    queryFn: async (): Promise<SalesData> => {
      console.log("Fetching sales data for date:", selectedDate);
      
      // First get visible staff members
      const { data: visibleStaff, error: staffError } = await supabase
        .from("staff_roles")
        .select("user_display_name")
        .eq("hidden", false);

      if (staffError) throw staffError;

      const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));
      
      const startOfDay = new Date(selectedDate || new Date());
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate || new Date());
      endOfDay.setHours(23, 59, 59, 999);

      // First check if there are any visible sellers for this day
      const { data: sellerCheck } = await supabase
        .from("total_purchases")
        .select("user_display_name")
        .gte("timestamp", startOfDay.toISOString())
        .lte("timestamp", endOfDay.toISOString())
        .not("user_display_name", "is", null);

      // Check if all sellers for this day are hidden
      const hasVisibleSellers = sellerCheck?.some(sale => 
        sale.user_display_name && visibleStaffNames.has(sale.user_display_name)
      );

      if (!hasVisibleSellers) {
        // If all sellers are hidden, return empty data
        return {
          totalAmount: 0,
          salesCount: 0,
          averageValue: 0,
          sellingDays: 0,
          uniqueSellers: 0,
          dailyAverage: 0,
          transactions: [],
          paymentMethodStats: [],
          percentageChanges: {
            totalAmount: 0,
            salesCount: 0,
            averageValue: 0
          }
        };
      }

      const { data: salesData, error: salesError } = await supabase
        .from("total_purchases")
        .select("*")
        .gte("timestamp", startOfDay.toISOString())
        .lte("timestamp", endOfDay.toISOString());

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        throw salesError;
      }

      // Filter out data from hidden staff members
      const filteredSalesData = salesData?.filter(sale => 
        !sale.user_display_name || visibleStaffNames.has(sale.user_display_name)
      ) || [];

      // Get previous day's data from a day that has visible sellers
      let previousSalesData: any[] = [];
      let currentDate = new Date(startOfDay);
      currentDate.setDate(currentDate.getDate() - 1);

      while (previousSalesData.length === 0 && currentDate.getTime() > new Date('2020-01-01').getTime()) {
        const previousStart = new Date(currentDate);
        previousStart.setHours(0, 0, 0, 0);
        const previousEnd = new Date(currentDate);
        previousEnd.setHours(23, 59, 59, 999);

        const { data: prevData } = await supabase
          .from("total_purchases")
          .select("*")
          .gte("timestamp", previousStart.toISOString())
          .lte("timestamp", previousEnd.toISOString());

        // Filter and check if there are any visible sellers
        const filteredPrevData = prevData?.filter(sale => 
          sale.user_display_name && visibleStaffNames.has(sale.user_display_name)
        ) || [];

        if (filteredPrevData.length > 0) {
          previousSalesData = filteredPrevData;
          break;
        }

        currentDate.setDate(currentDate.getDate() - 1);
      }

      const processedTransactions = processTransactions(filteredSalesData);
      const totalAmount = getValidTotalAmount(processedTransactions);
      const salesCount = getValidSalesCount(processedTransactions);
      const averageValue = salesCount > 0 ? totalAmount / salesCount : 0;

      const processedPreviousTransactions = processTransactions(previousSalesData);
      const previousTotalAmount = getValidTotalAmount(processedPreviousTransactions);
      const previousSalesCount = getValidSalesCount(processedPreviousTransactions);
      const previousAverageValue = previousSalesCount > 0 ? previousTotalAmount / previousSalesCount : 0;

      // Calculate payment method stats from filtered data
      const paymentMethodStats = processedTransactions.reduce((acc: any[], transaction) => {
        const methodIndex = acc.findIndex(m => m.method === transaction.payment_type);
        if (methodIndex === -1) {
          acc.push({
            method: transaction.payment_type || 'UNKNOWN',
            count: 1,
            amount: Number(transaction.amount) || 0,
            percentage: '0'
          });
        } else {
          acc[methodIndex].count += 1;
          acc[methodIndex].amount += Number(transaction.amount) || 0;
        }
        return acc;
      }, []);

      // Calculate percentages
      const totalCount = paymentMethodStats.reduce((sum, stat) => sum + stat.count, 0);
      paymentMethodStats.forEach(stat => {
        stat.percentage = ((stat.count / totalCount) * 100).toFixed(1);
      });

      const calculatePercentageChange = (current: number, previous: number) => {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
      };

      // Get unique sellers from filtered data
      const uniqueSellers = new Set(processedTransactions.map(t => t.user_display_name)).size;

      return {
        totalAmount,
        salesCount,
        averageValue,
        sellingDays: 1,
        uniqueSellers,
        dailyAverage: totalAmount,
        transactions: processedTransactions,
        paymentMethodStats,
        percentageChanges: {
          totalAmount: calculatePercentageChange(totalAmount, previousTotalAmount),
          salesCount: calculatePercentageChange(salesCount, previousSalesCount),
          averageValue: calculatePercentageChange(averageValue, previousAverageValue)
        }
      };
    }
  });
};
