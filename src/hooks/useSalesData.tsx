import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      
      // First, get the two latest distinct dates
      const { data: dateData, error: dateError } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false });

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

      // Get unique dates
      const uniqueDates = Array.from(new Set(
        dateData.map(d => new Date(d.Timestamp).toDateString())
      )).map(dateStr => new Date(dateStr));

      // Sort dates in descending order
      uniqueDates.sort((a, b) => b.getTime() - a.getTime());

      const latestDate = uniqueDates[0];
      const previousDate = uniqueDates[1];

      console.log("Latest date:", latestDate);
      console.log("Previous date:", previousDate);

      // Function to get sales data for a specific date
      const getSalesForDate = async (date: Date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: salesData, error: salesError } = await supabase
          .from("purchases")
          .select("Amount")
          .gte("Timestamp", startOfDay.toISOString())
          .lte("Timestamp", endOfDay.toISOString());

        if (salesError) {
          console.error("Error fetching sales data:", salesError);
          throw salesError;
        }

        const totalAmount = salesData.reduce((sum, sale) => {
          const amount = sale.Amount ? Number(sale.Amount) : 0;
          return sum + amount;
        }, 0);

        const salesCount = salesData.length;
        const averageValue = salesCount > 0 ? totalAmount / salesCount : 0;

        return { totalAmount, salesCount, averageValue };
      };

      // Get data for both days
      const latestData = await getSalesForDate(latestDate);
      const previousData = previousDate ? await getSalesForDate(previousDate) : null;

      // Calculate percentage changes
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