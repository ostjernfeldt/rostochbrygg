import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapPurchaseArray } from "@/utils/purchaseMappers";

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

export const useSalesData = () => {
  return useQuery({
    queryKey: ["latestSales"],
    queryFn: async (): Promise<SalesData> => {
      console.log("Fetching latest sales data...");
      
      const { data: dateData, error: dateError } = await supabase
        .from("total_purchases")
        .select("timestamp")
        .order("timestamp", { ascending: false });

      if (dateError) {
        console.error("Error fetching dates:", dateError);
        throw dateError;
      }

      if (!dateData || dateData.length === 0) {
        console.log("No sales data found");
        return {
          totalAmount: 0,
          salesCount: 0,
          averageValue: 0,
          percentageChanges: {
            totalAmount: 0,
            salesCount: 0,
            averageValue: 0
          }
        };
      }

      const uniqueDates = Array.from(new Set(
        dateData.map(d => new Date(d.timestamp).toDateString())
      )).map(dateStr => new Date(dateStr));

      uniqueDates.sort((a, b) => b.getTime() - a.getTime());

      const latestDate = uniqueDates[0];
      const previousDate = uniqueDates[1];

      console.log("Latest date:", latestDate);
      console.log("Previous date:", previousDate);

      const getSalesForDate = async (date: Date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
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

        const mappedSales = mapPurchaseArray(salesData || []);
        
        const totalAmount = mappedSales.reduce((sum, sale) => sum + sale.Amount, 0);
        const salesCount = mappedSales.length;
        const averageValue = salesCount > 0 ? totalAmount / salesCount : 0;

        return { totalAmount, salesCount, averageValue };
      };

      const latestData = await getSalesForDate(latestDate);
      const previousData = previousDate ? await getSalesForDate(previousDate) : null;

      const calculatePercentageChange = (current: number, previous: number) => {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
      };

      const percentageChanges = {
        totalAmount: calculatePercentageChange(latestData.totalAmount, previousData?.totalAmount || 0),
        salesCount: calculatePercentageChange(latestData.salesCount, previousData?.salesCount || 0),
        averageValue: calculatePercentageChange(latestData.averageValue, previousData?.averageValue || 0)
      };

      console.log("Latest data:", latestData);
      console.log("Previous data:", previousData);
      console.log("Percentage changes:", percentageChanges);

      return {
        ...latestData,
        percentageChanges
      };
    }
  });
};
