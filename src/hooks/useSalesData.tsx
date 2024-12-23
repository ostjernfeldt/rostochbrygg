import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processTransactions, getValidSalesCount, getValidTotalAmount } from "@/components/transactions/TransactionProcessor";

interface SalesData {
  totalAmount: number;
  salesCount: number;
  averageValue: number;
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
      
      const startOfDay = new Date(selectedDate || new Date());
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate || new Date());
      endOfDay.setHours(23, 59, 59, 999);

      const { data: salesData, error: salesError } = await supabase
        .from("total_purchases")
        .select("*")
        .gte("timestamp", startOfDay.toISOString())
        .lte("timestamp", endOfDay.toISOString());

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        throw salesError;
      }

      // Get previous day's data for comparison
      const previousDay = new Date(startOfDay);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousDayEnd = new Date(previousDay);
      previousDayEnd.setHours(23, 59, 59, 999);

      const { data: previousSalesData, error: previousSalesError } = await supabase
        .from("total_purchases")
        .select("*")
        .gte("timestamp", previousDay.toISOString())
        .lte("timestamp", previousDayEnd.toISOString());

      if (previousSalesError) {
        console.error("Error fetching previous sales data:", previousSalesError);
        throw previousSalesError;
      }

      const processedTransactions = processTransactions(salesData || []);
      const totalAmount = getValidTotalAmount(processedTransactions);
      const salesCount = getValidSalesCount(processedTransactions);
      const averageValue = salesCount > 0 ? totalAmount / salesCount : 0;

      const processedPreviousTransactions = processTransactions(previousSalesData || []);
      const previousTotalAmount = getValidTotalAmount(processedPreviousTransactions);
      const previousSalesCount = getValidSalesCount(processedPreviousTransactions);
      const previousAverageValue = previousSalesCount > 0 ? previousTotalAmount / previousSalesCount : 0;

      const calculatePercentageChange = (current: number, previous: number) => {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
      };

      console.log("Current day stats:", { totalAmount, salesCount, averageValue });
      console.log("Previous day stats:", { previousTotalAmount, previousSalesCount, previousAverageValue });

      return {
        totalAmount,
        salesCount,
        averageValue,
        percentageChanges: {
          totalAmount: calculatePercentageChange(totalAmount, previousTotalAmount),
          salesCount: calculatePercentageChange(salesCount, previousSalesCount),
          averageValue: calculatePercentageChange(averageValue, previousAverageValue)
        }
      };
    }
  });
};