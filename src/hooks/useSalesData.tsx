
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
      
      // First get visible staff members - single query
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

      // Get all transactions for the day in a single query
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
      
      // Check if there are any valid sales (non-refunds from visible sellers)
      const hasValidSales = filteredSalesData.some(sale => 
        !sale.refund_uuid && // not a refund
        sale.user_display_name && 
        visibleStaffNames.has(sale.user_display_name)
      );

      if (!hasValidSales) {
        // If all transactions are refunds or from hidden sellers, return empty data
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

      // Get previous day's data in a single query
      const previousDay = new Date(startOfDay);
      previousDay.setDate(previousDay.getDate() - 1);
      const prevStart = new Date(previousDay);
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = new Date(previousDay);
      prevEnd.setHours(23, 59, 59, 999);

      const { data: prevData } = await supabase
        .from("total_purchases")
        .select("*")
        .gte("timestamp", prevStart.toISOString())
        .lte("timestamp", prevEnd.toISOString());

      // Filter and check if there are any valid sales (non-refunds from visible sellers)
      const filteredPrevData = prevData?.filter(sale => 
        !sale.refund_uuid && // not a refund
        sale.user_display_name && 
        visibleStaffNames.has(sale.user_display_name)
      ) || [];

      // Process transactions - do this once
      const processedTransactions = processTransactions(filteredSalesData);
      const validTransactions = processedTransactions.filter(t => !t.refund_uuid);
      
      // Calculate all metrics from the processed transactions
      const totalAmount = getValidTotalAmount(processedTransactions);
      const salesCount = getValidSalesCount(processedTransactions);
      const averageValue = salesCount > 0 ? totalAmount / salesCount : 0;

      // Process previous transactions once
      const processedPreviousTransactions = processTransactions(filteredPrevData);
      const previousTotalAmount = getValidTotalAmount(processedPreviousTransactions);
      const previousSalesCount = getValidSalesCount(processedPreviousTransactions);
      const previousAverageValue = previousSalesCount > 0 ? previousTotalAmount / previousSalesCount : 0;

      // Get unique sellers - using the already processed transactions
      const uniqueSellers = new Set(
        validTransactions.map(t => t.user_display_name)
      ).size;

      // Calculate payment method stats from the processed transactions
      const paymentMethodStats = calculatePaymentMethodStats(validTransactions);

      // Calculate percentage changes
      const calculatePercentageChange = (current: number, previous: number) => {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
      };

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

// Helper function to calculate payment method stats
const calculatePaymentMethodStats = (transactions: any[]) => {
  const stats = transactions.reduce((acc: any[], transaction) => {
    if (transaction.refund_uuid) return acc; // Skip refunds

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
  const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
  stats.forEach(stat => {
    stat.percentage = ((stat.count / totalCount) * 100).toFixed(1);
  });

  return stats;
};
