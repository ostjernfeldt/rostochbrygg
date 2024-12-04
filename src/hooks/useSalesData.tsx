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

      // Then get all sales for that date
      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select("Amount")
        .gte("Timestamp", new Date(latestDate.setHours(0,0,0,0)).toISOString())
        .lte("Timestamp", new Date(latestDate.setHours(23,59,59,999)).toISOString());

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        throw salesError;
      }

      console.log("Sales data fetched:", salesData);

      const totalAmount = salesData.reduce((sum, sale) => {
        const amount = parseFloat(sale.Amount) || 0;
        return sum + amount;
      }, 0);

      return {
        totalAmount,
        salesCount: salesData.length,
        averageValue: salesData.length > 0 ? totalAmount / salesData.length : 0
      };
    }
  });
};