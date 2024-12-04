import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalesData = () => {
  return useQuery({
    queryKey: ["latestSales"],
    queryFn: async () => {
      console.log("Fetching latest sales data...");
      
      // First, get the latest date
      const { data: dateData, error: dateError } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false })
        .limit(1);

      if (dateError) {
        console.error("Error fetching latest date:", dateError);
        throw dateError;
      }

      if (!dateData || dateData.length === 0) {
        console.log("No sales data found");
        return { totalAmount: 0, salesCount: 0, averageValue: 0 };
      }

      const latestDate = new Date(dateData[0].Timestamp);
      console.log("Latest date found:", latestDate);

      // Create start and end of day dates
      const startOfDay = new Date(latestDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(latestDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Then get all sales for that date
      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select("Amount")
        .gte("Timestamp", startOfDay.toISOString())
        .lte("Timestamp", endOfDay.toISOString());

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        throw salesError;
      }

      console.log("Sales data fetched:", salesData);

      const totalAmount = salesData.reduce((sum, sale) => {
        // Ensure we're handling the Amount as a number and default to 0 if null
        const amount = sale.Amount ? Number(sale.Amount) : 0;
        return sum + amount;
      }, 0);

      // Count the number of transactions
      const salesCount = salesData.length;

      return {
        totalAmount,
        salesCount,
        averageValue: salesCount > 0 ? totalAmount / salesCount : 0
      };
    }
  });
};