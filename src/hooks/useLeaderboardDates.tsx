
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useLeaderboardDates = (onDatesLoaded?: (dates: string[]) => void) => {
  return useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity from total_purchases...");
      
      // First check if there are any sales
      const { count, error: countError } = await supabase
        .from("total_purchases")
        .select("*", { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error checking for sales:", countError);
        throw countError;
      }
      
      // If no sales exist, return empty dates array and let onDatesLoaded handle it
      if (count === 0) {
        console.log("No sales found at all");
        if (onDatesLoaded) {
          onDatesLoaded([]);
        }
        return [];
      }
      
      // Get all sales
      const { data, error } = await supabase
        .from("total_purchases")
        .select("timestamp, user_display_name")
        .eq('refunded', false)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching sales dates:", error);
        throw error;
      }

      // Group sales by date
      const salesByDate = data.reduce((acc: { [key: string]: Set<string> }, sale) => {
        const date = format(new Date(sale.timestamp), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = new Set();
        }
        if (sale.user_display_name) {
          acc[date].add(sale.user_display_name);
        }
        return acc;
      }, {});

      // Get all dates with sales
      const validDates = Object.keys(salesByDate).sort().reverse();

      console.log("Found valid sales dates:", validDates);
      
      // Call the callback with the loaded dates
      if (onDatesLoaded) {
        onDatesLoaded(validDates);
      }
      
      return validDates;
    }
  });
};
